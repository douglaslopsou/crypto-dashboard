import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { PairId } from 'shared-types';

@Entity('hourly_averages')
@Index(['pair', 'hourStart'], { unique: true })
export class HourlyAverageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pair: PairId;

  @Column({ type: 'bigint' })
  hourStart: number;

  @Column({ type: 'real' })
  avgPrice: number;

  @Column({ type: 'integer' })
  sampleCount: number;
}
