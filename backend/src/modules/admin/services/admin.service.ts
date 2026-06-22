import {
  Injectable, Logger, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Role } from '@prisma/client';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns paginated list of all users.
   * Admin-only — protected by RolesGuard at the controller level.
   */
  async listUsers(page = 1, limit = 20, search?: string) {
    try {
      const where = search
        ? {
            OR: [
              { email:       { contains: search, mode: 'insensitive' as const } },
              { username:    { contains: search, mode: 'insensitive' as const } },
              { displayName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: {
            id:              true,
            email:           true,
            username:        true,
            displayName:     true,
            role:            true,
            isActive:        true,
            isEmailVerified: true,
            createdAt:       true,
          },
          ...getPrismaSkipTake(page, limit),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where }),
      ]);

      return paginate(users, total, page, limit);
    } catch (error) {
      this.logger.error('Admin listUsers error', error);
      throw error;
    }
  }

  /**
   * Changes a user's role.
   * An admin cannot demote themselves to prevent accidental lockout.
   */
  async setUserRole(targetUserId: string, role: Role, requestingAdminId: string) {
    try {
      if (targetUserId === requestingAdminId && role !== Role.ADMIN) {
        throw new BadRequestException('You cannot change your own admin role');
      }

      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw new NotFoundException('User not found');

      return await this.prisma.user.update({
        where:  { id: targetUserId },
        data:   { role },
        select: { id: true, email: true, username: true, role: true },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      this.logger.error(`Admin setUserRole error for user ${targetUserId}`, error);
      throw error;
    }
  }

  /**
   * Activates or deactivates a user account.
   * Deactivated users cannot log in — existing sessions are revoked.
   */
  async setUserActive(targetUserId: string, isActive: boolean) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw new NotFoundException('User not found');

      const updated = await this.prisma.user.update({
        where:  { id: targetUserId },
        data:   { isActive },
        select: { id: true, email: true, isActive: true },
      });

      if (!isActive) {
        await this.prisma.session.updateMany({
          where: { userId: targetUserId },
          data:  { isRevoked: true },
        });
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Admin setUserActive error for user ${targetUserId}`, error);
      throw error;
    }
  }

  /** Returns platform-wide statistics for the admin dashboard. */
  async getPlatformStats() {
    try {
      const [users, habits, goals, focusSessions, xpLogs] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.habit.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.goal.count({ where: { deletedAt: null } }),
        this.prisma.focusSession.count({ where: { status: 'COMPLETED' } }),
        this.prisma.xpLog.aggregate({ _sum: { amount: true } }),
      ]);

      return {
        totalUsers:          users,
        activeHabits:        habits,
        totalGoals:          goals,
        completedFocusSessions: focusSessions,
        totalXpAwarded:      xpLogs._sum.amount ?? 0,
      };
    } catch (error) {
      this.logger.error('Admin getPlatformStats error', error);
      throw error;
    }
  }
}
