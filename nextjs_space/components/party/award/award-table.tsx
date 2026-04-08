'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy, Calendar, FileText, Building2, Paperclip,
  ChevronDown, ChevronUp, Pencil, Trash2, ExternalLink,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AwardItem {
  id: string;
  partyMemberId: string;
  title: string;
  decisionNo?: string | null;
  decisionDate?: string | null;
  issuer?: string | null;
  note?: string | null;
  attachmentUrl?: string | null;
  createdAt?: string;
  partyMember?: {
    id: string;
    partyCardNumber?: string | null;
    partyCell?: string | null;
    currentPosition?: string | null;
    user?: {
      id: string;
      name: string;
      militaryId?: string | null;
      rank?: string | null;
      unitRelation?: { id: string; name: string; code: string } | null;
    };
  };
}

interface AwardTableProps {
  items: AwardItem[];
  loading?: boolean;
  onEdit?: (item: AwardItem) => void;
  onDelete?: (item: AwardItem) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initials(name?: string) {
  if (!name) return '?';
  return name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();
}

const POSITION_LABELS: Record<string, string> = {
  BI_THU: 'Bí thư',
  PHO_BI_THU: 'Phó bí thư',
  CAP_UY_VIEN: 'Cấp ủy viên',
  DANG_VIEN: 'Đảng viên',
  BI_THU_CHI_BO: 'Bí thư chi bộ',
  PHO_BI_THU_CHI_BO: 'Phó bí thư chi bộ',
  TO_TRUONG_TO_DANG: 'Tổ trưởng',
  TO_PHO_TO_DANG: 'Tổ phó',
};

// ─── Row ─────────────────────────────────────────────────────────────────────
function AwardRow({ item, onEdit, onDelete }: { item: AwardItem; onEdit?: (i: AwardItem) => void; onDelete?: (i: AwardItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const name = item.partyMember?.user?.name ?? '—';
  const milId = item.partyMember?.user?.militaryId;
  const rank = item.partyMember?.user?.rank;
  const unit = item.partyMember?.user?.unitRelation?.name;
  const pos = item.partyMember?.currentPosition;

  return (
    <div className="group border-b border-gray-100 dark:border-gray-800/60 last:border-0 hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Award icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Trophy className="h-5 w-5 text-white" />
        </div>

        {/* Award info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.title}</p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {item.decisionNo && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <FileText className="h-3 w-3" />
                {item.decisionNo}
              </span>
            )}
            {item.decisionDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                {fmtDate(item.decisionDate)}
              </span>
            )}
            {item.issuer && (
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                {item.issuer}
              </span>
            )}
          </div>
        </div>

        {/* Member */}
        <div className="hidden md:flex items-center gap-2.5 min-w-[180px] max-w-[220px]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">
              {rank ?? milId ?? '—'}
              {pos && ` · ${POSITION_LABELS[pos] ?? pos}`}
            </p>
          </div>
        </div>

        {/* Unit badge */}
        {unit && (
          <Badge className="hidden lg:inline-flex bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-[11px] font-medium max-w-[130px] truncate">
            {unit}
          </Badge>
        )}

        {/* Attachment */}
        {item.attachmentUrl && (
          <a
            href={item.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <Paperclip className="h-3.5 w-3.5" />
            <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.note && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400"
              title="Ghi chú"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onEdit(item)}
              title="Chỉnh sửa"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={() => onDelete(item)}
              title="Xóa"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded note */}
      {expanded && item.note && (
        <div className="px-5 pb-4">
          <div className="ml-14 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ghi chú</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.note}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function AwardRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800/60">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-36" />
      </div>
      <div className="hidden md:flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

// ─── AwardTable ───────────────────────────────────────────────────────────────
export function AwardTable({ items, loading, onEdit, onDelete }: AwardTableProps) {
  if (loading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {Array.from({ length: 6 }).map((_, i) => <AwardRowSkeleton key={i} />)}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="py-20 text-center">
        <Trophy className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Chưa có bản ghi khen thưởng</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc nhấn "Thêm khen thưởng"</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[1fr_200px_auto] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <span>Danh hiệu / Quyết định</span>
        <span>Đảng viên</span>
        <span>Đơn vị / File</span>
      </div>
      {items.map(item => (
        <AwardRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
