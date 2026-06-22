import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MayaController } from './controllers/maya.controller';
import { MayaService }    from './services/maya.service';
import { QUEUE_ML_EVENTS } from '../../queues/queues.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_ML_EVENTS }),
  ],
  controllers: [MayaController],
  providers:   [MayaService],
  exports:     [MayaService],
})
export class MayaModule {}
