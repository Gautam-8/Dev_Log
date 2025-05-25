import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { DailyLog } from '../dailylogs/entities/daily-log.entity';
import PDFDocument from 'pdfkit-table';
import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';

@Injectable()
export class ReportsService {
  private chartJSNodeCanvas: ChartJSNodeCanvas;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DailyLog)
    private dailylogsRepository: Repository<DailyLog>,
  ) {
    this.chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 600, height: 400 });
  }

  async generateWeeklyReport(managerId: string, startDate: Date, endDate: Date, format: 'pdf' | 'csv') {
    // Get all developers under this manager
    const developers = await this.usersRepository.find({
      where: { managerId },
    });

    const developerIds = developers.map(d => d.id);

    // Get logs for all developers within the date range
    const logs = await this.dailylogsRepository.find({
      where: {
        user: { id: In(developerIds) },
        logDate: Between(startDate, endDate),
      },
      relations: ['user'],
      order: { logDate: 'ASC' },
    });

    // Group logs by developer
    const developerLogs = developers.map(developer => ({
      developer,
      logs: logs.filter(log => log.user.id === developer.id),
    }));

    if (format === 'pdf') {
      return this.generatePDF(developerLogs, startDate, endDate);
    } else {
      return this.generateCSV(developerLogs, startDate, endDate);
    }
  }

  async generatePDF(developerLogs: any[], startDate: Date, endDate: Date): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Weekly Development Report', { align: 'center' })
          .moveDown();

        doc
          .fontSize(12)
          .font('Helvetica')
          .text(`Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`, { align: 'center' })
          .moveDown(2);

        // Generate and add charts
        await this.addCharts(doc, developerLogs);

        // Add summary section
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('Summary', { underline: true })
          .moveDown();

        const totalLogs = developerLogs.reduce((sum, dev) => sum + dev.logs.length, 0);
        const totalBlockers = developerLogs.reduce((sum, dev) => 
          sum + dev.logs.filter(log => log.blockers).length, 0);

        // Add summary table
        const summaryTable = {
          headers: ['Metric', 'Value'],
          rows: [
            ['Total Logs', totalLogs.toString()],
            ['Total Blockers', totalBlockers.toString()],
            ['Average Logs per Developer', (totalLogs / developerLogs.length).toFixed(1)],
          ]
        };

        await doc.table(summaryTable, {
          prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
          prepareRow: () => doc.font('Helvetica').fontSize(10),
        });

        doc.moveDown(2);

        // Add developer sections
        for (const { developer, logs } of developerLogs) {
          doc.addPage();

          // Developer header
          doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(`${developer.firstName} ${developer.lastName}`, { underline: true })
            .moveDown();

          // Developer summary
          const totalHours = logs.reduce((sum, log) => 
            sum + log.timeSpent.reduce((taskSum, task) => taskSum + task.hours + task.minutes / 60, 0), 0);
          const blockerCount = logs.filter(log => log.blockers).length;

          // Add developer summary table
          const devSummaryTable = {
            headers: ['Metric', 'Value'],
            rows: [
              ['Total Hours', totalHours.toFixed(1)],
              ['Blockers', blockerCount.toString()],
              ['Logs Submitted', logs.length.toString()],
            ]
          };

          await doc.table(devSummaryTable, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
            prepareRow: () => doc.font('Helvetica').fontSize(10),
          });

          doc.moveDown();

          // Add developer's daily logs table
          const logsTable = {
            headers: ['Date', 'Tasks', 'Time Spent', 'Mood', 'Status'],
            rows: logs.map(log => [
              new Date(log.logDate).toLocaleDateString(),
              log.tasks,
              log.timeSpent.map(t => `${t.hours}h ${t.minutes}m`).join(', '),
              this.convertMoodToText(log.mood),
              log.isReviewed ? 'Reviewed' : 'Pending'
            ])
          };

          await doc.table(logsTable, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: () => doc.font('Helvetica').fontSize(8),
          });

          // Add blockers if any
          const logsWithBlockers = logs.filter(log => log.blockers);
          if (logsWithBlockers.length > 0) {
            doc.moveDown()
              .fontSize(12)
              .font('Helvetica-Bold')
              .text('Blockers:', { underline: true })
              .moveDown();

            const blockersTable = {
              headers: ['Date', 'Blocker'],
              rows: logsWithBlockers.map(log => [
                new Date(log.logDate).toLocaleDateString(),
                log.blockers
              ])
            };

            await doc.table(blockersTable, {
              prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
              prepareRow: () => doc.font('Helvetica').fontSize(8),
            });
          }
        }

        // Add footer with page numbers
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc
            .fontSize(10)
            .text(
              `Page ${i + 1} of ${pages.count}`,
              50,
              doc.page.height - 50,
              { align: 'center' }
            );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private convertMoodToText(mood: string): string {
    const moodMap = {
      '😊': 'Great',
      '🙂': 'Good',
      '😐': 'Neutral',
      '🙁': 'Not Great',
      '😢': 'Bad'
    };
    return moodMap[mood] || mood;
  }

  private async addCharts(doc: PDFDocument, developerLogs: any[]) {
    // Mood Distribution Chart
    const moodData = this.getMoodDistribution(developerLogs);
    const moodChartConfig: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: Object.keys(moodData).map(mood => this.convertMoodToText(mood)),
        datasets: [{
          data: Object.values(moodData),
          backgroundColor: ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336']
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Mood Distribution'
          }
        }
      }
    };

    const moodChartBuffer = await this.chartJSNodeCanvas.renderToBuffer(moodChartConfig);
    doc.image(moodChartBuffer, { width: 300 });
    doc.moveDown();

    // Productivity Chart (Hours per Developer)
    const productivityData = this.getProductivityData(developerLogs);
    const productivityChartConfig: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: productivityData.labels,
        datasets: [{
          label: 'Hours Worked',
          data: productivityData.hours,
          backgroundColor: '#2196F3'
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Productivity by Developer'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hours'
            }
          }
        }
      }
    };

    const productivityChartBuffer = await this.chartJSNodeCanvas.renderToBuffer(productivityChartConfig);
    doc.image(productivityChartBuffer, { width: 300 });
    doc.moveDown(2);
  }

  private getMoodDistribution(developerLogs: any[]) {
    const moodCounts = {};
    developerLogs.forEach(({ logs }) => {
      logs.forEach(log => {
        const textMood = this.convertMoodToText(log.mood);
        moodCounts[textMood] = (moodCounts[textMood] || 0) + 1;
      });
    });
    return moodCounts;
  }

  private getProductivityData(developerLogs: any[]) {
    return {
      labels: developerLogs.map(({ developer }) => `${developer.firstName} ${developer.lastName}`),
      hours: developerLogs.map(({ logs }) => 
        logs.reduce((sum, log) => 
          sum + log.timeSpent.reduce((taskSum, task) => taskSum + task.hours + task.minutes / 60, 0), 0)
      )
    };
  }

  private async generateCSV(developerLogs: any[], startDate: Date, endDate: Date): Promise<Buffer> {
    const csvWriter = createObjectCsvWriter({
      path: 'temp-report.csv',
      header: [
        { id: 'developer', title: 'Developer' },
        { id: 'date', title: 'Date' },
        { id: 'tasks', title: 'Tasks' },
        { id: 'mood', title: 'Mood' },
        { id: 'blockers', title: 'Blockers' },
        { id: 'isReviewed', title: 'Status' },
      ],
    });

    const records = developerLogs.flatMap(({ developer, logs }) =>
      logs.map(log => ({
        developer: `${developer.firstName} ${developer.lastName}`,
        date: new Date(log.logDate).toLocaleDateString(),
        tasks: log.tasks,
        mood: this.convertMoodToText(log.mood),
        blockers: log.blockers || 'None',
        isReviewed: log.isReviewed ? 'Reviewed' : 'Pending',
      }))
    );

    await csvWriter.writeRecords(records);
    const buffer = fs.readFileSync('temp-report.csv');
    fs.unlinkSync('temp-report.csv'); // Clean up temp file
    return buffer;
  }
} 