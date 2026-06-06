'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MetricHeatmapProps {
  /** [rows][cols] of normalized intensities (0..1). */
  data: number[][];
  rowLabels?: string[];
  colLabels?: string[];
  legend?: boolean;
  /** Tooltip value formatter for a cell. */
  formatCell?: (value: number, row: number, col: number) => string;
}

const DEFAULT_ROWS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// 6 intensity buckets — recharts has no native heatmap, so we render a CSS grid
// and tint each cell from muted → primary using opacity buckets.
function bucketOpacity(value: number): number {
  if (value <= 0) return 0;
  const level = Math.min(5, Math.max(1, Math.ceil(value * 5)));
  return 0.12 + (level - 1) * 0.18; // 0.12 .. 0.84
}

/** 7×24 (or arbitrary) intensity heatmap (template Heatmap equivalent). */
export function MetricHeatmap({
  data,
  rowLabels = DEFAULT_ROWS,
  colLabels,
  legend = true,
  formatCell,
}: MetricHeatmapProps) {
  const cols = data[0]?.length ?? 0;
  const resolvedColLabels =
    colLabels ?? Array.from({ length: cols }, (_, i) => String(i).padStart(2, '0'));

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Row labels */}
          <div className="flex shrink-0 flex-col justify-between py-0.5 text-[10px] text-muted-foreground">
            {rowLabels.map((label) => (
              <span key={label} className="leading-none">
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1">
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {data.map((rowValues, row) =>
                rowValues.map((value, col) => (
                  <Tooltip key={`${row}-${col}`}>
                    <TooltipTrigger asChild>
                      <div
                        className="aspect-square rounded-[2px] bg-primary transition-colors"
                        style={{ opacity: bucketOpacity(value) || undefined, backgroundColor: value <= 0 ? 'hsl(var(--muted))' : undefined }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {formatCell
                        ? formatCell(value, row, col)
                        : `${rowLabels[row] ?? row} · ${resolvedColLabels[col] ?? col}h`}
                    </TooltipContent>
                  </Tooltip>
                )),
              )}
            </div>

            {/* Column ticks (sparse to avoid clutter) */}
            <div
              className="mt-1 grid text-[10px] text-muted-foreground"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {resolvedColLabels.map((label, i) => (
                <span key={i} className="text-center leading-none">
                  {i % 4 === 0 ? label : ''}
                </span>
              ))}
            </div>
          </div>
        </div>

        {legend && (
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
            <span>Thấp</span>
            {[0.12, 0.3, 0.48, 0.66, 0.84].map((opacity) => (
              <span
                key={opacity}
                className="h-2.5 w-2.5 rounded-[2px] bg-primary"
                style={{ opacity }}
              />
            ))}
            <span>Cao</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
