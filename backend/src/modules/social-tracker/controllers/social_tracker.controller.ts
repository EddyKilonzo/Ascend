import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SocialTrackerService, LogSocialUsageDto } from '../services/social_tracker.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('social-tracker')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('social-tracker')
export class SocialTrackerController {
  constructor(private readonly socialTrackerService: SocialTrackerService) {}

  /** Log social media usage for a given date and platform. */
  @Post()
  @ApiOperation({ summary: 'Log social media usage' })
  log(@CurrentUser() user: { id: string }, @Body() dto: LogSocialUsageDto) {
    return this.socialTrackerService.logUsage(user.id, dto);
  }

  /** Get social usage history and per-platform totals for the last N days. */
  @Get()
  @ApiOperation({ summary: 'Get social usage history' })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  getUsage(@CurrentUser() user: { id: string }, @Query('days') days = 30) {
    return this.socialTrackerService.getUsage(user.id, Number(days));
  }

  /** Delete a specific social usage log entry. */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a social usage log entry' })
  deleteLog(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.socialTrackerService.deleteLog(id, user.id);
  }
}
