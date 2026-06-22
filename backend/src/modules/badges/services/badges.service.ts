import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Returns all active badges with the user's earned/displayed status. */
  async getAllWithStatus(userId: string) {
    try {
      const [badges, userBadges] = await Promise.all([
        this.prisma.badge.findMany({
          where:   { isActive: true },
          orderBy: [{ rarity: 'asc' }, { name: 'asc' }],
        }),
        this.prisma.userBadge.findMany({
          where:  { userId },
          select: { badgeId: true, earnedAt: true, isDisplayed: true },
        }),
      ]);

      const earnedMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]));

      return badges.map((b) => ({
        ...b,
        isEarned:    earnedMap.has(b.id),
        earnedAt:    earnedMap.get(b.id)?.earnedAt ?? null,
        isDisplayed: earnedMap.get(b.id)?.isDisplayed ?? false,
      }));
    } catch (error) {
      this.logger.error(`getAllWithStatus error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns only the badges the user has earned.
   * `isDisplayed` badges are shown on the user's public profile.
   */
  async getUserBadges(userId: string) {
    try {
      return await this.prisma.userBadge.findMany({
        where:   { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`getUserBadges error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Toggles whether a badge is shown on the user's public profile.
   * A user may display at most 6 badges simultaneously.
   */
  async toggleDisplay(userId: string, badgeId: string, isDisplayed: boolean) {
    try {
      const userBadge = await this.prisma.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId } },
      });
      if (!userBadge) throw new ResourceNotFoundException('Badge', badgeId);
      if (userBadge.userId !== userId) throw new ForbiddenException('Access denied');

      if (isDisplayed) {
        const displayedCount = await this.prisma.userBadge.count({
          where: { userId, isDisplayed: true },
        });
        if (displayedCount >= 6) {
          throw new ForbiddenException('Maximum 6 badges can be displayed on your profile');
        }
      }

      return await this.prisma.userBadge.update({
        where: { userId_badgeId: { userId, badgeId } },
        data:  { isDisplayed },
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`toggleDisplay error — user ${userId} badge ${badgeId}`, error);
      throw error;
    }
  }

  /** Awards a badge to a user if not already earned. Non-fatal — errors are logged only. */
  async award(userId: string, badgeSlug: string) {
    try {
      const badge = await this.prisma.badge.findUnique({ where: { slug: badgeSlug } });
      if (!badge || !badge.isActive) return;

      await this.prisma.userBadge.upsert({
        where:  { userId_badgeId: { userId, badgeId: badge.id } },
        update: {},
        create: { userId, badgeId: badge.id },
      });
    } catch (error) {
      this.logger.error(`award badge error — user ${userId} slug ${badgeSlug}`, error);
    }
  }
}
