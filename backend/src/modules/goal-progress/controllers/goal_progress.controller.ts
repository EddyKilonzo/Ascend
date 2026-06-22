import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GoalProgressService } from '../services/goal_progress.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('goal-progress')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/progress')
export class GoalProgressController {
  constructor(private readonly goalProgressService: GoalProgressService) {}

  /** Returns the progress log history for a specific goal. */
  @Get()
  @ApiOperation({ summary: 'Get progress log history for a goal' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProgressLogs(
    @CurrentUser()                            user:   { id: string },
    @Param('goalId', ParseUUIDPipe) goalId: string,
    @Query('page')  page  = 1,
    @Query('limit') limit = 30,
  ) {
    return this.goalProgressService.getProgressLogs(goalId, user.id, Number(page), Number(limit));
  }
}
