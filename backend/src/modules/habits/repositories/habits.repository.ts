import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateHabitDto } from '../dto/create-habit.dto';
import { UpdateHabitDto } from '../dto/update-habit.dto';
import { HabitFrequency } from '@prisma/client';

@Injectable()
export class HabitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: { userId, ...dto },
    });
  }

  findAllByUser(userId: string, activeOnly = true) {
    return this.prisma.habit.findMany({
      where:   { userId, ...(activeOnly ? { isActive: true } : {}), deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findById(id: string, userId: string) {
    return this.prisma.habit.findFirst({
      where: { id, userId, deletedAt: null },
    });
  }

  update(id: string, userId: string, dto: UpdateHabitDto) {
    return this.prisma.habit.update({
      where: { id },
      data:  { ...dto },
    });
  }

  softDelete(id: string) {
    return this.prisma.habit.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
  }

  getStreakForHabit(habitId: string, userId: string) {
    return this.prisma.habitLog.findFirst({
      where:   { habitId, userId },
      orderBy: { completedAt: 'desc' },
      select:  { streak: true, completedAt: true },
    });
  }

  getCompletionRateForPeriod(
    habitId:   string,
    userId:    string,
    startDate: Date,
    endDate:   Date,
  ) {
    return this.prisma.habitLog.count({
      where: {
        habitId,
        userId,
        completedAt: { gte: startDate, lte: endDate },
      },
    });
  }

  getHabitsWithTodayLogs(userId: string) {
    const today     = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay   = new Date(today.setHours(23, 59, 59, 999));

    return this.prisma.habit.findMany({
      where:   { userId, isActive: true, deletedAt: null },
      include: {
        logs: {
          where: { completedAt: { gte: startOfDay, lte: endOfDay } },
          select: { id: true, count: true, completedAt: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
