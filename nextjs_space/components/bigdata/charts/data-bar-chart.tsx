'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK_STYLE, GRID_STROKE, TOOLTIP_STYLE } from './chart-theme';

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

interface DataBarChartProps {
  data: BarDatum[];
  /** 'vertical' = horizontal bars (category on Y); 'horizontal' = vertical bars. */
  layout?: 'horizontal' | 'vertical';
  color?: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}

/** Single-series bar chart supporting both orientations (template BarChart equivalent). */
export function DataBarChart({
  data,
  layout = 'horizontal',
  color = 'hsl(var(--chart-1))',
  height = 280,
  valueFormatter,
}: DataBarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 16, bottom: 0, left: isVertical ? 8 : 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={!isVertical} vertical={isVertical} />
        {isVertical ? (
          <>
            <XAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
            <YAxis type="category" dataKey="label" tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} width={120} />
          </>
        ) : (
          <>
            <XAxis type="category" dataKey="label" tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} />
            <YAxis type="number" tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} width={48} tickFormatter={valueFormatter} />
          </>
        )}
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'hsl(var(--muted))', fillOpacity: 0.4 }} />
        <Bar dataKey="value" radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]} fill={color}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color ?? color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
