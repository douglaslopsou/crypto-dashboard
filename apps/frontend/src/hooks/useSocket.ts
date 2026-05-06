import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ConnectionState,
  DashboardSnapshot,
  PairSnapshot,
  RateTick,
  SOCKET_EVENTS,
  PairId,
} from 'shared-types';

const WS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const HEALTH_INTERVAL_MS = 30_000;
const MAX_CHART_POINTS = 60;

export interface PairChartPoint {
  timestamp: number;
  price: number;
}

export interface PairData extends PairSnapshot {
  chartPoints: PairChartPoint[];
}

export interface SocketState {
  connection: ConnectionState;
  pairs: Record<PairId, PairData>;
}

const PAIRS: PairId[] = ['ETH/USDC', 'ETH/USDT', 'ETH/BTC'];

function buildInitialPairs(): Record<PairId, PairData> {
  const entries = PAIRS.map((p): [PairId, PairData] => [
    p,
    { pair: p, price: null, lastUpdated: null, hourlyAvg: null, sampleCount: 0, chartPoints: [] },
  ]);
  return Object.fromEntries(entries) as Record<PairId, PairData>;
}

export function useSocket(): SocketState & { retry: () => void } {
  const socketRef = useRef<Socket | null>(null);
  const healthTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [pairs, setPairs] = useState<Record<PairId, PairData>>(buildInitialPairs);

  const startHealthCheck = useCallback(() => {
    if (healthTimerRef.current) return;
    healthTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${WS_URL}/health`);
        if (res.ok && socketRef.current?.disconnected) {
          socketRef.current.connect();
        }
      } catch {
        // backend still unreachable
      }
    }, HEALTH_INTERVAL_MS);
  }, []);

  const stopHealthCheck = useCallback(() => {
    if (healthTimerRef.current) {
      clearInterval(healthTimerRef.current);
      healthTimerRef.current = null;
    }
  }, []);

  const applySnapshot = useCallback((snapshot: DashboardSnapshot) => {
    setPairs((prev) => {
      const next = { ...prev };
      for (const s of snapshot.pairs) {
        const existing = next[s.pair];
        next[s.pair] = {
          ...s,
          chartPoints: s.price != null
            ? [...(existing?.chartPoints ?? []), { timestamp: s.lastUpdated ?? Date.now(), price: s.price }].slice(-MAX_CHART_POINTS)
            : existing?.chartPoints ?? [],
        };
      }
      return next;
    });
  }, []);

  const applyTick = useCallback((tick: RateTick) => {
    setPairs((prev) => {
      const existing = prev[tick.pair];
      const newPoint: PairChartPoint = { timestamp: tick.timestamp, price: tick.price };
      return {
        ...prev,
        [tick.pair]: {
          ...existing,
          price: tick.price,
          lastUpdated: tick.timestamp,
          chartPoints: [...(existing?.chartPoints ?? []), newPoint].slice(-MAX_CHART_POINTS),
        },
      };
    });
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    setConnection('connecting');

    const socket = io(WS_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 60_000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnection('connected');
      stopHealthCheck();
    });

    socket.on('disconnect', () => {
      setConnection('disconnected');
      startHealthCheck();
    });

    socket.on('connect_error', () => {
      setConnection('reconnecting');
      startHealthCheck();
    });

    socket.on('reconnect_attempt', () => {
      setConnection('reconnecting');
    });

    socket.on(SOCKET_EVENTS.SNAPSHOT, applySnapshot);
    socket.on(SOCKET_EVENTS.TICK, applyTick);
  }, [applySnapshot, applyTick, startHealthCheck, stopHealthCheck]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.removeAllListeners();
      socketRef.current?.disconnect();
      stopHealthCheck();
    };
  }, [connect, stopHealthCheck]);

  const retry = useCallback(() => {
    setPairs(buildInitialPairs());
    connect();
  }, [connect]);

  return { connection, pairs, retry };
}
