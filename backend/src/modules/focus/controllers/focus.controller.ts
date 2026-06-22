import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FocusService } from '../services/focus.service';
import { StartFocusDto, CompleteFocusDto } from '../dto/start-focus.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('focus')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('focus')
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  /** Start a new Pomodoro / deep work session. */
  @Post('sessions/start')
  @ApiOperation({ summary: 'Start a focus session' })
  start(@CurrentUser() user: { id: string }, @Body() dto: StartFocusDto) {
    return this.focusService.startSession(user.id, dto);
  }

  /** Complete an active focus session and award XP. */
  @Patch('sessions/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a focus session' })
  complete(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteFocusDto,
  ) {
    return this.focusService.completeSession(id, user.id, dto);
  }

  /** Interrupt (cancel) an active session without awarding XP. */
  @Patch('sessions/:id/interrupt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Interrupt a focus session' })
  interrupt(
    @CurrentUser() user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.focusService.interruptSession(id, user.id);
  }

  /** Get focus session history. */
  @Get('sessions')
  @ApiOperation({ summary: 'Get focus session history' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: { id: string },
    @Query('page')  page  = 1,
    @Query('limit') limit = 20,
  ) {
    return this.focusService.getHistory(user.id, Number(page), Number(limit));
  }

  /** Get aggregated focus statistics. */
  @Get('stats')
  @ApiOperation({ summary: 'Get focus statistics' })
  getStats(@CurrentUser() user: { id: string }) {
    return this.focusService.getStats(user.id);
  }
}
