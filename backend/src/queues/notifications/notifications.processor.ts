import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUE_NOTIFICATIONS, JOB_NOTIFICATION_PUSH } from '../queues.constants';
import { NotificationType } from '@prisma/client';

export interface NotificationJobData {
  userId: string;
  type:   NotificationType;
  title:  string;
  body:   string;
  data?:  Record<string, unknown>;
  actionUrl?: string;
}

@Processor(QUEUE_NOTIFICATIONS)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  @Process(JOB_NOTIFICATION_PUSH)
  async pushNotification(job: Job<NotificationJobData>): Promise<void> {
    const { userId, type, title, body, data, actionUrl } = job.data;

    try {
      // Persist notification in DB (the source of truth; client polls or uses websocket)
      const notification = await this.prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data:      data ? JSON.stringify(data) : null,
          actionUrl: actionUrl ?? null,
          isRead:    false,
        },
      });

      // Emit in-process event for any active WebSocket gateway to forward immediately
      this.events.emit('notification.created', {
        userId,
        notification: { id: notification.id, type, title, body, data, actionUrl },
      });
    } catch (err) {
      this.logger.error(`Failed to push notification user=${userId} type=${type}`, err);
      throw err;
    }
  }
}
