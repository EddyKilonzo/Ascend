import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationType } from '@prisma/client';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Returns paginated notifications for a user. */
  async getNotifications(userId: string, page = 1, limit = 20, unreadOnly = false) {
    try {
      const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
      const [notifications, total] = await Promise.all([
        this.prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...getPrismaSkipTake(page, limit),
        }),
        this.prisma.notification.count({ where }),
      ]);
      return paginate(notifications, total, page, limit);
    } catch (error) {
      this.logger.error(`getNotifications error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns the unread notification count. */
  async getUnreadCount(userId: string) {
    try {
      const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
      return { unreadCount: count };
    } catch (error) {
      this.logger.error(`getUnreadCount error — user ${userId}`, error);
      throw error;
    }
  }

  /** Marks a single notification as read. */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification) throw new ResourceNotFoundException('Notification', notificationId);
      if (notification.userId !== userId) throw new ForbiddenException('Access denied');

      return await this.prisma.notification.update({
        where: { id: notificationId },
        data:  { isRead: true, readAt: new Date() },
      });
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`markAsRead error — notification ${notificationId}`, error);
      throw error;
    }
  }

  /** Marks all unread notifications as read for a user. */
  async markAllAsRead(userId: string) {
    try {
      const { count } = await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data:  { isRead: true, readAt: new Date() },
      });
      return { updated: count };
    } catch (error) {
      this.logger.error(`markAllAsRead error — user ${userId}`, error);
      throw error;
    }
  }

  /** Deletes a single notification. */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
      if (!notification) throw new ResourceNotFoundException('Notification', notificationId);
      if (notification.userId !== userId) throw new ForbiddenException('Access denied');

      await this.prisma.notification.delete({ where: { id: notificationId } });
      return { message: 'Notification deleted' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`deleteNotification error — notification ${notificationId}`, error);
      throw error;
    }
  }

  /** Internal helper to push a notification to a user. */
  async push(
    userId: string,
    type:   NotificationType,
    title:  string,
    body:   string,
    data?:  Record<string, unknown>,
  ) {
    try {
      return await this.prisma.notification.create({
        data: { userId, type, title, body, data: data as any },
      });
    } catch (error) {
      this.logger.error(`push notification error — user ${userId} type ${type}`, error);
    }
  }

  // ─── Event-driven notifications ────────────────────────────────────────────

  @OnEvent('xp.level_up')
  async onLevelUp(payload: { userId: string; newLevel: number }) {
    await this.push(
      payload.userId,
      NotificationType.LEVEL_UP,
      `Level ${payload.newLevel} reached!`,
      `You have leveled up to level ${payload.newLevel}. Keep going!`,
      { newLevel: payload.newLevel },
    );
  }

  @OnEvent('achievement.unlocked')
  async onAchievementUnlocked(payload: { userId: string; achievementName: string; achievementId: string }) {
    await this.push(
      payload.userId,
      NotificationType.ACHIEVEMENT_UNLOCKED,
      `Achievement unlocked: ${payload.achievementName}`,
      `You unlocked a new achievement!`,
      { achievementId: payload.achievementId },
    );
  }
}
