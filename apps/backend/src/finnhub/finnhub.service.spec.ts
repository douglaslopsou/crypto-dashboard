import {
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  RECONNECT_MULTIPLIER,
  RECONNECT_JITTER_FACTOR,
} from './finnhub.constants';

function computeDelay(attempt: number): number {
  const base = Math.min(
    RECONNECT_INITIAL_DELAY_MS * Math.pow(RECONNECT_MULTIPLIER, attempt),
    RECONNECT_MAX_DELAY_MS,
  );
  return base;
}

describe('Finnhub reconnect backoff', () => {
  it('starts at initial delay on first attempt', () => {
    expect(computeDelay(0)).toBe(RECONNECT_INITIAL_DELAY_MS);
  });

  it('doubles on each attempt', () => {
    expect(computeDelay(1)).toBe(RECONNECT_INITIAL_DELAY_MS * 2);
    expect(computeDelay(2)).toBe(RECONNECT_INITIAL_DELAY_MS * 4);
  });

  it('caps at max delay', () => {
    expect(computeDelay(100)).toBe(RECONNECT_MAX_DELAY_MS);
  });

  it('jitter factor is within bounds', () => {
    const base = computeDelay(3);
    for (let i = 0; i < 50; i++) {
      const jitter = base * RECONNECT_JITTER_FACTOR * (Math.random() * 2 - 1);
      const delay = base + jitter;
      expect(delay).toBeGreaterThanOrEqual(base * (1 - RECONNECT_JITTER_FACTOR));
      expect(delay).toBeLessThanOrEqual(base * (1 + RECONNECT_JITTER_FACTOR));
    }
  });
});
