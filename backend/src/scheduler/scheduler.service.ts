import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { DailyLog } from '../dailylogs/entities/daily-log.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DailyLog)
    private dailylogsRepository: Repository<DailyLog>,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    console.log('Scheduler service initialized');
  }

  @Cron(CronExpression.EVERY_DAY_AT_10PM)
  async sendDailyReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all developers
    const developers = await this.usersRepository.find({
      where: { role: UserRole.DEVELOPER },
    });

    for (const developer of developers) {
      // Check if developer has submitted a log for today
      const existingLog = await this.dailylogsRepository.findOne({
        where: {
          user: { id: developer.id },
          logDate: today,
        },
      });

      // If no log exists for today, send reminder
      if (!existingLog) {
        try {
          await this.mailService.sendReminderNotification(
            developer.email,
            `${developer.firstName} ${developer.lastName}`
          );
          console.log(`Reminder sent to ${developer.email}`);
        } catch (error) {
          console.error(`Failed to send reminder to ${developer.email}:`, error);
        }
      }
    }
  }
} 