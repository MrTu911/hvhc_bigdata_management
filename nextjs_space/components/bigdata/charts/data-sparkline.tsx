'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface DataSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

/** Minimal inline area chart (no axes/grid/tooltip) for KPI cards. */
export function DataSparkline({
  data,
  color = 'hsl(var(--chart-1))',
  height = 32,
}: DataSparklineProps) {
  const series = data.map((value, index) => ({ index, value }));
  const gradientId = `spark-${color.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
