'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, FileText, Calendar, ChevronRight, Star,
  CheckCircle2, Clock, AlertCircle, ArrowRight,
} from 'lucide-react';

// ── Step metadata ─────────────────────────────────────────────────────────────
export const STEPS = [
  'THEO_DOI',
  'HOC_CAM_TINH',
  'DOI_TUONG',
  'CHI_BO_XET',
  'CAP_TREN_DUYET',
  'DA_KET_NAP',
] as const;

export type RecruitmentStep = typeof STEPS[number];

export const STEP_META: Record<RecruitmentStep, {
  label: string;
  labelShort: string;
  color: string;
  bg: string;
  border: string;
  headerBg: string;
  badgeCls: string;
  icon: React.ElementType;
  step: number;
}> = {
  THEO_DOI: {
    label: 'Theo dõi', labelShort: 'Theo dõi',
    color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200',
    headerBg: 'bg-slate-100', badgeCls: 'bg-slate-200 text-slate-700',
    icon: Users, step: 1,
  },
  HOC_CAM_TINH: {
    label: 'Học cảm tình', labelShort: 'Cảm tình',
    color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200',
    headerBg: 'bg-blue-100', badgeCls: 'bg-blue-200 text-blue-700',
    icon: Star, step: 2,
  },
  DOI_TUONG: {
    label: 'Đối tượng Đảng', labelShort: 'Đối tượng',
    color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
    headerBg: 'bg-violet-100', badgeCls: 'bg-violet-200 text-violet-700',
    icon: FileText, step: 3,
  },
  CHI_BO_XET: {
    label: 'Chi bộ xét duyệt', labelShort: 'Chi bộ xét',
    color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200',
    headerBg: 'bg-amber-100', badgeCls: 'bg-amber-200 text-amber-700',
    icon: AlertCircle, step: 4,
  },
  CAP_TREN_DUYET: {
    label: 'Cấp trên phê duyệt', labelShort: 'Cấp trên duyệt',
    color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200',
    headerBg: 'bg-orange-100', badgeCls: 'bg-orange-200 text-orange-700',
    icon: Clock, step: 5,
  },
  DA_KET_NAP: {
    label: 'Đã kết nạp', labelShort: 'Kết nạp',
    color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',
    headerBg: 'bg-emerald-100', badgeCls: 'bg-emerald-200 text-emerald-700',
    icon: CheckCircle2, step: 6,
  },
};

const DOSSIER_STATUS_CLS: Record<string, string> = {
  COMPLETE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  PENDING_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
};
const DOSSIER_STATUS_LABEL: Record<string, string> = {
  COMPLETE: 'Đủ hồ sơ',
  IN_PROGRESS: 'Đang bổ sung',
  PENDING_REVIEW: 'Chờ duyệt',
};

function initials(name?: string | null) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtDate(d?: Date | string | null) {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Avatar background colors (deterministic by name)
const AVATAR_COLORS = [
  'bg-red-500', 'bg-violet-500', 'bg-blue-500', 'bg-teal-500',
  'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
];
function avatarColor(name?: string | null) {
  if (!name) return AVATAR_COLORS[0];
  const code = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Candidate card ────────────────────────────────────────────────────────────
function CandidateCard({
  item,
  stepMeta,
  onAdvance,
  advancing,
}: {
  item: any;
  stepMeta: typeof STEP_META[RecruitmentStep];
  onAdvance?: (id: string, userId: string, targetOrgId: string, nextStep: RecruitmentStep) => void;
  advancing?: boolean;
}) {
  const currentIdx = STEPS.indexOf(item.currentStep as RecruitmentStep);
  const nextStep = STEPS[currentIdx + 1] as RecruitmentStep | undefined;
  const isLast = !nextStep;

  const dossierCls = DOSSIER_STATUS_CLS[item.dossierStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const dossierLabel = DOSSIER_STATUS_LABEL[item.dossierStatus] ?? item.dossierStatus ?? '—';

  // Date label for current step
  const stepDate = item.currentStep === 'HOC_CAM_TINH' ? item.camTinhDate
    : item.currentStep === 'DOI_TUONG' ? item.doiTuongDate
    : item.currentStep === 'CHI_BO_XET' ? item.chiBoProposalDate
    : item.currentStep === 'CAP_TREN_DUYET' ? item.capTrenApprovalDate
    : item.currentStep === 'DA_KET_NAP' ? item.joinedDate
    : null;

  return (
    <div className={`rounded-xl border ${stepMeta.border} bg-white hover:shadow-md transition-shadow group`}>
      <div className="p-3 space-y-2.5">
        {/* Header row: avatar + name + dossier badge */}
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${avatarColor(item.user?.name)}`}>
            {initials(item.user?.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {item.user?.name ?? 'Ứng viên'}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.user?.militaryId ?? item.user?.email ?? '—'}
            </p>
          </div>
          {item.dossierStatus && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${dossierCls}`}>
              {dossierLabel}
            </span>
          )}
        </div>

        {/* Target org */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{item.targetPartyOrg?.name ?? '—'}</span>
        </div>

        {/* Step date */}
        {stepDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{fmtDate(stepDate)}</span>
          </div>
        )}

        {/* Assistant members */}
        {(item.assistantMember1 || item.assistantMember2) && (
          <div className="text-[10px] text-muted-foreground bg-slate-50 rounded-lg px-2 py-1 border border-slate-100">
            {item.assistantMember1 && <div>{item.assistantMember1}</div>}
            {item.assistantMember2 && <div>{item.assistantMember2}</div>}
          </div>
        )}

        {/* Advance button */}
        {!isLast && onAdvance && (
          <button
            type="button"
            disabled={advancing}
            onClick={() => onAdvance(item.id, item.userId, item.targetPartyOrgId, nextStep!)}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-2 rounded-lg border transition-colors opacity-0 group-hover:opacity-100 ${stepMeta.border} ${stepMeta.color} ${stepMeta.bg} hover:opacity-100`}
          >
            <ArrowRight className="h-3 w-3" />
            Chuyển: {STEP_META[nextStep!].labelShort}
          </button>
        )}
        {isLast && (
          <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 py-1">
            <CheckCircle2 className="h-3 w-3" />
            Đã hoàn thành pipeline
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────
function KanbanColumn({
  step,
  items,
  onAdvance,
  advancing,
}: {
  step: RecruitmentStep;
  items: any[];
  onAdvance?: (id: string, userId: string, targetOrgId: string, nextStep: RecruitmentStep) => void;
  advancing?: boolean;
}) {
  const meta = STEP_META[step];
  const Icon = meta.icon;

  return (
    <div className={`flex flex-col rounded-xl border ${meta.border} min-h-[420px]`}>
      {/* Column header */}
      <div className={`${meta.headerBg} rounded-t-xl px-3 py-2.5 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 bg-white/70`}>
            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
          </div>
          <div>
            <p className={`text-xs font-bold ${meta.color}`}>{meta.label}</p>
            <p className="text-[10px] text-muted-foreground">Bước {meta.step}/6</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.badgeCls}`}>
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className={`flex-1 p-2 space-y-2 ${meta.bg} rounded-b-xl`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Icon className={`h-8 w-8 ${meta.color} opacity-20 mb-2`} />
            <p className="text-xs text-muted-foreground">Chưa có ứng viên</p>
          </div>
        ) : (
          items.map((item) => (
            <CandidateCard
              key={item.id}
              item={item}
              stepMeta={meta}
              onAdvance={onAdvance}
              advancing={advancing}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Progress funnel strip ─────────────────────────────────────────────────────
export function RecruitmentFunnel({ items }: { items: any[] }) {
  const total = items.length;
  return (
    <div className="grid grid-cols-6 gap-1">
      {STEPS.map((step) => {
        const meta = STEP_META[step];
        const count = items.filter(i => i.currentStep === step).length;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const Icon = meta.icon;
        return (
          <div key={step} className={`rounded-xl border ${meta.border} ${meta.bg} px-3 py-3 text-center`}>
            <Icon className={`h-4 w-4 ${meta.color} mx-auto mb-1`} />
            <p className={`text-xl font-bold ${meta.color}`}>{count}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{meta.labelShort}</p>
            <p className={`text-[10px] font-medium mt-0.5 ${meta.color}`}>{pct}%</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Board ────────────────────────────────────────────────────────────────
interface Props {
  items?: any[];
  onAdvance?: (id: string, userId: string, targetOrgId: string, nextStep: RecruitmentStep) => void;
  advancing?: boolean;
  filterStep?: string;
}

export function RecruitmentPipelineBoard({ items = [], onAdvance, advancing, filterStep }: Props) {
  const visibleSteps = filterStep && filterStep !== 'ALL'
    ? STEPS.filter(s => s === filterStep)
    : STEPS;

  const grouped: Record<string, any[]> = {};
  for (const step of STEPS) {
    grouped[step] = items.filter(i => i.currentStep === step);
  }

  return (
    <div
      className={`grid gap-3 ${
        visibleSteps.length === 1
          ? 'grid-cols-1 max-w-md'
          : visibleSteps.length <= 3
          ? 'grid-cols-1 md:grid-cols-3'
          : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
      }`}
    >
      {visibleSteps.map(step => (
        <KanbanColumn
          key={step}
          step={step}
          items={grouped[step] ?? []}
          onAdvance={onAdvance}
          advancing={advancing}
        />
      ))}
    </div>
  );
}
