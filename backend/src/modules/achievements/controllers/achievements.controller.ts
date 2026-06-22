import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AchievementsService } from '../services/achievements.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('achievements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  /** Returns all active achievements with each one's unlock status for the caller. */
  @Get()
  @ApiOperation({ summary: 'Get all achievements with unlock status' })
  getAllWithProgress(@CurrentUser() user: { id: string }) {
    return this.achievementsService.getAllWithProgress(user.id);
  }

  /** Returns the caller's unlocked achievements, newest first, paginated. */
  @Get('mine')
  @ApiOperation({ summary: 'Get my unlocked achievements (paginated)' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserAchievements(
    @CurrentUser()       user: { id: string },
    @Query('page')  page  = 1,
    @Query('limit') limit = 20,
  ) {
    return this.achievementsService.getUserAchievements(user.id, Number(page), Number(limit));
  }
}
