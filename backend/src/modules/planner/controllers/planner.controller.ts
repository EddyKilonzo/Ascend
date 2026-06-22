import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { PlannerService } from '../services/planner.service';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('planner')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  /** Create a new task, optionally time-blocked. */
  @Post('tasks')
  @ApiOperation({ summary: 'Create a planner task' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTaskDto) {
    return this.plannerService.create(user.id, dto);
  }

  /** Get all tasks for a specific date (defaults to today). */
  @Get('tasks')
  @ApiOperation({ summary: 'Get tasks for a date' })
  @ApiQuery({ name: 'date', required: false, example: '2025-01-20' })
  getForDate(
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    return this.plannerService.getTasksForDate(user.id, date);
  }

  /** Get tasks within a date range for weekly / monthly view. */
  @Get('tasks/range')
  @ApiOperation({ summary: 'Get tasks for a date range' })
  @ApiQuery({ name: 'startDate', required: true, example: '2025-01-13' })
  @ApiQuery({ name: 'endDate',   required: true, example: '2025-01-19' })
  getForRange(
    @CurrentUser() user: { id: string },
    @Query('startDate') startDate: string,
    @Query('endDate')   endDate:   string,
  ) {
    return this.plannerService.getTasksForRange(user.id, startDate, endDate);
  }

  /** Get overdue tasks (past due, not completed). */
  @Get('tasks/overdue')
  @ApiOperation({ summary: 'Get overdue tasks' })
  getOverdue(@CurrentUser() user: { id: string }) {
    return this.plannerService.getOverdueTasks(user.id);
  }

  /** Get a single task by ID. */
  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task by ID' })
  findOne(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plannerService.findOne(id, user.id);
  }

  /** Update task fields or mark it complete. */
  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.plannerService.update(id, user.id, dto);
  }

  /** Soft-delete a task. */
  @Delete('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.plannerService.remove(id, user.id);
  }
}
