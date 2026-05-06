import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { RateTick, PairId, PairSnapshot, HourlyAverage } from 'shared-types';
import { HourlyAverageEntity } from '../persistence/hourly-average.entity';

interface TickBuffer {
  price: number;
  timestamp: number;
}

interface PairState {
  lastPrice: number | null;
  lastUpdated: number | null;
  ticks: TickBuffer[];
}

const PAIRS: PairId[] = ['ETH/USDC', 'ETH/USDT', 'ETH/BTC'];
const ONE_HOUR_MS = 60 * 60 * 1_000;

@Injectable()
export class RatesService implements OnModuleInit {
  private readonly logger = new Logger(RatesService.name);
  private state: Map<PairId, PairState> = new Map();

  constructor(
    @InjectRepository(HourlyAverageEntity)
    private readonly avgRepo: Repository<HourlyAverageEntity>,
  ) {}

  onModuleInit() {
    for (const pair of PAIRS) {
      this.state.set(pair, { lastPrice: null, lastUpdated: null, ticks: [] });
    }
  }

  @OnEvent('rate.tick')
  handleTick(tick: RateTick) {
    const s = this.state.get(tick.pair);
    if (!s) return;

    s.lastPrice = tick.price;
    s.lastUpdated = tick.timestamp;
    s.ticks.push({ price: tick.price, timestamp: tick.timestamp });

    this.pruneOldTicks(s);
  }

  private pruneOldTicks(s: PairState) {
    const cutoff = Date.now() - ONE_HOUR_MS;
    s.ticks = s.ticks.filter((t) => t.timestamp > cutoff);
  }

  getHourlyAvg(pair: PairId): number | null {
    const s = this.state.get(pair);
    if (!s || s.ticks.length === 0) return null;
    const sum = s.ticks.reduce((acc, t) => acc + t.price, 0);
    return sum / s.ticks.length;
  }

  getSnapshot(pair: PairId): PairSnapshot {
    const s = this.state.get(pair)!;
    this.pruneOldTicks(s);
    return {
      pair,
      price: s.lastPrice,
      lastUpdated: s.lastUpdated,
      hourlyAvg: this.getHourlyAvg(pair),
      sampleCount: s.ticks.length,
    };
  }

  getAllSnapshots(): PairSnapshot[] {
    return PAIRS.map((p) => this.getSnapshot(p));
  }

  @Cron(CronExpression.EVERY_HOUR)
  async persistHourlyAverages() {
    const hourStart = this.currentHourStart();

    for (const pair of PAIRS) {
      const s = this.state.get(pair)!;
      this.pruneOldTicks(s);
      if (s.ticks.length === 0) continue;

      const sum = s.ticks.reduce((acc, t) => acc + t.price, 0);
      const avgPrice = sum / s.ticks.length;

      const avg: HourlyAverage = {
        pair,
        hourStart,
        avgPrice,
        sampleCount: s.ticks.length,
      };

      await this.avgRepo.upsert(
        { pair, hourStart, avgPrice, sampleCount: avg.sampleCount },
        ['pair', 'hourStart'],
      );

      this.logger.log(
        `Persisted hourly avg for ${pair}: ${avgPrice.toFixed(6)} (${avg.sampleCount} samples)`,
      );
    }
  }

  private currentHourStart(): number {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.getTime();
  }
}
