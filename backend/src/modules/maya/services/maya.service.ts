import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Maya — the AI productivity coach module.
 * Currently returns rule-based suggestions drawn from the user's real data.
 * Full LLM integration (FastAPI ML service) is wired in Phase 2.
 */
@Injectable()
export class MayaService {
  private readonly logger = new Logger(MayaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates contextual productivity suggestions for the user.
   * Analyzes habit completion rates, focus session frequency, and overdue tasks.
   */
  async getSuggestions(userId: string) {
    try {
      const [habitStats, overdueTasks, focusStats, level] = await Promise.all([
        this.prisma.habitLog.count({
          where: {
            userId,
            completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.plannerTask.count({
          where: {
            userId,
            status:  { in: ['TODO', 'IN_PROGRESS'] },
            dueDate: { lt: new Date() },
            deletedAt: null,
          },
        }),
        this.prisma.focusSession.count({
          where: {
            userId,
            status:    'COMPLETED',
            startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.userLevel.findUnique({ where: { userId } }),
      ]);

      const suggestions: string[] = [];

      if (habitStats < 3) {
        suggestions.push('You have completed fewer than 3 habits this week. Try to check in on your daily habits to build momentum.');
      }
      if (overdueTasks > 0) {
        suggestions.push(`You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. Tackle your most critical one first.`);
      }
      if (focusStats < 2) {
        suggestions.push('Consider scheduling at least 2 focused work sessions this week. Even 25 minutes can significantly boost your productivity.');
      }
      if ((level?.currentXp ?? 0) > (level?.xpToNextLevel ?? 100) * 0.8) {
        suggestions.push(`You are ${Math.round(((level?.currentXp ?? 0) / (level?.xpToNextLevel ?? 100)) * 100)}% of the way to level ${(level?.level ?? 1) + 1}! Push through with one more productive session.`);
      }
      if (suggestions.length === 0) {
        suggestions.push('Great work! You are on track. Stay consistent and challenge yourself with a new goal.');
      }

      return { suggestions };
    } catch (error) {
      this.logger.error(`getSuggestions error — user ${userId}`, error);
      throw error;
    }
  }
}
