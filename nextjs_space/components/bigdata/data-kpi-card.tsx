'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataSparkline } from './charts/data-sparkline';

export type KpiAccent = 'primary' | 'gold' | 'info' | 'success';

interface DataKpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaDir?: 'up' | 'down';
  sub?: string;
  spark?: number[];
  accent?: KpiAccent;
  className?: string;
}

const ACCENT: Record<KpiAccent, { bar: string; spark: string }> = {
  primary: { bar: 'bg-primary', spark: 'hsl(var(--chart-1))' },
  gold: { bar: 'bg-accent', spark: 'hsl(var(--chart-2))' },
  info: { bar: 'bg-info', spark: 'hsl(var(--chart-3))' },
  success: { bar: 'bg-success', spark: 'hsl(var(--chart-4))' },
};

/** KPI tile with value/unit, delta direction and a sparkline (template KPI equivalent). */
export function DataKpiCard({
  label,
  value,
  unit,
  delta,
  deltaDir = 'up',
  sub,
  spark,
  accent = 'primary',
  className,
}: DataKpiCardProps) {
  const accentStyle = ACCENT[accent];
  const DeltaIcon = deltaDir === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm',
        className,
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', accentStyle.bar)} />

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold leading-none text-foreground">{value}</span>
        {unit && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          {delta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                deltaDir === 'up' ? 'text-success' : 'text-destructive',
              )}
            >
              <DeltaIcon className="h-3.5 w-3.5" />
              {delta}
            </span>
          )}
          {sub && <span className="text-muted-foreground">{sub}</span>}
        </div>
      </div>

      {spark && spark.length > 1 && (
        <div className="mt-3 -mx-1">
          <DataSparkline data={spark} color={accentStyle.spark} height={32} />
        </div>
      )}
    </div>
  );
}
