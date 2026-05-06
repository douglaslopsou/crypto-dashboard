import { ConnectionState } from 'shared-types';
import { Badge } from '@/components/ui/badge';

const config: Record<ConnectionState, { label: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }> = {
  connected: { label: 'Connected', variant: 'success' },
  connecting: { label: 'Connecting…', variant: 'warning' },
  reconnecting: { label: 'Reconnecting…', variant: 'warning' },
  disconnected: { label: 'Disconnected', variant: 'destructive' },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const { label, variant } = config[state];
  return <Badge variant={variant}>{label}</Badge>;
}
