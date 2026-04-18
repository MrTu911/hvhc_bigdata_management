'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, FlaskConical, Users, Milestone, BookOpen,
  Shield, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  PlayCircle, Clock, RefreshCw, Send, ExternalLink,
  FileText, BarChart2, Landmark, CalendarDays, UserSquare2,
  ChevronRight, AlertTriangle, GraduationCap, ScrollText,
  TrendingUp, Info, MessageSquare, Paperclip,
} from 'lucide-react';
import { ProjectChat } from '@/components/science/ProjectChat';
import { ScienceAttachmentPanel } from '@/components/science/ScienceAttachmentPanel';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT:        'Nháp',
  SUBMITTED:    'Đã nộp',
  UNDER_REVIEW: 'Thẩm định',
  APPROVED:     'Phê duyệt',
  REJECTED:     'Từ chối',
  IN_PROGRESS:  'Đang thực hiện',
  PAUSED:       'Tạm dừng',
  COMPLETED:    'Hoàn thành',
  CANCELLED:    'Hủy',
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT:        'bg-gray-100 text-gray-600',
  SUBMITTED:    'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  APPROVED:     'bg-teal-100 text-teal-700',
  REJECTED:     'bg-red-100 text-red-600',
  IN_PROGRESS:  'bg-violet-100 text-violet-700',
  PAUSED:       'bg-orange-100 text-orange-700',
  COMPLETED:    'bg-emerald-100 text-emerald-700',
  CANCELLED:    'bg-red-50 text-red-400',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:       'Đề xuất',
  CONTRACT:       'Ký hợp đồng',
  EXECUTION:      'Thực hiện',
  MIDTERM_REVIEW: 'Giữa kỳ',
  FINAL_REVIEW:   'Nghiệm thu',
  ACCEPTED:       'Đạt',
  ARCHIVED:       'Lưu trữ',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI:   'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT:              'Công nghệ thông tin',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const TYPE_LABELS: Record<string, string> = {
  CO_BAN:                'Cơ bản',
  UNG_DUNG:              'Ứng dụng',
  TRIEN_KHAI:            'Triển khai',
  SANG_KIEN_KINH_NGHIEM: 'Sáng kiến kinh nghiệm',
};

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM:          'Chủ nhiệm',
  THU_KY_KHOA_HOC:    'Thư ký KH',
  THANH_VIEN_CHINH:   'Thành viên chính',
  CONG_TAC_VIEN:      'Cộng tác viên',
};

const MEMBER_ROLE_BADGE: Record<string, string> = {
  CHU_NHIEM:          'bg-violet-100 text-violet-700',
  THU_KY_KHOA_HOC:    'bg-blue-100 text-blue-700',
  THANH_VIEN_CHINH:   'bg-teal-100 text-teal-700',
  CONG_TAC_VIEN:      'bg-gray-100 text-gray-600',
};

const WORKFLOW_ACTIONS: Record<string, Array<{
  toStatus: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'destructive';
  requireComment?: boolean;
  confirmMsg?: string;
  color?: string;
}>> = {
  DRAFT: [
    { toStatus: 'SUBMITTED', label: 'Nộp đề xuất', icon: <Send className="h-4 w-4" />, variant: 'default', color: 'bg-violet-600 hover:bg-violet-700' },
    { toStatus: 'CANCELLED', label: 'Hủy đề tài', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true, confirmMsg: 'Xác nhận hủy đề tài?' },
  ],
  SUBMITTED: [
    { toStatus: 'UNDER_REVIEW', label: 'Tiếp nhận thẩm định', icon: <Clock className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'REJECTED', label: 'Từ chối', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'outline', requireComment: true, confirmMsg: 'Xác nhận hủy?' },
  ],
  UNDER_REVIEW: [
    { toStatus: 'APPROVED', label: 'Phê duyệt', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { toStatus: 'REJECTED', label: 'Từ chối', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
  APPROVED: [
    { toStatus: 'IN_PROGRESS', label: 'Kích hoạt thực hiện', icon: <PlayCircle className="h-4 w-4" />, variant: 'default', color: 'bg-violet-600 hover:bg-violet-700' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true, confirmMsg: 'Xác nhận hủy đề tài đã duyệt?' },
  ],
  REJECTED: [
    { toStatus: 'DRAFT', label: 'Trả về nháp để chỉnh sửa', icon: <RefreshCw className="h-4 w-4" />, variant: 'outline' },
  ],
  IN_PROGRESS: [
    { toStatus: 'PAUSED', label: 'Tạm dừng', icon: <Clock className="h-4 w-4" />, variant: 'outline', requireComment: true },
    { toStatus: 'COMPLETED', label: 'Hoàn thành', icon: <CheckCircle2 className="h-4 w-4" />, variant: 'default', confirmMsg: 'Xác nhận hoàn thành đề tài?', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
  PAUSED: [
    { toStatus: 'IN_PROGRESS', label: 'Tiếp tục thực hiện', icon: <PlayCircle className="h-4 w-4" />, variant: 'default' },
    { toStatus: 'CANCELLED', label: 'Hủy', icon: <XCircle className="h-4 w-4" />, variant: 'destructive', requireComment: true },
  ],
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; rank?: string | null };
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  completedAt?: string | null;
  note?: string | null;
}

interface Acceptance {
  id: string;
  acceptanceDate: string;
  acceptanceType: string;
  result: string;
  finalScore?: number | null;
  grade?: string | null;
}

interface ProjectDetail {
  id: string;
  projectCode: string;
  title: string;
  titleEn?: string;
  abstract?: string;
  keywords: string[];
  category: string;
  field: string;
  researchType: string;
  status: string;
  phase: string;
  sensitivity: string;
  budgetRequested?: number;
  budgetApproved?: number;
  budgetUsed?: number;
  budgetYear?: number;
  startDate?: string;
  endDate?: string;
  actualEndDate?: string;
  bqpProjectCode?: string;
  completionScore?: number;
  completionGrade?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  principalInvestigator: { id: string; name: string; rank?: string; email?: string };
  unit?: { id: string; name: string; code: string };
  members?: Member[];
  milestones?: Milestone[];
  acceptance?: Acceptance | null;
  workflowLogs?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    actedAt: string;
    comment?: string;
    actionBy: { name: string };
  }>;
}

type TabKey = 'overview' | 'team' | 'milestones' | 'finance' | 'history' | 'chat' | 'documents';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const vnd = (n?: number | null) =>
  n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : '—';

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function daysLeft(endDate?: string | null) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
}

function SensitivityBadge({ sensitivity }: { sensitivity: string }) {
  if (sensitivity === 'NORMAL') return null;
  const cfg = sensitivity === 'SECRET'
    ? { icon: <ShieldAlert className="h-3 w-3" />, label: 'Tuyệt mật', cls: 'bg-red-50 text-red-700 border-red-200' }
    : { icon: <ShieldCheck className="h-3 w-3" />, label: 'Mật', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value?: string | null; highlight?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${highlight ? 'text-violet-700' : 'text-gray-800'}`}>{value}</div>
    </div>
  );
}

// ─── Tab nav ───────────────────────────────────────────────────────────────────

function TabNav({ active, onChange, milestoneCount, memberCount }: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  milestoneCount: number;
  memberCount: number;
}) {
  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview',   label: 'Tổng quan',   icon: <Info className="h-3.5 w-3.5" /> },
    { key: 'team',       label: 'Nhóm NC',     icon: <Users className="h-3.5 w-3.5" />, count: memberCount + 1 },
    { key: 'milestones', label: 'Tiến độ',     icon: <Milestone className="h-3.5 w-3.5" />, count: milestoneCount },
    { key: 'finance',    label: 'Tài chính',   icon: <Landmark className="h-3.5 w-3.5" /> },
    { key: 'history',    label: 'Lịch sử',     icon: <ScrollText className="h-3.5 w-3.5" /> },
    { key: 'documents',  label: 'Tài liệu',    icon: <Paperclip className="h-3.5 w-3.5" /> },
    { key: 'chat',       label: 'Thảo luận',   icon: <MessageSquare className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-px overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === t.key
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {t.icon}
          {t.label}
          {t.count != null && t.count > 0 && (
            <span className={`text-xs rounded-full px-1.5 py-px font-semibold ${
              active === t.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Tổng quan ────────────────────────────────────────────────────────────

function OverviewTab({ project }: { project: ProjectDetail }) {
  const dl = daysLeft(project.endDate);
  const budgetPct = project.budgetApproved && project.budgetUsed
    ? Math.round((project.budgetUsed / project.budgetApproved) * 100)
    : null;

  return (
    <div className="space-y-5">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Kinh phí phê duyệt"
          value={vnd(project.budgetApproved)}
          icon={<Landmark className="h-4 w-4" />}
          color="violet"
        />
        <KPICard
          label="Đã sử dụng"
          value={vnd(project.budgetUsed)}
          icon={<TrendingUp className="h-4 w-4" />}
          color={budgetPct != null && budgetPct >= 100 ? 'red' : 'emerald'}
          sub={budgetPct != null ? `${budgetPct}%` : undefined}
        />
        <KPICard
          label={dl != null ? (dl < 0 ? 'Quá hạn' : 'Còn lại') : 'Kết thúc'}
          value={dl != null
            ? (dl < 0 ? `${Math.abs(dl)} ngày` : `${dl} ngày`)
            : formatDate(project.endDate)}
          icon={<CalendarDays className="h-4 w-4" />}
          color={dl != null && dl < 0 ? 'red' : dl != null && dl <= 30 ? 'amber' : 'gray'}
        />
        <KPICard
          label="Thành viên"
          value={`${(project.members?.length ?? 0) + 1} người`}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
      </div>

      {/* Acceptance result (if completed) */}
      {project.acceptance && (
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          project.acceptance.result === 'PASS' ? 'border-emerald-200 bg-emerald-50' :
          project.acceptance.result === 'FAIL' ? 'border-red-200 bg-red-50' :
          'border-amber-200 bg-amber-50'
        }`}>
          <CheckCircle2 className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
            project.acceptance.result === 'PASS' ? 'text-emerald-600' :
            project.acceptance.result === 'FAIL' ? 'text-red-500' : 'text-amber-600'
          }`} />
          <div>
            <p className={`text-sm font-semibold ${
              project.acceptance.result === 'PASS' ? 'text-emerald-800' :
              project.acceptance.result === 'FAIL' ? 'text-red-700' : 'text-amber-800'
            }`}>
              Nghiệm thu:{' '}
              {project.acceptance.result === 'PASS' ? 'ĐẠT' :
               project.acceptance.result === 'FAIL' ? 'KHÔNG ĐẠT' : 'ĐẠT CÓ ĐIỀU KIỆN'}
              {project.acceptance.grade && ` — ${project.acceptance.grade}`}
              {project.acceptance.finalScore != null && ` (${project.acceptance.finalScore}/10)`}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Ngày: {formatDate(project.acceptance.acceptanceDate)}
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Thông tin đề tài */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-violet-500" /> Thông tin đề tài
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Cấp đề tài" value={CATEGORY_LABELS[project.category] ?? project.category} />
            <InfoRow label="Lĩnh vực" value={FIELD_LABELS[project.field] ?? project.field} />
            <InfoRow label="Loại NC" value={TYPE_LABELS[project.researchType] ?? project.researchType} />
            <InfoRow label="Năm kinh phí" value={project.budgetYear?.toString()} />
            <InfoRow label="Bắt đầu" value={formatDate(project.startDate)} />
            <InfoRow label="Kế hoạch kết thúc" value={formatDate(project.endDate)} />
            {project.actualEndDate && <InfoRow label="Kết thúc thực tế" value={formatDate(project.actualEndDate)} />}
            {project.bqpProjectCode && <InfoRow label="Mã BQP" value={project.bqpProjectCode} highlight />}
            {project.completionGrade && (
              <InfoRow
                label="Kết quả nghiệm thu"
                value={`${project.completionGrade}${project.completionScore ? ` (${project.completionScore}/10)` : ''}`}
                highlight
              />
            )}
            {project.unit && <InfoRow label="Đơn vị" value={project.unit.name} />}
          </CardContent>
        </Card>

        {/* Tóm tắt + từ khóa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" /> Nội dung nghiên cứu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {project.titleEn && (
              <p className="text-xs italic text-gray-500 border-l-2 border-violet-200 pl-2">{project.titleEn}</p>
            )}
            {project.abstract ? (
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-6">{project.abstract}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">Chưa có tóm tắt.</p>
            )}
            {project.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.keywords.map((kw) => (
                  <span key={kw} className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded text-xs font-medium">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Đường dẫn nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <QuickLink
              href={`/dashboard/science/activities/progress?projectId=${project.id}`}
              icon={<BarChart2 className="h-4 w-4" />}
              label="Tiến độ & Báo cáo"
              color="violet"
            />
            <QuickLink
              href={`/dashboard/science/activities/budgets?projectId=${project.id}`}
              icon={<Landmark className="h-4 w-4" />}
              label="Ngân sách"
              color="blue"
            />
            <QuickLink
              href={`/dashboard/science/activities/acceptance?projectId=${project.id}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Nghiệm thu"
              color="emerald"
            />
            <QuickLink
              href={`/dashboard/science/activities/councils?projectId=${project.id}`}
              icon={<Users className="h-4 w-4" />}
              label="Hội đồng"
              color="amber"
            />
            <QuickLink
              href={`/dashboard/science/activities/midterm?projectId=${project.id}`}
              icon={<FileText className="h-4 w-4" />}
              label="Kiểm tra giữa kỳ"
              color="teal"
            />
            <QuickLink
              href={`/dashboard/science/activities/extensions?projectId=${project.id}`}
              icon={<CalendarDays className="h-4 w-4" />}
              label="Gia hạn"
              color="orange"
            />
            <QuickLink
              href={`/dashboard/science/finance/purchase-orders?projectId=${project.id}`}
              icon={<ScrollText className="h-4 w-4" />}
              label="Đơn mua sắm"
              color="gray"
            />
            <QuickLink
              href={`/dashboard/science/ai/similar-projects?projectId=${project.id}`}
              icon={<GraduationCap className="h-4 w-4" />}
              label="Đề tài tương tự"
              color="purple"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Nhóm NC ──────────────────────────────────────────────────────────────

function TeamTab({ project }: { project: ProjectDetail }) {
  const allMembers: Array<{ id: string; role: string; user: { id: string; name: string; rank?: string | null } }> = [
    { id: 'pi', role: 'CHU_NHIEM', user: project.principalInvestigator },
    ...(project.members ?? []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {allMembers.length} thành viên nhóm nghiên cứu.
        Nhấn <ExternalLink className="h-3 w-3 inline" /> để xem hồ sơ nhân sự trong hệ thống.
      </p>

      <div className="grid md:grid-cols-2 gap-3">
        {allMembers.map((m, idx) => (
          <div
            key={m.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
          >
            {/* Avatar placeholder */}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
              idx === 0 ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {m.user.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 truncate">{m.user.name}</span>
                <Link
                  href={`/dashboard/personnel/${m.user.id}`}
                  title="Xem hồ sơ nhân sự"
                  className="text-gray-400 hover:text-violet-600 transition-colors flex-shrink-0"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              {m.user.rank && (
                <p className="text-xs text-gray-500 mt-0.5">{m.user.rank}</p>
              )}
              <span className={`mt-1 inline-flex text-xs px-2 py-0.5 rounded-full font-medium ${MEMBER_ROLE_BADGE[m.role] ?? 'bg-gray-100 text-gray-600'}`}>
                {MEMBER_ROLE_LABELS[m.role] ?? m.role}
              </span>
            </div>

            {/* Personnel quick link button */}
            <Link
              href={`/dashboard/personnel/${m.user.id}`}
              className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              title="Hồ sơ nhân sự"
            >
              <UserSquare2 className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Note about student participants */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <p>
          Nhấn biểu tượng <UserSquare2 className="h-3 w-3 inline" /> để mở hồ sơ nhân sự của từng thành viên — bao gồm thông tin cán bộ, học viên và sinh viên trong hệ thống quản lý nhân sự.
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Tiến độ / Milestones ─────────────────────────────────────────────────

function MilestonesTab({ project }: { project: ProjectDetail }) {
  const milestones = project.milestones ?? [];
  const total     = milestones.length;
  const done      = milestones.filter((m) => m.status === 'COMPLETED').length;
  const overdue   = milestones.filter((m) => m.status === 'OVERDUE').length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Summary */}
      {total > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Tiến độ tổng thể</span>
                {overdue > 0 && (
                  <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" /> {overdue} mốc quá hạn
                  </span>
                )}
              </div>
              <span className="text-lg font-bold text-violet-700">{pct}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 100 ? 'bg-emerald-500' : overdue > 0 ? 'bg-amber-500' : 'bg-violet-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="text-emerald-600 font-medium">{done} hoàn thành</span>
              <span>{total - done - overdue} đang thực hiện</span>
              {overdue > 0 && <span className="text-red-500 font-medium">{overdue} quá hạn</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {milestones.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
          <Milestone className="h-10 w-10 opacity-30" />
          <p className="text-sm">Chưa có mốc tiến độ nào.</p>
          <Link
            href={`/dashboard/science/activities/progress?projectId=${project.id}`}
            className="text-xs text-violet-600 hover:underline flex items-center gap-1"
          >
            Quản lý mốc tiến độ <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {milestones.map((m, idx) => {
            const isOverdue = m.status === 'OVERDUE' || (m.status === 'PENDING' && new Date(m.dueDate) < new Date());
            const statusConfig = {
              COMPLETED:   { label: 'Hoàn thành', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
              IN_PROGRESS: { label: 'Đang làm',   cls: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500' },
              OVERDUE:     { label: 'Quá hạn',     cls: 'bg-red-100 text-red-600',         dot: 'bg-red-500' },
              PENDING:     { label: isOverdue ? 'Trễ hạn' : 'Chờ', cls: isOverdue ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500', dot: isOverdue ? 'bg-amber-500' : 'bg-gray-300' },
              CANCELLED:   { label: 'Huỷ',         cls: 'bg-gray-50 text-gray-400',        dot: 'bg-gray-200' },
            }[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' };

            return (
              <div key={m.id} className="flex items-start gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <div className={`h-3 w-3 rounded-full ${statusConfig.dot}`} />
                  {idx < milestones.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]" />}
                </div>

                <div className={`flex-1 rounded-xl border p-3 mb-1 ${
                  m.status === 'COMPLETED' ? 'border-emerald-100 bg-emerald-50/50' :
                  isOverdue ? 'border-amber-200 bg-amber-50/50' :
                  'border-gray-100 bg-white'
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${m.status === 'CANCELLED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {m.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusConfig.cls}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Hạn: {formatDate(m.dueDate)}
                    </span>
                    {m.completedAt && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Xong: {formatDate(m.completedAt)}
                      </span>
                    )}
                  </div>
                  {m.note && (
                    <p className="text-xs text-gray-500 mt-1.5 italic">{m.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href={`/dashboard/science/activities/progress?projectId=${project.id}`}
          className="text-xs text-violet-600 hover:underline flex items-center gap-1"
        >
          Quản lý mốc tiến độ <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Tab: Tài chính ────────────────────────────────────────────────────────────

function FinanceTab({ project }: { project: ProjectDetail }) {
  const approved = project.budgetApproved ?? 0;
  const used     = project.budgetUsed ?? 0;
  const remain   = approved - used;
  const pct      = approved > 0 ? Math.round((used / approved) * 100) : 0;
  const isOver   = pct >= 100;
  const isNear   = pct >= 80 && !isOver;

  const financeLinks = [
    { href: `/dashboard/science/activities/budgets?projectId=${project.id}`, label: 'Chi tiết ngân sách', icon: <Landmark className="h-4 w-4" />, color: 'violet' },
    { href: `/dashboard/science/finance/purchase-orders?projectId=${project.id}`, label: 'Đơn mua sắm (PO)', icon: <ScrollText className="h-4 w-4" />, color: 'blue' },
    { href: `/dashboard/science/finance/expenses?projectId=${project.id}`, label: 'Chi tiêu', icon: <TrendingUp className="h-4 w-4" />, color: 'amber' },
    { href: `/dashboard/science/finance/grants?projectId=${project.id}`, label: 'Tài trợ', icon: <GraduationCap className="h-4 w-4" />, color: 'emerald' },
  ];

  return (
    <div className="space-y-5">
      {/* Budget overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPICard label="Kinh phí đề xuất" value={vnd(project.budgetRequested)} icon={<Landmark className="h-4 w-4" />} color="gray" />
        <KPICard label="Kinh phí phê duyệt" value={vnd(project.budgetApproved)} icon={<CheckCircle2 className="h-4 w-4" />} color="violet" />
        <KPICard label="Đã sử dụng" value={vnd(project.budgetUsed)} icon={<TrendingUp className="h-4 w-4" />} color={isOver ? 'red' : 'emerald'} sub={approved > 0 ? `${pct}%` : undefined} />
      </div>

      {/* Progress bar */}
      {approved > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span className="font-medium text-gray-700">Tỷ lệ sử dụng kinh phí</span>
              <span>{vnd(approved)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={`font-semibold ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pct}% — Đã chi {vnd(used)}
              </span>
              <span className="text-gray-400">Còn lại: {vnd(Math.max(remain, 0))}</span>
            </div>
            {isOver && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                Đã vượt kinh phí phê duyệt {vnd(Math.abs(remain))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finance quick links */}
      <div className="grid grid-cols-2 gap-2">
        {financeLinks.map((fl) => (
          <Link
            key={fl.href}
            href={fl.href}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-white hover:border-violet-200 hover:bg-violet-50/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
              {fl.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 group-hover:text-violet-700">{fl.label}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-violet-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Lịch sử vòng đời ─────────────────────────────────────────────────────

function HistoryTab({ project }: { project: ProjectDetail }) {
  const logs = project.workflowLogs ?? [];

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-gray-400 gap-2">
        <ScrollText className="h-10 w-10 opacity-30" />
        <p className="text-sm">Chưa có lịch sử thay đổi trạng thái.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...logs].reverse().map((log, idx) => (
        <div key={log.id} className="flex gap-3">
          {/* Timeline */}
          <div className="flex flex-col items-center flex-shrink-0 mt-1.5">
            <div className={`h-3 w-3 rounded-full ${idx === 0 ? 'bg-violet-500' : 'bg-gray-300'}`} />
            {idx < logs.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[24px]" />}
          </div>

          <div className={`flex-1 rounded-xl border p-3 mb-1 ${idx === 0 ? 'border-violet-200 bg-violet-50/50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[log.fromStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[log.fromStatus] ?? log.fromStatus}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[log.toStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[log.toStatus] ?? log.toStatus}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">
                {new Date(log.actedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{log.actionBy.name}</p>
            {log.comment && (
              <p className="text-xs text-gray-600 mt-1 italic bg-gray-50 rounded px-2 py-1">"{log.comment}"</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function KPICard({ label, value, icon, color, sub }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: 'text-violet-700',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    teal: 'text-teal-600',
    gray: 'text-gray-600',
  };
  return (
    <div className="rounded-xl border bg-white p-3 flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-gray-100 ${colorMap[color] ?? 'text-gray-600'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 leading-snug">{label}</p>
        <p className={`text-sm font-bold truncate ${colorMap[color] ?? 'text-gray-800'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, color }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    violet:  'bg-violet-50 text-violet-600 border-violet-100 hover:border-violet-300 hover:bg-violet-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300 hover:bg-amber-100',
    teal:    'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300 hover:bg-teal-100',
    orange:  'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300 hover:bg-orange-100',
    gray:    'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100',
    purple:  'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300 hover:bg-purple-100',
  };
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors group ${colorMap[color] ?? colorMap.gray}`}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="text-xs font-medium leading-tight">{label}</span>
      <ChevronRight className="h-3.5 w-3.5 ml-auto flex-shrink-0 opacity-50 group-hover:opacity-100" />
    </Link>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [project, setProject]         = useState<ProjectDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [comment, setComment]         = useState('');
  const [pendingAction, setPendingAction] = useState<{ toStatus: string } | null>(null);
  const [activeTab, setActiveTab]     = useState<TabKey>('overview');

  const fetchProject = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/science/projects/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? 'Không tải được đề tài');
      setProject(data.data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải đề tài');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleTransition = useCallback(async (toStatus: string) => {
    if (transitioning) return;
    setTransitioning(true);
    try {
      const res  = await fetch(`/api/science/projects/${id}/workflow`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ toStatus, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      toast.success(`Đã chuyển trạng thái → ${STATUS_LABELS[toStatus] ?? toStatus}`);
      setPendingAction(null);
      setComment('');
      await fetchProject();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Thao tác thất bại');
    } finally {
      setTransitioning(false);
    }
  }, [id, comment, transitioning, fetchProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-9 w-9 border-[3px] border-violet-600 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Đang tải đề tài...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <FlaskConical className="h-12 w-12 mx-auto text-gray-300" />
        <p className="text-gray-500">Không tìm thấy đề tài hoặc bạn không có quyền xem.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/science/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách
        </Button>
      </div>
    );
  }

  const actions = WORKFLOW_ACTIONS[project.status] ?? [];
  const milestones = project.milestones ?? [];
  const members    = project.members    ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">

      {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/dashboard/science/projects" className="hover:text-violet-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Danh sách đề tài
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium truncate max-w-[320px]">{project.projectCode}</span>
      </div>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <FlaskConical className="h-5 w-5 text-violet-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs text-violet-600 font-semibold">{project.projectCode}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {PHASE_LABELS[project.phase] ?? project.phase}
                </span>
                <SensitivityBadge sensitivity={project.sensitivity} />
              </div>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">{project.title}</h1>
              {project.titleEn && (
                <p className="text-xs text-gray-400 italic mt-0.5 line-clamp-1">{project.titleEn}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={fetchProject} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Làm mới
            </Button>
          </div>
        </div>

        {/* PI quick info */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-100 flex-wrap text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-medium text-gray-800">{project.principalInvestigator.name}</span>
            {project.principalInvestigator.rank && (
              <span className="text-gray-400 text-xs">({project.principalInvestigator.rank})</span>
            )}
            <Link
              href={`/dashboard/personnel/${project.principalInvestigator.id}`}
              title="Hồ sơ nhân sự"
              className="text-gray-400 hover:text-violet-600 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
          {project.unit && (
            <>
              <span className="text-gray-300">·</span>
              <span>{project.unit.name}</span>
            </>
          )}
          {project.endDate && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(project.endDate)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Workflow action panel ──────────────────────────────────────────── */}
      {actions.length > 0 && (
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-white">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm font-semibold text-violet-800 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Thao tác vòng đời
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.toStatus}
                  variant={action.variant}
                  size="sm"
                  disabled={transitioning}
                  onClick={() => {
                    if (action.confirmMsg && !confirm(action.confirmMsg)) return;
                    if (action.requireComment && !comment.trim()) {
                      setPendingAction({ toStatus: action.toStatus });
                      return;
                    }
                    handleTransition(action.toStatus);
                  }}
                  className={`gap-2 ${action.color ?? ''}`}
                >
                  {transitioning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : action.icon}
                  {action.label}
                </Button>
              ))}
            </div>

            {(pendingAction || actions.some(a => a.requireComment)) && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Ghi chú / lý do (bắt buộc khi từ chối hoặc hủy)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="text-sm bg-white"
                />
                {pendingAction && (
                  <Button
                    size="sm"
                    disabled={!comment.trim() || transitioning}
                    onClick={() => handleTransition(pendingAction.toStatus)}
                    className="gap-2"
                  >
                    {transitioning && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Xác nhận: {STATUS_LABELS[pendingAction.toStatus] ?? pendingAction.toStatus}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <TabNav
        active={activeTab}
        onChange={setActiveTab}
        milestoneCount={milestones.length}
        memberCount={members.length}
      />

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="pt-1">
        {activeTab === 'overview'   && <OverviewTab   project={project} />}
        {activeTab === 'team'       && <TeamTab       project={project} />}
        {activeTab === 'milestones' && <MilestonesTab project={project} />}
        {activeTab === 'finance'    && <FinanceTab    project={project} />}
        {activeTab === 'history'    && <HistoryTab    project={project} />}
        {activeTab === 'documents'  && (
          <ScienceAttachmentPanel
            entityType="PROJECT"
            entityId={project.id}
            allowUpload
            allowDelete
            currentUserId={session?.user?.id}
          />
        )}
        {activeTab === 'chat'       && (
          <ProjectChat
            projectId={project.id}
            currentUserId={session?.user?.id ?? ''}
            currentUserName={session?.user?.name ?? 'Bạn'}
          />
        )}
      </div>
    </div>
  );
}
