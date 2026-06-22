import { Controller, Get, Query, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AnalyticsService } from '../services/analytics.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** Returns the user's cached dashboard snapshot (refreshed every 5 min by scheduler). */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard snapshot' })
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.analyticsService.getDashboardSnapshot(user.id);
  }

  /** Returns daily analytics for the last N days (max 365). */
  @Get('daily')
  @ApiOperation({ summary: 'Daily analytics' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  getDaily(@CurrentUser() user: { id: string }, @Query('days') days = 30) {
    return this.analyticsService.getDailySummary(user.id, Number(days));
  }

  /** Returns weekly analytics for the last N weeks (max 52). */
  @Get('weekly')
  @ApiOperation({ summary: 'Weekly analytics' })
  @ApiQuery({ name: 'weeks', required: false, type: Number, example: 12 })
  getWeekly(@CurrentUser() user: { id: string }, @Query('weeks') weeks = 12) {
    return this.analyticsService.getWeeklySummary(user.id, Number(weeks));
  }

  /** Returns monthly analytics for the last N months (max 24). */
  @Get('monthly')
  @ApiOperation({ summary: 'Monthly analytics' })
  @ApiQuery({ name: 'months', required: false, type: Number, example: 12 })
  getMonthly(@CurrentUser() user: { id: string }, @Query('months') months = 12) {
    return this.analyticsService.getMonthlySummary(user.id, Number(months));
  }

  /** Forces a live refresh of the dashboard snapshot for the caller. */
  @Post('snapshot/refresh')
  @ApiOperation({ summary: 'Force refresh dashboard snapshot' })
  refreshSnapshot(@CurrentUser() user: { id: string }) {
    return this.analyticsService.refreshSnapshot(user.id);
  }
}
