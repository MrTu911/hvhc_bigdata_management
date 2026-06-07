'use client';

/**
 * M13 – Workflow shared UI kit
 * Các primitive hiển thị dùng chung cho phân hệ Quy trình (overview / instances /
 * history / my-work) để giữ giao diện nhất quán.
 *
 * Chỉ chứa UI thuần — không business logic, không fetch data.
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/** Bảng màu chuẩn của phân hệ workflow (nền amber/orange) */
export const WF_PALETTE = {
  amber: '#d97706',
  orange: '#ea580c',
  blue: '#2563eb',
  indigo: '#4f46e5',
  violet: '#7c3aed',
  green: '#16a34a',
  emerald: '#059669',
  red: '#dc2626',
  cyan: '#0891b2',
  teal: '#0d9488',
  pink: '#db2777',
  yellow: '#ca8a04',
  slate: '#475569',
};

interface WorkflowStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  /** Mã màu hex (dùng WF_PALETTE) */
  color: string;
  /** Tô đậm giá trị + viền nhấn khi có số liệu cần chú ý */
  emphasize?: boolean;
  onClick?: () => void;
}

export function WorkflowStatCard({
  icon: Icon, label, value, sub, color, emphasize, onClick,
}: WorkflowStatCardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-200',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
      )}
      style={emphasize ? { boxShadow: `0 0 0 1px ${color}33` } : undefined}
      onClick={onClick}
    >
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p
              className="text-3xl font-bold leading-none"
              style={{ color: emphasize ? color : '#1e293b' }}
            >
              {value}
            </p>
            {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: `${color}18` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: color }} />
      </CardContent>
    </Card>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-amber-500 inline-block" />
        {children}
      </h2>
      {action}
    </div>
  );
}
