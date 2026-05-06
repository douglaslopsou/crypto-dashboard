import { PairId } from 'shared-types';

export const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

export const PAIR_SYMBOLS: Record<PairId, string> = {
  'ETH/USDC': 'BINANCE:ETHUSDC',
  'ETH/USDT': 'BINANCE:ETHUSDT',
  'ETH/BTC': 'BINANCE:ETHBTC',
};

export const RECONNECT_INITIAL_DELAY_MS = 1_000;
export const RECONNECT_MAX_DELAY_MS = 60_000;
export const RECONNECT_MULTIPLIER = 2;
export const RECONNECT_JITTER_FACTOR = 0.2;

export const AUTH_ERROR_PATTERNS = ['invalid token', 'Invalid token', 'unauthorized'];
export const AUTH_ERROR_BACKOFF_MS = 300_000;
export const AUTH_ERROR_MAX_CONSECUTIVE = 3;
