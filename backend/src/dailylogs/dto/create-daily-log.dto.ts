import { IsString, IsArray, IsEnum, IsOptional, IsDate, ValidateNested, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Mood } from '../entities/daily-log.entity';

class TimeSpentDto {
  @IsString()
  taskId: string;

  @IsNumber()
  @Min(0)
  @Max(24)
  hours: number;

  @IsNumber()
  @Min(0)
  @Max(59)
  minutes: number;
}

export class CreateDailyLogDto {
  @IsString()
  tasks: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSpentDto)
  timeSpent: TimeSpentDto[];

  @IsEnum(Mood)
  mood: Mood;

  @IsString()
  @IsOptional()
  blockers?: string;

  @IsDate()
  @Type(() => Date)
  logDate: Date;
} 