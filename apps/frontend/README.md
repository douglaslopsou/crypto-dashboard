# Frontend — Crypto Dashboard

React interface that displays real-time ETH/USDC, ETH/USDT, and ETH/BTC prices received via Socket.IO from the backend.

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for real-time line charts
- **socket.io-client** for the backend connection
- **Vitest** + **Testing Library** for testing

## What is displayed

One card per pair with:

- Current price (updated on every tick)
- Rolling 1-hour average
- Last updated timestamp
- Real-time line chart
- Connection state (`connecting → connected / reconnecting / disconnected`)

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend base URL |

Copy the example and adjust if needed:

```bash
cp .env.example .env
```

## Running

From the monorepo root:

```bash
# Together with the backend
yarn dev

# Frontend only
yarn workspace frontend dev
```

Available at <http://localhost:5173>.

## Tests

```bash
# From the monorepo root
yarn workspace frontend test

# Watch mode
yarn workspace frontend test:watch
```

## Production build

```bash
yarn workspace frontend build
```

The output is generated in `apps/frontend/dist/`.
