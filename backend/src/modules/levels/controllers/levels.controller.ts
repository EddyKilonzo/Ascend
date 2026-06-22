import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LevelsService } from '../services/levels.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('levels')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  /** Returns the caller's current level, XP, and xpToNextLevel. */
  @Get('me')
  @ApiOperation({ summary: 'Get my current level and XP' })
  getMyLevel(@CurrentUser() user: { id: string }) {
    return this.levelsService.getMyLevel(user.id);
  }

  /** Returns XP thresholds for a range of levels. Public so the frontend can cache it. */
  @Public()
  @Get('thresholds')
  @ApiOperation({ summary: 'Get XP thresholds for each level' })
  @ApiQuery({ name: 'from', required: false, type: Number })
  @ApiQuery({ name: 'to',   required: false, type: Number })
  getThresholds(@Query('from') from = 1, @Query('to') to = 50) {
    return this.levelsService.getLevelThresholds(Number(from), Number(to));
  }
}
