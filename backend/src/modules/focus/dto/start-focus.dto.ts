import { IsEnum, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FocusMode } from '@prisma/client';
import { Type } from 'class-transformer';

export class StartFocusDto {
  @ApiProperty({ enum: FocusMode, default: FocusMode.POMODORO_25 })
  @IsEnum(FocusMode)
  mode: FocusMode;

  @ApiPropertyOptional({ description: 'Link focus session to a specific task' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ example: 'Writing tests for the auth module' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteFocusDto {
  @ApiPropertyOptional({ description: 'Actual minutes worked (if different from planned)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(300)
  actualMinutes?: number;

  @ApiPropertyOptional({ description: 'Number of interruptions during session', minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  interruptions?: number;
}
