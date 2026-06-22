import { Module } from '@nestjs/common';
import { MayaController } from './controllers/maya.controller';
import { MayaService } from './services/maya.service';

@Module({
  controllers: [MayaController],
  providers: [MayaService], exports: [MayaService],
})
export class MayaModule {}
