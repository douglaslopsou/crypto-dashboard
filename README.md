# Crypto Dashboard

Real-time dashboard for ETH/USDC, ETH/USDT, and ETH/BTC exchange rates powered by Finnhub's WebSocket API.

## Architecture

```
Finnhub WS → NestJS backend → Socket.IO → React frontend
                   ↓
               SQLite (hourly averages)
```

- **Backend** (NestJS): connects to Finnhub, aggregates a rolling 1-hour average per pair in memory, persists each completed clock-hour average to SQLite, and streams every tick to connected browser clients via Socket.IO.
- **Frontend** (Vite + React + shadcn/ui): shows a card per pair with live price, last-updated timestamp, 1-hour average, and a real-time line chart. Tracks connection state (`connecting → connected / reconnecting / disconnected`).

## Prerequisites

- Node.js ≥ 18
- Yarn 1.x (Classic)

## Obtain a Finnhub API key

1. Sign up at <https://finnhub.io>
2. Go to your [dashboard](https://finnhub.io/dashboard)
3. Copy the **API Key** shown on the home page

> The free tier supports the WebSocket connection needed for this project. REST endpoints (not used at runtime) are rate-limited to 60 calls/minute.

## Setup

```bash
git clone git@github.com:douglaslopsou/crypto-dashboard.git crypto-dashboard
cd crypto-dashboard
yarn install
```

### Configure environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and set FINNHUB_API_KEY

# Frontend (optional — defaults to http://localhost:3000)
cp apps/frontend/.env.example apps/frontend/.env
```

## Running locally

### Both services at once

```bash
yarn dev
```

### Or in separate terminals

```bash
# Terminal 1
yarn workspace backend start:dev

# Terminal 2
yarn workspace frontend dev
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000>
- Health check: <http://localhost:3000/health>

## Tests

```bash
# All workspaces
yarn test

# Backend only
yarn workspace backend test

# Frontend only
yarn workspace frontend test
```

## Reconnection policy

### Backend → Finnhub

| Parameter | Value |
|-----------|-------|
| Initial delay | 1 s |
| Multiplier | ×2 per attempt |
| Maximum delay | 60 s |
| Jitter | ±20% of computed delay |
| Retry attempts | Infinite (until process exits) |
| Re-subscribe on reconnect | Yes — all 3 symbols re-sent on every `open` event |

#### Troubleshooting: auth errors

If Finnhub returns an "invalid token" message 3 times in a row, the client backs off to **300 s** between retries to avoid spamming the API. Check that `FINNHUB_API_KEY` is set correctly in `apps/backend/.env`.

### Frontend → Backend (Socket.IO)

| Parameter | Value |
|-----------|-------|
| Initial delay | 1 s |
| Maximum delay | 60 s |
| Retry attempts | Infinite |
| Health poll when disconnected | Every 30 s (`GET /health`) |

## Hourly average definition

The displayed "1h average" is a **rolling window**: the mean of all ticks received in the past 60 minutes. This updates continuously as new ticks arrive.

At each clock-hour boundary (`@nestjs/schedule` cron), the current window's average and sample count are written to SQLite (`hourly_averages` table), keyed by `pair + hour_start (UTC)`.

## Pair symbols

Prices are sourced from Binance via Finnhub:

| Pair | Finnhub symbol |
|------|---------------|
| ETH/USDC | `BINANCE:ETHUSDC` |
| ETH/USDT | `BINANCE:ETHUSDT` |
| ETH/BTC | `BINANCE:ETHBTC` |

> If a symbol is unavailable on your Finnhub plan, update `PAIR_SYMBOLS` in `apps/backend/src/finnhub/finnhub.constants.ts`.

## Finnhub free-tier notes

- WebSocket connections use the token as a query parameter.
- The REST API (not used at runtime) is limited to 60 requests/minute.
- Finnhub may throttle or close WS connections if subscription volume is very high — the backend will reconnect automatically.
