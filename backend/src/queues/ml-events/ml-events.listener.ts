/**
 * ML Events Listener — subscribes to all domain events and enqueues
 * async ML jobs so the synchronous request path is never blocked.
 *
 * Every event that changes user behaviour must be ingested into the
 * ml/ai-platform/ feature store so models can self-improve over time.
 */
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  QUEUE_ML_EVENTS, QUEUE_ANALYTICS,
  JOB_ML_INGEST_FEATURE, JOB_ML_ANTICHEAT,
  JOB_ANALYTICS_DAILY, JOB_ANALYTICS_SNAPSHOT,
} from '../queues.constants';
import dayjs from 'dayjs';

@Injectable()
export class MlEventsListener {
  private readonly logger = new Logger(MlEventsListener.name);

  constructor(
    @InjectQueue(QUEUE_ML_EVENTS)  private readonly mlQueue:        Queue,
    @InjectQueue(QUEUE_ANALYTICS)  private readonly analyticsQueue: Queue,
  ) {}

  // ── Habit events ───────────────────────────────────────────────────────────

  @OnEvent('habit.completed')
  async onHabitCompleted(payload: { userId: string; habitId: string; xpEarned: number; streak: number }) {
    await this.enqueueFeature(payload.userId, 'habit.completed', payload);
    await this.enqueueAnalytics(payload.userId);
    // High streak + rapid XP = anticheat trigger
    if (payload.streak > 0 && payload.xpEarned > 100) {
      await this.mlQueue.add(JOB_ML_ANTICHEAT, { userId: payload.userId, periodHours: 24 }, { delay: 30_000 });
    }
  }

  @OnEvent('habit.created')
  async onHabitCreated(payload: { userId: string; habitId: string }) {
    await this.enqueueFeature(payload.userId, 'habit.created', payload);
  }

  @OnEvent('habit.log_removed')
  async onHabitLogRemoved(payload: { userId: string; habitId: string }) {
    await this.enqueueAnalytics(payload.userId);
  }

  // ── Goal events ────────────────────────────────────────────────────────────

  @OnEvent('goal.completed')
  async onGoalCompleted(payload: { userId: string; goalId: string; xpReward: number }) {
    await this.enqueueFeature(payload.userId, 'goal.completed', payload);
    await this.enqueueAnalytics(payload.userId);
  }

  @OnEvent('goal.created')
  async onGoalCreated(payload: { userId: string; goalId: string }) {
    await this.enqueueFeature(payload.userId, 'goal.created', payload);
  }

  // ── Focus events ───────────────────────────────────────────────────────────

  @OnEvent('focus.session_completed')
  async onFocusCompleted(payload: { userId: string; sessionId: string; actualMinutes: number; xpEarned: number }) {
    await this.enqueueFeature(payload.userId, 'focus.session_completed', payload);
    await this.enqueueAnalytics(payload.userId);
  }

  @OnEvent('focus.session_started')
  async onFocusStarted(payload: { userId: string; sessionId: string; mode: string }) {
    await this.enqueueFeature(payload.userId, 'focus.session_started', payload);
  }

  @OnEvent('focus.session_interrupted')
  async onFocusInterrupted(payload: { userId: string; sessionId: string }) {
    await this.enqueueFeature(payload.userId, 'focus.session_interrupted', payload);
  }

  // ── Task events ────────────────────────────────────────────────────────────

  @OnEvent('planner.task_completed')
  async onTaskCompleted(payload: { userId: string; taskId: string; xpReward: number }) {
    await this.enqueueFeature(payload.userId, 'planner.task_completed', payload);
    await this.enqueueAnalytics(payload.userId);
  }

  @OnEvent('planner.task_created')
  async onTaskCreated(payload: { userId: string; taskId: string }) {
    await this.enqueueFeature(payload.userId, 'planner.task_created', payload);
  }

  // ── XP / level events ─────────────────────────────────────────────────────

  @OnEvent('xp.awarded')
  async onXpAwarded(payload: { userId: string; amount: number; source: string; newTotalXp: number }) {
    await this.enqueueFeature(payload.userId, 'xp.awarded', payload);
    // Rapid XP accumulation check
    if (payload.amount > 200) {
      await this.mlQueue.add(JOB_ML_ANTICHEAT, { userId: payload.userId, periodHours: 1 }, { delay: 5_000 });
    }
    await this.enqueueDashboardSnapshot(payload.userId);
  }

  @OnEvent('xp.level_up')
  async onLevelUp(payload: { userId: string; newLevel: number }) {
    await this.enqueueDashboardSnapshot(payload.userId);
  }

  // ── Commitment events ──────────────────────────────────────────────────────

  @OnEvent('commitment.kept')
  async onCommitmentKept(payload: { userId: string; commitmentId: string }) {
    await this.enqueueFeature(payload.userId, 'commitment.kept', payload);
  }

  @OnEvent('commitment.failed')
  async onCommitmentFailed(payload: { userId: string; commitmentId: string }) {
    await this.enqueueFeature(payload.userId, 'commitment.failed', payload);
  }

  @OnEvent('commitment.created')
  async onCommitmentCreated(payload: { userId: string; commitmentId: string }) {
    await this.enqueueFeature(payload.userId, 'commitment.created', payload);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async enqueueFeature(userId: string, eventType: string, payload: Record<string, unknown>) {
    try {
      await this.mlQueue.add(JOB_ML_INGEST_FEATURE, { userId, eventType, payload });
    } catch (err) {
      this.logger.error(`Failed to enqueue ML feature job user=${userId} event=${eventType}`, err);
    }
  }

  private async enqueueAnalytics(userId: string) {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      await Promise.all([
        this.analyticsQueue.add(JOB_ANALYTICS_DAILY,    { userId, date: today }, { jobId: `daily:${userId}:${today}`, removeOnComplete: true }),
        this.analyticsQueue.add(JOB_ANALYTICS_SNAPSHOT, { userId },              { jobId: `snap:${userId}:${Date.now()}`,  removeOnComplete: true }),
      ]);
    } catch (err) {
      this.logger.error(`Failed to enqueue analytics job user=${userId}`, err);
    }
  }

  private async enqueueDashboardSnapshot(userId: string) {
    try {
      await this.analyticsQueue.add(JOB_ANALYTICS_SNAPSHOT, { userId }, { removeOnComplete: true });
    } catch (err) {
      this.logger.error(`Failed to enqueue snapshot job user=${userId}`, err);
    }
  }
}
