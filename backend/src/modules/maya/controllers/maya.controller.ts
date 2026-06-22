import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MayaService } from '../services/maya.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { CoachingModule } from '../../../integrations/ai-gateway/ai-gateway.types';

const MODULES: CoachingModule[] = [
  'PRODUCTIVITY', 'ACCOUNTABILITY', 'HABIT', 'GOAL',
  'FOCUS', 'BURNOUT', 'SCHEDULE', 'WEEKLY_REVIEW',
  'MONTHLY_REVIEW', 'ACHIEVEMENT',
];

export class MayaChatDto {
  @ApiPropertyOptional({ example: 'Why is my productivity score so low?', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiPropertyOptional({ enum: MODULES, default: 'PRODUCTIVITY' })
  @IsOptional()
  @IsEnum(MODULES)
  module?: CoachingModule;
}

@ApiTags('maya')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('maya')
export class MayaController {
  constructor(private readonly mayaService: MayaService) {}

  /** Returns Maya's full AI-backed coaching for the caller (GET convenience endpoint). */
  @Get('suggestions')
  @ApiOperation({ summary: 'Get Maya AI productivity suggestions' })
  @ApiQuery({ name: 'module', required: false, enum: MODULES })
  getSuggestions(
    @CurrentUser() user: { id: string },
    @Query('module') module: CoachingModule = 'PRODUCTIVITY',
  ) {
    return this.mayaService.getSuggestions(user.id, module);
  }

  /** Chat with Maya — send a message and get a context-aware response. */
  @Post('chat')
  @ApiOperation({ summary: 'Chat with Maya (data-backed coaching)' })
  chat(
    @CurrentUser() user: { id: string },
    @Body() dto: MayaChatDto,
  ) {
    return this.mayaService.getSuggestions(user.id, dto.module ?? 'PRODUCTIVITY', dto.message);
  }
}
