import {
  Injectable, Logger, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../database/prisma.service';
import { CommitmentStatus } from '@prisma/client';
import { IsString, IsDateString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceNotFoundException } from '../../../common/exceptions/http-exceptions';
import { getPrismaSkipTake, paginate } from '../../../common/utils/pagination.util';

export class CreateCommitmentDto {
  @ApiProperty({ example: 'No social media this week' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2025-06-30T23:59:59Z', description: 'Deadline for this commitment' })
  @IsDateString()
  dueAt: string;

  @ApiPropertyOptional({ example: 20, description: 'XP at stake if the commitment is failed' })
  @IsOptional()
  @IsInt()
  @Min(0)
  xpStake?: number;
}

@Injectable()
export class AccountabilityService {
  private readonly logger = new Logger(AccountabilityService.name);

  constructor(
    private readonly prisma:  PrismaService,
    private readonly events:  EventEmitter2,
  ) {}

  /** Creates a new commitment (public promise with an XP stake). */
  async create(userId: string, dto: CreateCommitmentDto) {
    try {
      const dueAt = new Date(dto.dueAt);
      if (dueAt <= new Date()) {
        throw new BadRequestException('dueAt must be in the future');
      }

      const commitment = await this.prisma.commitment.create({
        data: {
          userId,
          title:       dto.title,
          description: dto.description,
          dueAt,
          xpStake:     dto.xpStake ?? 20,
          status:      CommitmentStatus.PENDING,
        },
      });

      this.events.emit('commitment.created', { userId, commitmentId: commitment.id });
      return commitment;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`create commitment error — user ${userId}`, error);
      throw error;
    }
  }

  /** Returns paginated commitments for a user, optionally filtered by status. */
  async findAll(userId: string, page = 1, limit = 20, status?: CommitmentStatus) {
    try {
      const where = { userId, ...(status ? { status } : {}) };
      const [items, total] = await Promise.all([
        this.prisma.commitment.findMany({
          where,
          orderBy: { dueAt: 'asc' },
          ...getPrismaSkipTake(page, limit),
        }),
        this.prisma.commitment.count({ where }),
      ]);
      return paginate(items, total, page, limit);
    } catch (error) {
      this.logger.error(`findAll commitments error — user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Marks a commitment as COMPLETED.
   * Emits commitment.kept so the XP module can award the staked XP as a bonus.
   */
  async complete(commitmentId: string, userId: string) {
    try {
      const commitment = await this.prisma.commitment.findUnique({ where: { id: commitmentId } });
      if (!commitment) throw new ResourceNotFoundException('Commitment', commitmentId);
      if (commitment.userId !== userId) throw new ForbiddenException('Access denied');
      if (commitment.status !== CommitmentStatus.PENDING) {
        throw new BadRequestException('Only PENDING commitments can be completed');
      }

      const updated = await this.prisma.commitment.update({
        where: { id: commitmentId },
        data:  { status: CommitmentStatus.COMPLETED, completedAt: new Date() },
      });

      this.events.emit('commitment.kept', { userId, commitmentId, xpReward: commitment.xpStake });
      return updated;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`complete commitment error — ${commitmentId}`, error);
      throw error;
    }
  }

  /**
   * Marks a commitment as FAILED with an optional failure note.
   * No XP bonus is awarded; the user loses their staked XP (future: deduct from balance).
   */
  async fail(commitmentId: string, userId: string, failureNote?: string) {
    try {
      const commitment = await this.prisma.commitment.findUnique({ where: { id: commitmentId } });
      if (!commitment) throw new ResourceNotFoundException('Commitment', commitmentId);
      if (commitment.userId !== userId) throw new ForbiddenException('Access denied');
      if (commitment.status !== CommitmentStatus.PENDING) {
        throw new BadRequestException('Only PENDING commitments can be marked as failed');
      }

      const updated = await this.prisma.commitment.update({
        where: { id: commitmentId },
        data:  { status: CommitmentStatus.FAILED, failedAt: new Date(), failureNote },
      });

      this.events.emit('commitment.failed', { userId, commitmentId });
      return updated;
    } catch (error) {
      if (
        error instanceof ResourceNotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) throw error;
      this.logger.error(`fail commitment error — ${commitmentId}`, error);
      throw error;
    }
  }
}
