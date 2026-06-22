import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiGatewayService } from '../../integrations/ai-gateway/ai-gateway.service';
import { PrismaService } from '../../database/prisma.service';
import {
  QUEUE_ML_EVENTS,
  JOB_ML_INGEST_FEATURE,
  JOB_ML_ANTICHEAT,
} from '../queues.constants';

export interface MlFeatureJobData {
  userId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export interface AntiCheatJobData {
  userId: string;
  periodHours: number;
}

@Processor(QUEUE_ML_EVENTS)
export class MlEventsProcessor {
  private readonly logger = new Logger(MlEventsProcessor.name);

  constructor(
    private readonly gateway: AiGatewayService,
    private readonly prisma:  PrismaService,
  ) {}

  /**
   * Async feature store ingestion — fires after every domain event.
   * Builds a snapshot of the user's current state and ships it to ml/ai-platform/.
   * Failures are logged and retried by Bull (up to 3 attempts) — never rethrown.
   */
  @Process(JOB_ML_INGEST_FEATURE)
  async ingestFeature(job: Job<MlFeatureJobData>): Promise<void> {
    const { userId, eventType, payload } = job.data;
    try {
      const result = await this.gateway.ingestMlEvent({
        event_type: eventType,
        user_id:    userId,
        payload,
        timestamp:  new Date().toISOString(),
      });

      if (!result.ok) {
        this.logger.warn(`ML feature ingest failed for user ${userId}: ${result.error}`);
      }
    } catch (err) {
      this.logger.error(`ML ingest job error user=${userId} event=${eventType}`, err);
      throw err; // let Bull retry
    }
  }

  /**
   * Runs the anticheat check asynchronously after suspicious activity patterns.
   * Flags the user in DB if risk is HIGH and suspends from training pipeline.
   */
  @Process(JOB_ML_ANTICHEAT)
  async runAntiCheat(job: Job<AntiCheatJobData>): Promise<void> {
    const { userId, periodHours } = job.data;
    try {
      const [xpEvents, habitLogs, actions] = await Promise.all([
        this.prisma.xpLog.findMany({
          where:   { userId, earnedAt: { gte: new Date(Date.now() - periodHours * 3_600_000) } },
          select:  { earnedAt: true, amount: true, source: true },
          take:    500,
        }),
        this.prisma.habitLog.findMany({
          where:   { userId, completedAt: { gte: new Date(Date.now() - periodHours * 3_600_000) } },
          select:  { habitId: true, completedAt: true, streak: true },
          take:    500,
        }),
        this.prisma.auditLog.findMany({
          where:   { userId, createdAt: { gte: new Date(Date.now() - 3_600_000) } },
          select:  { action: true, createdAt: true },
          take:    200,
        }),
      ]);

      const result = await this.gateway.checkAntiCheat({
        user_id:     userId,
        period_hours: periodHours,
        xp_events: xpEvents.map((e) => ({
          timestamp:  e.earnedAt.toISOString(),
          xp_amount:  e.amount,
          source:     e.source,
        })),
        habit_completions: habitLogs.map((h) => ({
          habit_id:        h.habitId,
          completed:       true,
          completion_time: h.completedAt.toISOString(),
          date:            h.completedAt.toISOString().slice(0, 10),
        })),
        recent_actions: actions.map((a) => ({
          action_type: a.action,
          timestamp:   a.createdAt.toISOString(),
        })),
      });

      if (result.ok && result.data.is_suspicious && result.data.overall_risk === 'HIGH') {
        await this.prisma.userStatistics.upsert({
          where:  { userId },
          create: { userId, trustScore: Math.max(0, 100 - result.data.recommended_xp_reduction_pct) },
          update: { trustScore: Math.max(0, 100 - result.data.recommended_xp_reduction_pct) },
        });

        this.logger.warn(
          `Anticheat HIGH risk: user=${userId} confidence=${result.data.confidence}`,
        );
      }
    } catch (err) {
      this.logger.error(`Anticheat job error user=${userId}`, err);
      throw err;
    }
  }
}
