import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class LeaderboardJob {
  private readonly logger = new Logger(LeaderboardJob.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refreshes weekly XP leaderboard cache in UserDashboardSnapshot.weeklyXp.
   * Runs every 15 minutes during active hours (06:00–23:00).
   */
  @Cron('*/15 6-23 * * *', { name: 'leaderboard-refresh' })
  async refreshWeeklyXp(): Promise<void> {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      await this.prisma.$executeRaw`
        UPDATE user_dashboard_snapshots uds
        SET weekly_xp = COALESCE((
          SELECT SUM(xl.amount)
          FROM xp_logs xl
          WHERE xl.user_id = uds.user_id
            AND xl.earned_at >= ${weekAgo}
        ), 0),
        updated_at = NOW()
      `;
    } catch (err) {
      this.logger.error('Leaderboard refresh failed', err);
    }
  }
}
