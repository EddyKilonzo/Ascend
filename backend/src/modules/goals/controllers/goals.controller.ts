import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto } from '../dto/create-goal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';
import { GoalStatus } from '@prisma/client';

class UpdateProgressDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  progress: number;

  @IsOptional()
  @IsString()
  note?: string;
}

@ApiTags('goals')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a goal' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals (optionally filtered by status)' })
  @ApiQuery({ name: 'status', required: false, enum: GoalStatus })
  findAll(
    @CurrentUser() user: { id: string },
    @Query('status') status?: GoalStatus,
  ) {
    return this.goalsService.findAll(user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal detail with milestones' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.findOne(id, user.id);
  }

  @Patch(':id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update goal progress (0–100)' })
  @ApiBody({ type: UpdateProgressDto })
  updateProgress(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProgressDto,
  ) {
    return this.goalsService.updateProgress(id, user.id, body.progress, body.note);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete (abandon) a goal' })
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.goalsService.remove(id, user.id);
  }
}
