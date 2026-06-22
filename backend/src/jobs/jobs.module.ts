import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AnalyticsJob }  from './analytics/analytics.job';
import { StreakJob }     from './streaks/streak.job';
import { LeaderboardJob } from './leaderboard/leaderboard.job';
import { DatabaseModule } from '../database/database.module';
import { QueuesModule }   from '../queues/queues.module';
import {
  QUEUE_ANALYTICS,
  QUEUE_ML_EVENTS,
  QUEUE_NOTIFICATIONS,
} from '../queues/queues.constants';

@Module({
  imports: [
    DatabaseModule,
    QueuesModule,
    BullModule.registerQueue(
      { name: QUEUE_ANALYTICS },
      { name: QUEUE_ML_EVENTS },
      { name: QUEUE_NOTIFICATIONS },
    ),
  ],
  providers: [AnalyticsJob, StreakJob, LeaderboardJob],
})
export class JobsModule {}
