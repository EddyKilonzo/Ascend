import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HabitsRepository } from '../repositories/habits.repository';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    private readonly habitsRepo: HabitsRepository,
    private readonly events:     EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateHabitDto) {
    try {
      const habit = await this.habitsRepo.create(userId, dto);
      this.events.emit('habit.created', { userId, habitId: habit.id });
      return habit;
    } catch (error) {
      this.logger.error(`create habit error for user ${userId}`, error);
      throw error;
    }
  }

  async findAll(userId: string, activeOnly = true) {
    try {
      return await this.habitsRepo.getHabitsWithTodayLogs(userId);
    } catch (error) {
      this.logger.error(`findAll habits error for user ${userId}`, error);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const habit = await this.habitsRepo.findById(id, userId);
      if (!habit) throw new ResourceNotFoundException('Habit', id);
      return habit;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`findOne habit ${id} error`, error);
      throw error;
    }
  }

  async update(id: string, userId: string, dto: UpdateHabitDto) {
    try {
      const habit = await this.habitsRepo.findById(id, userId);
      if (!habit)            throw new ResourceNotFoundException('Habit', id);
      if (habit.userId !== userId) throw new ForbiddenException('Access denied');

      const updated = await this.habitsRepo.update(id, userId, dto);
      this.events.emit('habit.updated', { userId, habitId: id });
      return updated;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) throw error;
      this.logger.error(`update habit ${id} error`, error);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      const habit = await this.habitsRepo.findById(id, userId);
      if (!habit)            throw new ResourceNotFoundException('Habit', id);
      if (habit.userId !== userId) throw new ForbiddenException('Access denied');

      await this.habitsRepo.softDelete(id);
      return { message: 'Habit deleted successfully' };
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException
      ) throw error;
      this.logger.error(`remove habit ${id} error`, error);
      throw error;
    }
  }

  async getHabitStats(id: string, userId: string) {
    try {
      const habit = await this.findOne(id, userId);

      const now       = new Date();
      const last30    = new Date(now);
      last30.setDate(last30.getDate() - 30);
      const last7     = new Date(now);
      last7.setDate(last7.getDate() - 7);

      const [streak, last30Count, last7Count] = await Promise.all([
        this.habitsRepo.getStreakForHabit(id, userId),
        this.habitsRepo.getCompletionRateForPeriod(id, userId, last30, now),
        this.habitsRepo.getCompletionRateForPeriod(id, userId, last7, now),
      ]);

      return {
        habit,
        stats: {
          currentStreak:    streak?.streak ?? 0,
          lastCompleted:    streak?.completedAt ?? null,
          completionsLast7:  last7Count,
          completionsLast30: last30Count,
          rateLastWeek:      Math.round((last7Count / 7) * 100),
          rateLastMonth:     Math.round((last30Count / 30) * 100),
        },
      };
    } catch (error) {
      if (error instanceof ResourceNotFoundException) throw error;
      this.logger.error(`getHabitStats ${id} error`, error);
      throw error;
    }
  }
}
