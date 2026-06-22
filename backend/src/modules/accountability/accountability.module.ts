import { Module } from '@nestjs/common';
import { AccountabilityController } from './controllers/accountability.controller';
import { AccountabilityService } from './services/accountability.service';

@Module({
  controllers: [AccountabilityController],
  providers: [AccountabilityService], exports: [AccountabilityService],
})
export class AccountabilityModule {}
