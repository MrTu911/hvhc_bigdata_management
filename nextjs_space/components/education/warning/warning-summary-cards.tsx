'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, TrendingUp, AlertCircle, Info, ShieldAlert } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WarningSummary = {
  CRITICAL: number;
  HIGH:     number;
  MEDIUM:   number;
  LOW:      number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const LEVEL_CONFIG = [
  {
    key: 'CRITICAL' as const,
    label: 'Mức Nghiêm trọng',
    sublabel: 'GPA < 1.0 hoặc ≥ 20 TC trượt',
    icon: ShieldAlert,
    cardClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
    countClass: 'text-red-700',
  },
  {
    key: 'HIGH' as const,
    label: 'Mức Cao',
    sublabel: 'GPA < 1.5 hoặc ≥ 12 TC trượt',
    icon: AlertTriangle,
    cardClass: 'border-orange-200 bg-orange-50',
    iconClass: 'text-orange-600',
    countClass: 'text-orange-700',
  },
  {
    key: 'MEDIUM' as const,
    label: 'Mức Trung bình',
    sublabel: 'GPA < 2.0 hoặc ≥ 6 TC trượt',
    icon: AlertCircle,
    cardClass: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
    countClass: 'text-amber-700',
  },
  {
    key: 'LOW' as const,
    label: 'Mức Nhẹ',
    sublabel: 'GPA < 2.5 hoặc ≥ 3 TC trượt',
    icon: Info,
    cardClass: 'border-blue-200 bg-blue-50',
    iconClass: 'text-blue-600',
    countClass: 'text-blue-700',
  },
] as const;

// ─── WarningSummaryCards ──────────────────────────────────────────────────────

export function WarningSummaryCards({
  counts,
  loading,
}: {
  counts: WarningSummary;
  loading: boolean;
}) {
  const total = counts.CRITICAL + counts.HIGH + counts.MEDIUM + counts.LOW;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {LEVEL_CONFIG.map(cfg => {
        const Icon = cfg.icon;
        const count = counts[cfg.key];
        return (
          <Card key={cfg.key} className={`border ${cfg.cardClass}`}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{cfg.label}</p>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mt-1 text-muted-foreground" />
                  ) : (
                    <p className={`text-3xl font-bold mt-1 ${cfg.countClass}`}>{count}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{cfg.sublabel}</p>
                </div>
                <Icon className={`h-8 w-8 shrink-0 opacity-70 ${cfg.iconClass}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
