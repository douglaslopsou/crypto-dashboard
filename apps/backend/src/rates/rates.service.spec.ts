import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RatesService } from './rates.service';
import { HourlyAverageEntity } from '../persistence/hourly-average.entity';
import { RateTick } from 'shared-types';

const mockRepo = {
  upsert: jest.fn().mockResolvedValue({}),
};

async function buildService(): Promise<RatesService> {
  const module = await Test.createTestingModule({
    providers: [
      RatesService,
      { provide: getRepositoryToken(HourlyAverageEntity), useValue: mockRepo },
      { provide: EventEmitter2, useValue: new EventEmitter2() },
    ],
  }).compile();

  const svc = module.get(RatesService);
  svc.onModuleInit();
  return svc;
}

describe('RatesService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with null snapshot for all pairs', async () => {
    const svc = await buildService();
    const snap = svc.getSnapshot('ETH/USDT');
    expect(snap.price).toBeNull();
    expect(snap.hourlyAvg).toBeNull();
    expect(snap.sampleCount).toBe(0);
  });

  it('reflects latest tick', async () => {
    const svc = await buildService();
    const tick: RateTick = { pair: 'ETH/USDT', price: 3200, volume: 1, timestamp: Date.now() };
    svc.handleTick(tick);
    const snap = svc.getSnapshot('ETH/USDT');
    expect(snap.price).toBe(3200);
  });

  it('computes hourly average over multiple ticks', async () => {
    const svc = await buildService();
    const now = Date.now();
    [3000, 3100, 3200].forEach((price) =>
      svc.handleTick({ pair: 'ETH/USDC', price, volume: 1, timestamp: now }),
    );
    expect(svc.getHourlyAvg('ETH/USDC')).toBeCloseTo(3100, 5);
  });

  it('returns null average with no ticks', async () => {
    const svc = await buildService();
    expect(svc.getHourlyAvg('ETH/BTC')).toBeNull();
  });

  it('getAllSnapshots returns all three pairs', async () => {
    const svc = await buildService();
    const snaps = svc.getAllSnapshots();
    expect(snaps.map((s) => s.pair)).toEqual(
      expect.arrayContaining(['ETH/USDC', 'ETH/USDT', 'ETH/BTC']),
    );
  });

  it('persists hourly averages and calls upsert for each pair with ticks', async () => {
    const svc = await buildService();
    const now = Date.now();
    svc.handleTick({ pair: 'ETH/USDT', price: 3000, volume: 1, timestamp: now });
    svc.handleTick({ pair: 'ETH/BTC', price: 0.05, volume: 1, timestamp: now });
    await svc.persistHourlyAverages();
    expect(mockRepo.upsert).toHaveBeenCalledTimes(2);
  });
});
