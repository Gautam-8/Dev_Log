import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { User } from '../users/entities/user.entity';
import { DailyLog } from '../dailylogs/entities/daily-log.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([User, DailyLog]),
    MailModule,
  ],
  providers: [SchedulerService],
})
export class SchedulerModule {} 