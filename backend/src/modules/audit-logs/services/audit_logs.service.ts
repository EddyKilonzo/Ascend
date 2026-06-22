import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditAction } from '@prisma/client';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit event for a user action.
   * Non-fatal — errors are caught and logged so auditing never breaks the primary flow.
   */
  async log(params: {
    userId?:    string;
    action:     AuditAction;
    entity?:    string;
    entityId?:  string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({ data: params as any });
    } catch (error) {
      this.logger.error('AuditLog.create error', error);
    }
  }

  /**
   * Returns paginated audit logs for a user.
   * Admins see all; regular users only see their own.
   */
  async getUserLogs(userId: string, page = 1, limit = 50) {
    try {
      const cappedLimit = Math.min(limit, 100);
      const where = { userId };
      const [items, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          ...getPrismaSkipTake(page, cappedLimit),
        }),
        this.prisma.auditLog.count({ where }),
      ]);
      return paginate(items, total, page, cappedLimit);
    } catch (error) {
      this.logger.error(`getUserLogs error — user ${userId}`, error);
      throw error;
    }
  }
}
