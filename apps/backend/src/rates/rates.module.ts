import { Module } from '@nestjs/common';
import { RatesService } from './rates.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule],
  providers: [RatesService],
  exports: [RatesService],
})
export class RatesModule {}
