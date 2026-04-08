'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronDown, ChevronRight, Users, Star,
  Building2, Layers, GitBranch, CalendarDays,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
export type PartyOrgNode = {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  parentId?: string | null;
  orgLevel?: string | null;
  level?: number | null;
  isActive?: boolean;
  description?: string | null;
  unit?: { name: string; code: string; type?: string } | null;
  _count?: { members?: number; children?: number; meetings?: number };
};

// ── Level metadata ────────────────────────────────────────────────────────────
type LevelMeta = {
  label: string;
  color: string;
  bg: string;
  border: string;
  badgeCls: string;
  icon: React.ElementType;
};

const LEVEL_META: Record<string, LevelMeta> = {
  DANG_UY_HOC_VIEN: {
    label: 'Đảng ủy Học viện',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-300',
    badgeCls: 'bg-red-100 text-red-700 border-red-200',
    icon: Star,
  },
  DANG_BO: {
    label: 'Đảng bộ bộ phận',
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    badgeCls: 'bg-violet-100 text-violet-700 border-violet-200',
    icon: Building2,
  },
  CHI_BO_CO_SO: {
    label: 'Chi bộ cơ sở',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badgeCls: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Layers,
  },
  CHI_BO_GHEP: {
    label: 'Chi bộ ghép',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    badgeCls: 'bg-teal-100 text-teal-700 border-teal-200',
    icon: GitBranch,
  },
};

const FALLBACK_META: LevelMeta = {
  label: '-',
  color: 'text-gray-600',
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  badgeCls: 'bg-gray-100 text-gray-600 border-gray-200',
  icon: Building2,
};

function getMeta(level?: string | null): LevelMeta {
  return LEVEL_META[level ?? ''] ?? FALLBACK_META;
}

// ── OrgNode ───────────────────────────────────────────────────────────────────
function OrgNode({
  node,
  childNodes,
  renderChild,
  isRoot,
  forceOpen,
}: {
  node: PartyOrgNode;
  childNodes: PartyOrgNode[];
  renderChild: (n: PartyOrgNode) => React.ReactElement;
  isRoot: boolean;
  forceOpen: boolean | null;
}) {
  const [open, setOpen] = useState(isRoot || (node.level != null && node.level <= 2));
  const isOpen = forceOpen !== null ? forceOpen : open;

  const meta = getMeta(node.orgLevel);
  const Icon = meta.icon;
  const memberCount = node._count?.members ?? 0;
  const meetingCount = node._count?.meetings ?? 0;
  const hasChildren = childNodes.length > 0;

  return (
    <div className="mb-1">
      {/* ── Card row ─────────────────────────────────────────────────── */}
      <div className={`rounded-xl border ${meta.border} ${meta.bg} px-4 py-3 hover:shadow-sm transition-shadow`}>
        <div className="flex items-center gap-3">

          {/* Expand/collapse toggle */}
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            disabled={!hasChildren}
            className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
              hasChildren
                ? `${meta.color} hover:bg-white/70 cursor-pointer`
                : 'pointer-events-none opacity-0'
            }`}
          >
            {isOpen
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Org type icon */}
          <div className={`flex-shrink-0 rounded-lg p-1.5 bg-white/80 border ${meta.border}`}>
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>

          {/* Name + unit */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`font-semibold text-slate-900 ${isRoot ? 'text-base' : 'text-sm'} truncate`}>
                {node.name}
              </span>
              <code className="text-[10px] text-slate-500 bg-white/70 rounded px-1.5 py-0.5 border border-slate-200 font-mono">
                {node.code}
              </code>
            </div>
            {node.unit && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                Đơn vị: {node.unit.name}
                {node.unit.code && node.unit.code !== node.unit.name && (
                  <span className="ml-1 text-slate-400">({node.unit.code})</span>
                )}
              </p>
            )}
          </div>

          {/* Stats + level badge */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {memberCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-700 bg-white/80 border border-slate-200 rounded-lg px-2 py-1">
                <Users className="h-3 w-3 text-blue-500" />
                <span className="font-semibold">{memberCount}</span>
                <span className="text-muted-foreground">ĐV</span>
              </span>
            )}
            {meetingCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white/80 border border-slate-200 rounded-lg px-2 py-1">
                <CalendarDays className="h-3 w-3 text-amber-500" />
                <span>{meetingCount}</span>
              </span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.badgeCls}`}>
              {meta.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Children: indented with left border connector ──────────── */}
      {hasChildren && isOpen && (
        <div className="ml-6 mt-1 border-l-2 border-slate-200 pl-4 space-y-1">
          {childNodes.map(child => renderChild(child))}
        </div>
      )}
    </div>
  );
}

// ── Main Tree ─────────────────────────────────────────────────────────────────
export function PartyOrgTree({ items }: { items: PartyOrgNode[] }) {
  const [forceOpen, setForceOpen] = useState<boolean | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Building2 className="h-12 w-12 text-slate-300 mb-3" />
        <p>Chưa có dữ liệu tổ chức Đảng</p>
        <p className="text-xs mt-1">Tạo tổ chức đầu tiên để bắt đầu</p>
      </div>
    );
  }

  // Build children map
  const childrenMap = new Map<string | null, PartyOrgNode[]>();
  for (const org of items) {
    const key = org.parentId ?? null;
    const list = childrenMap.get(key) ?? [];
    list.push(org);
    childrenMap.set(key, list);
  }

  const roots = childrenMap.get(null) ?? [];

  const renderNode = (node: PartyOrgNode): React.ReactElement => {
    const childNodes = childrenMap.get(node.id) ?? [];
    return (
      <OrgNode
        key={node.id}
        node={node}
        childNodes={childNodes}
        renderChild={renderNode}
        isRoot={!node.parentId}
        forceOpen={forceOpen}
      />
    );
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <p className="text-sm text-muted-foreground">
          {items.length} tổ chức · 3 cấp
        </p>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => setForceOpen(true)}>
            <ChevronDown className="h-3 w-3" /> Mở rộng tất cả
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1"
            onClick={() => setForceOpen(false)}>
            <ChevronRight className="h-3 w-3" /> Thu gọn
          </Button>
          {forceOpen !== null && (
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => setForceOpen(null)}>
              Mặc định
            </Button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="space-y-1">
        {roots.map(root => renderNode(root))}
      </div>
    </div>
  );
}
