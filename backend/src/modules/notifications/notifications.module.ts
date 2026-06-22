import { Module } from '@nestjs/common';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService], exports: [NotificationsService],
})
export class NotificationsModule {}
