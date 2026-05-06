import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FinnhubService } from './finnhub.service';

@Module({
  imports: [EventEmitterModule],
  providers: [FinnhubService],
  exports: [FinnhubService],
})
export class FinnhubModule {}
