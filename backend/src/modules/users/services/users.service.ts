import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { PaginationDto, paginate, getPrismaSkipTake } from '../../../common/utils/pagination.util';
import { AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  private readonly userSelect = {
    id:              true,
    email:           true,
    username:        true,
    displayName:     true,
    avatarUrl:       true,
    bio:             true,
    timezone:        true,
    role:            true,
    isEmailVerified: true,
    isTwoFaEnabled:  true,
    notificationPrefs: true,
    themePrefs:      true,
    productivityPrefs: true,
    createdAt:       true,
    updatedAt:       true,
    level:           { select: { level: true, currentXp: true, totalXp: true, xpToNextLevel: true } },
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where:  { id, deletedAt: null },
        select: this.userSelect,
      });
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`findById error for ${id}`, error);
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email, deletedAt: null },
      });
    } catch (error) {
      this.logger.error(`findByEmail error for ${email}`, error);
      throw error;
    }
  }

  async update(userId: string, dto: UpdateUserDto) {
    try {
      await this.findById(userId);
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data:  dto as any,
        select: this.userSelect,
      });
      return updated;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`update error for ${userId}`, error);
      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    try {
      const authProvider = await this.prisma.userAuthProvider.findFirst({
        where: { userId, provider: AuthProvider.EMAIL },
      });

      if (!authProvider?.accessToken) {
        throw new ForbiddenException('Password cannot be changed for OAuth-only accounts');
      }

      const isValid = await bcrypt.compare(dto.currentPassword, authProvider.accessToken);
      if (!isValid) throw new UnauthorizedException('Current password is incorrect');

      const hashed = await bcrypt.hash(dto.newPassword, 12);
      await this.prisma.userAuthProvider.update({
        where: { id: authProvider.id },
        data:  { accessToken: hashed },
      });

      await this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data:  { isRevoked: true },
      });

      return { message: 'Password changed successfully. Please log in again.' };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) throw error;
      this.logger.error(`changePassword error for ${userId}`, error);
      throw error;
    }
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    try {
      const updated = await this.prisma.user.update({
        where:  { id: userId },
        data:   { avatarUrl },
        select: { id: true, avatarUrl: true },
      });
      return updated;
    } catch (error) {
      this.logger.error(`updateAvatar error for ${userId}`, error);
      throw error;
    }
  }

  async deleteAccount(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data:  {
          deletedAt: new Date(),
          isActive:  false,
          email:     `deleted_${userId}@deleted.invalid`,
        },
      });
      return { message: 'Account scheduled for deletion' };
    } catch (error) {
      this.logger.error(`deleteAccount error for ${userId}`, error);
      throw error;
    }
  }

  async getPublicProfile(username: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username, deletedAt: null, isActive: true },
        select: {
          id:          true,
          username:    true,
          displayName: true,
          avatarUrl:   true,
          bio:         true,
          createdAt:   true,
          level:       { select: { level: true, totalXp: true } },
          userBadges:  {
            where:   { isDisplayed: true },
            include: { badge: true },
            take:    6,
          },
          userAchievements: {
            orderBy: { unlockedAt: 'desc' },
            include: { achievement: true },
            take:    9,
          },
        },
      });

      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`getPublicProfile error for ${username}`, error);
      throw error;
    }
  }

  async getUserStats(userId: string) {
    try {
      const [habitCount, focusCount, goalCount, achievementCount, totalXp] = await Promise.all([
        this.prisma.habit.count({ where: { userId, isActive: true } }),
        this.prisma.focusSession.count({ where: { userId, status: 'COMPLETED' } }),
        this.prisma.goal.count({ where: { userId, status: 'COMPLETED', deletedAt: null } }),
        this.prisma.userAchievement.count({ where: { userId } }),
        this.prisma.userLevel.findUnique({ where: { userId }, select: { totalXp: true, level: true } }),
      ]);

      return {
        habits:       habitCount,
        focusSessions: focusCount,
        goalsCompleted: goalCount,
        achievements: achievementCount,
        level:        totalXp?.level ?? 1,
        totalXp:      totalXp?.totalXp ?? 0,
      };
    } catch (error) {
      this.logger.error(`getUserStats error for ${userId}`, error);
      throw error;
    }
  }
}
