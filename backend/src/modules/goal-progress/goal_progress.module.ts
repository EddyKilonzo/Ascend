import { Module } from '@nestjs/common';
import { GoalProgressController } from './controllers/goal_progress.controller';
import { GoalProgressService } from './services/goal_progress.service';

@Module({
  controllers: [GoalProgressController],
  providers: [GoalProgressService], exports: [GoalProgressService],
})
export class GoalProgressModule {}
