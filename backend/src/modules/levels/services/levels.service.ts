import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/** Level threshold formula, mirroring xp.service. */
function xpForLevel(level: number): number {
  return level * level * 100;
}

@Injectable()
export class LevelsService {
  private readonly logger = new Logger(LevelsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the calling user's current level, XP, and progress to the next level.
   * Creates a default record (level 1) if one does not yet exist.
   */
  async getMyLevel(userId: string) {
    try {
      const level = await this.prisma.userLevel.findUnique({ where: { userId } });
      if (!level) {
        return await this.prisma.userLevel.create({
          data: { userId, level: 1, currentXp: 0, totalXp: 0, xpToNextLevel: 100 },
        });
      }
      return level;
    } catch (error) {
      this.logger.error(`getMyLevel error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns the XP thresholds for a range of levels.
   * Useful for the client to render level-progress bars without client-side recalculation.
   */
  getLevelThresholds(from = 1, to = 50) {
    const cappedTo = Math.min(to, 200);
    return Array.from({ length: cappedTo - from + 1 }, (_, i) => {
      const level = from + i;
      return { level, xpRequired: xpForLevel(level) };
    });
  }
}
