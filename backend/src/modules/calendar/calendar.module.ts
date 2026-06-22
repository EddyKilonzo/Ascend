import { Module } from '@nestjs/common';
import { CalendarController } from './controllers/calendar.controller';
import { CalendarService } from './services/calendar.service';

@Module({
  controllers: [CalendarController],
  providers: [CalendarService], exports: [CalendarService],
})
export class CalendarModule {}
