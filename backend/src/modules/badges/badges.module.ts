import { Module } from '@nestjs/common';
import { BadgesController } from './controllers/badges.controller';
import { BadgesService } from './services/badges.service';

@Module({
  controllers: [BadgesController],
  providers: [BadgesService], exports: [BadgesService],
})
export class BadgesModule {}
