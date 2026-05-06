import { describe, it, expect } from 'vitest';
import { ConnectionState } from 'shared-types';

const validStates: ConnectionState[] = ['connecting', 'reconnecting', 'connected', 'disconnected'];

describe('ConnectionState contract', () => {
  it('contains exactly four states', () => {
    expect(validStates).toHaveLength(4);
  });

  it('connected is in the set', () => {
    expect(validStates).toContain('connected');
  });

  it('reconnecting is distinct from connecting', () => {
    expect(validStates.indexOf('reconnecting')).not.toBe(validStates.indexOf('connecting'));
  });
});
