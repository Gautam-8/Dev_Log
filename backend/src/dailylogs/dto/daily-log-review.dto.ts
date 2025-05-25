import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class DailyLogReviewDto {
  @IsBoolean()
  isReviewed: boolean;

  @IsString()
  @IsOptional()
  reviewComment?: string;
} 