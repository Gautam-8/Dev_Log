import { IsString, IsDate, IsArray, ValidateNested, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Mood } from '../entities/daily-log.entity';

class TimeSpentDto {
  @IsString()
  taskId: string;

  @IsNumber()
  hours: number;

  @IsNumber()
  minutes: number;
}

export class UpdateDailyLogDto {
  @IsString()
  @IsOptional()
  tasks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSpentDto)
  @IsOptional()
  timeSpent?: TimeSpentDto[];

  @IsEnum(Mood)
  @IsOptional()
  mood?: Mood;

  @IsString()
  @IsOptional()
  blockers?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  logDate?: Date;

  @IsBoolean()
  @IsOptional()
  isReviewed?: boolean;

  @IsString()
  @IsOptional()
  reviewComment?: string;
} 