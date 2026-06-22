import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

@Injectable()
export class GoalProgressService {
  private readonly logger = new Logger(GoalProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the progress log history for a specific goal.
   * Ownership is validated — a user can only see logs for their own goals.
   */
  async getProgressLogs(goalId: string, userId: string, page = 1, limit = 30) {
    try {
      const goal = await this.prisma.goal.findFirst({
        where: { id: goalId, userId, deletedAt: null },
      });
      if (!goal) throw new ResourceNotFoundException('Goal', goalId);

      const [logs, total] = await Promise.all([
        this.prisma.goalProgressLog.findMany({
          where:   { goalId },
          orderBy: { loggedAt: 'desc' },
          ...getPrismaSkipTake(page, limit),
        }),
        this.prisma.goalProgressLog.count({ where: { goalId } }),
      ]);

      return paginate(logs, total, page, limit);
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`getProgressLogs error — goal ${goalId}`, error);
      throw error;
    }
  }
}
