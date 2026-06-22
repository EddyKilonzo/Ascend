import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';

/** XP awarded per action type. Adjust multipliers here for game balance. */
const XP_VALUES: Record<string, number> = {
  'habit.completed':        10,
  'planner.task_completed':  5,
  'focus.session_completed': 15,
  'goal.completed':         100,
  'commitment.kept':         20,
  'challenge.completed':     50,
};

/** Level thresholds — XP required to reach each level.
 *  Formula: level^2 * 100  (level 1 = 100, level 10 = 10,000, level 50 = 250,000)
 */
function xpForLevel(level: number): number {
  return level * level * 100;
}

@Injectable()
export class XpService {
  private readonly logger = new Logger(XpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Awards XP to a user for a given action.
   * Handles leveling up automatically when the XP threshold is crossed.
   * Emits xp.awarded and (if leveled up) xp.level_up events.
   */
  async awardXp(userId: string, amount: number, source: string, sourceId?: string) {
    try {
      if (amount <= 0) return;

      // Use a transaction with a re-read inside to prevent concurrent XP award race conditions.
      // The xpLog insert + level update are atomic — a second concurrent award will re-read
      // the updated totalXp after the first transaction commits.
      await this.prisma.$transaction(async (tx) => {
        await tx.xpLog.create({
          data: { userId, amount, source, sourceId, description: `XP from ${source}` },
        });

        let level = await tx.userLevel.findUnique({ where: { userId } });
        if (!level) {
          await tx.userLevel.create({
            data: { userId, level: 1, currentXp: amount, totalXp: amount, xpToNextLevel: xpForLevel(2) - amount },
          });
          return;
        }

        let   newLevel   = level.level;
        let   remaining  = level.currentXp + amount;
        const newTotalXp = level.totalXp   + amount;

        while (remaining >= xpForLevel(newLevel + 1)) {
          remaining -= xpForLevel(newLevel + 1);
          newLevel  += 1;
        }

        await tx.userLevel.update({
          where: { userId },
          data: {
            currentXp:    remaining,
            totalXp:      newTotalXp,
            level:        newLevel,
            xpToNextLevel: xpForLevel(newLevel + 1) - remaining,
          },
        });

        if (newLevel > level.level) {
          this.events.emit('xp.level_up', { userId, newLevel });
        }
        this.events.emit('xp.awarded', { userId, amount, source, newLevel, newTotalXp });
      });
    } catch (error) {
      this.logger.error(`awardXp error — user ${userId} source ${source}`, error);
      // XP errors must not break the primary action — log but do not rethrow
    }
  }

  /** Returns current XP, level, and next-level threshold for a user. */
  async getUserLevel(userId: string) {
    try {
      const level = await this.prisma.userLevel.findUnique({ where: { userId } });
      if (!level) return { level: 1, currentXp: 0, totalXp: 0, xpToNextLevel: 100 };
      return level;
    } catch (error) {
      this.logger.error(`getUserLevel error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns paginated XP log history. */
  async getXpHistory(userId: string, page = 1, limit = 20) {
    try {
      const [logs, total] = await Promise.all([
        this.prisma.xpLog.findMany({
          where:   { userId },
          orderBy: { earnedAt: 'desc' },
          skip:    (page - 1) * limit,
          take:    limit,
        }),
        this.prisma.xpLog.count({ where: { userId } }),
      ]);
      return { data: logs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`getXpHistory error — user ${userId}`, error);
      throw error;
    }
  }

  // ─── Event listeners — award XP automatically when domain events fire ─────

  @OnEvent('habit.completed')
  async onHabitCompleted(payload: { userId: string; habitId: string; xpEarned: number }) {
    await this.awardXp(payload.userId, payload.xpEarned, 'habit.completed', payload.habitId);
  }

  @OnEvent('planner.task_completed')
  async onTaskCompleted(payload: { userId: string; taskId: string; xpReward: number }) {
    await this.awardXp(payload.userId, payload.xpReward, 'planner.task_completed', payload.taskId);
  }

  @OnEvent('focus.session_completed')
  async onFocusCompleted(payload: { userId: string; sessionId: string; xpEarned: number }) {
    await this.awardXp(payload.userId, payload.xpEarned, 'focus.session_completed', payload.sessionId);
  }

  @OnEvent('goal.completed')
  async onGoalCompleted(payload: { userId: string; goalId: string; xpReward: number }) {
    await this.awardXp(payload.userId, payload.xpReward, 'goal.completed', payload.goalId);
  }
}
