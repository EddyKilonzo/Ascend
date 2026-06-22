import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the user's daily analytics for the last N days.
   * Pre-computed records are read from analytics_daily; falls back to live aggregation
   * when a day has no pre-computed row (e.g., for the current day).
   */
  async getDailySummary(userId: string, days = 30) {
    try {
      const cappedDays = Math.min(days, 365);
      const since = dayjs().subtract(cappedDays, 'day').startOf('day').toDate();

      const records = await this.prisma.analyticsDaily.findMany({
        where:   { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      });

      return records;
    } catch (error) {
      this.logger.error(`getDailySummary error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns the user's weekly analytics.
   * Covers the last N weeks.
   */
  async getWeeklySummary(userId: string, weeks = 12) {
    try {
      const cappedWeeks = Math.min(weeks, 52);
      const since = dayjs().subtract(cappedWeeks, 'week').startOf('isoWeek').toDate();

      const records = await this.prisma.analyticsWeekly.findMany({
        where:   { userId, weekStart: { gte: since } },
        orderBy: { weekStart: 'asc' },
      });

      return records;
    } catch (error) {
      this.logger.error(`getWeeklySummary error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns monthly analytics for the last N months.
   */
  async getMonthlySummary(userId: string, months = 12) {
    try {
      const cappedMonths = Math.min(months, 24);
      const now  = dayjs();
      const records = await this.prisma.analyticsMonthly.findMany({
        where: {
          userId,
          OR: Array.from({ length: cappedMonths }, (_, i) => {
            const d = now.subtract(i, 'month');
            return { month: d.month() + 1, year: d.year() };
          }),
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      });

      return records;
    } catch (error) {
      this.logger.error(`getMonthlySummary error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns the user's dashboard snapshot — a pre-computed read model refreshed
   * every 5 minutes by the background job. Falls back to live data when absent.
   */
  async getDashboardSnapshot(userId: string) {
    try {
      const snapshot = await this.prisma.userDashboardSnapshot.findUnique({ where: { userId } });
      if (snapshot) return snapshot;

      // Live fallback — compute the key metrics on the fly
      return await this.computeLiveSnapshot(userId);
    } catch (error) {
      this.logger.error(`getDashboardSnapshot error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Refreshes the UserDashboardSnapshot for a user.
   * Called by the scheduled job (background); also callable on-demand.
   */
  async refreshSnapshot(userId: string) {
    try {
      const data = await this.computeLiveSnapshot(userId);

      return await this.prisma.userDashboardSnapshot.upsert({
        where:  { userId },
        create: { userId, ...data },
        update: data,
      });
    } catch (error) {
      this.logger.error(`refreshSnapshot error — user ${userId}`, error);
      throw error;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async computeLiveSnapshot(userId: string) {
    const todayStart = dayjs().startOf('day').toDate();
    const todayEnd   = dayjs().endOf('day').toDate();
    const weekAgo    = dayjs().subtract(7, 'day').toDate();

    const [level, habitsToday, totalHabitsToday, focusToday, tasksToday, goals, achievements, weeklyXp] =
      await Promise.all([
        this.prisma.userLevel.findUnique({ where: { userId } }),
        this.prisma.habitLog.count({
          where: { userId, completedAt: { gte: todayStart, lte: todayEnd } },
        }),
        this.prisma.habit.count({ where: { userId, isActive: true, deletedAt: null } }),
        this.prisma.focusSession.aggregate({
          where: { userId, status: 'COMPLETED', startedAt: { gte: todayStart } },
          _sum:  { actualMinutes: true },
        }),
        this.prisma.plannerTask.count({
          where: { userId, status: 'DONE', completedAt: { gte: todayStart } },
        }),
        this.prisma.goal.groupBy({
          by:    ['status'],
          where: { userId, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.userAchievement.count({ where: { userId } }),
        this.prisma.xpLog.aggregate({
          where: { userId, earnedAt: { gte: weekAgo } },
          _sum:  { amount: true },
        }),
      ]);

    const activeGoals    = goals.find((g) => g.status === 'ACTIVE')?._count.id ?? 0;
    const completedGoals = goals.find((g) => g.status === 'COMPLETED')?._count.id ?? 0;

    return {
      level:                level?.level ?? 1,
      currentXp:            level?.currentXp ?? 0,
      totalXp:              level?.totalXp ?? 0,
      xpToNextLevel:        level?.xpToNextLevel ?? 100,
      habitsCompletedToday: habitsToday,
      totalHabitsToday,
      focusMinutesToday:    focusToday._sum.actualMinutes ?? 0,
      tasksCompletedToday:  tasksToday,
      activeGoals,
      completedGoals,
      totalAchievements:    achievements,
      weeklyXp:             weeklyXp._sum.amount ?? 0,
    };
  }
}
