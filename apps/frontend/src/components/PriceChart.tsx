import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { PairChartPoint } from '@/hooks/useSocket';
import { PairId } from 'shared-types';

interface Props {
  pair: PairId;
  points: PairChartPoint[];
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatPrice(value: number, pair: PairId) {
  if (pair === 'ETH/BTC') return value.toFixed(6);
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function PriceChart({ pair, points }: Props) {
  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Waiting for data…
      </div>
    );
  }

  const domain = (() => {
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.05 || min * 0.001;
    return [min - pad, max + pad] as [number, number];
  })();

  return (
    <ResponsiveContainer width="100%" height={128}>
      <LineChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatTime}
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={domain}
          tickFormatter={(v) => formatPrice(v, pair)}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={70}
        />
        <Tooltip
          labelFormatter={(l) => formatTime(l as number)}
          formatter={(v) => [formatPrice(v as number, pair), 'Price']}
          contentStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          dot={false}
          strokeWidth={2}
          stroke="hsl(var(--primary))"
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
