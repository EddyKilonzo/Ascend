import { Module } from '@nestjs/common';
import { GoalsController } from './controllers/goals.controller';
import { GoalsService } from './services/goals.service';

@Module({
  controllers: [GoalsController],
  providers:   [GoalsService],
  exports:     [GoalsService],
})
export class GoalsModule {}
