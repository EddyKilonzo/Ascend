import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { LogHabitDto } from '../dto/log-habit.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { HabitFrequency } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class HabitLogsService {
  private readonly logger = new Logger(HabitLogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Logs a habit completion for the authenticated user.
   * Calculates and updates the current streak for the habit.
   * Emits habit.completed event for XP awarding and analytics pipeline.
   *
   * @throws ConflictException if the habit was already logged for the given period
   * @throws ResourceNotFoundException if the habit does not exist or does not belong to user
   */
  async logHabit(habitId: string, userId: string, dto: LogHabitDto) {
    try {
      const habit = await this.prisma.habit.findFirst({
        where: { id: habitId, userId, isActive: true, deletedAt: null },
      });
      if (!habit) throw new ResourceNotFoundException('Habit', habitId);

      const completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
      const now = new Date();
      const maxBackdate = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 h lookback max
      if (completedAt > now) {
        throw new BadRequestException('completedAt cannot be in the future');
      }
      if (completedAt < maxBackdate) {
        throw new BadRequestException('completedAt cannot be more than 48 hours in the past');
      }

      // Prevent duplicate logs for the same period
      const periodStart = this.getPeriodStart(completedAt, habit.frequency);
      const periodEnd   = this.getPeriodEnd(completedAt, habit.frequency);

      const existing = await this.prisma.habitLog.findFirst({
        where: {
          habitId,
          userId,
          completedAt: { gte: periodStart, lte: periodEnd },
        },
      });
      if (existing) {
        throw new ConflictException(`Habit already logged for this ${habit.frequency.toLowerCase()} period`);
      }

      const streak   = await this.calculateStreak(habitId, userId, completedAt, habit.frequency);
      const xpEarned = this.calculateXp(habit.xpReward, streak);

      const log = await this.prisma.habitLog.create({
        data: {
          habitId,
          userId,
          completedAt,
          count:    dto.count ?? 1,
          note:     dto.note,
          streak,
          xpEarned,
        },
      });

      this.events.emit('habit.completed', {
        userId,
        habitId,
        logId:   log.id,
        xpEarned,
        streak,
        frequency: habit.frequency,
      });

      return { log, xpEarned, streak };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`logHabit error — habit ${habitId} user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Removes a habit log entry. Only the owner can remove their own logs.
   *
   * @throws ResourceNotFoundException if log does not exist
   * @throws ForbiddenException if the log does not belong to the requesting user
   */
  async removeLog(logId: string, userId: string) {
    try {
      const log = await this.prisma.habitLog.findUnique({ where: { id: logId } });
      if (!log)              throw new ResourceNotFoundException('Habit log', logId);
      if (log.userId !== userId) throw new ForbiddenException('Access denied');

      await this.prisma.habitLog.delete({ where: { id: logId } });
      this.events.emit('habit.log_removed', { userId, habitId: log.habitId, logId });

      return { message: 'Log entry removed' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) throw error;
      this.logger.error(`removeLog error — log ${logId}`, error);
      throw error;
    }
  }

  /**
   * Returns paginated log history for a specific habit.
   */
  async getLogsForHabit(habitId: string, userId: string, page = 1, limit = 30) {
    try {
      const habit = await this.prisma.habit.findFirst({
        where: { id: habitId, userId, deletedAt: null },
      });
      if (!habit) throw new ResourceNotFoundException('Habit', habitId);

      const [logs, total] = await Promise.all([
        this.prisma.habitLog.findMany({
          where:   { habitId, userId },
          orderBy: { completedAt: 'desc' },
          skip:    (page - 1) * limit,
          take:    limit,
        }),
        this.prisma.habitLog.count({ where: { habitId, userId } }),
      ]);

      return {
        data:  logs,
        meta:  { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`getLogsForHabit error — habit ${habitId}`, error);
      throw error;
    }
  }

  /**
   * Returns the heatmap data (daily completion counts) for the last N days.
   * Used to render contribution-style heatmaps on the dashboard.
   */
  async getHeatmapData(userId: string, days = 365) {
    try {
      const since = dayjs().subtract(days, 'day').toDate();
      const logs  = await this.prisma.habitLog.findMany({
        where:   { userId, completedAt: { gte: since } },
        select:  { completedAt: true, habitId: true },
        orderBy: { completedAt: 'asc' },
      });

      // Group by date string for O(n) heatmap generation
      const heatmap: Record<string, number> = {};
      for (const log of logs) {
        const key = dayjs(log.completedAt).format('YYYY-MM-DD');
        heatmap[key] = (heatmap[key] ?? 0) + 1;
      }

      return { heatmap };
    } catch (error) {
      this.logger.error(`getHeatmapData error — user ${userId}`, error);
      throw error;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Calculates the current streak by looking back through consecutive completed periods.
   * Streak resets to 1 when a period is missed.
   */
  private async calculateStreak(
    habitId:   string,
    userId:    string,
    completedAt: Date,
    frequency: HabitFrequency,
  ): Promise<number> {
    try {
      const previousLogs = await this.prisma.habitLog.findMany({
        where:   { habitId, userId },
        orderBy: { completedAt: 'desc' },
        take:    1,
        select:  { completedAt: true, streak: true },
      });

      if (previousLogs.length === 0) return 1;

      const last      = previousLogs[0];
      const prevEnd   = this.getPeriodEnd(last.completedAt, frequency);
      const prevStart = this.getPeriodStart(
        dayjs(completedAt).subtract(1, this.frequencyToUnit(frequency)).toDate(),
        frequency,
      );

      // Check if the last completion was in the immediately preceding period
      const wasPreviousPeriod = last.completedAt >= prevStart && last.completedAt <= prevEnd;
      return wasPreviousPeriod ? last.streak + 1 : 1;
    } catch {
      return 1;
    }
  }

  /** Applies a streak bonus multiplier: higher streaks earn more XP. */
  private calculateXp(baseXp: number, streak: number): number {
    const multiplier = streak >= 100 ? 3 : streak >= 30 ? 2 : streak >= 7 ? 1.5 : 1;
    return Math.round(baseXp * multiplier);
  }

  private getPeriodStart(date: Date, frequency: HabitFrequency): Date {
    const d = dayjs(date);
    if (frequency === HabitFrequency.DAILY)   return d.startOf('day').toDate();
    if (frequency === HabitFrequency.WEEKLY)  return d.startOf('week').toDate();
    if (frequency === HabitFrequency.MONTHLY) return d.startOf('month').toDate();
    return d.startOf('day').toDate();
  }

  private getPeriodEnd(date: Date, frequency: HabitFrequency): Date {
    const d = dayjs(date);
    if (frequency === HabitFrequency.DAILY)   return d.endOf('day').toDate();
    if (frequency === HabitFrequency.WEEKLY)  return d.endOf('week').toDate();
    if (frequency === HabitFrequency.MONTHLY) return d.endOf('month').toDate();
    return d.endOf('day').toDate();
  }

  private frequencyToUnit(frequency: HabitFrequency): 'day' | 'week' | 'month' {
    const map = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month' } as const;
    return map[frequency];
  }
}
