import {
  IsString, IsOptional, IsEnum, IsBoolean, IsInt,
  IsDateString, MinLength, MaxLength, Min, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @ApiProperty({ example: 'Write unit tests for auth module' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Cover register, login, and refresh endpoints' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2025-01-20T00:00:00.000Z', description: 'Date to schedule the task' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '09:00', description: 'HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'scheduledTime must be HH:MM format' })
  scheduledTime?: string;

  @ApiPropertyOptional({ example: '2025-01-25T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 90, description: 'Estimated duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Enable time-block mode to reserve a calendar slot' })
  @IsOptional()
  @IsBoolean()
  isTimeBlocked?: boolean;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'blockStart must be HH:MM format' })
  blockStart?: string;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'blockEnd must be HH:MM format' })
  blockEnd?: string;

  @ApiPropertyOptional({ description: 'Associate task with a goal' })
  @IsOptional()
  @IsString()
  goalId?: string;
}
