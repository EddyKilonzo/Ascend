import {
  Controller, Get, Patch, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BadgesService } from '../services/badges.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('badges')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  /** Returns all badges with earn / display status for the caller. */
  @Get()
  @ApiOperation({ summary: 'Get all badges with my status' })
  getAllWithStatus(@CurrentUser() user: { id: string }) {
    return this.badgesService.getAllWithStatus(user.id);
  }

  /** Returns only the badges the caller has earned. */
  @Get('mine')
  @ApiOperation({ summary: 'Get my earned badges' })
  getUserBadges(@CurrentUser() user: { id: string }) {
    return this.badgesService.getUserBadges(user.id);
  }

  /** Toggles whether a badge is shown on the caller's public profile (max 6 displayed). */
  @Patch(':id/display')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle badge display on public profile' })
  toggleDisplay(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isDisplayed')        isDisplayed: boolean,
  ) {
    return this.badgesService.toggleDisplay(user.id, id, isDisplayed);
  }
}
