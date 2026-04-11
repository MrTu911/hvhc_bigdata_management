'use client';

/**
 * M20 — Science Activities: Progress
 * Hiển thị đề tài IN_PROGRESS và PAUSED với:
 *   - Quản lý mốc tiến độ (milestone): thêm, cập nhật trạng thái
 *   - Nộp nghiệm thu (POST /acceptance): decision PASSED → project auto→COMPLETED
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
  Search, FileText, RefreshCw, ChevronDown, ChevronUp,
  Plus, CheckCircle2, Clock, Circle, AlertCircle, ClipboardCheck,
  Activity, Calendar,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const MILESTONE_STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING:     <Circle     className="h-3.5 w-3.5 text-gray-400" />,
  IN_PROGRESS: <Clock      className="h-3.5 w-3.5 text-blue-500" />,
  COMPLETED:   <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
  OVERDUE:     <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
  CANCELLED:   <Circle     className="h-3.5 w-3.5 text-gray-300" />,
};

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  PENDING:     'Chờ',
  IN_PROGRESS: 'Đang làm',
  COMPLETED:   'Hoàn thành',
  OVERDUE:     'Quá hạn',
  CANCELLED:   'Huỷ',
};

const REVIEW_TYPE_LABELS: Record<string, string> = {
  THAM_DINH_DE_CUONG:   'Thẩm định đề cương',
  KIEM_TRA_GIUA_KY:     'Kiểm tra giữa kỳ',
  NGHIEM_THU_CO_SO:     'Nghiệm thu cơ sở',
  NGHIEM_THU_CAP_HV:    'Nghiệm thu cấp HV',
  NGHIEM_THU_CAP_TREN:  'Nghiệm thu cấp trên',
};

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  status: string;
  phase: string;
  endDate?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
}

interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  note?: string;
}

type PanelMode = 'milestones' | 'acceptance' | null;

export default function ProgressPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const kw = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
      const [r1, r2] = await Promise.all([
        fetch(`/api/science/projects?status=IN_PROGRESS&pageSize=100${kw}`).then(r => r.json()),
        fetch(`/api/science/projects?status=PAUSED&pageSize=100${kw}`).then(r => r.json()),
      ]);
      const all = [
        ...(r1.success ? (r1.data.items ?? r1.data) : []),
        ...(r2.success ? (r2.data.items ?? r2.data) : []),
      ];
      setProjects(all);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const toggleExpand = (id: string, mode: PanelMode) => {
    if (expandedId === id && panelMode === mode) {
      setExpandedId(null);
      setPanelMode(null);
    } else {
      setExpandedId(id);
      setPanelMode(mode);
    }
  };

  const daysLeft = (endDate?: string) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tiến độ thực hiện</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý mốc tiến độ và nộp nghiệm thu cho đề tài đang thực hiện.
          </p>
        </div>
      </div>

      <ActivityNav active="progress" />

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
      ) : projects.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có đề tài đang thực hiện.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const dl = daysLeft(p.endDate);
            const isExpanded = expandedId === p.id;
            return (
              <Card key={p.id} className={`transition-colors ${isExpanded ? 'border-violet-300 shadow-sm' : 'hover:border-gray-300'}`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-violet-600 font-semibold">{p.projectCode}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          p.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'
                        }`}>
                          {p.status === 'PAUSED' ? 'Tạm dừng' : 'Đang thực hiện'}
                        </span>
                        <span className="text-xs text-gray-400">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                      </div>
                      <div
                        className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-violet-700 line-clamp-1"
                        onClick={() => router.push(`/dashboard/science/projects/${p.id}`)}
                      >
                        {p.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>
                          {p.principalInvestigator.rank && `${p.principalInvestigator.rank} `}
                          {p.principalInvestigator.name}
                        </span>
                        {p.unit && <span>{p.unit.name}</span>}
                        {dl !== null && (
                          <span className={`flex items-center gap-1 font-medium ${
                            dl < 0 ? 'text-red-600' : dl <= 30 ? 'text-orange-600' : 'text-gray-400'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {dl < 0 ? `Quá hạn ${Math.abs(dl)} ngày` : `Còn ${dl} ngày`}
                          </span>
                        )}
                        <Link
                          href={`/dashboard/science/activities/budgets?projectId=${p.id}`}
                          className="text-violet-500 hover:text-violet-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ngân sách →
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/science/projects/${p.id}`)} className="gap-1">
                        <FileText className="h-3.5 w-3.5" /> Xem
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => toggleExpand(p.id, 'milestones')}
                        className="gap-1"
                      >
                        {isExpanded && panelMode === 'milestones' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        Mốc tiến độ
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleExpand(p.id, 'acceptance')}
                        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        Nghiệm thu
                      </Button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {panelMode === 'milestones' && (
                        <MilestonesPanel
                          projectId={p.id}
                          onDone={() => { setExpandedId(null); setPanelMode(null); }}
                        />
                      )}
                      {panelMode === 'acceptance' && (
                        <AcceptancePanel
                          projectId={p.id}
                          onDone={() => { setExpandedId(null); setPanelMode(null); fetchProjects(); }}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Milestones Panel ──────────────────────────────────────────────────────────

function MilestonesPanel({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: '', dueDate: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchMilestones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/projects/${projectId}/milestones`).then(r => r.json());
      setMilestones(res.success ? res.data : []);
    } catch {
      toast.error('Lỗi tải mốc tiến độ');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const handleAdd = async () => {
    if (!addForm.title.trim() || !addForm.dueDate) {
      toast.error('Cần nhập tên mốc và ngày hạn');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/science/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: addForm.title, dueDate: addForm.dueDate, note: addForm.note || undefined }),
      }).then(r => r.json());
      if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : 'Lỗi thêm mốc');
      toast.success('Đã thêm mốc tiến độ');
      setShowAdd(false);
      setAddForm({ title: '', dueDate: '', note: '' });
      await fetchMilestones();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (milestoneId: string, status: string) => {
    setUpdatingId(milestoneId);
    try {
      const res = await fetch(`/api/science/projects/${projectId}/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json());
      if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : 'Lỗi cập nhật');
      toast.success('Đã cập nhật mốc tiến độ');
      await fetchMilestones();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-4">
      <div className="animate-spin h-5 w-5 border-2 border-violet-400 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Mốc tiến độ ({milestones.length})</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAdd(!showAdd)} className="gap-1 text-xs">
            <Plus className="h-3 w-3" /> Thêm mốc
          </Button>
          <Button size="sm" variant="ghost" onClick={onDone} className="text-xs">Đóng</Button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-gray-50 rounded-md p-3 space-y-2 border border-gray-200">
          <p className="text-xs font-medium text-gray-600">Thêm mốc tiến độ mới</p>
          <Input
            placeholder="Tên mốc tiến độ *"
            value={addForm.title}
            onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
            className="text-sm h-8"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={addForm.dueDate}
              onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
              className="text-sm h-8 flex-1"
            />
            <Input
              placeholder="Ghi chú (tuỳ chọn)"
              value={addForm.note}
              onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
              className="text-sm h-8 flex-1"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 gap-1 text-xs">
              {submitting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Thêm
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs">Hủy</Button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có mốc tiến độ nào.</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => {
            const isOverdue = new Date(m.dueDate) < new Date() && m.status === 'PENDING';
            return (
              <div key={m.id} className="flex items-center gap-3 bg-white rounded border border-gray-100 px-3 py-2">
                <div className="flex-shrink-0">{MILESTONE_STATUS_ICONS[m.status] ?? <Circle className="h-3.5 w-3.5" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.status === 'CANCELLED' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {m.title}
                  </p>
                  <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {new Date(m.dueDate).toLocaleDateString('vi-VN')}
                    {isOverdue && ' — Quá hạn'}
                  </p>
                </div>
                <div className="flex-shrink-0 flex gap-1">
                  {m.status === 'PENDING' && (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs h-7 px-2"
                      disabled={updatingId === m.id}
                      onClick={() => handleUpdateStatus(m.id, 'IN_PROGRESS')}
                    >
                      Bắt đầu
                    </Button>
                  )}
                  {m.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      className="text-xs h-7 px-2 bg-emerald-600 hover:bg-emerald-700"
                      disabled={updatingId === m.id}
                      onClick={() => handleUpdateStatus(m.id, 'COMPLETED')}
                    >
                      {updatingId === m.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Hoàn thành'}
                    </Button>
                  )}
                  {(m.status === 'PENDING' || m.status === 'IN_PROGRESS') && isOverdue && (
                    <Button
                      size="sm" variant="outline"
                      className="text-xs h-7 px-2 text-red-600 border-red-200"
                      disabled={updatingId === m.id}
                      onClick={() => handleUpdateStatus(m.id, 'OVERDUE')}
                    >
                      Đánh quá hạn
                    </Button>
                  )}
                  <span className="text-xs text-gray-400 self-center ml-1">
                    {MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Acceptance (Nghiệm thu) Panel ─────────────────────────────────────────────

const REVIEW_TYPES = [
  'THAM_DINH_DE_CUONG', 'KIEM_TRA_GIUA_KY',
  'NGHIEM_THU_CO_SO', 'NGHIEM_THU_CAP_HV', 'NGHIEM_THU_CAP_TREN',
] as const;

function AcceptancePanel({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [form, setForm] = useState({
    reviewType: 'NGHIEM_THU_CO_SO',
    reviewDate: new Date().toISOString().split('T')[0],
    score: '',
    grade: '',
    comments: '',
    decision: 'PASSED',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        reviewType: form.reviewType,
        reviewDate: form.reviewDate,
        decision: form.decision,
        comments: form.comments || undefined,
        grade: form.grade || undefined,
      };
      if (form.score) body.score = parseFloat(form.score);

      const res = await fetch(`/api/science/projects/${projectId}/acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : 'Lỗi nộp nghiệm thu');

      const msg = form.decision === 'PASSED'
        ? 'Nghiệm thu đạt — đề tài đã chuyển sang Hoàn thành'
        : 'Đã ghi nhận kết quả nghiệm thu';
      toast.success(msg);
      onDone();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Nộp biên bản nghiệm thu</span>
        <Button size="sm" variant="ghost" onClick={onDone} className="text-xs">Đóng</Button>
      </div>

      <div className="bg-gray-50 rounded-md p-4 space-y-3 border border-gray-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Loại nghiệm thu *</label>
            <select
              value={form.reviewType}
              onChange={(e) => setForm({ ...form, reviewType: e.target.value })}
              className="w-full text-sm h-8 rounded-md border border-gray-300 px-2 bg-white"
            >
              {REVIEW_TYPES.map((t) => (
                <option key={t} value={t}>{REVIEW_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Ngày nghiệm thu *</label>
            <Input
              type="date"
              value={form.reviewDate}
              onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
              className="text-sm h-8"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Điểm (0–10)</label>
            <Input
              type="number" min="0" max="10" step="0.1"
              placeholder="VD: 8.5"
              value={form.score}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Xếp loại</label>
            <Input
              placeholder="VD: Khá, Giỏi..."
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Kết quả *</label>
            <select
              value={form.decision}
              onChange={(e) => setForm({ ...form, decision: e.target.value })}
              className="w-full text-sm h-8 rounded-md border border-gray-300 px-2 bg-white"
            >
              <option value="PASSED">Đạt</option>
              <option value="FAILED">Không đạt</option>
              <option value="REVISION_REQUIRED">Yêu cầu bổ sung</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Nhận xét</label>
          <Textarea
            placeholder="Nhận xét của hội đồng nghiệm thu..."
            value={form.comments}
            onChange={(e) => setForm({ ...form, comments: e.target.value })}
            rows={3}
            className="text-sm"
          />
        </div>

        {form.decision === 'PASSED' && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700">
              Kết quả <strong>Đạt</strong> sẽ tự động chuyển đề tài sang trạng thái <strong>Hoàn thành</strong>.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm" onClick={handleSubmit} disabled={submitting}
            className={`gap-1 ${form.decision === 'PASSED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-violet-600 hover:bg-violet-700'}`}
          >
            {submitting
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <ClipboardCheck className="h-3.5 w-3.5" />}
            Nộp nghiệm thu
          </Button>
          <Button size="sm" variant="ghost" onClick={onDone} disabled={submitting}>Hủy</Button>
        </div>
      </div>
    </div>
  );
}

// ─── ActivityNav ───────────────────────────────────────────────────────────────

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
