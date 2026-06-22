import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { TaskStatus } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Creates a new planner task for the authenticated user.
   * Validates time-block consistency (blockEnd must be after blockStart).
   */
  async create(userId: string, dto: CreateTaskDto) {
    try {
      if (dto.isTimeBlocked && dto.blockStart && dto.blockEnd) {
        if (dto.blockEnd <= dto.blockStart) {
          throw new BadRequestException('blockEnd must be after blockStart');
        }
      }

      const task = await this.prisma.plannerTask.create({
        data: {
          userId,
          ...dto,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
          dueDate:       dto.dueDate       ? new Date(dto.dueDate)       : null,
        },
      });

      this.events.emit('planner.task_created', { userId, taskId: task.id });
      return task;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`create task error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns all tasks for a given date (defaults to today).
   * Includes time-blocked tasks and orders by blockStart or order.
   */
  async getTasksForDate(userId: string, date?: string) {
    try {
      const targetDate = date ? dayjs(date) : dayjs();
      const startOfDay = targetDate.startOf('day').toDate();
      const endOfDay   = targetDate.endOf('day').toDate();

      const tasks = await this.prisma.plannerTask.findMany({
        where: {
          userId,
          deletedAt:     null,
          scheduledDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          goal: { select: { id: true, title: true, color: true } },
        },
        orderBy: [
          { isTimeBlocked: 'desc' },
          { blockStart:    'asc'  },
          { order:         'asc'  },
          { createdAt:     'asc'  },
        ],
      });

      return tasks;
    } catch (error) {
      this.logger.error(`getTasksForDate error — user ${userId} date ${date}`, error);
      throw error;
    }
  }

  /**
   * Returns tasks within a date range for the weekly / monthly planner view.
   */
  async getTasksForRange(userId: string, startDate: string, endDate: string) {
    try {
      const start = new Date(startDate);
      const end   = new Date(endDate);

      if (start > end) {
        throw new BadRequestException('startDate must be before endDate');
      }

      return await this.prisma.plannerTask.findMany({
        where: {
          userId,
          deletedAt:     null,
          scheduledDate: { gte: start, lte: end },
        },
        include: {
          goal: { select: { id: true, title: true, color: true } },
        },
        orderBy: [{ scheduledDate: 'asc' }, { order: 'asc' }],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`getTasksForRange error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns a single task by ID, enforcing ownership. */
  async findOne(id: string, userId: string) {
    try {
      const task = await this.prisma.plannerTask.findFirst({
        where:   { id, userId, deletedAt: null },
        include: { goal: { select: { id: true, title: true, color: true } } },
      });
      if (!task) throw new ResourceNotFoundException('Task', id);
      return task;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`findOne task ${id} error`, error);
      throw error;
    }
  }

  /** Updates a task. When status transitions to DONE, records completedAt. */
  async update(id: string, userId: string, dto: UpdateTaskDto) {
    try {
      const task = await this.prisma.plannerTask.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!task)            throw new ResourceNotFoundException('Task', id);
      if (task.userId !== userId) throw new ForbiddenException('Access denied');

      if (dto.isTimeBlocked && dto.blockStart && dto.blockEnd) {
        if (dto.blockEnd <= dto.blockStart) {
          throw new BadRequestException('blockEnd must be after blockStart');
        }
      }

      const completedAt =
        dto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE
          ? new Date()
          : task.completedAt;

      const updated = await this.prisma.plannerTask.update({
        where: { id },
        data:  {
          ...dto,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
          dueDate:       dto.dueDate       ? new Date(dto.dueDate)       : undefined,
          completedAt,
        },
      });

      if (dto.status === TaskStatus.DONE && task.status !== TaskStatus.DONE) {
        this.events.emit('planner.task_completed', {
          userId,
          taskId: id,
          xpReward: task.xpReward,
        });
      }

      return updated;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`update task ${id} error`, error);
      throw error;
    }
  }

  /** Soft-deletes a task. */
  async remove(id: string, userId: string) {
    try {
      const task = await this.prisma.plannerTask.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!task)            throw new ResourceNotFoundException('Task', id);
      if (task.userId !== userId) throw new ForbiddenException('Access denied');

      await this.prisma.plannerTask.update({
        where: { id },
        data:  { deletedAt: new Date() },
      });

      return { message: 'Task deleted' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) throw error;
      this.logger.error(`remove task ${id} error`, error);
      throw error;
    }
  }

  /**
   * Returns overdue tasks (past due date, not done/cancelled).
   * Used for deadline-alert notifications.
   */
  async getOverdueTasks(userId: string) {
    try {
      const now = new Date();
      return await this.prisma.plannerTask.findMany({
        where: {
          userId,
          deletedAt: null,
          dueDate:   { lt: now },
          status:    { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        },
        orderBy: { dueDate: 'asc' },
      });
    } catch (error) {
      this.logger.error(`getOverdueTasks error — user ${userId}`, error);
      throw error;
    }
  }
}
