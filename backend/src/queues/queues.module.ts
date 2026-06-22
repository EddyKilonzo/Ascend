import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  QUEUE_ML_EVENTS,
  QUEUE_ANALYTICS,
  QUEUE_OCR,
  QUEUE_NOTIFICATIONS,
} from './queues.constants';

import { MlEventsProcessor }      from './ml-events/ml-events.processor';
import { MlEventsListener }       from './ml-events/ml-events.listener';
import { AnalyticsProcessor }     from './analytics/analytics.processor';
import { OcrProcessor }           from './ocr/ocr.processor';
import { NotificationsProcessor } from './notifications/notifications.processor';

import { DatabaseModule }    from '../database/database.module';
import { AiGatewayModule }   from '../integrations/ai-gateway/ai-gateway.module';

const QUEUES = [
  { name: QUEUE_ML_EVENTS,     defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2_000 }, removeOnComplete: 100, removeOnFail: 50 } },
  { name: QUEUE_ANALYTICS,     defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 1_000 }, removeOnComplete: 100, removeOnFail: 50 } },
  { name: QUEUE_OCR,           defaultJobOptions: { attempts: 2, backoff: { type: 'fixed',       delay: 5_000 }, removeOnComplete: 50,  removeOnFail: 50 } },
  { name: QUEUE_NOTIFICATIONS, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 1_000 }, removeOnComplete: 200, removeOnFail: 100 } },
];

@Module({
  imports: [
    DatabaseModule,
    AiGatewayModule,

    BullModule.forRootAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        redis: {
          host:     cfg.get('REDIS_HOST', 'localhost'),
          port:     cfg.get<number>('REDIS_PORT', 6379),
          password: cfg.get('REDIS_PASSWORD'),
          db:       cfg.get<number>('REDIS_QUEUE_DB', 4),
        },
      }),
    }),

    ...QUEUES.map((q) => BullModule.registerQueue(q)),
  ],
  providers: [
    MlEventsProcessor,
    MlEventsListener,
    AnalyticsProcessor,
    OcrProcessor,
    NotificationsProcessor,
  ],
  exports: [
    BullModule,  // so other modules can inject queues via @InjectQueue
  ],
})
export class QueuesModule {}
