import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailylogsService } from './dailylogs.service';
import { DailylogsController } from './dailylogs.controller';
import { DailyLog } from './entities/daily-log.entity';
import { User } from '../users/entities/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([DailyLog, User]), MailModule],
  controllers: [DailylogsController],
  providers: [DailylogsService],
  exports: [DailylogsService],
})
export class DailylogsModule {} 