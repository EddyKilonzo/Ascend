import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { XpService } from '../services/xp.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('xp')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('xp')
export class XpController {
  constructor(private readonly xpService: XpService) {}

  /** Get the current user's level and XP progress. */
  @Get('level')
  @ApiOperation({ summary: 'Get current level and XP' })
  getLevel(@CurrentUser() user: { id: string }) {
    return this.xpService.getUserLevel(user.id);
  }

  /** Get paginated XP earning history. */
  @Get('history')
  @ApiOperation({ summary: 'Get XP history' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: { id: string },
    @Query('page')  page  = 1,
    @Query('limit') limit = 20,
  ) {
    return this.xpService.getXpHistory(user.id, Number(page), Number(limit));
  }
}
