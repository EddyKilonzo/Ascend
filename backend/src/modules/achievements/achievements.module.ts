import { Module } from '@nestjs/common';
import { AchievementsController } from './controllers/achievements.controller';
import { AchievementsService } from './services/achievements.service';

@Module({
  controllers: [AchievementsController],
  providers: [AchievementsService], exports: [AchievementsService],
})
export class AchievementsModule {}
