import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PriceChart } from './PriceChart';
import { PairData } from '@/hooks/useSocket';
import { PairId } from 'shared-types';

function formatPrice(price: number, pair: PairId) {
  if (pair === 'ETH/BTC') return price.toFixed(6);
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimestamp(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString();
}

export function PairCard({ data }: { data: PairData }) {
  const loading = data.price === null;

  return (
    <Card className="flex flex-col gap-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{data.pair}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-muted-foreground">Price</span>
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="font-mono font-semibold tabular-nums">
              {formatPrice(data.price!, data.pair)}
            </span>
          )}

          <span className="text-muted-foreground">Last updated</span>
          {loading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="text-xs">{formatTimestamp(data.lastUpdated)}</span>
          )}

          <span className="text-muted-foreground">1h average</span>
          {loading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {data.hourlyAvg != null ? formatPrice(data.hourlyAvg, data.pair) : '—'}
            </span>
          )}

          <span className="text-muted-foreground">Samples</span>
          <span className="text-xs">{data.sampleCount}</span>
        </div>

        <PriceChart pair={data.pair} points={data.chartPoints} />
      </CardContent>
    </Card>
  );
}
