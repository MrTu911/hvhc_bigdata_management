'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK_STYLE, GRID_STROKE, TOOLTIP_STYLE } from './chart-theme';

export interface LineSeries {
  key: string;
  name: string;
  color: string;
}

interface DataLineChartProps {
  data: Array<Record<string, number | string>>;
  xKey: string;
  series: LineSeries[];
  height?: number;
  /** Format Y-axis ticks (e.g. abbreviate large numbers). */
  yTickFormatter?: (value: number) => string;
}

/** Multi-series filled line chart (template LineChart equivalent). */
export function DataLineChart({
  data,
  xKey,
  series,
  height = 280,
  yTickFormatter,
}: DataLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey={xKey} tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_TICK_STYLE}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={yTickFormatter}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: GRID_STROKE }} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2}
            fill={`url(#fill-${s.key})`}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
