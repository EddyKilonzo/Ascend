import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CalendarService, CreateEventDto } from '../services/calendar.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../../common/pipes/parse-uuid.pipe';

@ApiTags('calendar')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /** Create a new calendar event. */
  @Post('events')
  @ApiOperation({ summary: 'Create calendar event' })
  createEvent(@CurrentUser() user: { id: string }, @Body() dto: CreateEventDto) {
    return this.calendarService.createEvent(user.id, dto);
  }

  /** Get calendar events, optionally filtered by date range. */
  @Get('events')
  @ApiOperation({ summary: 'Get calendar events' })
  @ApiQuery({ name: 'from',  required: false, type: String, example: '2025-06-01T00:00:00Z' })
  @ApiQuery({ name: 'to',    required: false, type: String, example: '2025-06-30T23:59:59Z' })
  @ApiQuery({ name: 'page',  required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEvents(
    @CurrentUser()        user:  { id: string },
    @Query('from')  from?: string,
    @Query('to')    to?:   string,
    @Query('page')  page  = 1,
    @Query('limit') limit = 50,
  ) {
    return this.calendarService.getEvents(user.id, from, to, Number(page), Number(limit));
  }

  /** Update a calendar event by ID. */
  @Patch('events/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update calendar event' })
  updateEvent(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body()                         dto:  Partial<CreateEventDto>,
  ) {
    return this.calendarService.updateEvent(id, user.id, dto);
  }

  /** Delete a calendar event. */
  @Delete('events/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete calendar event' })
  deleteEvent(
    @CurrentUser()                  user: { id: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.calendarService.deleteEvent(id, user.id);
  }
}
