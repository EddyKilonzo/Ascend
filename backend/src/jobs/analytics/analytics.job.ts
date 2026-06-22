import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_ANALYTICS, JOB_ANALYTICS_DAILY, JOB_ANALYTICS_SNAPSHOT } from '../../queues/queues.constants';
import dayjs from 'dayjs';

@Injectable()
export class AnalyticsJob {
  private readonly logger = new Logger(AnalyticsJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_ANALYTICS) private readonly analyticsQueue: Queue,
  ) {}

  /**
   * Runs at 00:05 every day — computes yesterday's analytics for every active user.
   * 5-minute offset avoids midnight spike, ensures all late-night events are captured.
   */
  @Cron('5 0 * * *', { name: 'analytics-daily-rollup' })
  async dailyRollup(): Promise<void> {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    this.logger.log(`Analytics daily rollup starting for ${yesterday}`);

    try {
      // Chunk users to avoid loading all IDs into memory at once
      let cursor: string | undefined;
      let processed = 0;

      while (true) {
        const users = await this.prisma.user.findMany({
          where: { isActive: true, deletedAt: null },
          select: { id: true },
          take:   500,
          skip:   cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { id: 'asc' },
        });

        if (users.length === 0) break;

        const jobs = users.map((u) => ({
          name: JOB_ANALYTICS_DAILY,
          data: { userId: u.id, date: yesterday },
          opts: { delay: Math.floor(Math.random() * 5_000) }, // spread load over 5s
        }));

        await this.analyticsQueue.addBulk(jobs);
        processed += users.length;
        cursor = users[users.length - 1].id;

        if (users.length < 500) break;
      }

      this.logger.log(`Analytics daily rollup enqueued for ${processed} users`);
    } catch (err) {
      this.logger.error('Analytics daily rollup failed', err);
    }
  }

  /**
   * Refreshes dashboard snapshots every 5 minutes for active users.
   * Targets only users who had activity in the last 15 minutes.
   */
  @Cron('*/5 * * * *', { name: 'analytics-snapshot-refresh' })
  async snapshotRefresh(): Promise<void> {
    try {
      const since = new Date(Date.now() - 15 * 60_000);

      // Find users with recent XP activity (proxy for "was active recently")
      const recentUsers = await this.prisma.xpLog.findMany({
        where:   { earnedAt: { gte: since } },
        select:  { userId: true },
        distinct: ['userId'],
        take:    200,
      });

      if (recentUsers.length === 0) return;

      const jobs = recentUsers.map((u) => ({
        name: JOB_ANALYTICS_SNAPSHOT,
        data: { userId: u.userId },
      }));

      await this.analyticsQueue.addBulk(jobs);
    } catch (err) {
      this.logger.error('Snapshot refresh job failed', err);
    }
  }

  /**
   * Weekly rollup — Sundays at 00:10.
   * Aggregates daily records into AnalyticsWeekly.
   */
  @Cron('10 0 * * 0', { name: 'analytics-weekly-rollup' })
  async weeklyRollup(): Promise<void> {
    const weekStart = dayjs().subtract(1, 'week').startOf('isoWeek');
    const weekEnd   = weekStart.endOf('isoWeek');
    this.logger.log(`Analytics weekly rollup for week starting ${weekStart.format('YYYY-MM-DD')}`);

    try {
      const groups = await this.prisma.analyticsDaily.groupBy({
        by:    ['userId'],
        where: { date: { gte: weekStart.toDate(), lte: weekEnd.toDate() } },
        _sum:  {
          habitsCompleted: true, focusMinutes: true, tasksCompleted: true, xpEarned: true,
          focusSessions: true,
        },
        _avg:  { habitCompletionRate: true, productivityScore: true },
        _count: { id: true },
      });

      const upserts = groups.map((g) =>
        this.prisma.analyticsWeekly.upsert({
          where:  { userId_weekNumber_year: {
            userId:     g.userId,
            weekNumber: weekStart.isoWeek(),
            year:       weekStart.year(),
          }},
          create: {
            userId:              g.userId,
            weekStart:           weekStart.toDate(),
            weekNumber:          weekStart.isoWeek(),
            year:                weekStart.year(),
            habitsCompleted:     g._sum.habitsCompleted ?? 0,
            avgHabitRate:        g._avg.habitCompletionRate ?? 0,
            totalFocusMinutes:   g._sum.focusMinutes ?? 0,
            focusSessions:       g._sum.focusSessions ?? 0,
            tasksCompleted:      g._sum.tasksCompleted ?? 0,
            xpEarned:            g._sum.xpEarned ?? 0,
            avgProductivityScore: g._avg.productivityScore ?? 0,
          },
          update: {
            habitsCompleted:     g._sum.habitsCompleted ?? 0,
            avgHabitRate:        g._avg.habitCompletionRate ?? 0,
            totalFocusMinutes:   g._sum.focusMinutes ?? 0,
            focusSessions:       g._sum.focusSessions ?? 0,
            tasksCompleted:      g._sum.tasksCompleted ?? 0,
            xpEarned:            g._sum.xpEarned ?? 0,
            avgProductivityScore: g._avg.productivityScore ?? 0,
          },
        }),
      );

      await Promise.allSettled(upserts);
      this.logger.log(`Weekly rollup complete for ${groups.length} users`);
    } catch (err) {
      this.logger.error('Weekly rollup failed', err);
    }
  }
}
