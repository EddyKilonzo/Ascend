import {
  Injectable, Logger, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { IsString, IsBoolean, IsOptional, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

export class CreateEventDto {
  @ApiProperty({ example: 'Team standup' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ example: '2025-06-15T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2025-06-15T09:30:00Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new calendar event for the authenticated user.
   * Validates that endTime is after startTime.
   */
  async createEvent(userId: string, dto: CreateEventDto) {
    try {
      const startTime = new Date(dto.startTime);
      const endTime   = new Date(dto.endTime);

      if (endTime <= startTime) {
        throw new BadRequestException('endTime must be after startTime');
      }

      return await this.prisma.calendarEvent.create({
        data: {
          userId,
          title:       dto.title,
          description: dto.description,
          location:    dto.location,
          startTime,
          endTime,
          isAllDay:    dto.isAllDay ?? false,
          color:       dto.color,
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`createEvent error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Returns events for a user within an optional date range.
   * If no range is provided, returns upcoming events (from now, paginated).
   */
  async getEvents(userId: string, from?: string, to?: string, page = 1, limit = 50) {
    try {
      const where: any = { userId };
      if (from) where.startTime = { ...(where.startTime ?? {}), gte: new Date(from) };
      if (to)   where.endTime   = { ...(where.endTime   ?? {}), lte: new Date(to)   };

      const [events, total] = await Promise.all([
        this.prisma.calendarEvent.findMany({
          where,
          orderBy: { startTime: 'asc' },
          ...getPrismaSkipTake(page, limit),
        }),
        this.prisma.calendarEvent.count({ where }),
      ]);

      return paginate(events, total, page, limit);
    } catch (error) {
      this.logger.error(`getEvents error — user ${userId}`, error);
      throw error;
    }
  }

  /** Updates a calendar event. Ownership is enforced. */
  async updateEvent(eventId: string, userId: string, dto: Partial<CreateEventDto>) {
    try {
      const event = await this.prisma.calendarEvent.findUnique({ where: { id: eventId } });
      if (!event) throw new ResourceNotFoundException('Calendar event', eventId);
      if (event.userId !== userId) throw new ForbiddenException('Access denied');

      if (dto.startTime && dto.endTime) {
        if (new Date(dto.endTime) <= new Date(dto.startTime)) {
          throw new BadRequestException('endTime must be after startTime');
        }
      }

      return await this.prisma.calendarEvent.update({
        where: { id: eventId },
        data:  {
          ...(dto.title       ? { title: dto.title }             : {}),
          ...(dto.description ? { description: dto.description } : {}),
          ...(dto.location    ? { location: dto.location }       : {}),
          ...(dto.startTime   ? { startTime: new Date(dto.startTime) } : {}),
          ...(dto.endTime     ? { endTime:   new Date(dto.endTime)   } : {}),
          ...(dto.isAllDay !== undefined ? { isAllDay: dto.isAllDay } : {}),
          ...(dto.color       ? { color: dto.color }             : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`updateEvent error — event ${eventId}`, error);
      throw error;
    }
  }

  /** Deletes a calendar event. Only the owner can delete. */
  async deleteEvent(eventId: string, userId: string) {
    try {
      const event = await this.prisma.calendarEvent.findUnique({ where: { id: eventId } });
      if (!event) throw new ResourceNotFoundException('Calendar event', eventId);
      if (event.userId !== userId) throw new ForbiddenException('Access denied');

      await this.prisma.calendarEvent.delete({ where: { id: eventId } });
      return { message: 'Event deleted' };
    } catch (error) {
      if (error instanceof ResourceNotFoundException || error instanceof ForbiddenException) throw error;
      this.logger.error(`deleteEvent error — event ${eventId}`, error);
      throw error;
    }
  }
}
