import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HourlyAverageEntity } from './hourly-average.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HourlyAverageEntity]),
  ],
  exports: [TypeOrmModule],
})
export class PersistenceModule {}
