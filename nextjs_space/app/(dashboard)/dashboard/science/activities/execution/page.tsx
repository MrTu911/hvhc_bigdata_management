'use client';

/**
 * M20 — Science Activities: Execution
 * Hiển thị đề tài APPROVED (chờ kích hoạt) và IN_PROGRESS (đang thực hiện).
 * APPROVED → IN_PROGRESS: PI kích hoạt.
 * IN_PROGRESS → PAUSED/COMPLETED: quản lý tiến độ.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, PlayCircle, CheckCircle2, PauseCircle, RefreshCw,
  FileText, Milestone, Clock, Activity, GavelIcon,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const PHASE_LABELS: Record<string, string> = {
  PROPOSAL:       'Đề xuất',
  CONTRACT:       'Ký HĐ',
  EXECUTION:      'Thực hiện',
  MIDTERM_REVIEW: 'Giữa kỳ',
  FINAL_REVIEW:   'Nghiệm thu',
  ACCEPTED:       'Đạt',
  ARCHIVED:       'Lưu trữ',
};

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  status: string;
  phase: string;
  sensitivity: string;
  budgetApproved?: number;
  startDate?: string;
  endDate?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
  _count?: { members: number; milestones: number };
}

type ActionType = 'activate' | 'pause' | 'complete';

interface ActionState {
  projectId: string;
  type: ActionType;
}

export default function ExecutionPage() {
  const router = useRouter();
  const [approved, setApproved] = useState<Project[]>([]);
  const [inProgress, setInProgress] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState<ActionState | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
      const [r1, r2] = await Promise.all([
        fetch(`/api/science/projects?status=APPROVED&pageSize=50${kw}`).then(r => r.json()),
        fetch(`/api/science/projects?status=IN_PROGRESS&pageSize=50${kw}`).then(r => r.json()),
      ]);
      setApproved(r1.success ? r1.data : []);
      setInProgress(r2.success ? r2.data : []);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleAction = useCallback(async () => {
    if (!action || processing) return;
    setProcessing(true);
    try {
      const toStatusMap: Record<ActionType, string> = {
        activate: 'IN_PROGRESS',
        pause:    'PAUSED',
        complete: 'COMPLETED',
      };
      const toPhaseMap: Record<ActionType, string | undefined> = {
        activate: 'EXECUTION',
        pause:    undefined,
        complete: 'FINAL_REVIEW',
      };
      const res = await fetch(`/api/science/projects/${action.projectId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: toStatusMap[action.type],
          toPhase: toPhaseMap[action.type],
          comment: comment.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Thao tác thất bại');
      const msgs: Record<ActionType, string> = {
        activate: 'Đã kích hoạt thực hiện đề tài',
        pause:    'Đã tạm dừng đề tài',
        complete: 'Đã đánh dấu hoàn thành đề tài',
      };
      toast.success(msgs[action.type]);
      setAction(null);
      setComment('');
      await fetchProjects();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setProcessing(false);
    }
  }, [action, comment, processing, fetchProjects]);

  const vnd = (n?: number | null) =>
    n != null ? new Intl.NumberFormat('vi-VN').format(n) + ' tr.đ' : null;

  const daysLeft = (endDate?: string) => {
    if (!endDate) return null;
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thực hiện đề tài</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài đã phê duyệt (chờ kích hoạt) và đang trong giai đoạn thực hiện.
          </p>
        </div>
      </div>

      <ActivityNav active="execution" />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm đề tài..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* APPROVED — chờ kích hoạt */}
          {approved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-500 inline-block" />
                Đã phê duyệt — chờ kích hoạt ({approved.length})
              </h2>
              <div className="space-y-2">
                {approved.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    action={action}
                    comment={comment}
                    processing={processing}
                    onView={() => router.push(`/dashboard/science/projects/${p.id}`)}
                    onAction={(type) => { setAction({ projectId: p.id, type }); setComment(''); }}
                    onCommentChange={setComment}
                    onConfirm={handleAction}
                    onCancel={() => { setAction(null); setComment(''); }}
                    vnd={vnd}
                    daysLeft={daysLeft}
                    availableActions={['activate']}
                  />
                ))}
              </div>
            </section>
          )}

          {/* IN_PROGRESS */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500 inline-block" />
                Đang thực hiện ({inProgress.length})
              </h2>
              <div className="space-y-2">
                {inProgress.map((p) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    action={action}
                    comment={comment}
                    processing={processing}
                    onView={() => router.push(`/dashboard/science/projects/${p.id}`)}
                    onAction={(type) => { setAction({ projectId: p.id, type }); setComment(''); }}
                    onCommentChange={setComment}
                    onConfirm={handleAction}
                    onCancel={() => { setAction(null); setComment(''); }}
                    onCouncil={() => router.push(`/dashboard/science/activities/councils/new?projectId=${p.id}&type=ACCEPTANCE`)}
                    vnd={vnd}
                    daysLeft={daysLeft}
                    availableActions={['pause', 'complete']}
                  />
                ))}
              </div>
            </section>
          )}

          {approved.length === 0 && inProgress.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Không có đề tài nào đang thực hiện hoặc chờ kích hoạt.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Sub-component: project row ────────────────────────────────────────────────

function ProjectRow({
  project, action, comment, processing,
  onView, onAction, onCommentChange, onConfirm, onCancel,
  onCouncil,
  vnd, daysLeft, availableActions,
}: {
  project: Project;
  action: ActionState | null;
  comment: string;
  processing: boolean;
  onView: () => void;
  onAction: (type: ActionType) => void;
  onCommentChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCouncil?: () => void;
  vnd: (n?: number | null) => string | null;
  daysLeft: (d?: string) => number | null;
  availableActions: ActionType[];
}) {
  const dl = daysLeft(project.endDate);
  const isActive = action?.projectId === project.id;

  return (
    <Card className={`transition-colors ${isActive ? 'border-violet-300 shadow-sm' : 'hover:border-gray-300'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-mono text-xs text-violet-600 font-semibold">{project.projectCode}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                project.status === 'APPROVED' ? 'bg-teal-100 text-teal-700' : 'bg-violet-100 text-violet-700'
              }`}>
                {project.status === 'APPROVED' ? 'Đã duyệt' : 'Đang thực hiện'}
              </span>
              <span className="text-xs text-gray-400">{CATEGORY_LABELS[project.category] ?? project.category}</span>
              <span className="text-xs text-gray-400">Phase: {PHASE_LABELS[project.phase] ?? project.phase}</span>
            </div>
            <div
              className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-violet-700 line-clamp-1"
              onClick={onView}
            >
              {project.title}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3 flex-wrap">
              <span>{project.principalInvestigator.rank && `${project.principalInvestigator.rank} `}{project.principalInvestigator.name}</span>
              {project.unit && <span>{project.unit.name}</span>}
              {vnd(project.budgetApproved) && <span>KP: {vnd(project.budgetApproved)}</span>}
              {project._count && (
                <>
                  <span className="flex items-center gap-1"><Milestone className="h-3 w-3" />{project._count.milestones} mốc</span>
                </>
              )}
              <Link
                href={`/dashboard/science/activities/budgets?projectId=${project.id}`}
                className="flex items-center gap-0.5 text-violet-500 hover:text-violet-700 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Xem ngân sách →
              </Link>
              {dl !== null && (
                <span className={`flex items-center gap-1 font-medium ${
                  dl < 0 ? 'text-red-600' : dl <= 30 ? 'text-orange-600' : 'text-gray-400'
                }`}>
                  <Clock className="h-3 w-3" />
                  {dl < 0 ? `Quá hạn ${Math.abs(dl)} ngày` : `Còn ${dl} ngày`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={onView} className="gap-1">
              <FileText className="h-3.5 w-3.5" /> Xem
            </Button>
            {onCouncil && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCouncil}
                className="gap-1 border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                <GavelIcon className="h-3.5 w-3.5" /> Lập HĐ nghiệm thu
              </Button>
            )}
            {availableActions.includes('activate') && (
              <Button size="sm" onClick={() => onAction('activate')} className="gap-1 bg-violet-600 hover:bg-violet-700">
                <PlayCircle className="h-3.5 w-3.5" /> Kích hoạt
              </Button>
            )}
            {availableActions.includes('pause') && (
              <Button variant="outline" size="sm" onClick={() => onAction('pause')} className="gap-1">
                <PauseCircle className="h-3.5 w-3.5" /> Tạm dừng
              </Button>
            )}
            {availableActions.includes('complete') && (
              <Button size="sm" onClick={() => onAction('complete')} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Hoàn thành
              </Button>
            )}
          </div>
        </div>

        {isActive && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
            <div className="text-sm font-medium text-gray-700">
              {action!.type === 'activate' && 'Kích hoạt đề tài — chuyển sang giai đoạn thực hiện'}
              {action!.type === 'pause' && 'Tạm dừng đề tài — nhập lý do'}
              {action!.type === 'complete' && 'Đánh dấu hoàn thành — chuyển sang nghiệm thu'}
            </div>
            <Textarea
              placeholder={action!.type === 'pause' ? 'Lý do tạm dừng (khuyến nghị)...' : 'Ghi chú (tuỳ chọn)...'}
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              rows={2}
              className="text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={processing}
                onClick={onConfirm}
                className={`gap-1 ${
                  action!.type === 'activate' ? 'bg-violet-600 hover:bg-violet-700'
                  : action!.type === 'complete' ? 'bg-emerald-600 hover:bg-emerald-700'
                  : ''
                }`}
              >
                {processing
                  ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  : action!.type === 'activate'
                  ? <PlayCircle className="h-3.5 w-3.5" />
                  : action!.type === 'complete'
                  ? <CheckCircle2 className="h-3.5 w-3.5" />
                  : <PauseCircle className="h-3.5 w-3.5" />
                }
                {action!.type === 'activate' ? 'Xác nhận kích hoạt'
                  : action!.type === 'complete' ? 'Xác nhận hoàn thành'
                  : 'Xác nhận tạm dừng'}
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancel}>Hủy</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityNav({ active }: { active: 'proposals' | 'intake' | 'review' | 'execution' | 'progress' | 'acceptance' | 'archive' | 'councils' | 'budgets' }) {
  const items = [
    { key: 'proposals',  label: 'Đề xuất',    href: '/dashboard/science/activities/proposals' },
    { key: 'intake',     label: 'Tiếp nhận',  href: '/dashboard/science/activities/intake' },
    { key: 'review',     label: 'Thẩm định',  href: '/dashboard/science/activities/review' },
    { key: 'execution',  label: 'Thực hiện',  href: '/dashboard/science/activities/execution' },
    { key: 'progress',   label: 'Tiến độ',    href: '/dashboard/science/activities/progress' },
    { key: 'acceptance', label: 'Nghiệm thu', href: '/dashboard/science/activities/acceptance' },
    { key: 'archive',    label: 'Lưu trữ',    href: '/dashboard/science/activities/archive' },
    { key: 'councils',   label: 'Hội đồng',   href: '/dashboard/science/activities/councils' },
    { key: 'budgets',    label: 'Ngân sách',  href: '/dashboard/science/activities/budgets' },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
