import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AiGatewayService } from '../../../integrations/ai-gateway/ai-gateway.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_ML_EVENTS, JOB_ML_INGEST_FEATURE } from '../../../queues/queues.constants';
import type { CoachingModule, MayaRequest } from '../../../integrations/ai-gateway/ai-gateway.types';
import dayjs from 'dayjs';

@Injectable()
export class MayaService {
  private readonly logger = new Logger(MayaService.name);

  constructor(
    private readonly prisma:   PrismaService,
    private readonly gateway:  AiGatewayService,
    @InjectQueue(QUEUE_ML_EVENTS) private readonly mlQueue: Queue,
  ) {}

  /**
   * Returns a fully data-backed Maya coaching response.
   *
   * Flow:
   *  1. Assemble full user context from DB (habits, goals, focus, social, XP, burnout)
   *  2. Call ml/maya/ (port 5002) with the context + coaching module
   *  3. Fall back to rule-based suggestions if ML service is unavailable
   *  4. Enqueue ML feature ingestion for the platform learning pipeline
   */
  async getSuggestions(
    userId: string,
    module: CoachingModule = 'PRODUCTIVITY',
    userMessage?: string,
  ) {
    try {
      const context = await this.buildUserContext(userId);
      const req: MayaRequest = { user_context: context, coaching_module: module, user_message: userMessage };

      const result = await this.gateway.coachMaya(req);

      if (result.ok) {
        // Fire-and-forget: log Maya interaction to ML feature store
        this.mlQueue.add(JOB_ML_INGEST_FEATURE, {
          userId,
          eventType: 'maya.coaching_request',
          payload:   { module, response_latency_ms: result.latency_ms, cached: result.data.cached },
        }).catch(() => {/* non-critical */});

        return {
          source:          'maya_ai',
          module,
          explanation:     result.data.explanation,
          recommendations: result.data.recommendations,
          factors:         result.data.factors,
          urgency:         result.data.urgency,
          prediction:      result.data.prediction,
          confidence:      result.data.confidence,
          latency_ms:      result.latency_ms,
        };
      }

      // Graceful degradation: ML service unavailable → rule-based fallback
      this.logger.warn(`Maya ML service unavailable (${result.error}), using fallback`);
      return this.ruleFallback(userId, context);
    } catch (error) {
      this.logger.error(`getSuggestions error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Builds the complete user context object Maya needs.
   * All fields come from the authoritative DB — Maya never reads the DB directly.
   */
  private async buildUserContext(userId: string) {
    const now     = dayjs();
    const week7   = now.subtract(7, 'day').toDate();
    const week30  = now.subtract(30, 'day').toDate();

    const [
      habits, goals, focusStats, xpLevel, socialUsage,
      burnoutIndicators, overdueTasks, achievements, stats,
    ] = await Promise.all([
      this.prisma.habit.findMany({
        where:   { userId, isActive: true, deletedAt: null },
        include: { logs: { orderBy: { completedAt: 'desc' }, take: 30 } },
        take:    20,
      }),
      this.prisma.goal.findMany({
        where:   { userId, deletedAt: null, status: 'ACTIVE' },
        include: { progressLogs: { orderBy: { loggedAt: 'desc' }, take: 1 } },
        take:    10,
      }),
      this.prisma.focusSession.aggregate({
        where: { userId, status: 'COMPLETED', startedAt: { gte: week7 } },
        _sum:  { actualMinutes: true },
        _count: { id: true },
        _avg:  { actualMinutes: true },
      }),
      this.prisma.userLevel.findUnique({ where: { userId } }),
      this.prisma.socialUsageLog.aggregate({
        where: { userId, loggedDate: { gte: week7 } },
        _sum:  { minutes: true },
      }),
      this.prisma.analyticsDaily.findMany({
        where:   { userId, date: { gte: week7 } },
        orderBy: { date: 'desc' },
        select:  { productivityScore: true, habitCompletionRate: true, focusMinutes: true, socialMinutes: true },
        take:    7,
      }),
      this.prisma.plannerTask.count({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] }, dueDate: { lt: new Date() }, deletedAt: null },
      }),
      this.prisma.userAchievement.count({ where: { userId } }),
      this.prisma.userStatistics.findUnique({ where: { userId } }),
    ]);

    // Compute habit completion rates
    const habitContext = habits.map((h) => {
      const logs7  = h.logs.filter((l) => l.completedAt >= week7);
      const logs30 = h.logs.filter((l) => l.completedAt >= week30);
      const rate7  = logs7.length  / Math.max(this.expectedCompletions(h.frequency, 7), 1);
      const rate30 = logs30.length / Math.max(this.expectedCompletions(h.frequency, 30), 1);
      const latest = h.logs[0];

      return {
        id:                  h.id,
        name:                h.name,
        frequency:           h.frequency,
        current_streak:      latest?.streak ?? 0,
        completion_rate_7d:  Math.min(1, rate7),
        completion_rate_30d: Math.min(1, rate30),
        difficulty:          h.difficulty ?? 3,
        target_time:         h.targetTime ?? undefined,
      };
    });

    // Compute burnout risk from recent analytics
    const avgProductivity = burnoutIndicators.length > 0
      ? burnoutIndicators.reduce((s, d) => s + d.productivityScore, 0) / burnoutIndicators.length
      : 50;
    const burnoutRisk = avgProductivity < 30
      ? { risk_level: 'HIGH',   risk_score: 8 }
      : avgProductivity < 50
      ? { risk_level: 'MEDIUM', risk_score: 5 }
      : { risk_level: 'LOW',    risk_score: 2 };

    // Weekly XP
    const weeklyXpResult = await this.prisma.xpLog.aggregate({
      where: { userId, earnedAt: { gte: week7 } },
      _sum:  { amount: true },
    });

    return {
      user_id: userId,
      habits:  habitContext,
      goals:   goals.map((g) => ({
        id:          g.id,
        title:       g.title,
        progress_pct: g.progressPercent ?? 0,
        target_date:  g.targetDate?.toISOString().slice(0, 10),
        status:       g.status,
      })),
      focus: {
        total_minutes_7d:    focusStats._sum.actualMinutes ?? 0,
        sessions_7d:         focusStats._count.id,
        avg_session_minutes: Math.round(focusStats._avg.actualMinutes ?? 0),
      },
      productivity_score: avgProductivity,
      burnout_risk:       burnoutRisk,
      xp: {
        total:     xpLevel?.totalXp ?? 0,
        level:     xpLevel?.level   ?? 1,
        weekly_xp: weeklyXpResult._sum.amount ?? 0,
      },
      social_usage_minutes_7d: socialUsage._sum.minutes ?? 0,
      overdue_tasks:           overdueTasks,
      achievements_count:      achievements,
    };
  }

  /** Returns expected number of completions for a habit frequency over N days. */
  private expectedCompletions(frequency: string, days: number): number {
    switch (frequency) {
      case 'DAILY':   return days;
      case 'WEEKLY':  return Math.floor(days / 7);
      case 'MONTHLY': return Math.floor(days / 30);
      default:        return days;
    }
  }

  /**
   * Rule-based fallback used when the Maya ML service is unavailable.
   * Data-driven — never returns hardcoded text without a user data check.
   */
  private async ruleFallback(userId: string, context: Awaited<ReturnType<typeof this.buildUserContext>>) {
    const recommendations: string[] = [];

    const habitsAtRisk = context.habits.filter((h) => h.completion_rate_7d < 0.5);
    if (habitsAtRisk.length > 0) {
      recommendations.push(
        `${habitsAtRisk.length} habit(s) have below 50% completion this week: ${habitsAtRisk.map((h) => h.name).join(', ')}. Focus on these first.`,
      );
    }

    if (context.overdue_tasks > 0) {
      recommendations.push(
        `You have ${context.overdue_tasks} overdue task${context.overdue_tasks > 1 ? 's' : ''}. Prioritise your most critical one today.`,
      );
    }

    if (context.focus.total_minutes_7d < 90) {
      recommendations.push(
        `Only ${context.focus.total_minutes_7d} focus minutes this week. Even one 25-minute session today would help.`,
      );
    }

    if (context.burnout_risk.risk_level === 'HIGH') {
      recommendations.push(
        'Productivity scores have been low this week. Consider a lighter schedule to recover.',
      );
    }

    if (context.goals.some((g) => g.progress_pct < 30 && g.target_date)) {
      const behind = context.goals.filter((g) => g.progress_pct < 30 && g.target_date);
      recommendations.push(
        `${behind.length} goal(s) are behind schedule. Linking a daily habit to these goals will build momentum.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('You are on track this week. Maintain your consistency to build momentum.');
    }

    return {
      source:          'maya_fallback',
      module:          'PRODUCTIVITY',
      explanation:     'Maya ML service is temporarily unavailable. These are data-backed suggestions from your recent activity.',
      recommendations,
      factors:         [],
      urgency:         context.burnout_risk.risk_level === 'HIGH' ? 'high' : 'normal',
      prediction:      null,
      confidence:      null,
      latency_ms:      0,
    };
  }
}
