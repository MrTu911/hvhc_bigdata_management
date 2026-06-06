'use client';

import { cn } from '@/lib/utils';

export type StatusTagKind = 'ok' | 'warn' | 'err' | 'info' | 'mute';

interface StatusTagProps {
  status: StatusTagKind;
  label: string;
  dot?: boolean;
  className?: string;
}

// Maps the template's tag semantics onto app theme tokens.
const STATUS_STYLES: Record<StatusTagKind, { wrap: string; dot: string }> = {
  ok: { wrap: 'bg-success/10 text-success border-success/20', dot: 'bg-success' },
  warn: { wrap: 'bg-warning/10 text-warning border-warning/20', dot: 'bg-warning' },
  err: { wrap: 'bg-destructive/10 text-destructive border-destructive/20', dot: 'bg-destructive' },
  info: { wrap: 'bg-info/10 text-info border-info/20', dot: 'bg-info' },
  mute: { wrap: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
};

/** Status pill with optional leading dot — template `.tag` equivalent. */
export function StatusTag({ status, label, dot = true, className }: StatusTagProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles.wrap,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />}
      {label}
    </span>
  );
}
