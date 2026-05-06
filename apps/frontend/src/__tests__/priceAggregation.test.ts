import { describe, it, expect } from 'vitest';

function computeAverage(prices: number[]): number | null {
  if (prices.length === 0) return null;
  return prices.reduce((a, b) => a + b, 0) / prices.length;
}

describe('price aggregation', () => {
  it('returns null for empty series', () => {
    expect(computeAverage([])).toBeNull();
  });

  it('returns the value itself for a single price', () => {
    expect(computeAverage([3000])).toBe(3000);
  });

  it('averages multiple prices correctly', () => {
    expect(computeAverage([3000, 3100, 3200])).toBeCloseTo(3100, 10);
  });
});
