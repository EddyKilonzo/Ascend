import {
  Injectable, Logger, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { GoalStatus } from '@prisma/client';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Creates a new goal and initialises its progress at 0. */
  async create(userId: string, dto: CreateGoalDto) {
    try {
      const goal = await this.prisma.goal.create({
        data: {
          userId,
          ...dto,
          targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        },
      });
      this.events.emit('goal.created', { userId, goalId: goal.id });
      return goal;
    } catch (error) {
      this.logger.error(`create goal error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns all non-deleted goals for a user, grouped by status. */
  async findAll(userId: string, status?: GoalStatus) {
    try {
      return await this.prisma.goal.findMany({
        where:   { userId, deletedAt: null, ...(status ? { status } : {}) },
        include: {
          milestones:  { orderBy: { order: 'asc' } },
          _count:      { select: { tasks: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      this.logger.error(`findAll goals error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns a single goal with full detail (milestones + recent progress logs). */
  async findOne(id: string, userId: string) {
    try {
      const goal = await this.prisma.goal.findFirst({
        where:   { id, userId, deletedAt: null },
        include: {
          milestones:  { orderBy: { order: 'asc' } },
          progressLogs: { orderBy: { loggedAt: 'desc' }, take: 10 },
          _count:       { select: { tasks: true } },
        },
      });
      if (!goal) throw new ResourceNotFoundException('Goal', id);
      return goal;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`findOne goal ${id} error`, error);
      throw error;
    }
  }

  /**
   * Updates goal progress (0–100) and logs the change.
   * Automatically marks the goal as COMPLETED when progress reaches 100.
   */
  async updateProgress(id: string, userId: string, progress: number, note?: string) {
    try {
      if (progress < 0 || progress > 100) {
        throw new BadRequestException('Progress must be between 0 and 100');
      }

      const goal = await this.prisma.goal.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!goal)            throw new ResourceNotFoundException('Goal', id);
      if (goal.userId !== userId) throw new ForbiddenException('Access denied');

      const isCompleting = progress === 100 && goal.status !== GoalStatus.COMPLETED;

      await this.prisma.$transaction([
        this.prisma.goal.update({
          where: { id },
          data:  {
            progress,
            status:      isCompleting ? GoalStatus.COMPLETED : undefined,
            completedAt: isCompleting ? new Date() : undefined,
          },
        }),
        this.prisma.goalProgressLog.create({
          data: { goalId: id, progress, note },
        }),
      ]);

      if (isCompleting) {
        this.events.emit('goal.completed', { userId, goalId: id, xpReward: goal.xpReward });
      }

      return { message: 'Progress updated', progress, completed: isCompleting };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`updateProgress goal ${id} error`, error);
      throw error;
    }
  }

  /** Soft-deletes a goal. */
  async remove(id: string, userId: string) {
    try {
      const goal = await this.prisma.goal.findFirst({ where: { id, userId, deletedAt: null } });
      if (!goal) throw new ResourceNotFoundException('Goal', id);

      await this.prisma.goal.update({
        where: { id },
        data:  { deletedAt: new Date(), status: GoalStatus.ABANDONED },
      });
      return { message: 'Goal deleted' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`remove goal ${id} error`, error);
      throw error;
    }
  }
}
