import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Query, Request } from '@nestjs/common';
import { DailylogsService } from './dailylogs.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { DailyLogReviewDto } from './dto/daily-log-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('dailylogs')
@UseGuards(JwtAuthGuard)
export class DailylogsController {
  constructor(private readonly dailylogsService: DailylogsService) {}

  @Post()
  create(@Body() createDailyLogDto: CreateDailyLogDto, @Request() req) {
    return this.dailylogsService.create(createDailyLogDto, req.user);
  }

  @Get()
  findAll(@Request() req) {
    return this.dailylogsService.findAll(req.user);
  }

  @Get('team')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  findTeamLogs(
    @Request() req,
    @Query('date') date?: string,
    @Query('developerId') developerId?: string,
    @Query('hasBlockers') hasBlockers?: boolean,
  ) {
    return this.dailylogsService.findTeamLogs(req.user, { date, developerId, hasBlockers });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.dailylogsService.findOne(id, req.user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDailyLogDto: Partial<CreateDailyLogDto>, @Request() req) {
    return this.dailylogsService.update(id, updateDailyLogDto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.dailylogsService.remove(id, req.user);
  }

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MANAGER)
  reviewLog(@Param('id') id: string, @Body() reviewData: DailyLogReviewDto, @Request() req) {
    return this.dailylogsService.reviewLog(id, reviewData, req.user);
  }
} 