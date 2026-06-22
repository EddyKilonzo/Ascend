import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  MinLength, MaxLength, Min, Max, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitCategory, HabitFrequency } from '@prisma/client';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning Run' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Run 5km every morning' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: HabitCategory, default: HabitCategory.CUSTOM })
  @IsOptional()
  @IsEnum(HabitCategory)
  category?: HabitCategory;

  @ApiPropertyOptional({ enum: HabitFrequency, default: HabitFrequency.DAILY })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  targetCount?: number;

  @ApiPropertyOptional({ example: '#428475', description: 'Hex color code' })
  @IsOptional()
  @IsString()
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Invalid hex color' })
  color?: string;

  @ApiPropertyOptional({ example: 'running' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ example: '07:00', description: 'HH:MM format' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Reminder time must be HH:MM format' })
  reminderTime?: string;
}
