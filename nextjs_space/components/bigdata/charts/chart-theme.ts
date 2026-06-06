// Shared recharts theming tokens. Colors read the CSS variables defined in
// app/globals.css (--chart-1..5) so charts automatically recolor in dark mode.

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

export const AXIS_TICK_STYLE = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 11,
} as const;

export const GRID_STROKE = 'hsl(var(--border))';

// Recharts <Tooltip> content background — uses popover tokens for theme parity.
export const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--popover-foreground))',
  fontSize: '12px',
} as const;
