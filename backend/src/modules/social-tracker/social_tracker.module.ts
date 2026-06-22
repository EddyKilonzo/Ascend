import { Module } from '@nestjs/common';
import { SocialTrackerController } from './controllers/social_tracker.controller';
import { SocialTrackerService } from './services/social_tracker.service';

@Module({
  controllers: [SocialTrackerController],
  providers: [SocialTrackerService], exports: [SocialTrackerService],
})
export class SocialTrackerModule {}
