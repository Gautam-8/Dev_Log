import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindManyOptions, Not, IsNull, Or, And, Equal, Raw } from 'typeorm';
import { DailyLog, Mood } from './entities/daily-log.entity';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { DailyLogReviewDto } from './dto/daily-log-review.dto';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class DailylogsService {
  constructor(
    @InjectRepository(DailyLog)
    private dailylogsRepository: Repository<DailyLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  async create(createDailyLogDto: CreateDailyLogDto, user: User): Promise<DailyLog> {
    const dailyLog = this.dailylogsRepository.create({
      ...createDailyLogDto,
      user: { id: user.id },
      mood: createDailyLogDto.mood as Mood
    });
    const savedLog = await this.dailylogsRepository.save(dailyLog);

    
    const loggedUser = await this.usersRepository.findOne({ where: { id: user.id } });
    // Send notification to manager if user has one
    console.log('Sending notification to manager...', loggedUser?.managerId);
    if (loggedUser?.managerId) {
      const manager = await this.usersRepository.findOne({ where: { id: loggedUser.managerId } });
      if (manager) {
        const developerName = `${loggedUser.firstName} ${loggedUser.lastName}`;
        const logDate = new Date(createDailyLogDto.logDate).toLocaleDateString();
        await this.mailService.sendManagerNotification(
          manager.email,
          developerName,
          logDate
        );
      }
    }

    return savedLog;
  }

  async findAll(user: User): Promise<DailyLog[]> {
    return this.dailylogsRepository.find({
      where: { user: { id: user.id } },
      order: { logDate: 'DESC' },
    });
  }

  async findOne(id: string, user: User): Promise<DailyLog> {
    const log = await this.dailylogsRepository.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!log) {
      throw new NotFoundException(`Daily log with ID ${id} not found`);
    }

    return log;
  }

  async findByDate(date: Date, user: User): Promise<DailyLog | null> {
    return this.dailylogsRepository.findOne({
      where: {
        logDate: date,
        user: { id: user.id },
      },
    });
  }

  async update(id: string, updateData: Partial<CreateDailyLogDto>, user: User): Promise<DailyLog> {
    const log = await this.findOne(id, user);
    Object.assign(log, updateData);
    return this.dailylogsRepository.save(log);
  }

  async remove(id: string, user: User): Promise<void> {
    const log = await this.findOne(id, user);
    await this.dailylogsRepository.remove(log);
  }

  async findTeamLogs(
    manager: User,
    filters: { date?: string; developerId?: string; hasBlockers?: boolean },
  ): Promise<DailyLog[]> {
    const developers = await this.usersRepository.find({ where: { managerId: manager.id } });
    const developerIds = developers.map((dev) => dev.id);
    if (developerIds.length === 0) return [];

    const findOptions: FindManyOptions<DailyLog> = {
      where: {
        user: { id: In(developerIds) },
      },
      relations: ['user'],
      order: { logDate: 'DESC' },
    };

    if (filters.date) {
      (findOptions.where as any).logDate = new Date(filters.date);
    }

    if (filters.developerId) {
      if (!developerIds.includes(filters.developerId)) {
        return [];
      }
      (findOptions.where as any).user = { id: filters.developerId };
    }

    // Handle blockers filter
    if (filters.hasBlockers === true) {
      // Find logs where trimmed blockers is not null AND not an empty string
       (findOptions.where as any).blockers = Raw(alias => `TRIM(${alias}) IS NOT NULL AND TRIM(${alias}) != ''`);
    }
    // If filters.hasBlockers is false or undefined, no blockers filter is applied.

    // Ensure user filter is applied correctly when other filters are present
    if (!filters.developerId && !(findOptions.where as any).user) {
         (findOptions.where as any).user = { id: In(developerIds) };
    }

    return this.dailylogsRepository.find(findOptions);
  }

  async reviewLog(id: string, reviewData: DailyLogReviewDto, manager: User): Promise<DailyLog> {
    const log = await this.dailylogsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!log) {
      throw new NotFoundException(`Daily log with ID ${id} not found`);
    }

    // Verify the manager is authorized to review this log
    const isAuthorized = await this.usersRepository.findOne({
      where: { id: log.user.id, managerId: manager.id },
    });

    if (!isAuthorized) {
      throw new ForbiddenException('You are not authorized to review this log');
    }

    Object.assign(log, reviewData);
    return this.dailylogsRepository.save(log);
  }
} 