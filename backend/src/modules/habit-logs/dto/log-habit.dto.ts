import { IsString, IsOptional, IsInt, IsDateString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LogHabitDto {
  /**
   * ISO timestamp for when the habit was completed.
   * Defaults to now if omitted.
   */
  @ApiPropertyOptional({ example: '2025-01-15T07:30:00.000Z' })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  /** Number of times the habit was completed in one log entry (e.g., 3 glasses of water). */
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  count?: number;

  /** Optional note or reflection for this completion. */
  @ApiPropertyOptional({ example: 'Felt great, ran an extra km today' })
  @IsOptional()
  @IsString()
  note?: string;
}
