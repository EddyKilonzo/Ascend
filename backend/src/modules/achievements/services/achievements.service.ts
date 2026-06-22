import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly events:  EventEmitter2,
  ) {}

  /** Returns all active achievements with the user's unlock status. */
  async getAllWithProgress(userId: string) {
    try {
      const [achievements, userAchievements] = await Promise.all([
        this.prisma.achievement.findMany({
          where:   { isActive: true },
          orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
        }),
        this.prisma.userAchievement.findMany({
          where:  { userId },
          select: { achievementId: true, unlockedAt: true },
        }),
      ]);

      const unlockedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]));

      return achievements.map((a) => ({
        ...a,
        isUnlocked:  unlockedMap.has(a.id),
        unlockedAt:  unlockedMap.get(a.id) ?? null,
      }));
    } catch (error) {
      this.logger.error(`getAllWithProgress error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns achievements the user has unlocked (paginated). */
  async getUserAchievements(userId: string, page = 1, limit = 20) {
    try {
      const [items, total] = await Promise.all([
        this.prisma.userAchievement.findMany({
          where:   { userId },
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' },
          ...getPrismaSkipTake(page, limit),
        }),
        this.prisma.userAchievement.count({ where: { userId } }),
      ]);
      return paginate(items, total, page, limit);
    } catch (error) {
      this.logger.error(`getUserAchievements error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Awards an achievement to a user if not already unlocked.
   * Emits achievement.unlocked so the notifications module can push an alert.
   */
  async award(userId: string, achievementSlug: string) {
    try {
      const achievement = await this.prisma.achievement.findUnique({
        where: { slug: achievementSlug },
      });
      if (!achievement || !achievement.isActive) return;

      const alreadyUnlocked = await this.prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      });
      if (alreadyUnlocked) return;

      await this.prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });

      this.events.emit('achievement.unlocked', {
        userId,
        achievementId:   achievement.id,
        achievementName: achievement.name,
        xpReward:        achievement.xpReward,
      });

      this.logger.log(`Achievement unlocked — user ${userId} slug ${achievementSlug}`);
    } catch (error) {
      this.logger.error(`award achievement error — user ${userId} slug ${achievementSlug}`, error);
    }
  }

  // ─── Automatic achievement checks triggered by domain events ───────────────

  @OnEvent('habit.completed')
  async checkHabitAchievements(payload: { userId: string; streak: number }) {
    if (payload.streak >= 7)   await this.award(payload.userId, 'habit-streak-7');
    if (payload.streak >= 30)  await this.award(payload.userId, 'habit-streak-30');
    if (payload.streak >= 100) await this.award(payload.userId, 'habit-streak-100');
  }

  @OnEvent('xp.level_up')
  async checkLevelAchievements(payload: { userId: string; newLevel: number }) {
    if (payload.newLevel >= 5)  await this.award(payload.userId, 'level-5');
    if (payload.newLevel >= 10) await this.award(payload.userId, 'level-10');
    if (payload.newLevel >= 25) await this.award(payload.userId, 'level-25');
    if (payload.newLevel >= 50) await this.award(payload.userId, 'level-50');
  }

  @OnEvent('goal.completed')
  async checkGoalAchievements(payload: { userId: string }) {
    const count = await this.prisma.goal.count({
      where: { userId: payload.userId, status: 'COMPLETED' },
    });
    if (count >= 1)  await this.award(payload.userId, 'first-goal');
    if (count >= 5)  await this.award(payload.userId, 'goal-crusher-5');
    if (count >= 10) await this.award(payload.userId, 'goal-crusher-10');
  }

  @OnEvent('focus.session_completed')
  async checkFocusAchievements(payload: { userId: string }) {
    const count = await this.prisma.focusSession.count({
      where: { userId: payload.userId, status: 'COMPLETED' },
    });
    if (count >= 1)   await this.award(payload.userId, 'first-focus');
    if (count >= 10)  await this.award(payload.userId, 'focus-10');
    if (count >= 50)  await this.award(payload.userId, 'focus-50');
    if (count >= 100) await this.award(payload.userId, 'focus-100');
  }
}
