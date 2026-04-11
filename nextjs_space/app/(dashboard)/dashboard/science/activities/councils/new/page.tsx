'use client';

/**
 * M23 — Science Councils: Thành lập hội đồng khoa học
 *
 * Wizard 3 bước:
 *   1. Đề tài & loại HĐ  — chọn đề tài, loại hội đồng, ngày họp
 *   2. Thành viên        — chọn chủ tịch, thư ký, phản biện / chuyên gia
 *   3. Xác nhận          — review lại, submit → POST /api/science/councils
 *
 * Nhận query param ?expertUserId=<id> từ experts page để pre-select thành viên.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check, Search, Plus, X, Users, CalendarDays } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNCIL_TYPES = [
  { value: 'REVIEW',     label: 'Thẩm định đề cương' },
  { value: 'ACCEPTANCE', label: 'Nghiệm thu kết quả' },
  { value: 'FINAL',      label: 'Kết luận cuối cùng' },
] as const;

const MEMBER_ROLES = [
  { value: 'CHAIRMAN',  label: 'Chủ tịch' },
  { value: 'SECRETARY', label: 'Thư ký' },
  { value: 'REVIEWER',  label: 'Phản biện' },
  { value: 'EXPERT',    label: 'Chuyên gia' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectItem {
  id: string;
  projectCode: string;
  title: string;
  category: string;
  status: string;
}

interface ScientistItem {
  id: string;
  degree?: string;
  primaryField?: string;
  user: { id: string; name: string; rank?: string | null; academicTitle?: string | null; unitRelation?: { name: string } | null };
}

interface SelectedMember {
  userId: string;
  userName: string;
  role: 'CHAIRMAN' | 'SECRETARY' | 'REVIEWER' | 'EXPERT';
}

type Step = 1 | 2 | 3;

// ─── Step indicators ──────────────────────────────────────────────────────────

function StepBar({ step }: { step: Step }) {
  const steps = ['Đề tài & loại HĐ', 'Thành viên', 'Xác nhận'] as const;
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((label, i) => {
        const num = (i + 1) as Step;
        const active = step === num;
        const done = step > num;
        return (
          <div key={num} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              done   ? 'bg-emerald-100 text-emerald-700' :
              active ? 'bg-violet-600 text-white' :
              'bg-gray-100 text-gray-400'
            }`}>
              {done ? <Check className="h-3.5 w-3.5" /> : <span>{num}</span>}
              {label}
            </div>
            {i < 2 && <div className="w-6 h-px bg-gray-200 mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Đề tài & loại HĐ ────────────────────────────────────────────────

function Step1({
  projectId, setProjectId,
  councilType, setCouncilType,
  meetingDate, setMeetingDate,
  onNext,
}: {
  projectId: string; setProjectId: (v: string) => void;
  councilType: string; setCouncilType: (v: string) => void;
  meetingDate: string; setMeetingDate: (v: string) => void;
  onNext: () => void;
}) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [keyword,  setKeyword]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const searchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '50', page: '1' });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/science/projects?${params}`);
      const json = await res.json();
      setProjects(json.data ?? []);
    } catch {
      toast.error('Lỗi tải danh sách đề tài');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { searchProjects(); }, [searchProjects]);

  const canNext = !!projectId && !!councilType;

  return (
    <div className="space-y-5">
      {/* Loại HĐ */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Loại hội đồng *</label>
        <div className="grid grid-cols-3 gap-2">
          {COUNCIL_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setCouncilType(t.value)}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                councilType === t.value
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-violet-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ngày họp */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-gray-400" /> Ngày họp (tùy chọn)
        </label>
        <Input
          type="date"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
          className="max-w-xs text-sm"
        />
      </div>

      {/* Chọn đề tài */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Đề tài *</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, mã đề tài..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Đang tải...</div>
          ) : projects.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">Không tìm thấy đề tài</div>
          ) : projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProjectId(p.id)}
              className={`w-full text-left px-4 py-2.5 text-sm border-b last:border-0 transition-colors ${
                projectId === p.id
                  ? 'bg-violet-50 text-violet-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span className="font-mono text-xs text-gray-400 mr-2">{p.projectCode}</span>
              <span className="font-medium">{p.title}</span>
              <span className="ml-2 text-xs text-gray-400">({p.status})</span>
            </button>
          ))}
        </div>
        {projectId && (
          <p className="text-xs text-emerald-600">
            ✓ Đã chọn: {projects.find(p => p.id === projectId)?.title}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
        >
          Tiếp theo <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Thành viên ───────────────────────────────────────────────────────

function Step2({
  projectId,
  members,
  setMembers,
  onBack,
  onNext,
}: {
  projectId: string;
  members: SelectedMember[];
  setMembers: (m: SelectedMember[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [scientists, setScientists] = useState<ScientistItem[]>([]);
  const [keyword,    setKeyword]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [addingRole, setAddingRole] = useState<SelectedMember['role']>('REVIEWER');

  const searchScientists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageSize: '100', page: '1' });
      if (keyword) params.set('keyword', keyword);
      const res = await fetch(`/api/science/scientists?${params}`);
      const json = await res.json();
      setScientists(json.data ?? []);
    } catch {
      toast.error('Lỗi tải danh sách nhà khoa học');
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => { searchScientists(); }, [searchScientists]);

  const addMember = (scientist: ScientistItem) => {
    const userId = scientist.user.id;
    // Một user chỉ được ở một vai trò
    if (members.some((m) => m.userId === userId)) {
      toast.error('Thành viên này đã được chọn');
      return;
    }
    setMembers([...members, {
      userId,
      userName: scientist.user.name,
      role: addingRole,
    }]);
  };

  const removeMember = (userId: string) => {
    setMembers(members.filter((m) => m.userId !== userId));
  };

  const changeRole = (userId: string, role: SelectedMember['role']) => {
    setMembers(members.map((m) => m.userId === userId ? { ...m, role } : m));
  };

  const hasChairman  = members.some((m) => m.role === 'CHAIRMAN');
  const hasSecretary = members.some((m) => m.role === 'SECRETARY');
  const canNext = hasChairman && hasSecretary && members.length >= 3;

  return (
    <div className="space-y-5">
      {/* Selected members */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" /> Thành viên đã chọn ({members.length})
          </label>
          {!hasChairman  && <span className="text-xs text-amber-600">⚠ Chưa có Chủ tịch</span>}
          {!hasSecretary && <span className="text-xs text-amber-600">⚠ Chưa có Thư ký</span>}
        </div>
        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-400">
            Chưa chọn thành viên nào
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {members.map((m) => (
              <div key={m.userId} className="flex items-center gap-3 px-3 py-2 border-b last:border-0 bg-white">
                <span className="flex-1 text-sm font-medium text-gray-800">{m.userName}</span>
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.userId, e.target.value as SelectedMember['role'])}
                  className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-400"
                >
                  {MEMBER_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeMember(m.userId)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vai trò khi thêm */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Thêm với vai trò:</span>
        {MEMBER_ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setAddingRole(r.value as SelectedMember['role'])}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              addingRole === r.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'border-gray-200 text-gray-500 hover:border-violet-300'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Search scientists */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Tìm nhà khoa học</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, lĩnh vực..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-400">Đang tải...</div>
          ) : scientists.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-400">Không tìm thấy</div>
          ) : scientists.map((s) => {
            const alreadyAdded = members.some((m) => m.userId === s.user.id);
            return (
              <div key={s.id} className={`flex items-center gap-3 px-3 py-2 border-b last:border-0 ${alreadyAdded ? 'bg-gray-50' : 'hover:bg-violet-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {s.user.rank ? `${s.user.rank} ` : ''}{s.user.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {s.degree ?? ''} {s.primaryField ? `• ${s.primaryField}` : ''} {s.user.unitRelation ? `• ${s.user.unitRelation.name}` : ''}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alreadyAdded}
                  onClick={() => addMember(s)}
                  className="gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {alreadyAdded ? 'Đã thêm' : 'Thêm'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {!canNext && members.length > 0 && (
        <p className="text-xs text-amber-600">
          Cần ít nhất: 1 Chủ tịch, 1 Thư ký, và tối thiểu 3 thành viên
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
        >
          Tiếp theo <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Xác nhận ─────────────────────────────────────────────────────────

function Step3({
  projectId,
  councilType,
  meetingDate,
  members,
  onBack,
  onSubmit,
  submitting,
}: {
  projectId: string;
  councilType: string;
  meetingDate: string;
  members: SelectedMember[];
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const typeLabel = { REVIEW: 'Thẩm định', ACCEPTANCE: 'Nghiệm thu', FINAL: 'Kết luận cuối' };
  const chairman  = members.find((m) => m.role === 'CHAIRMAN');
  const secretary = members.find((m) => m.role === 'SECRETARY');
  const others    = members.filter((m) => m.role !== 'CHAIRMAN' && m.role !== 'SECRETARY');

  const roleLabel: Record<string, string> = {
    REVIEWER: 'Phản biện',
    EXPERT:   'Chuyên gia',
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Thông tin hội đồng</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row label="Loại HĐ"   value={typeLabel[councilType as keyof typeof typeLabel] ?? councilType} />
          <Row label="Ngày họp"  value={meetingDate ? new Date(meetingDate).toLocaleDateString('vi-VN') : 'Chưa xác định'} />
          <Row label="Chủ tịch"  value={chairman?.userName ?? '—'} />
          <Row label="Thư ký"    value={secretary?.userName ?? '—'} />
          <Row label="Tổng thành viên" value={String(members.length)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Danh sách thành viên</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-500">#</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Họ tên</th>
                <th className="text-left px-4 py-2 font-medium text-gray-500">Vai trò</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.userId} className="border-b last:border-0">
                  <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{m.userName}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'CHAIRMAN'  ? 'bg-violet-100 text-violet-700' :
                      m.role === 'SECRETARY' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {m.role === 'CHAIRMAN' ? 'Chủ tịch' : m.role === 'SECRETARY' ? 'Thư ký' : roleLabel[m.role] ?? m.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Sau khi tạo hội đồng, thành viên sẽ được thông báo để nộp phiếu chấm và bỏ phiếu. Xung đột lợi ích sẽ được kiểm tra tự động.
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
        >
          <Check className="h-4 w-4" />
          {submitting ? 'Đang tạo...' : 'Thành lập hội đồng'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 w-36 shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCouncilPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preExpertUserId = searchParams.get('expertUserId');

  const [step,        setStep]        = useState<Step>(1);
  const [projectId,   setProjectId]   = useState('');
  const [councilType, setCouncilType] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [members,     setMembers]     = useState<SelectedMember[]>([]);
  const [submitting,  setSubmitting]  = useState(false);

  // Pre-load expert if navigated from experts page
  useEffect(() => {
    if (!preExpertUserId) return;
    // Fetch scientist profile to get name, then pre-add as REVIEWER
    fetch(`/api/science/scientists?userId=${preExpertUserId}&pageSize=1`)
      .then((r) => r.json())
      .then((json) => {
        const s: ScientistItem | undefined = json.data?.[0];
        if (!s) return;
        setMembers([{ userId: s.user.id, userName: s.user.name, role: 'REVIEWER' }]);
      })
      .catch(() => {/* ignore — user can add manually */});
  }, [preExpertUserId]);

  const handleSubmit = async () => {
    const chairman  = members.find((m) => m.role === 'CHAIRMAN');
    const secretary = members.find((m) => m.role === 'SECRETARY');
    if (!chairman || !secretary) {
      toast.error('Phải có Chủ tịch và Thư ký');
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        projectId,
        type:        councilType,
        chairmanId:  chairman.userId,
        secretaryId: secretary.userId,
        meetingDate: meetingDate || undefined,
        members:     members.map((m) => ({ userId: m.userId, role: m.role })),
      };

      const res = await fetch('/api/science/councils', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg = typeof json.error === 'string' ? json.error : JSON.stringify(json.error);
        throw new Error(errMsg);
      }

      toast.success('Đã thành lập hội đồng khoa học');
      router.push(`/dashboard/science/activities/councils/${json.data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo hội đồng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/science/activities/councils" className="hover:text-violet-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Danh sách hội đồng
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Thành lập hội đồng mới</span>
      </div>

      <h1 className="text-xl font-semibold text-gray-900">Thành lập hội đồng khoa học</h1>

      <Card>
        <CardContent className="p-6">
          <StepBar step={step} />

          {step === 1 && (
            <Step1
              projectId={projectId}   setProjectId={setProjectId}
              councilType={councilType} setCouncilType={setCouncilType}
              meetingDate={meetingDate} setMeetingDate={setMeetingDate}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              projectId={projectId}
              members={members}
              setMembers={setMembers}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <Step3
              projectId={projectId}
              councilType={councilType}
              meetingDate={meetingDate}
              members={members}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
