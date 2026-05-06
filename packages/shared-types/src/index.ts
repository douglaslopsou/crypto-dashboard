export type PairId = 'ETH/USDC' | 'ETH/USDT' | 'ETH/BTC';

export interface RateTick {
  pair: PairId;
  price: number;
  volume: number;
  timestamp: number;
}

export interface HourlyAverage {
  pair: PairId;
  hourStart: number;
  avgPrice: number;
  sampleCount: number;
}

export interface PairSnapshot {
  pair: PairId;
  price: number | null;
  lastUpdated: number | null;
  hourlyAvg: number | null;
  sampleCount: number;
}

export interface DashboardSnapshot {
  pairs: PairSnapshot[];
}

export type ConnectionState = 'connecting' | 'reconnecting' | 'connected' | 'disconnected';

export const SOCKET_EVENTS = {
  TICK: 'tick',
  SNAPSHOT: 'snapshot',
  ERROR: 'error',
} as const;
