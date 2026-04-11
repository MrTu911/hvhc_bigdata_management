'use client';

/**
 * M23 — Science Councils & Evaluation: Chi tiết hội đồng
 *
 * Tabs:
 *   1. Thông tin  — thông tin chung hội đồng + đề tài
 *   2. Thành viên — danh sách thành viên, vai trò
 *   3. Phản biện  — điểm chấm của thành viên (closed-review: mỗi reviewer chỉ thấy của mình)
 *   4. Bỏ phiếu   — tổng hợp phiếu bầu (chỉ chairman/admin)
 *   5. Kết luận   — finalize kết quả PASS/FAIL/REVISE
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, Users, ClipboardList, CheckCircle2, Vote, FileText,
  RefreshCw, ChevronRight, Download, Loader2,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  REVIEW:     'Thẩm định',
  ACCEPTANCE: 'Nghiệm thu',
  FINAL:      'Kết luận cuối',
};

const RESULT_LABELS: Record<string, string> = {
  PASS:   'Đạt',
  FAIL:   'Không đạt',
  REVISE: 'Cần bổ sung',
};

const RESULT_BADGE: Record<string, string> = {
  PASS:   'bg-emerald-100 text-emerald-700',
  FAIL:   'bg-red-100 text-red-700',
  REVISE: 'bg-amber-100 text-amber-700',
};

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHAIRMAN:  'Chủ tịch',
  SECRETARY: 'Thư ký',
  REVIEWER:  'Phản biện',
  EXPERT:    'Chuyên gia',
};

const CRITERIA_LABELS: Record<string, string> = {
  SCIENTIFIC_VALUE: 'Giá trị khoa học',
  FEASIBILITY:      'Tính khả thi',
  BUDGET:           'Kinh phí',
  TEAM:             'Nhóm nghiên cứu',
  OUTCOME:          'Kết quả dự kiến',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface CouncilMember {
  id: string;
  role: string;
  vote?: string | null;
  user: { id: string; name: string; rank?: string | null; academicTitle?: string | null };
}

interface CouncilReview {
  id: string;
  memberId: string;
  criteria: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}

interface CouncilDetail {
  id: string;
  type: string;
  meetingDate: string | null;
  result: string | null;
  overallScore: number | null;
  conclusionText: string | null;
  minutesFilePath: string | null;
  createdAt: string;
  project: { id: string; projectCode: string; title: string };
  chairman: { id: string; name: string; rank?: string | null } | null;
  secretary: { id: string; name: string; rank?: string | null } | null;
  members: CouncilMember[];
  reviews: CouncilReview[];
}

interface VoteSummary {
  total: number;
  voted: number;
  voteCounts: { PASS: number; FAIL: number; REVISE: number; PENDING: number };
  suggestedResult: 'PASS' | 'FAIL' | null;
  voteDetails: {
    memberId: string;
    userId: string;
    userName: string;
    role: string;
    vote: string | null;
  }[];
}

type TabKey = 'info' | 'members' | 'reviews' | 'votes' | 'conclusion';

// ─── Tab component ────────────────────────────────────────────────────────────

function Tabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  const items: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'info',       label: 'Thông tin',  icon: <FileText className="h-3.5 w-3.5" /> },
    { key: 'members',    label: 'Thành viên', icon: <Users className="h-3.5 w-3.5" /> },
    { key: 'reviews',    label: 'Phản biện',  icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: 'votes',      label: 'Bỏ phiếu',  icon: <Vote className="h-3.5 w-3.5" /> },
    { key: 'conclusion', label: 'Kết luận',   icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  ];
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1 overflow-x-auto">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors whitespace-nowrap ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Thông tin ───────────────────────────────────────────────────────────

function InfoTab({ council }: { council: CouncilDetail }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Hội đồng</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Loại" value={COUNCIL_TYPE_LABELS[council.type] ?? council.type} />
          <Row label="Ngày họp" value={council.meetingDate ? new Date(council.meetingDate).toLocaleDateString('vi-VN') : 'Chưa xác định'} />
          <Row label="Chủ tịch" value={council.chairman?.name ?? '—'} />
          <Row label="Thư ký"   value={council.secretary?.name ?? '—'} />
          <Row label="Số thành viên" value={String(council.members.length)} />
          {council.result && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-32 shrink-0">Kết quả:</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULT_BADGE[council.result] ?? 'bg-gray-100 text-gray-600'}`}>
                {RESULT_LABELS[council.result] ?? council.result}
              </span>
            </div>
          )}
          {council.overallScore != null && (
            <Row label="Điểm trung bình" value={council.overallScore.toFixed(2)} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Đề tài liên quan</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Mã đề tài" value={council.project.projectCode} />
          <div>
            <span className="text-gray-500">Tên đề tài:</span>
            <p className="mt-1 text-gray-800">{council.project.title}</p>
          </div>
          <div className="pt-1">
            <Link
              href={`/dashboard/science/activities/progress?projectId=${council.project.id}`}
              className="text-xs text-violet-600 hover:underline flex items-center gap-1"
            >
              Xem đề tài <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {council.conclusionText && (
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Kết luận hội đồng</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{council.conclusionText}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Tab: Thành viên ──────────────────────────────────────────────────────────

function MembersTab({ members }: { members: CouncilMember[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Họ tên</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Học hàm / Cấp bậc</th>
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{m.user.name}</td>
                <td className="px-4 py-2.5 text-gray-500">
                  {[m.user.academicTitle, m.user.rank].filter(Boolean).join(' / ') || '—'}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    m.role === 'CHAIRMAN'  ? 'bg-violet-100 text-violet-700' :
                    m.role === 'SECRETARY' ? 'bg-blue-100 text-blue-700' :
                    m.role === 'EXPERT'    ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {MEMBER_ROLE_LABELS[m.role] ?? m.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ─── Tab: Phản biện ───────────────────────────────────────────────────────────

function ReviewsTab({
  reviews,
  members,
}: {
  reviews: CouncilReview[];
  members: CouncilMember[];
}) {
  const memberMap: Record<string, CouncilMember> = {};
  for (const m of members) memberMap[m.id] = m;

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
        <ClipboardList className="h-8 w-8 opacity-30" />
        <p className="text-sm">Chưa có phiếu chấm nào (hoặc bạn chưa nộp phiếu chấm)</p>
      </div>
    );
  }

  // Group by memberId
  const grouped: Record<string, CouncilReview[]> = {};
  for (const r of reviews) {
    if (!grouped[r.memberId]) grouped[r.memberId] = [];
    grouped[r.memberId].push(r);
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([memberId, scores]) => {
        const member = memberMap[memberId];
        const avg = scores.reduce((s, r) => s + r.score, 0) / scores.length;
        return (
          <Card key={memberId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{member?.user.name ?? 'Thành viên'}</span>
                <span className="text-violet-600 font-semibold">ĐTB: {avg.toFixed(2)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Tiêu chí</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-600 w-20">Điểm</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Nhận xét</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{CRITERIA_LABELS[r.criteria] ?? r.criteria}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`font-semibold ${r.score >= 7 ? 'text-emerald-600' : r.score >= 5 ? 'text-amber-600' : 'text-red-500'}`}>
                          {r.score}
                        </span>
                        <span className="text-gray-400">/10</span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs">{r.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Tab: Bỏ phiếu ───────────────────────────────────────────────────────────

function VotesTab({ councilId, hasResult }: { councilId: string; hasResult: boolean }) {
  const [summary, setSummary] = useState<VoteSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const loadVotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/councils/${councilId}/votes`);
      if (res.status === 403) { setForbidden(true); return; }
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSummary(json.data);
    } catch {
      toast.error('Không thể tải phiếu bầu');
    } finally {
      setLoading(false);
    }
  }, [councilId]);

  useEffect(() => { loadVotes(); }, [loadVotes]);

  if (forbidden) {
    return (
      <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
        <Vote className="h-8 w-8 opacity-30" />
        <p className="text-sm">Bạn không có quyền xem phiếu bầu (chỉ dành cho Chủ tịch HĐ / Quản trị)</p>
      </div>
    );
  }
  if (loading) return <div className="flex justify-center py-12 text-gray-400 text-sm">Đang tải...</div>;
  if (!summary) return null;

  const { total, voted, voteCounts, suggestedResult, voteDetails } = summary;
  const threshold = Math.ceil((voted * 2) / 3);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Tổng thành viên" value={String(total)} />
        <StatCard label="Đã bỏ phiếu"    value={String(voted)} />
        <StatCard label="Phiếu ĐẠT"      value={String(voteCounts.PASS)}   color="emerald" />
        <StatCard label="Phiếu KHÔNG ĐẠT" value={String(voteCounts.FAIL)}  color="red" />
      </div>

      {/* Threshold info */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
        <strong>Quy tắc 2/3:</strong> Cần ít nhất <strong>{threshold}</strong> phiếu ĐẠT trên tổng {voted} phiếu để thông qua.
        {suggestedResult && (
          <span className={`ml-2 font-semibold ${suggestedResult === 'PASS' ? 'text-emerald-700' : 'text-red-600'}`}>
            → Gợi ý: {RESULT_LABELS[suggestedResult]}
          </span>
        )}
        {!suggestedResult && voted > 0 && (
          <span className="ml-2 text-amber-700"> → Chưa đủ túc số (phiếu trắng / REVISE)</span>
        )}
      </div>

      {/* Vote detail table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Thành viên</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Vai trò</th>
                <th className="text-center px-4 py-2.5 font-medium text-gray-600">Phiếu bầu</th>
              </tr>
            </thead>
            <tbody>
              {voteDetails.map((v) => (
                <tr key={v.memberId} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{v.userName}</td>
                  <td className="px-4 py-2.5 text-gray-500">{MEMBER_ROLE_LABELS[v.role] ?? v.role}</td>
                  <td className="px-4 py-2.5 text-center">
                    {v.vote ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULT_BADGE[v.vote] ?? 'bg-gray-100 text-gray-600'}`}>
                        {RESULT_LABELS[v.vote] ?? v.vote}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Chưa bỏ phiếu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Kết luận ────────────────────────────────────────────────────────────

function ConclusionTab({
  council,
  onFinalized,
}: {
  council: CouncilDetail;
  onFinalized: () => void;
}) {
  const [result,         setResult]         = useState(council.result ?? '');
  const [overallScore,   setOverallScore]   = useState(council.overallScore != null ? String(council.overallScore) : '');
  const [conclusionText, setConclusionText] = useState(council.conclusionText ?? '');
  const [submitting,     setSubmitting]     = useState(false);

  const canFinalize = !council.result;

  const handleSubmit = async () => {
    if (!result || !conclusionText) {
      toast.error('Vui lòng chọn kết quả và nhập nội dung kết luận');
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { result, conclusionText };
      if (overallScore) body.overallScore = Number(overallScore);

      const res = await fetch(`/api/science/councils/${council.id}/acceptance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Lỗi ghi nhận kết luận');
      }
      toast.success('Đã ghi nhận kết luận hội đồng');
      onFinalized();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canFinalize) {
    return (
      <div className="space-y-4">
        <div className={`rounded-lg border p-4 flex items-center justify-between ${RESULT_BADGE[council.result!] ?? 'bg-gray-50'}`}>
          <p className="font-semibold text-sm">
            Kết quả: {RESULT_LABELS[council.result!] ?? council.result}
            {council.overallScore != null && (
              <span className="ml-2 font-normal text-gray-700">— Điểm: {council.overallScore.toFixed(2)}</span>
            )}
          </p>
          <ExportButton councilId={council.id} />
        </div>
        {council.conclusionText && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Nội dung kết luận</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{council.conclusionText}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Ghi nhận kết luận hội đồng</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Kết quả *</label>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            >
              <option value="">Chọn kết quả...</option>
              {Object.entries(RESULT_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Điểm trung bình (nếu có)</label>
            <Input
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={overallScore}
              onChange={(e) => setOverallScore(e.target.value)}
              placeholder="0.0 – 10.0"
              className="text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-600">Nội dung kết luận *</label>
          <Textarea
            value={conclusionText}
            onChange={(e) => setConclusionText(e.target.value)}
            rows={5}
            placeholder="Nhập nội dung kết luận của hội đồng..."
            className="text-sm resize-none"
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
          >
            <CheckCircle2 className="h-4 w-4" />
            {submitting ? 'Đang lưu...' : 'Ghi nhận kết luận'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Export button ────────────────────────────────────────────────────────────

function ExportButton({ councilId }: { councilId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/science/councils/${councilId}/export`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ outputFormat: 'DOCX' }),
      });

      if (res.status === 403) {
        toast.error('Bạn không có quyền xuất biên bản (chỉ Chủ tịch HĐ / Quản trị)');
        return;
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Lỗi xuất biên bản');

      if (json.data?.downloadUrl) {
        // Full M18 export — mở link download
        window.open(json.data.downloadUrl, '_blank');
        toast.success('Đã tạo file — đang tải xuống');
      } else if (json.meta?.mode === 'json_summary') {
        // Fallback JSON — tải xuống dưới dạng .json
        const blob  = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url   = URL.createObjectURL(blob);
        const a     = document.createElement('a');
        a.href      = url;
        a.download  = `bien-ban-hoi-dong-${councilId.slice(-6)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Đã xuất biên bản (JSON — chưa có template M18)');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất biên bản');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
    >
      {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {exporting ? 'Đang xuất...' : 'Xuất biên bản'}
    </Button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 w-36 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const colorClass =
    color === 'emerald' ? 'text-emerald-600' :
    color === 'red'     ? 'text-red-500' :
    'text-violet-600';
  return (
    <div className="rounded-lg border bg-white p-3 text-center">
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CouncilDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [council, setCouncil] = useState<CouncilDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  const loadCouncil = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/science/councils/${id}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setCouncil(json.data);
    } catch {
      toast.error('Không thể tải thông tin hội đồng');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadCouncil(); }, [loadCouncil]);

  if (loading) return <div className="flex justify-center py-16 text-gray-400">Đang tải...</div>;
  if (!council) return <div className="flex justify-center py-16 text-red-400">Không tìm thấy hội đồng</div>;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/science/activities/councils" className="hover:text-violet-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Danh sách hội đồng
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">
          {COUNCIL_TYPE_LABELS[council.type] ?? council.type} — {council.project.projectCode}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              {COUNCIL_TYPE_LABELS[council.type] ?? council.type}
            </span>
            {council.result ? (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RESULT_BADGE[council.result] ?? 'bg-gray-100 text-gray-600'}`}>
                {RESULT_LABELS[council.result] ?? council.result}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Đang tiến hành</span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mt-1">{council.project.title}</h1>
          <p className="text-sm text-gray-500">{council.project.projectCode}</p>
        </div>
        <div className="flex gap-2">
          {council.result && <ExportButton councilId={council.id} />}
          <Button variant="outline" size="sm" onClick={loadCouncil} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      <div className="pt-1">
        {activeTab === 'info'       && <InfoTab council={council} />}
        {activeTab === 'members'    && <MembersTab members={council.members} />}
        {activeTab === 'reviews'    && <ReviewsTab reviews={council.reviews} members={council.members} />}
        {activeTab === 'votes'      && <VotesTab councilId={council.id} hasResult={!!council.result} />}
        {activeTab === 'conclusion' && <ConclusionTab council={council} onFinalized={loadCouncil} />}
      </div>
    </div>
  );
}
