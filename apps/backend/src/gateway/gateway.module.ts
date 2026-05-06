import { Module } from '@nestjs/common';
import { RatesGateway } from './rates.gateway';
import { RatesModule } from '../rates/rates.module';

@Module({
  imports: [RatesModule],
  providers: [RatesGateway],
})
export class GatewayModule {}
