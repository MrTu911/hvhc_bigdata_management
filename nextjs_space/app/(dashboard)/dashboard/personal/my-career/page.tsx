'use client';

/**
 * /dashboard/personal/my-career
 * Xem quá trình công tác của bản thân — Tầng 0, mọi người dùng (SELF scope).
 *
 * Bố cục:
 *  - ModuleHero (M02 · Hồ sơ cá nhân)
 *  - 4 thẻ tóm tắt: chức vụ hiện tại, đơn vị hiện tại, tổng sự kiện, thâm niên
 *  - Các chức vụ đã/đang đảm nhiệm (lưới thẻ)
 *  - Dòng thời gian sự kiện công tác (lọc theo loại sự kiện)
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase, MapPin, Calendar, CalendarClock, UserPlus, ChevronsUp, ChevronsDown,
  BadgeCheck, ArrowRightLeft, GraduationCap, Trophy, AlertTriangle, Home, LogOut,
  Send, BookOpen, RotateCcw, Hourglass, Building2, CircleDot, RefreshCw, Star,
  History, Paperclip, FileText, Layers, ShieldCheck, type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleHero, EmptyState } from '@/components/ui/enhanced-data-card';
import { DocumentExportMenu } from '@/components/templates/export/document-export-menu';
import { RequestCorrectionDialog, type CorrectableField } from '@/components/personal/request-correction-dialog';
import { CareerEventCorrectionDialog } from '@/components/personal/career-event-correction-dialog';
import { TEMPLATES } from '@/lib/rbac/function-codes';
import { cn } from '@/lib/utils';

const CAREER_TEMPLATE_CODE = 'TPL_M02_QTCT_CANHAN';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CareerHistoryItem {
  id: string;
  eventType: string;
  eventDate: string;
  effectiveDate: string | null;
  endDate: string | null;
  reason: string | null;
  title: string | null;
  decisionAuthority: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  signerName: string | null;
  signerPosition: string | null;
  oldPosition: string | null;
  newPosition: string | null;
  oldRank: string | null;
  newRank: string | null;
  oldUnit: string | null;
  newUnit: string | null;
  trainingName: string | null;
  trainingInstitution: string | null;
  trainingResult: string | null;
  certificateNumber: string | null;
  attachmentUrl: string | null;
  notes: string | null;
}

interface PositionItem {
  id: string;
  startDate: string;
  endDate: string | null;
  isPrimary: boolean;
  isActive: boolean;
  notes: string | null;
  position: { code: string; name: string };
  unit: { id: string; name: string; code: string } | null;
}

interface CareerSummary {
  fullName: string | null;
  rank: string | null;
  enlistmentDate: string | null;
  currentUnitName: string | null;
  currentPositionName: string | null;
}

interface CareerData {
  summary: CareerSummary;
  careerHistories: CareerHistoryItem[];
  positions: PositionItem[];
}

/** Nhãn tiếng Việt cho các trường do chỉ huy/cơ quan quản lý (hiển thị ở dialog thông tin). */
const CORRECTION_FIELD_LABELS: Record<string, string> = {
  rank: 'Cấp bậc',
  enlistmentDate: 'Ngày nhập ngũ',
  unitId: 'Đơn vị công tác',
  positionId: 'Chức vụ',
};

// ---------------------------------------------------------------------------
// Event-type presentation metadata (label, icon, màu sắc)
// ---------------------------------------------------------------------------

interface EventMeta {
  label: string;
  icon: LucideIcon;
  dot: string;
  badge: string;
  iconWrap: string;
}

const EVENT_META: Record<string, EventMeta> = {
  ENLISTMENT:      { label: 'Nhập ngũ / Tuyển dụng', icon: UserPlus,       dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconWrap: 'bg-emerald-100 text-emerald-600' },
  PROMOTION:       { label: 'Thăng quân hàm',        icon: ChevronsUp,     dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       iconWrap: 'bg-amber-100 text-amber-600' },
  APPOINTMENT:     { label: 'Bổ nhiệm chức vụ',      icon: BadgeCheck,     dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',          iconWrap: 'bg-blue-100 text-blue-600' },
  POSITION_CHANGE: { label: 'Thay đổi chức vụ',      icon: Briefcase,      dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 border-violet-200',    iconWrap: 'bg-violet-100 text-violet-600' },
  TRANSFER:        { label: 'Điều động',             icon: ArrowRightLeft, dot: 'bg-cyan-500',    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',          iconWrap: 'bg-cyan-100 text-cyan-600' },
  UNIT_CHANGE:     { label: 'Chuyển đơn vị',         icon: Building2,      dot: 'bg-sky-500',     badge: 'bg-sky-50 text-sky-700 border-sky-200',             iconWrap: 'bg-sky-100 text-sky-600' },
  SECONDMENT:      { label: 'Biệt phái',             icon: Send,           dot: 'bg-teal-500',    badge: 'bg-teal-50 text-teal-700 border-teal-200',          iconWrap: 'bg-teal-100 text-teal-600' },
  TRAINING:        { label: 'Đào tạo / Bồi dưỡng',   icon: GraduationCap,  dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    iconWrap: 'bg-indigo-100 text-indigo-600' },
  STUDY_LEAVE:     { label: 'Đi học tập trung',      icon: BookOpen,       dot: 'bg-indigo-500',  badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',    iconWrap: 'bg-indigo-100 text-indigo-600' },
  RETURN:          { label: 'Trở lại công tác',      icon: RotateCcw,      dot: 'bg-green-500',   badge: 'bg-green-50 text-green-700 border-green-200',       iconWrap: 'bg-green-100 text-green-600' },
  AWARD:           { label: 'Khen thưởng',           icon: Trophy,         dot: 'bg-yellow-500',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-200',    iconWrap: 'bg-yellow-100 text-yellow-600' },
  DISCIPLINE:      { label: 'Kỷ luật',               icon: AlertTriangle,  dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',             iconWrap: 'bg-red-100 text-red-600' },
  RANK_DEMOTION:   { label: 'Giáng cấp',             icon: ChevronsDown,   dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',          iconWrap: 'bg-rose-100 text-rose-600' },
  RETIREMENT_PREP: { label: 'Chuẩn bị nghỉ hưu',     icon: Hourglass,      dot: 'bg-slate-500',   badge: 'bg-slate-50 text-slate-600 border-slate-200',       iconWrap: 'bg-slate-100 text-slate-600' },
  RETIREMENT:      { label: 'Nghỉ hưu',              icon: Home,           dot: 'bg-slate-500',   badge: 'bg-slate-50 text-slate-600 border-slate-200',       iconWrap: 'bg-slate-100 text-slate-600' },
  DISCHARGE:       { label: 'Phục viên / Xuất ngũ',  icon: LogOut,         dot: 'bg-slate-500',   badge: 'bg-slate-50 text-slate-600 border-slate-200',       iconWrap: 'bg-slate-100 text-slate-600' },
  OTHER:           { label: 'Khác',                  icon: CircleDot,      dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border-slate-200',       iconWrap: 'bg-slate-100 text-slate-500' },
};

const FALLBACK_META = EVENT_META.OTHER;

function getEventMeta(eventType: string): EventMeta {
  return EVENT_META[eventType] ?? FALLBACK_META;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatMonthYear(d: string | null): string {
  if (!d) return 'nay';
  return new Date(d).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' });
}

function formatFullDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getYear(d: string | null): number | null {
  if (!d) return null;
  const y = new Date(d).getFullYear();
  return Number.isNaN(y) ? null : y;
}

/** Tóm tắt một sự kiện thành chuỗi ngắn — dùng làm "giá trị hiện tại" khi đề nghị đính chính. */
function buildEventSummary(event: CareerHistoryItem): string {
  const parts: string[] = [getEventMeta(event.eventType).label];
  if (event.title) parts.push(event.title);
  if (event.newPosition) parts.push(`Chức vụ: ${event.oldPosition ? event.oldPosition + ' → ' : ''}${event.newPosition}`);
  if (event.newRank) parts.push(`Cấp bậc: ${event.oldRank ? event.oldRank + ' → ' : ''}${event.newRank}`);
  if (event.newUnit) parts.push(`Đơn vị: ${event.newUnit}`);
  if (event.decisionNumber) parts.push(`QĐ ${event.decisionNumber}`);
  parts.push(`(${formatFullDate(event.eventDate)})`);
  return parts.join(' · ');
}

/** Thâm niên công tác (số năm tròn) tính từ ngày nhập ngũ, fallback về sự kiện sớm nhất. */
function calculateServiceYears(summary: CareerSummary, histories: CareerHistoryItem[]): { years: number | null; sinceYear: number | null } {
  const startStr =
    summary.enlistmentDate ??
    histories.map((h) => h.eventDate).sort()[0] ??
    null;
  const sinceYear = getYear(startStr);
  if (!startStr || sinceYear === null) return { years: null, sinceYear: null };
  const start = new Date(startStr).getTime();
  const years = Math.max(0, Math.floor((Date.now() - start) / (365.25 * 24 * 60 * 60 * 1000)));
  return { years, sinceYear };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  accentBorder: string;
  iconWrap: string;
}

function SummaryCard({ icon: Icon, label, value, subtitle, accentBorder, iconWrap }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5 border border-t-4 border-slate-200',
        'bg-gradient-to-br from-white via-slate-50/60 to-white',
        'shadow-sm hover:shadow-md transition-shadow duration-300',
        accentBorder,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-lg font-bold text-slate-800 leading-snug break-words">{value}</p>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 truncate">{subtitle}</p>}
        </div>
        <div className={cn('shrink-0 p-2.5 rounded-xl', iconWrap)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: PositionItem }) {
  const p = position;
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-shadow',
        p.isActive
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50/40 shadow-sm ring-1 ring-blue-100'
          : 'border-slate-200 bg-white hover:shadow-sm',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('shrink-0 p-2 rounded-lg', p.isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')}>
          <Briefcase className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-800">{p.position.name}</span>
            {p.isActive && <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[11px]">Hiện tại</Badge>}
            {p.isPrimary && (
              <Badge variant="outline" className="text-[11px] border-amber-300 text-amber-700 bg-amber-50">
                <Star className="mr-1 h-3 w-3" /> Chức vụ chính
              </Badge>
            )}
          </div>
          {p.unit && (
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> {p.unit.name}
            </div>
          )}
          <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            {formatMonthYear(p.startDate)} — {formatMonthYear(p.endDate)}
          </div>
          {p.notes && <p className="mt-2 text-sm text-slate-500">{p.notes}</p>}
        </div>
      </div>
    </div>
  );
}

function ChangeRow({ label, from, to }: { label: string; from: string | null; to: string | null }) {
  if (!from && !to) return null;
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <span className="text-slate-400 shrink-0">{label}:</span>
      {from && <span className="text-slate-500 line-through decoration-slate-300">{from}</span>}
      {from && to && <ArrowRightLeft className="h-3 w-3 text-slate-400 shrink-0" />}
      {to && <span className="font-medium text-slate-700">{to}</span>}
    </div>
  );
}

function TimelineEvent({ event }: { event: CareerHistoryItem }) {
  const meta = getEventMeta(event.eventType);
  const Icon = meta.icon;
  const hasTraining = event.trainingName || event.trainingInstitution || event.trainingResult;

  return (
    <div className="relative pl-12">
      {/* Rail dot */}
      <span
        className={cn(
          'absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-sm ring-4 ring-white',
          meta.dot,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', meta.badge)}>
                {meta.label}
              </span>
            </div>
            {event.title && <h4 className="mt-1.5 font-semibold text-slate-800">{event.title}</h4>}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatFullDate(event.eventDate)}
              {event.endDate && <span className="text-slate-400">→ {formatMonthYear(event.endDate)}</span>}
            </div>
            <CareerEventCorrectionDialog
              event={event as unknown as Record<string, unknown> & { id: string }}
              summary={buildEventSummary(event)}
            />
          </div>
        </div>

        {/* Thay đổi chức vụ / cấp bậc / đơn vị */}
        <div className="mt-2 space-y-1">
          <ChangeRow label="Chức vụ" from={event.oldPosition} to={event.newPosition} />
          <ChangeRow label="Cấp bậc" from={event.oldRank} to={event.newRank} />
          <ChangeRow label="Đơn vị" from={event.oldUnit} to={event.newUnit} />
        </div>

        {/* Thông tin đào tạo */}
        {hasTraining && (
          <div className="mt-2 rounded-lg bg-indigo-50/60 px-3 py-2 text-sm">
            {event.trainingName && <div className="font-medium text-indigo-800">{event.trainingName}</div>}
            <div className="text-indigo-700/80">
              {event.trainingInstitution}
              {event.trainingInstitution && event.trainingResult && ' · '}
              {event.trainingResult && <span>Kết quả: {event.trainingResult}</span>}
            </div>
            {event.certificateNumber && (
              <div className="text-xs text-indigo-700/70">Văn bằng/chứng chỉ: {event.certificateNumber}</div>
            )}
          </div>
        )}

        {event.reason && <p className="mt-2 text-sm text-slate-600">Lý do: {event.reason}</p>}
        {event.notes && <p className="mt-1 text-sm text-slate-500">{event.notes}</p>}

        {/* Thông tin quyết định */}
        {(event.decisionNumber || event.decisionAuthority || event.decisionDate || event.signerName) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500">
            {event.decisionNumber && (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> QĐ số {event.decisionNumber}
                {event.decisionDate && ` (${formatFullDate(event.decisionDate)})`}
              </span>
            )}
            {event.decisionAuthority && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {event.decisionAuthority}
              </span>
            )}
            {event.signerName && (
              <span>
                Người ký: {event.signerName}
                {event.signerPosition && ` — ${event.signerPosition}`}
              </span>
            )}
            {event.attachmentUrl && (
              <a
                href={event.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" /> Tệp đính kèm
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyCareerPage() {
  const [data, setData] = useState<CareerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/personal/my-career').then((r) => r.json());
      if (res.success) setData(res.data);
      else setError(res.error ?? 'Không thể tải dữ liệu');
    } catch {
      setError('Lỗi kết nối server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const histories = data?.careerHistories ?? [];
  const positions = data?.positions ?? [];
  const summary = data?.summary;

  const correctionFields: CorrectableField[] = useMemo(
    () => [
      { fieldName: 'rank', label: CORRECTION_FIELD_LABELS.rank, currentValue: summary?.rank ?? null },
      {
        fieldName: 'enlistmentDate',
        label: CORRECTION_FIELD_LABELS.enlistmentDate,
        currentValue: summary?.enlistmentDate ? formatFullDate(summary.enlistmentDate) : null,
      },
      { fieldName: 'unitId', label: CORRECTION_FIELD_LABELS.unitId, currentValue: summary?.currentUnitName ?? null },
      { fieldName: 'positionId', label: CORRECTION_FIELD_LABELS.positionId, currentValue: summary?.currentPositionName ?? null },
    ],
    [summary],
  );

  // Các loại sự kiện thực sự xuất hiện trong dữ liệu (để dựng bộ lọc động)
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    histories.forEach((h) => set.add(h.eventType));
    return Array.from(set);
  }, [histories]);

  const filteredHistories = useMemo(
    () => (typeFilter === 'ALL' ? histories : histories.filter((h) => h.eventType === typeFilter)),
    [histories, typeFilter],
  );

  const service = summary ? calculateServiceYears(summary, histories) : { years: null, sinceYear: null };
  const unitCount = useMemo(() => {
    const set = new Set<string>();
    positions.forEach((p) => p.unit && set.add(p.unit.name));
    histories.forEach((h) => h.newUnit && set.add(h.newUnit));
    return set.size;
  }, [positions, histories]);

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <ModuleHero
        moduleId="personnel"
        supra="M02 · Hồ sơ cá nhân"
        title="Quá trình công tác"
        subtitle={
          summary?.fullName
            ? `${summary.rank ? summary.rank + ' · ' : ''}${summary.fullName}`
            : 'Lịch sử vị trí, chức vụ và đơn vị công tác của bạn'
        }
        icon={Briefcase}
        stats={[
          { label: 'Sự kiện', value: histories.length },
          { label: 'Chức vụ', value: positions.length },
          { label: 'Đơn vị đã qua', value: unitCount },
        ]}
      />

      {/* Thanh hành động: xuất hồ sơ (M18) · đề nghị đính chính · làm mới */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DocumentExportMenu
          entityType="personnel"
          entityId="self"
          exportEndpoint="/api/personal/my-career/export"
          requiredPermission={TEMPLATES.EXPORT_DATA}
          templateCodes={[CAREER_TEMPLATE_CODE]}
          label="Xuất hồ sơ"
        />
        <RequestCorrectionDialog fields={correctionFields} />
        <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', refreshing && 'animate-spin')} />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Thẻ tóm tắt */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={Briefcase}
          label="Chức vụ hiện tại"
          value={summary?.currentPositionName ?? 'Chưa cập nhật'}
          accentBorder="border-t-blue-500"
          iconWrap="bg-blue-100 text-blue-600"
        />
        <SummaryCard
          icon={MapPin}
          label="Đơn vị hiện tại"
          value={summary?.currentUnitName ?? 'Chưa cập nhật'}
          accentBorder="border-t-cyan-500"
          iconWrap="bg-cyan-100 text-cyan-600"
        />
        <SummaryCard
          icon={History}
          label="Tổng sự kiện công tác"
          value={String(histories.length)}
          subtitle={`${positions.length} chức vụ đã đảm nhiệm`}
          accentBorder="border-t-emerald-500"
          iconWrap="bg-emerald-100 text-emerald-600"
        />
        <SummaryCard
          icon={CalendarClock}
          label="Thâm niên công tác"
          value={service.years !== null ? `${service.years} năm` : 'Chưa xác định'}
          subtitle={service.sinceYear ? `Từ năm ${service.sinceYear}` : undefined}
          accentBorder="border-t-violet-500"
          iconWrap="bg-violet-100 text-violet-600"
        />
      </div>

      {/* Chức vụ đã/đang đảm nhiệm */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <Layers className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Chức vụ đã đảm nhiệm</h2>
          <Badge variant="outline" className="ml-auto text-slate-500">{positions.length}</Badge>
        </div>
        <div className="p-5">
          {positions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Chưa có dữ liệu chức vụ"
              description="Thông tin chức vụ sẽ hiển thị khi đơn vị quản lý cập nhật hồ sơ của bạn."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {positions.map((p) => (
                <PositionCard key={p.id} position={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dòng thời gian sự kiện công tác */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-3.5">
          <History className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-800">Lịch sử sự kiện công tác</h2>
          <Badge variant="outline" className="text-slate-500">{filteredHistories.length}</Badge>
        </div>

        {/* Bộ lọc theo loại sự kiện */}
        {availableTypes.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
            <FilterChip label="Tất cả" active={typeFilter === 'ALL'} onClick={() => setTypeFilter('ALL')} />
            {availableTypes.map((t) => (
              <FilterChip
                key={t}
                label={getEventMeta(t).label}
                active={typeFilter === t}
                onClick={() => setTypeFilter(t)}
              />
            ))}
          </div>
        )}

        <div className="p-5">
          {histories.length === 0 ? (
            <EmptyState
              icon={History}
              title="Chưa có lịch sử công tác"
              description="Các sự kiện như bổ nhiệm, thăng quân hàm, điều động, đào tạo sẽ xuất hiện ở đây."
            />
          ) : filteredHistories.length === 0 ? (
            <EmptyState
              icon={CircleDot}
              title="Không có sự kiện phù hợp bộ lọc"
              description="Thử chọn loại sự kiện khác hoặc xem tất cả."
            />
          ) : (
            <Timeline events={filteredHistories} />
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline wrapper (group theo năm + đường kẻ dọc)
// ---------------------------------------------------------------------------

function Timeline({ events }: { events: CareerHistoryItem[] }) {
  return (
    <div className="relative">
      {/* Đường rail dọc */}
      <span className="pointer-events-none absolute left-[18px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-slate-200 to-transparent" />
      <div className="space-y-5">
        {events.map((event, i) => {
          const year = getYear(event.eventDate);
          const prevYear = i > 0 ? getYear(events[i - 1].eventDate) : null;
          const showYear = year !== null && year !== prevYear;
          return (
            <div key={event.id}>
              {showYear && (
                <div className="relative mb-3 pl-12">
                  <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                    {year}
                  </span>
                </div>
              )}
              <TimelineEvent event={event} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700',
      )}
    >
      {label}
    </button>
  );
}
