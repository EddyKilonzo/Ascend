import { Module } from '@nestjs/common';
import { FocusController } from './controllers/focus.controller';
import { FocusService } from './services/focus.service';

@Module({
  controllers: [FocusController],
  providers:   [FocusService],
  exports:     [FocusService],
})
export class FocusModule {}
