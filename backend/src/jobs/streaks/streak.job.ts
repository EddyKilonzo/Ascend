import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { QUEUE_NOTIFICATIONS, JOB_NOTIFICATION_PUSH } from '../../queues/queues.constants';
import dayjs from 'dayjs';

@Injectable()
export class StreakJob {
  private readonly logger = new Logger(StreakJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NOTIFICATIONS) private readonly notifQueue: Queue,
  ) {}

  /**
   * Runs at 20:00 every day — checks for users at risk of losing a streak.
   * Users with streaks ≥ 3 who haven't logged today get a reminder notification.
   */
  @Cron('0 20 * * *', { name: 'streak-health-check' })
  async checkStreaksAtRisk(): Promise<void> {
    this.logger.log('Streak health check starting');

    try {
      const todayStart = dayjs().startOf('day').toDate();

      // Find active habits with meaningful streaks that haven't been logged today
      const atRisk = await this.prisma.$queryRaw<Array<{ userId: string; habitName: string; streak: number }>>`
        SELECT DISTINCT h.user_id as "userId", h.name as "habitName",
               COALESCE(
                 (SELECT hl.streak FROM habit_logs hl
                  WHERE hl.habit_id = h.id
                  ORDER BY hl.completed_at DESC LIMIT 1),
                 0
               ) as streak
        FROM habits h
        WHERE h.is_active = true
          AND h.deleted_at IS NULL
          AND h.id NOT IN (
            SELECT hl.habit_id FROM habit_logs hl
            WHERE hl.user_id = h.user_id
              AND hl.completed_at >= ${todayStart}
          )
          AND (
            SELECT COALESCE(MAX(hl.streak), 0) FROM habit_logs hl WHERE hl.habit_id = h.id
          ) >= 3
        LIMIT 1000
      `;

      if (atRisk.length === 0) return;

      const jobs = atRisk.map((r) => ({
        name: JOB_NOTIFICATION_PUSH,
        data: {
          userId: r.userId,
          type:   NotificationType.STREAK_ALERT,
          title:  `Your ${r.streak}-day streak is at risk!`,
          body:   `Log "${r.habitName}" before midnight to keep your streak alive.`,
          data:   { habitName: r.habitName, streak: r.streak },
        },
      }));

      await this.notifQueue.addBulk(jobs);
      this.logger.log(`Streak alerts enqueued for ${atRisk.length} users`);
    } catch (err) {
      this.logger.error('Streak health check failed', err);
    }
  }

  /**
   * Updates UserStatistics.currentStreak and longestStreak for all users.
   * Runs at 00:02 daily — after midnight, before the daily analytics rollup.
   */
  @Cron('2 0 * * *', { name: 'streak-update' })
  async updateStreaks(): Promise<void> {
    try {
      const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
      const dayBefore = dayjs().subtract(2, 'day').startOf('day').toDate();

      // Users with a habit log yesterday — their streak is alive
      const activeStreakUsers = await this.prisma.habitLog.findMany({
        where:   { completedAt: { gte: yesterday } },
        select:  { userId: true, streak: true },
        distinct: ['userId'],
      });

      // Users with no habit log yesterday but had one the day before — streak broken
      const allActiveUsers = await this.prisma.user.findMany({
        where:   { isActive: true, deletedAt: null },
        select:  { id: true },
      });

      const activeSet = new Set(activeStreakUsers.map((u) => u.userId));
      const maxStreak = new Map(activeStreakUsers.map((u) => [u.userId, u.streak]));

      const upserts = allActiveUsers.map(({ id: userId }) => {
        const currentStreak = activeSet.has(userId) ? (maxStreak.get(userId) ?? 0) : 0;
        return this.prisma.userStatistics.upsert({
          where:  { userId },
          create: { userId, currentStreak },
          update: {
            currentStreak,
            longestStreak: currentStreak > 0
              ? { set: currentStreak } // updated via raw comparison below
              : undefined,
          },
        });
      });

      // Update longestStreak separately — only when currentStreak > longestStreak
      await this.prisma.$executeRaw`
        UPDATE user_statistics
        SET longest_streak = GREATEST(longest_streak, current_streak)
        WHERE current_streak > 0
      `;

      await Promise.allSettled(upserts);
      this.logger.log(`Streaks updated for ${allActiveUsers.length} users`);
    } catch (err) {
      this.logger.error('Streak update job failed', err);
    }
  }
}
