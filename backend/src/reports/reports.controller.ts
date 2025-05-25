import { Controller, Get, Query, UseGuards, Res, Request } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('weekly')
  async generateWeeklyReport(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'pdf' | 'csv',
    @Res() res: Response,
  ) {
    const report = await this.reportsService.generateWeeklyReport(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
      format,
    );

    const filename = `weekly-report-${startDate}-to-${endDate}.${format}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'text/csv';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(report);
  }
} 