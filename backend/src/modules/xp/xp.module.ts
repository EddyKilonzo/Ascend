import { Module } from '@nestjs/common';
import { XpController } from './controllers/xp.controller';
import { XpService } from './services/xp.service';

@Module({
  controllers: [XpController],
  providers:   [XpService],
  exports:     [XpService],
})
export class XpModule {}
