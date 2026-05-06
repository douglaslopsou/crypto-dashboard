import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FinnhubModule } from './finnhub/finnhub.module';
import { RatesModule } from './rates/rates.module';
import { GatewayModule } from './gateway/gateway.module';
import { HealthModule } from './health/health.module';
import { HourlyAverageEntity } from './persistence/hourly-average.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', 'data/crypto.db'),
        entities: [HourlyAverageEntity],
        synchronize: true,
      }),
    }),
    FinnhubModule,
    RatesModule,
    GatewayModule,
    HealthModule,
  ],
})
export class AppModule {}
