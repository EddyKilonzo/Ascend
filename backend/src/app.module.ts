import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';

import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { cloudinaryConfig } from './config/cloudinary.config';
import { mailConfig } from './config/mail.config';
import { mlConfig } from './config/ml.config';

import { DatabaseModule }  from './database/database.module';
import { EmailModule }     from './integrations/email/email.module';
import { AiGatewayModule } from './integrations/ai-gateway/ai-gateway.module';
import { QueuesModule }    from './queues/queues.module';
import { JobsModule }      from './jobs/jobs.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HabitsModule } from './modules/habits/habits.module';
import { HabitLogsModule } from './modules/habit-logs/habit-logs.module';
import { PlannerModule } from './modules/planner/planner.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { GoalsModule } from './modules/goals/goals.module';
import { GoalProgressModule } from './modules/goal-progress/goal_progress.module';
import { FocusModule } from './modules/focus/focus.module';
import { SkillsModule } from './modules/skills/skills.module';
import { XpModule } from './modules/xp/xp.module';
import { LevelsModule } from './modules/levels/levels.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { BadgesModule } from './modules/badges/badges.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { AccountabilityModule } from './modules/accountability/accountability.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SocialTrackerModule } from './modules/social-tracker/social_tracker.module';
import { MayaModule } from './modules/maya/maya.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuditLogsModule } from './modules/audit-logs/audit_logs.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, cloudinaryConfig, mailConfig, mlConfig],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => [
        { name: 'short',  ttl: 1_000,  limit: cfg.get('THROTTLE_SHORT_LIMIT',  10)  },
        { name: 'medium', ttl: 10_000, limit: cfg.get('THROTTLE_MEDIUM_LIMIT', 30)  },
        { name: 'long',   ttl: 60_000, limit: cfg.get('THROTTLE_LONG_LIMIT',   100) },
      ],
    }),

    // Redis-backed cache (falls back to in-memory if REDIS_URL unset)
    CacheModule.registerAsync({
      isGlobal: true,
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: async (cfg: ConfigService) => {
        const redisUrl = cfg.get<string>('REDIS_URL');
        if (redisUrl) {
          // Dynamically load redis store so missing dep doesn't crash dev
          try {
            const { default: redisStore } = await import('cache-manager-ioredis-yet');
            return { store: redisStore, url: redisUrl, ttl: 300, max: 10_000 };
          } catch {
            // cache-manager-ioredis-yet not installed — fall through to in-memory
          }
        }
        return { ttl: 300_000, max: 500 };
      },
    }),

    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),

    DatabaseModule,
    EmailModule,
    AiGatewayModule,
    QueuesModule,
    JobsModule,
    AuthModule,
    UsersModule,
    HabitsModule,
    HabitLogsModule,
    PlannerModule,
    CalendarModule,
    GoalsModule,
    GoalProgressModule,
    FocusModule,
    SkillsModule,
    XpModule,
    LevelsModule,
    AchievementsModule,
    BadgesModule,
    LeaderboardModule,
    AccountabilityModule,
    AnalyticsModule,
    NotificationsModule,
    SocialTrackerModule,
    MayaModule,
    UploadsModule,
    AuditLogsModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
