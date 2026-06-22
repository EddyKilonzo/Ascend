import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { AiGatewayService } from '../../integrations/ai-gateway/ai-gateway.service';
import { QUEUE_ANALYTICS, JOB_ANALYTICS_DAILY, JOB_ANALYTICS_SNAPSHOT } from '../queues.constants';
import dayjs from 'dayjs';

export interface AnalyticsDailyJobData  { userId: string; date: string }
export interface SnapshotJobData        { userId: string }

@Processor(QUEUE_ANALYTICS)
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AiGatewayService,
  ) {}

  /**
   * Computes and persists the daily analytics row for a user.
   * Triggered after any domain event that affects daily metrics.
   * Also kicks off a productivity score update against ml/ai/.
   */
  @Process(JOB_ANALYTICS_DAILY)
  async computeDaily(job: Job<AnalyticsDailyJobData>): Promise<void> {
    const { userId, date } = job.data;
    try {
      const dayStart = dayjs(date).startOf('day').toDate();
      const dayEnd   = dayjs(date).endOf('day').toDate();

      const [habitsCompleted, habitTotal, focus, tasksCompleted, tasksCreated, xp, social] =
        await Promise.all([
          this.prisma.habitLog.count({
            where: { userId, completedAt: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.habit.count({ where: { userId, isActive: true, deletedAt: null } }),
          this.prisma.focusSession.aggregate({
            where: { userId, status: 'COMPLETED', startedAt: { gte: dayStart, lte: dayEnd } },
            _sum:  { actualMinutes: true },
            _count: { id: true },
          }),
          this.prisma.plannerTask.count({
            where: { userId, status: 'DONE', completedAt: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.plannerTask.count({
            where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
          }),
          this.prisma.xpLog.aggregate({
            where: { userId, earnedAt: { gte: dayStart, lte: dayEnd } },
            _sum:  { amount: true },
          }),
          this.prisma.socialUsageLog.aggregate({
            where: { userId, loggedDate: { gte: dayStart, lte: dayEnd } },
            _sum:  { minutes: true },
          }),
        ]);

      const habitCompletionRate = habitTotal > 0 ? habitsCompleted / habitTotal : 0;

      // Request AI productivity score for this day
      let productivityScore = 0;
      const dailyMetrics = await this.buildDailyMetricsHistory(userId, 30);
      if (dailyMetrics.length > 0) {
        const scoreResult = await this.gateway.scoreProductivity({
          user_id:         userId,
          period_days:     30,
          habits:          [],
          focus_sessions:  dailyMetrics.map((d) => ({
            date:    d.date,
            minutes: d.focus_minutes,
            mode:    'POMODORO_25',
          })),
          tasks_completed: tasksCompleted,
          tasks_total:     tasksCompleted + tasksCreated,
          social_usage:    [],
        });

        if (scoreResult.ok) productivityScore = scoreResult.data.score;
      }

      await this.prisma.analyticsDaily.upsert({
        where:  { userId_date: { userId, date: dayStart } },
        create: {
          userId, date: dayStart,
          habitsCompleted,
          habitTotal,
          habitCompletionRate,
          focusMinutes:     focus._sum.actualMinutes ?? 0,
          focusSessions:    focus._count.id,
          tasksCompleted,
          tasksCreated,
          xpEarned:         xp._sum.amount ?? 0,
          productivityScore,
          socialMinutes:    social._sum.minutes ?? 0,
        },
        update: {
          habitsCompleted,
          habitTotal,
          habitCompletionRate,
          focusMinutes:     focus._sum.actualMinutes ?? 0,
          focusSessions:    focus._count.id,
          tasksCompleted,
          tasksCreated,
          xpEarned:         xp._sum.amount ?? 0,
          productivityScore,
          socialMinutes:    social._sum.minutes ?? 0,
        },
      });
    } catch (err) {
      this.logger.error(`Analytics daily job error user=${userId} date=${date}`, err);
      throw err;
    }
  }

  /**
   * Refreshes the dashboard snapshot for a user.
   * Runs after any event that changes key dashboard metrics.
   */
  @Process(JOB_ANALYTICS_SNAPSHOT)
  async refreshSnapshot(job: Job<SnapshotJobData>): Promise<void> {
    const { userId } = job.data;
    try {
      const todayStart = dayjs().startOf('day').toDate();
      const todayEnd   = dayjs().endOf('day').toDate();
      const weekAgo    = dayjs().subtract(7, 'day').toDate();

      const [
        level, habitsToday, totalHabitsToday, focusToday,
        tasksToday, goals, achievements, weeklyXp, streak,
      ] = await Promise.all([
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
          by:     ['status'],
          where:  { userId, deletedAt: null },
          _count: { id: true },
        }),
        this.prisma.userAchievement.count({ where: { userId } }),
        this.prisma.xpLog.aggregate({
          where: { userId, earnedAt: { gte: weekAgo } },
          _sum:  { amount: true },
        }),
        this.prisma.userStatistics.findUnique({ where: { userId }, select: { currentStreak: true, longestStreak: true } }),
      ]);

      const activeGoals    = goals.find((g) => g.status === 'ACTIVE')?._count.id ?? 0;
      const completedGoals = goals.find((g) => g.status === 'COMPLETED')?._count.id ?? 0;

      await this.prisma.userDashboardSnapshot.upsert({
        where:  { userId },
        create: {
          userId,
          level:                level?.level ?? 1,
          currentXp:            level?.currentXp ?? 0,
          totalXp:              level?.totalXp ?? 0,
          xpToNextLevel:        level?.xpToNextLevel ?? 100,
          currentStreak:        streak?.currentStreak ?? 0,
          longestStreak:        streak?.longestStreak ?? 0,
          habitsCompletedToday: habitsToday,
          totalHabitsToday,
          focusMinutesToday:    focusToday._sum.actualMinutes ?? 0,
          tasksCompletedToday:  tasksToday,
          activeGoals,
          completedGoals,
          totalAchievements:    achievements,
          weeklyXp:             weeklyXp._sum.amount ?? 0,
        },
        update: {
          level:                level?.level ?? 1,
          currentXp:            level?.currentXp ?? 0,
          totalXp:              level?.totalXp ?? 0,
          xpToNextLevel:        level?.xpToNextLevel ?? 100,
          currentStreak:        streak?.currentStreak ?? 0,
          longestStreak:        streak?.longestStreak ?? 0,
          habitsCompletedToday: habitsToday,
          totalHabitsToday,
          focusMinutesToday:    focusToday._sum.actualMinutes ?? 0,
          tasksCompletedToday:  tasksToday,
          activeGoals,
          completedGoals,
          totalAchievements:    achievements,
          weeklyXp:             weeklyXp._sum.amount ?? 0,
        },
      });
    } catch (err) {
      this.logger.error(`Snapshot job error user=${userId}`, err);
      throw err;
    }
  }

  private async buildDailyMetricsHistory(userId: string, days: number) {
    const since = dayjs().subtract(days, 'day').startOf('day').toDate();
    const records = await this.prisma.analyticsDaily.findMany({
      where:   { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    return records.map((r) => ({
      date:              dayjs(r.date).format('YYYY-MM-DD'),
      focus_minutes:     r.focusMinutes,
      habit_completion:  r.habitCompletionRate,
      productivity_score: r.productivityScore,
    }));
  }
}
