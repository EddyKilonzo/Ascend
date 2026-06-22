import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';

/** XP required to reach the next skill level. Keeps skill progression smooth but rewarding. */
function skillXpForLevel(level: number): number {
  return level * 50;
}

/** Maps domain event sources to the skills they advance. */
const SOURCE_TO_SKILLS: Record<string, string[]> = {
  'habit.completed':          ['discipline', 'consistency'],
  'focus.session_completed':  ['focus', 'discipline'],
  'goal.completed':           ['career', 'discipline'],
  'planner.task_completed':   ['productivity'],
  'commitment.kept':          ['accountability'],
};

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all skills with the user's progress on each.
   * Skills without any user progress are returned with level 1 / xp 0.
   */
  async getAllWithProgress(userId: string) {
    try {
      const [skills, progress] = await Promise.all([
        this.prisma.skill.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] }),
        this.prisma.userSkillProgress.findMany({
          where:  { userId },
          select: { skillId: true, level: true, xp: true },
        }),
      ]);

      const progressMap = new Map(progress.map((p) => [p.skillId, p]));

      return skills.map((s) => {
        const p = progressMap.get(s.id);
        return {
          ...s,
          userLevel: p?.level ?? 1,
          userXp:    p?.xp    ?? 0,
          xpToNext:  p ? skillXpForLevel(p.level + 1) - p.xp : skillXpForLevel(2),
        };
      });
    } catch (error) {
      this.logger.error(`getAllWithProgress error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Awards XP to a specific skill for a user.
   * Handles level-ups atomically within a transaction.
   */
  async awardSkillXp(userId: string, skillName: string, amount: number) {
    try {
      if (amount <= 0) return;

      const skill = await this.prisma.skill.findFirst({
        where: { name: { equals: skillName, mode: 'insensitive' } },
      });
      if (!skill) return;

      await this.prisma.$transaction(async (tx) => {
        let progress = await tx.userSkillProgress.findUnique({
          where: { userId_skillId: { userId, skillId: skill.id } },
        });

        if (!progress) {
          progress = await tx.userSkillProgress.create({
            data: { userId, skillId: skill.id, level: 1, xp: 0 },
          });
        }

        let newXp    = progress.xp + amount;
        let newLevel = progress.level;

        while (newXp >= skillXpForLevel(newLevel + 1) && newLevel < skill.maxLevel) {
          newXp    -= skillXpForLevel(newLevel + 1);
          newLevel += 1;
        }

        await tx.userSkillProgress.update({
          where: { userId_skillId: { userId, skillId: skill.id } },
          data:  { xp: newXp, level: newLevel },
        });
      });
    } catch (error) {
      this.logger.error(`awardSkillXp error — user ${userId} skill ${skillName}`, error);
    }
  }

  // ─── Auto-advance skills when domain events fire ────────────────────────────

  @OnEvent('habit.completed')
  async onHabitCompleted(payload: { userId: string }) {
    for (const skillName of SOURCE_TO_SKILLS['habit.completed'] ?? []) {
      await this.awardSkillXp(payload.userId, skillName, 5);
    }
  }

  @OnEvent('focus.session_completed')
  async onFocusCompleted(payload: { userId: string }) {
    for (const skillName of SOURCE_TO_SKILLS['focus.session_completed'] ?? []) {
      await this.awardSkillXp(payload.userId, skillName, 10);
    }
  }

  @OnEvent('goal.completed')
  async onGoalCompleted(payload: { userId: string }) {
    for (const skillName of SOURCE_TO_SKILLS['goal.completed'] ?? []) {
      await this.awardSkillXp(payload.userId, skillName, 20);
    }
  }
}
