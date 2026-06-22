import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { HabitLogsService } from '../services/habit-logs.service';
import { LogHabitDto } from '../dto/log-habit.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('habits')
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  /** Mark a habit as complete for the current period. */
  @Post(':habitId/log')
  @ApiOperation({ summary: 'Log a habit completion' })
  logHabit(
    @CurrentUser() user: { id: string },
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Body() dto: LogHabitDto,
  ) {
    return this.habitLogsService.logHabit(habitId, user.id, dto);
  }

  /** Retrieve paginated completion history for a single habit. */
  @Get(':habitId/logs')
  @ApiOperation({ summary: 'Get completion history for a habit' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLogs(
    @CurrentUser() user: { id: string },
    @Param('habitId', ParseUUIDPipe) habitId: string,
    @Query('page')  page  = 1,
    @Query('limit') limit = 30,
  ) {
    return this.habitLogsService.getLogsForHabit(habitId, user.id, Number(page), Number(limit));
  }

  /** Delete a specific log entry (undo a completion). */
  @Delete('logs/:logId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a habit log entry' })
  removeLog(
    @CurrentUser() user: { id: string },
    @Param('logId', ParseUUIDPipe) logId: string,
  ) {
    return this.habitLogsService.removeLog(logId, user.id);
  }

  /** Get contribution-style heatmap data for the user's habits. */
  @Get('heatmap')
  @ApiOperation({ summary: 'Get habit completion heatmap for the last N days' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Default: 365' })
  getHeatmap(
    @CurrentUser() user: { id: string },
    @Query('days') days = 365,
  ) {
    return this.habitLogsService.getHeatmapData(user.id, Number(days));
  }
}
