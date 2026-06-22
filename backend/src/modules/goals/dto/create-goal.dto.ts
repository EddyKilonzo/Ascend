import {
  IsString, IsOptional, IsEnum, IsDateString,
  MinLength, MaxLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalTimeframe } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({ example: 'Become a SOC Analyst' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Complete certifications and land a security role' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: GoalTimeframe, default: GoalTimeframe.SHORT_TERM })
  @IsOptional()
  @IsEnum(GoalTimeframe)
  timeframe?: GoalTimeframe;

  @ApiPropertyOptional({ example: '2025-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({ example: '#428475' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid hex color' })
  color?: string;

  @ApiPropertyOptional({ example: 'target' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;
}
