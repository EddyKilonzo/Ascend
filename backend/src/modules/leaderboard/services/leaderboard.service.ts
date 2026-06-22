import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the global XP leaderboard — top N users ranked by totalXp.
   * Only active, non-deleted users with a public profile are included.
   * Data comes from the user_levels table (written by the XP service).
   */
  async getGlobalXpLeaderboard(limit = 50) {
    try {
      const cappedLimit = Math.min(limit, 100);

      const entries = await this.prisma.userLevel.findMany({
        where: {
          user: { isActive: true, deletedAt: null },
        },
        orderBy: { totalXp: 'desc' },
        take:    cappedLimit,
        select: {
          level:   true,
          totalXp: true,
          user: {
            select: {
              id:          true,
              username:    true,
              displayName: true,
              avatarUrl:   true,
            },
          },
        },
      });

      return entries.map((e, i) => ({ rank: i + 1, ...e }));
    } catch (error) {
      this.logger.error('getGlobalXpLeaderboard error', error);
      throw error;
    }
  }

  /**
   * Returns the weekly XP leaderboard (XP earned in the last 7 days).
   * Uses the xp_logs table summed per user for the rolling window.
   */
  async getWeeklyXpLeaderboard(limit = 50) {
    try {
      const cappedLimit = Math.min(limit, 100);
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const rows = await this.prisma.xpLog.groupBy({
        by:      ['userId'],
        where:   { earnedAt: { gte: since } },
        _sum:    { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take:    cappedLimit,
      });

      // Hydrate with user info
      const userIds = rows.map((r) => r.userId);
      const users   = await this.prisma.user.findMany({
        where:  { id: { in: userIds }, isActive: true, deletedAt: null },
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      return rows
        .filter((r) => userMap.has(r.userId))
        .map((r, i) => ({
          rank:       i + 1,
          weeklyXp:   r._sum.amount ?? 0,
          user:       userMap.get(r.userId)!,
        }));
    } catch (error) {
      this.logger.error('getWeeklyXpLeaderboard error', error);
      throw error;
    }
  }

  /**
   * Returns the streak leaderboard — top N users ranked by their longest habit streak.
   * Reads from UserStatistics aggregate table to avoid expensive on-the-fly calculations.
   */
  async getStreakLeaderboard(limit = 50) {
    try {
      const cappedLimit = Math.min(limit, 100);

      const stats = await this.prisma.userStatistics.findMany({
        where: {
          currentStreak: { gt: 0 },
          user:          { isActive: true, deletedAt: null },
        },
        orderBy: { currentStreak: 'desc' },
        take:    cappedLimit,
        select: {
          currentStreak: true,
          longestStreak: true,
          user: {
            select: {
              id:          true,
              username:    true,
              displayName: true,
              avatarUrl:   true,
            },
          },
        },
      });

      return stats.map((s, i) => ({ rank: i + 1, ...s }));
    } catch (error) {
      this.logger.error('getStreakLeaderboard error', error);
      throw error;
    }
  }

  /**
   * Returns the caller's rank and surrounding entries (+/- 5 rows) in the global XP leaderboard.
   * Useful for the "your rank" widget without returning the full leaderboard.
   */
  async getMyRank(userId: string) {
    try {
      const myLevel = await this.prisma.userLevel.findUnique({ where: { userId } });
      if (!myLevel) return { rank: null, totalXp: 0 };

      const rank = await this.prisma.userLevel.count({
        where: {
          totalXp: { gt: myLevel.totalXp },
          user:    { isActive: true, deletedAt: null },
        },
      });

      return {
        rank:    rank + 1,
        totalXp: myLevel.totalXp,
        level:   myLevel.level,
      };
    } catch (error) {
      this.logger.error(`getMyRank error — user ${userId}`, error);
      throw error;
    }
  }
}
