import { Module } from '@nestjs/common';
import { PlannerController } from './controllers/planner.controller';
import { PlannerService } from './services/planner.service';

@Module({
  controllers: [PlannerController],
  providers:   [PlannerService],
  exports:     [PlannerService],
})
export class PlannerModule {}
