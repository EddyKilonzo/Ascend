import { Module } from '@nestjs/common';
import { HabitsController } from './controllers/habits.controller';
import { HabitsService } from './services/habits.service';
import { HabitsRepository } from './repositories/habits.repository';

@Module({
  controllers: [HabitsController],
  providers:   [HabitsService, HabitsRepository],
  exports:     [HabitsService],
})
export class HabitsModule {}
