# Backend — Crypto Dashboard

NestJS service that connects to the Finnhub WebSocket, aggregates hourly averages, and streams every tick to the frontend via Socket.IO.

## Stack

- **NestJS 11** + **TypeScript**
- **ws** for the Finnhub WebSocket connection
- **Socket.IO** for real-time streaming to the frontend
- **TypeORM** + **better-sqlite3** for hourly average persistence
- **@nestjs/schedule** for the top-of-hour cron job
- **Jest** for testing

## Modules

| Module | Responsibility |
|---|---|
| `finnhub` | Connects to the Finnhub WS and emits ticks internally |
| `rates` | Aggregates a rolling 1-hour average per pair in memory |
| `gateway` | Socket.IO — broadcasts ticks to connected clients |
| `persistence` | Writes each completed hour's average to SQLite via TypeORM |
| `health` | `GET /health` endpoint |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `FINNHUB_API_KEY` | — | **Required.** Finnhub API key |
| `PORT` | `3000` | NestJS server port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed origin for CORS / Socket.IO |
| `DB_PATH` | `data/crypto.db` | SQLite database file path |

Copy the example and fill in your key:

```bash
cp .env.example .env
# Edit .env and set FINNHUB_API_KEY
```

> Get a free key at <https://finnhub.io/dashboard>.

## Running

From the monorepo root:

```bash
# Together with the frontend
yarn dev

# Backend only
yarn workspace backend start:dev
```

Server available at <http://localhost:3000>. Health check: <http://localhost:3000/health>.

## Tests

```bash
# From the monorepo root
yarn workspace backend test

# With coverage
yarn workspace backend test:cov

# E2E
yarn workspace backend test:e2e
```

## Production build

```bash
yarn workspace backend build
yarn workspace backend start:prod
```
