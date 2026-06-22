import { Module } from '@nestjs/common';
import { HabitLogsController } from './controllers/habit-logs.controller';
import { HabitLogsService } from './services/habit-logs.service';

@Module({
  controllers: [HabitLogsController],
  providers:   [HabitLogsService],
  exports:     [HabitLogsService],
})
export class HabitLogsModule {}
