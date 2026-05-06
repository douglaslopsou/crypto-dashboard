import { useSocket } from '@/hooks/useSocket';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { PairCard } from '@/components/PairCard';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PairId } from 'shared-types';

const PAIRS: PairId[] = ['ETH/USDC', 'ETH/USDT', 'ETH/BTC'];

export default function App() {
  const { connection, pairs, retry } = useSocket();
  const isDown = connection === 'disconnected';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Crypto Dashboard</h1>
        <div className="flex items-center gap-3">
          <ConnectionBadge state={connection} />
          {isDown && (
            <Button size="sm" variant="outline" onClick={retry}>
              Retry
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">
        {isDown && (
          <Alert variant="destructive">
            <AlertTitle>Backend unavailable</AlertTitle>
            <AlertDescription>
              Could not connect to the data server. Attempting to reconnect automatically.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {PAIRS.map((pair) => (
            <PairCard key={pair} data={pairs[pair]} />
          ))}
        </div>
      </main>
    </div>
  );
}
