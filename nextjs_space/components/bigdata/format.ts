// Number formatting helpers for the BigData section (display-only).

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Abbreviate large counts: 1_200_000_000 → "1.2B", 58_200 → "58.2K". */
export function formatShort(value: number): string {
  return compactFormatter.format(value);
}

const decimalFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}
