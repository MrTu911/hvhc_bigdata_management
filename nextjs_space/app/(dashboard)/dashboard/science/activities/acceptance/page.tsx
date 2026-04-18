'use client';

/**
 * M20 — Science Activities: Acceptance (Nghiệm thu / Lưu trữ)
 * Hiển thị đề tài COMPLETED (chưa lưu trữ — phase ≠ ARCHIVED).
 * Actor quản lý có thể:
 *   - Xem lịch sử nghiệm thu
 *   - Kích hoạt lưu trữ (POST /archive) → phase → ARCHIVED
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
  Search, FileText, RefreshCw, CheckCircle2, Archive,
  ClipboardCheck, ChevronDown, ChevronUp, ClipboardList,
} from 'lucide-react';

const REVIEW_TYPE_LABELS: Record<string, string> = {
  THAM_DINH_DE_CUONG:  'Thẩm định đề cương',
  KIEM_TRA_GIUA_KY:    'Kiểm tra giữa kỳ',
  NGHIEM_THU_CO_SO:    'Nghiệm thu cơ sở',
  NGHIEM_THU_CAP_HV:   'Nghiệm thu cấp HV',
  NGHIEM_THU_CAP_TREN: 'Nghiệm thu cấp trên',
};

const DECISION_BADGE: Record<string, string> = {
  PASSED:            'bg-emerald-100 text-emerald-700',
  FAILED:            'bg-red-100 text-red-700',
  REVISION_REQUIRED: 'bg-amber-100 text-amber-700',
};

const DECISION_LABELS: Record<string, string> = {
  PASSED:            'Đạt',
  FAILED:            'Không đạt',
  REVISION_REQUIRED: 'Cần bổ sung',
};

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp BQP',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

interface Project {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  status: string;
  phase: string;
  completionScore?: number;
  completionGrade?: string;
  principalInvestigator: { id: string; name: string; rank?: string };
  unit?: { name: string };
}

interface ReviewRecord {
  id: string;
  reviewType: string;
  reviewDate: string;
  decision: string;
  score?: number;
  grade?: string;
  comments?: string;
}

type PanelMode = 'history' | 'formal' | 'archive' | null;

export default function AcceptancePage() {
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
      const res = await fetch(`/api/science/projects?status=COMPLETED&pageSize=100${kw}`).then(r => r.json());
      if (!res.success) throw new Error('Lỗi tải dữ liệu');
      const items: Project[] = res.data.items ?? res.data;
      // Chỉ hiển thị đề tài COMPLETED chưa lưu trữ
      setProjects(items.filter((p) => p.phase !== 'ARCHIVED'));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hoàn thành & Lưu trữ</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Đề tài đã hoàn thành, chờ xét duyệt lưu trữ chính thức.
          </p>
        </div>
      </div>

      <ActivityNav active="acceptance" />

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
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không có đề tài đã hoàn thành chờ lưu trữ.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <Card key={p.id} className={`transition-colors ${isExpanded ? 'border-violet-300 shadow-sm' : 'hover:border-gray-300'}`}>
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs text-violet-600 font-semibold">{p.projectCode}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700">
                          Hoàn thành
                        </span>
                        <span className="text-xs text-gray-400">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                        {p.completionGrade && (
                          <span className="text-xs font-medium text-gray-600">
                            Xếp loại: {p.completionGrade}
                            {p.completionScore != null && ` (${p.completionScore}/10)`}
                          </span>
                        )}
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/science/projects/${p.id}`)} className="gap-1">
                        <FileText className="h-3.5 w-3.5" /> Xem
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => toggleExpand(p.id, 'history')}
                        className="gap-1"
                      >
                        {isExpanded && panelMode === 'history'
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />}
                        Lịch sử NT
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => toggleExpand(p.id, 'formal')}
                        className="gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        NT Chính thức
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => toggleExpand(p.id, 'archive')}
                        className="gap-1 bg-violet-600 hover:bg-violet-700"
                      >
                        <Archive className="h-3.5 w-3.5" /> Lưu trữ
                      </Button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {panelMode === 'history' && (
                        <AcceptanceHistoryPanel
                          projectId={p.id}
                          onClose={() => { setExpandedId(null); setPanelMode(null); }}
                        />
                      )}
                      {panelMode === 'formal' && (
                        <FormalAcceptancePanel
                          projectId={p.id}
                          onClose={() => { setExpandedId(null); setPanelMode(null); }}
                        />
                      )}
                      {panelMode === 'archive' && (
                        <ArchivePanel
                          projectId={p.id}
                          project={p}
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

// ─── Acceptance History Panel ──────────────────────────────────────────────────

function AcceptanceHistoryPanel({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [records, setRecords] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/projects/${projectId}/acceptance`)
      .then(r => r.json())
      .then((res) => setRecords(res.success ? res.data : []))
      .catch(() => toast.error('Lỗi tải lịch sử'))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> Lịch sử nghiệm thu
        </span>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">Đóng</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-violet-400 border-t-transparent rounded-full" />
        </div>
      ) : records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Chưa có biên bản nghiệm thu.</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-md p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">
                      {REVIEW_TYPE_LABELS[r.reviewType] ?? r.reviewType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DECISION_BADGE[r.decision] ?? 'bg-gray-100 text-gray-600'}`}>
                      {DECISION_LABELS[r.decision] ?? r.decision}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.reviewDate).toLocaleDateString('vi-VN')}
                    {r.grade && ` · ${r.grade}`}
                    {r.score != null && ` · ${r.score}/10`}
                  </p>
                  {r.comments && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.comments}</p>
                  )}
                </div>
                <ClipboardCheck className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Formal Acceptance Panel (NckhAcceptance) ─────────────────────────────────

interface FormalAcceptance {
  id: string;
  acceptanceDate: string;
  acceptanceType: string;
  result: string;
  finalScore?: number | null;
  grade?: string | null;
  conditions?: string | null;
  signedMinutesUrl?: string | null;
  createdAt: string;
  acceptedBy: { id: string; fullName: string };
  council?: { id: string; type: string } | null;
}

const ACCEPTANCE_TYPE_LABELS: Record<string, string> = {
  PRELIMINARY: 'Sơ bộ',
  FINAL:       'Chính thức',
};

const ACCEPTANCE_RESULT_LABELS: Record<string, string> = {
  PASS:        'Đạt',
  FAIL:        'Không đạt',
  CONDITIONAL: 'Đạt có điều kiện',
};

const ACCEPTANCE_RESULT_BADGE: Record<string, string> = {
  PASS:        'bg-emerald-100 text-emerald-700',
  FAIL:        'bg-red-100 text-red-700',
  CONDITIONAL: 'bg-amber-100 text-amber-700',
};

function FormalAcceptancePanel({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [record, setRecord]       = useState<FormalAcceptance | null | undefined>(undefined);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    acceptanceDate:  new Date().toISOString().split('T')[0],
    acceptanceType:  'FINAL',
    result:          'PASS',
    finalScore:      '',
    grade:           '',
    conditions:      '',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/science/projects/${projectId}/formal-acceptance`)
      .then(r => r.json())
      .then((res) => setRecord(res.success ? res.data : null))
      .catch(() => toast.error('Lỗi tải nghiệm thu chính thức'))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSubmit = async () => {
    if (!form.acceptanceDate || !form.result) { toast.error('Vui lòng điền đầy đủ thông tin bắt buộc'); return; }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        acceptanceDate: form.acceptanceDate,
        acceptanceType: form.acceptanceType,
        result:         form.result,
        grade:          form.grade || undefined,
        conditions:     form.conditions || undefined,
      };
      if (form.finalScore) body.finalScore = Number(form.finalScore);

      const res = await fetch(`/api/science/projects/${projectId}/formal-acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());
      if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : 'Lỗi ghi nhận');
      toast.success('Đã ghi nhận nghiệm thu chính thức');
      setRecord(res.data);
      setShowForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-emerald-600" /> Nghiệm thu chính thức
        </span>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">Đóng</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-emerald-400 border-t-transparent rounded-full" />
        </div>
      ) : record ? (
        // Show existing formal acceptance
        <div className="bg-white border border-gray-100 rounded-md p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${ACCEPTANCE_RESULT_BADGE[record.result] ?? 'bg-gray-100 text-gray-700'}`}>
              {ACCEPTANCE_RESULT_LABELS[record.result] ?? record.result}
            </span>
            <span className="text-xs text-gray-500">
              {ACCEPTANCE_TYPE_LABELS[record.acceptanceType] ?? record.acceptanceType}
            </span>
            {record.finalScore != null && (
              <span className="text-xs font-medium text-gray-700">Điểm: {record.finalScore}/10</span>
            )}
            {record.grade && (
              <span className="text-xs font-medium text-gray-700">Xếp loại: {record.grade}</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Ngày nghiệm thu: {new Date(record.acceptanceDate).toLocaleDateString('vi-VN')} · Người duyệt: {record.acceptedBy.fullName}
          </p>
          {record.conditions && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
              <strong>Điều kiện:</strong> {record.conditions}
            </p>
          )}
          {record.signedMinutesUrl && (
            <a href={record.signedMinutesUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-violet-600 hover:underline">
              Xem biên bản ký
            </a>
          )}
        </div>
      ) : (
        // No formal acceptance yet
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-3">Chưa có nghiệm thu chính thức.</p>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)} className="gap-1 bg-emerald-600 hover:bg-emerald-700">
              <ClipboardCheck className="h-3.5 w-3.5" /> Ghi nhận nghiệm thu
            </Button>
          )}
        </div>
      )}

      {showForm && !record && (
        <div className="bg-emerald-50 rounded-md p-3 space-y-3 border border-emerald-200">
          <p className="text-xs font-medium text-emerald-700">Nghiệm thu chính thức</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Ngày nghiệm thu *</label>
              <Input type="date" value={form.acceptanceDate} onChange={(e) => setForm({ ...form, acceptanceDate: e.target.value })} className="text-sm h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Loại nghiệm thu</label>
              <select
                value={form.acceptanceType}
                onChange={(e) => setForm({ ...form, acceptanceType: e.target.value })}
                className="w-full text-sm h-8 rounded-md border border-gray-300 px-2 bg-white"
              >
                {Object.entries(ACCEPTANCE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Kết quả *</label>
              <select
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
                className="w-full text-sm h-8 rounded-md border border-gray-300 px-2 bg-white"
              >
                {Object.entries(ACCEPTANCE_RESULT_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Điểm (0–10)</label>
              <Input type="number" min={0} max={10} step={0.1} value={form.finalScore} onChange={(e) => setForm({ ...form, finalScore: e.target.value })} placeholder="VD: 8.5" className="text-sm h-8" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Xếp loại</label>
              <Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="VD: Khá, Giỏi..." className="text-sm h-8" />
            </div>
          </div>
          {form.result === 'CONDITIONAL' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Điều kiện bổ sung</label>
              <Textarea value={form.conditions} onChange={(e) => setForm({ ...form, conditions: e.target.value })} rows={2} placeholder="Nêu rõ các điều kiện..." className="text-sm resize-none" />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-xs">
              {submitting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ClipboardCheck className="h-3 w-3" />}
              Ghi nhận
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="text-xs">Hủy</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Archive Panel ─────────────────────────────────────────────────────────────

function ArchivePanel({
  projectId, project, onDone,
}: {
  projectId: string;
  project: Project;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    completionScore: project.completionScore?.toString() ?? '',
    completionGrade: project.completionGrade ?? '',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleArchive = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        comment: form.comment || undefined,
        completionGrade: form.completionGrade || undefined,
      };
      if (form.completionScore) body.completionScore = parseFloat(form.completionScore);

      const res = await fetch(`/api/science/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (!res.success) throw new Error(typeof res.error === 'string' ? res.error : 'Lỗi lưu trữ đề tài');
      toast.success('Đề tài đã được lưu trữ thành công');
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
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Archive className="h-4 w-4" /> Lưu trữ đề tài
        </span>
        <Button size="sm" variant="ghost" onClick={onDone} className="text-xs">Đóng</Button>
      </div>

      <div className="bg-gray-50 rounded-md p-4 space-y-3 border border-gray-200">
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <p className="text-xs text-amber-700">
            Lưu trữ là thao tác cuối cùng. Sau khi lưu trữ, đề tài chuyển sang trạng thái <strong>ARCHIVED</strong> và không thể chỉnh sửa.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Điểm hoàn thành (0–10)</label>
            <Input
              type="number" min="0" max="10" step="0.1"
              placeholder="VD: 8.5"
              value={form.completionScore}
              onChange={(e) => setForm({ ...form, completionScore: e.target.value })}
              className="text-sm h-8"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Xếp loại</label>
            <Input
              placeholder="VD: Khá, Giỏi, Xuất sắc..."
              value={form.completionGrade}
              onChange={(e) => setForm({ ...form, completionGrade: e.target.value })}
              className="text-sm h-8"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Ghi chú lưu trữ</label>
          <Textarea
            placeholder="Ghi chú của ban quản lý khi lưu trữ..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            rows={2}
            className="text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button
            size="sm" onClick={handleArchive} disabled={submitting}
            className="gap-1 bg-violet-600 hover:bg-violet-700"
          >
            {submitting
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Archive className="h-3.5 w-3.5" />}
            Xác nhận lưu trữ
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
