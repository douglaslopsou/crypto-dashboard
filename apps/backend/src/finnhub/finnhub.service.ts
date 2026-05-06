import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as WebSocket from 'ws';
import { RateTick, PairId } from 'shared-types';
import {
  FINNHUB_WS_URL,
  PAIR_SYMBOLS,
  RECONNECT_INITIAL_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  RECONNECT_MULTIPLIER,
  RECONNECT_JITTER_FACTOR,
  AUTH_ERROR_PATTERNS,
  AUTH_ERROR_BACKOFF_MS,
  AUTH_ERROR_MAX_CONSECUTIVE,
} from './finnhub.constants';

interface FinnhubTrade {
  s: string;
  p: number;
  t: number;
  v: number;
}

interface FinnhubMessage {
  type: string;
  data?: FinnhubTrade[];
}

@Injectable()
export class FinnhubService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(FinnhubService.name);
  private ws: WebSocket | null = null;
  private destroyed = false;
  private attemptCount = 0;
  private consecutiveAuthErrors = 0;
  private symbolToPair: Map<string, PairId>;

  constructor(
    private readonly config: ConfigService,
    private readonly events: EventEmitter2,
  ) {
    this.symbolToPair = new Map(
      Object.entries(PAIR_SYMBOLS).map(([pair, symbol]) => [symbol, pair as PairId]),
    );
  }

  onApplicationBootstrap() {
    this.connect();
  }

  onApplicationShutdown() {
    this.destroyed = true;
    this.ws?.close();
  }

  private buildUrl(): string {
    const key = this.config.getOrThrow<string>('FINNHUB_API_KEY');
    return `${FINNHUB_WS_URL}?token=${key}`;
  }

  private connect() {
    if (this.destroyed) return;

    this.logger.log(`Connecting to Finnhub (attempt ${this.attemptCount + 1})`);
    const ws = new WebSocket(this.buildUrl());
    this.ws = ws;

    ws.on('open', () => {
      this.logger.log('Finnhub connection established');
      this.attemptCount = 0;
      this.consecutiveAuthErrors = 0;
      this.subscribeAll(ws);
    });

    ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(data.toString());
    });

    ws.on('close', (code) => {
      this.logger.warn(`Finnhub connection closed (code ${code})`);
      this.scheduleReconnect();
    });

    ws.on('error', (err) => {
      this.logger.error(`Finnhub socket error: ${err.message}`);
    });
  }

  private subscribeAll(ws: WebSocket) {
    for (const symbol of Object.values(PAIR_SYMBOLS)) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      this.logger.log(`Subscribed to ${symbol}`);
    }
  }

  private handleMessage(raw: string) {
    let msg: FinnhubMessage;
    try {
      msg = JSON.parse(raw) as FinnhubMessage;
    } catch {
      this.logger.warn(`Failed to parse Finnhub message: ${raw.slice(0, 120)}`);
      return;
    }

    if (msg.type === 'error') {
      const text = JSON.stringify(msg);
      if (AUTH_ERROR_PATTERNS.some((p) => text.includes(p))) {
        this.consecutiveAuthErrors++;
        this.logger.error(
          `Finnhub auth error (${this.consecutiveAuthErrors}/${AUTH_ERROR_MAX_CONSECUTIVE}): ${text}`,
        );
      } else {
        this.logger.warn(`Finnhub error message: ${text}`);
      }
      return;
    }

    if (msg.type !== 'trade' || !msg.data) return;

    for (const trade of msg.data) {
      const pair = this.symbolToPair.get(trade.s);
      if (!pair) continue;

      const tick: RateTick = {
        pair,
        price: trade.p,
        volume: trade.v,
        timestamp: trade.t,
      };

      this.events.emit('rate.tick', tick);
    }
  }

  private scheduleReconnect() {
    if (this.destroyed) return;

    const isAuthError = this.consecutiveAuthErrors >= AUTH_ERROR_MAX_CONSECUTIVE;
    const baseDelay = isAuthError
      ? AUTH_ERROR_BACKOFF_MS
      : Math.min(
          RECONNECT_INITIAL_DELAY_MS * Math.pow(RECONNECT_MULTIPLIER, this.attemptCount),
          RECONNECT_MAX_DELAY_MS,
        );

    const jitter = baseDelay * RECONNECT_JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay = Math.round(baseDelay + jitter);

    this.attemptCount++;
    this.logger.log(`Reconnecting in ${delay}ms (attempt ${this.attemptCount})`);

    setTimeout(() => this.connect(), delay);
  }
}
