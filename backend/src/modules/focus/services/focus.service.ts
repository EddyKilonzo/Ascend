import {
  Injectable, Logger, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { StartFocusDto, CompleteFocusDto } from '../dto/start-focus.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { FocusMode, FocusStatus } from '@prisma/client';

/** Planned minutes for each focus mode. */
const FOCUS_DURATION: Record<FocusMode, number> = {
  POMODORO_25:     25,
  DEEP_WORK_50:    50,
  ULTRA_FOCUS_90:  90,
};

/** XP awarded per completed focus session by mode. */
const FOCUS_XP: Record<FocusMode, number> = {
  POMODORO_25:     15,
  DEEP_WORK_50:    30,
  ULTRA_FOCUS_90:  50,
};

@Injectable()
export class FocusService {
  private readonly logger = new Logger(FocusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Starts a new focus session.
   * Only one active session is allowed at a time — prevents ghost sessions.
   */
  async startSession(userId: string, dto: StartFocusDto) {
    try {
      // Wrap in a transaction to prevent a race condition where two concurrent requests
      // both pass the "no active session" check and create duplicate active sessions.
      const session = await this.prisma.$transaction(async (tx) => {
        const active = await tx.focusSession.findFirst({
          where: { userId, status: FocusStatus.ACTIVE },
        });
        if (active) {
          throw new BadRequestException('You already have an active focus session. Complete or interrupt it first.');
        }

        return tx.focusSession.create({
          data: {
            userId,
            mode:           dto.mode,
            plannedMinutes: FOCUS_DURATION[dto.mode],
            taskId:         dto.taskId,
            note:           dto.note,
            status:         FocusStatus.ACTIVE,
          },
        });
      });

      this.events.emit('focus.session_started', { userId, sessionId: session.id, mode: dto.mode });
      return session;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`startSession error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Marks a focus session as COMPLETED.
   * Awards XP with an interruption penalty — fewer interruptions = more XP.
   */
  async completeSession(sessionId: string, userId: string, dto: CompleteFocusDto) {
    try {
      const session = await this.prisma.focusSession.findUnique({ where: { id: sessionId } });
      if (!session)              throw new ResourceNotFoundException('Focus session', sessionId);
      if (session.userId !== userId)  throw new ForbiddenException('Access denied');
      if (session.status !== FocusStatus.ACTIVE) {
        throw new BadRequestException('Session is not active');
      }

      const interruptions  = Math.max(0, Math.min(dto.interruptions ?? 0, 100));
      const baseXp         = FOCUS_XP[session.mode];
      const penalty        = Math.min(interruptions * 3, Math.floor(baseXp * 0.5));
      const xpEarned       = Math.max(baseXp - penalty, Math.floor(baseXp * 0.2));
      // Cap actualMinutes to 2× planned to prevent inflated focus stats
      const maxMinutes     = session.plannedMinutes * 2;
      const actualMinutes  = Math.min(dto.actualMinutes ?? session.plannedMinutes, maxMinutes);

      const completed = await this.prisma.focusSession.update({
        where: { id: sessionId },
        data:  {
          status:       FocusStatus.COMPLETED,
          actualMinutes,
          interruptions,
          xpEarned,
          completedAt:  new Date(),
        },
      });

      this.events.emit('focus.session_completed', {
        userId,
        sessionId,
        mode:          session.mode,
        actualMinutes,
        xpEarned,
      });

      return { session: completed, xpEarned };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`completeSession error — session ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Marks a focus session as INTERRUPTED.
   * No XP is awarded for incomplete sessions.
   */
  async interruptSession(sessionId: string, userId: string) {
    try {
      const session = await this.prisma.focusSession.findUnique({ where: { id: sessionId } });
      if (!session)             throw new ResourceNotFoundException('Focus session', sessionId);
      if (session.userId !== userId) throw new ForbiddenException('Access denied');
      if (session.status !== FocusStatus.ACTIVE) {
        throw new BadRequestException('Session is not active');
      }

      const updated = await this.prisma.focusSession.update({
        where: { id: sessionId },
        data:  { status: FocusStatus.INTERRUPTED, completedAt: new Date() },
      });

      this.events.emit('focus.session_interrupted', { userId, sessionId });
      return updated;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`interruptSession error — session ${sessionId}`, error);
      throw error;
    }
  }

  /** Returns paginated focus session history for a user. */
  async getHistory(userId: string, page = 1, limit = 20) {
    try {
      const [sessions, total] = await Promise.all([
        this.prisma.focusSession.findMany({
          where:   { userId },
          orderBy: { startedAt: 'desc' },
          skip:    (page - 1) * limit,
          take:    limit,
        }),
        this.prisma.focusSession.count({ where: { userId } }),
      ]);
      return { data: sessions, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    } catch (error) {
      this.logger.error(`getHistory error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns aggregated focus stats: total minutes, sessions, average per day. */
  async getStats(userId: string) {
    try {
      const [total, weekly, sessions] = await Promise.all([
        this.prisma.focusSession.aggregate({
          where:   { userId, status: FocusStatus.COMPLETED },
          _sum:    { actualMinutes: true },
          _count:  { id: true },
        }),
        this.prisma.focusSession.aggregate({
          where: {
            userId,
            status:    FocusStatus.COMPLETED,
            startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          _sum:   { actualMinutes: true },
          _count: { id: true },
        }),
        this.prisma.focusSession.findFirst({
          where:   { userId, status: FocusStatus.ACTIVE },
        }),
      ]);

      return {
        totalMinutes:   total._sum.actualMinutes ?? 0,
        totalSessions:  total._count.id,
        weeklyMinutes:  weekly._sum.actualMinutes ?? 0,
        weeklySessions: weekly._count.id,
        activeSession:  sessions,
      };
    } catch (error) {
      this.logger.error(`getStats error — user ${userId}`, error);
      throw error;
    }
  }
}
