import {
  Injectable, Logger, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SocialPlatform } from '@prisma/client';
import { IsEnum, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import dayjs from 'dayjs';

export class LogSocialUsageDto {
  @ApiProperty({ enum: SocialPlatform })
  @IsEnum(SocialPlatform)
  platform: SocialPlatform;

  @ApiProperty({ example: 30, description: 'Minutes spent on the platform' })
  @IsInt()
  @Min(1)
  @Max(1440)
  minutes: number;

  @ApiProperty({ example: '2025-06-15', description: 'Date of usage (YYYY-MM-DD)' })
  @IsDateString()
  loggedDate: string;
}

@Injectable()
export class SocialTrackerService {
  private readonly logger = new Logger(SocialTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs or updates social media usage for a specific date and platform.
   * Enforces a max lookback of 7 days to prevent retroactive manipulation.
   */
  async logUsage(userId: string, dto: LogSocialUsageDto) {
    try {
      const loggedDate = dayjs(dto.loggedDate).startOf('day');
      const today      = dayjs().startOf('day');
      const maxBack    = today.subtract(7, 'day');

      if (loggedDate.isAfter(today)) {
        throw new BadRequestException('loggedDate cannot be in the future');
      }
      if (loggedDate.isBefore(maxBack)) {
        throw new BadRequestException('loggedDate cannot be more than 7 days in the past');
      }

      return await this.prisma.socialUsageLog.upsert({
        where: {
          userId_platform_loggedDate: {
            userId,
            platform:   dto.platform,
            loggedDate: loggedDate.toDate(),
          },
        },
        update: { minutes: dto.minutes },
        create: {
          userId,
          platform:   dto.platform,
          minutes:    dto.minutes,
          loggedDate: loggedDate.toDate(),
          weekNumber: loggedDate.isoWeek(),
          year:       loggedDate.year(),
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`logUsage error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns social usage for the last N days grouped by platform.
   * Capped at 90 days to prevent large data exports.
   */
  async getUsage(userId: string, days = 30) {
    try {
      const cappedDays = Math.min(days, 90);
      const since = dayjs().subtract(cappedDays, 'day').startOf('day').toDate();

      const logs = await this.prisma.socialUsageLog.findMany({
        where:   { userId, loggedDate: { gte: since } },
        orderBy: { loggedDate: 'desc' },
      });

      // Aggregate total minutes per platform
      const totals: Record<string, number> = {};
      for (const log of logs) {
        totals[log.platform] = (totals[log.platform] ?? 0) + log.minutes;
      }

      return { logs, totals };
    } catch (error) {
      this.logger.error(`getUsage error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Deletes a specific social usage log entry.
   * Only the owner can delete their own logs.
   */
  async deleteLog(logId: string, userId: string) {
    try {
      const log = await this.prisma.socialUsageLog.findUnique({ where: { id: logId } });
      if (!log) throw new ResourceNotFoundException('Social usage log', logId);
      if (log.userId !== userId) throw new ForbiddenException('Access denied');

      await this.prisma.socialUsageLog.delete({ where: { id: logId } });
      return { message: 'Log deleted' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`deleteLog error — log ${logId}`, error);
      throw error;
    }
  }
}
