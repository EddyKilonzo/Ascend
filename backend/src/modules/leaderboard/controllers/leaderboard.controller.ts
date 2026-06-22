import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LeaderboardService } from '../services/leaderboard.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('leaderboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /** Global all-time XP leaderboard (max 100 entries). */
  @Get('xp')
  @ApiOperation({ summary: 'Global XP leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getXp(@Query('limit') limit = 50) {
    return this.leaderboardService.getGlobalXpLeaderboard(Number(limit));
  }

  /** Weekly XP leaderboard — XP earned in the rolling 7-day window. */
  @Get('weekly')
  @ApiOperation({ summary: 'Weekly XP leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWeekly(@Query('limit') limit = 50) {
    return this.leaderboardService.getWeeklyXpLeaderboard(Number(limit));
  }

  /** Top users by current streak (requires UserStatistics to be populated). */
  @Get('streaks')
  @ApiOperation({ summary: 'Streak leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStreaks(@Query('limit') limit = 50) {
    return this.leaderboardService.getStreakLeaderboard(Number(limit));
  }

  /** Returns the caller's rank and XP in the global leaderboard. */
  @Get('my-rank')
  @ApiOperation({ summary: 'My rank in the global XP leaderboard' })
  getMyRank(@CurrentUser() user: { id: string }) {
    return this.leaderboardService.getMyRank(user.id);
  }
}
