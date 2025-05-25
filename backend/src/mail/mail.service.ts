import { Injectable } from '@nestjs/common';
import { Client } from 'node-mailjet';

@Injectable()
export class MailService {
  private mailjet: Client;

  constructor() {
    this.mailjet = new Client({
      apiKey: process.env.MAILJET_API_KEY,
      apiSecret: process.env.MAILJET_API_SECRET,
    });
  }

  async sendManagerNotification(managerEmail: string, developerName: string, logDate: string) {
    try {
        const response = await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.FROM_EMAIL,
              Name: process.env.FROM_NAME,
            },
            To: [
              {
                Email: managerEmail,
                Name: managerEmail.split('@')[0],
              },
            ],
            Subject: 'New Daily Log Submitted',
            TextPart: `A new daily log has been submitted by ${developerName} for ${logDate}. Please review it in your dashboard.`,
            HTMLPart: `
              <h3>New Daily Log Submitted</h3>
              <p>A new daily log has been submitted by <strong>${developerName}</strong> for <strong>${logDate}</strong>.</p>
              <p>Please review it in your dashboard.</p>
              <p>Best regards,<br>DevLog Team</p>
            `,
          },
        ],
      });
      return response.body;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendReminderNotification(developerEmail: string, developerName: string) {
    try {
      const response = await this.mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: process.env.FROM_EMAIL,
              Name: process.env.FROM_NAME,
            },
            To: [
              {
                Email: developerEmail,
                Name: developerName,
              },
            ],
            Subject: 'Reminder: Submit Your Daily Log',
            TextPart: `Dear ${developerName},\n\nThis is a reminder to submit your daily log before 10 PM.\n\nBest regards,\nDevLog Team`,
            HTMLPart: `
              <h3>Daily Log Reminder</h3>
              <p>Dear <strong>${developerName}</strong>,</p>
              <p>This is a reminder to submit your daily log before 10 PM.</p>
              <p>Please take a moment to log your progress for today.</p>
              <p>Best regards,<br>DevLog Team</p>
            `,
          },
        ],
      });
      return response.body;
    } catch (error) {
      console.error('Error sending reminder email:', error);
      throw error;
    }
  }
} 