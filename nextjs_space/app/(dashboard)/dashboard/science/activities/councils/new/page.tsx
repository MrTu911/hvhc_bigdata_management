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
import { ArrowLeft, ArrowRight, Check, Search, X, Users, CalendarDays } from 'lucide-react';

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

interface UserItem {
  id: string;
  name: string;
  rank?: string | null;
  department?: string | null;
  unit?: string | null;
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
  prefilledProjectTitle,
  onNext,
}: {
  projectId: string; setProjectId: (v: string) => void;
  councilType: string; setCouncilType: (v: string) => void;
  meetingDate: string; setMeetingDate: (v: string) => void;
  prefilledProjectTitle?: string;
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
        {councilType === 'REVIEW' && (
          <p className="text-xs text-violet-600 bg-violet-50 rounded px-2 py-1">
            Hội đồng thẩm định đề cương — dành cho đề tài đang trong giai đoạn xét duyệt.
          </p>
        )}
        {councilType === 'ACCEPTANCE' && (
          <p className="text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
            Hội đồng nghiệm thu kết quả — dành cho đề tài đang thực hiện hoặc hoàn thành.
          </p>
        )}
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

        {/* Hiển thị đề tài đã được pre-fill từ URL */}
        {prefilledProjectTitle && projectId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-sm">
            <span className="text-violet-500">✓</span>
            <span className="font-medium text-violet-800 flex-1 truncate">{prefilledProjectTitle}</span>
            <button
              type="button"
              onClick={() => setProjectId('')}
              className="text-violet-400 hover:text-violet-700 text-xs underline shrink-0"
            >
              Đổi đề tài
            </button>
          </div>
        )}

        {/* Ẩn search khi đã pre-fill và chưa muốn đổi */}
        {(!prefilledProjectTitle || !projectId) && (
        <>
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
        {projectId && !prefilledProjectTitle && (
          <p className="text-xs text-emerald-600">
            ✓ Đã chọn: {projects.find(p => p.id === projectId)?.title}
          </p>
        )}
        </>
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

// ─── Slot badge ───────────────────────────────────────────────────────────────

function SlotBadge({ label, filled, required, count, minCount }: {
  label: string; filled: boolean; required: boolean; count: number; minCount?: number;
}) {
  const ok = filled || (!required && (minCount === undefined || count >= minCount));
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${
      ok ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
         : 'bg-amber-50 border-amber-300 text-amber-700'
    }`}>
      {ok ? '✓' : '○'} {label}{count > 1 || minCount ? ` (${count})` : ''}
    </span>
  );
}

// ─── Member slot card ─────────────────────────────────────────────────────────

function MemberSlotCard({ label, color, member, onRemove, initials }: {
  label: string;
  color: 'violet' | 'blue';
  member?: SelectedMember;
  onRemove: (id: string) => void;
  initials: (name: string) => string;
}) {
  const colorMap = {
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', header: 'bg-violet-50 border-violet-200', empty: 'text-violet-300' },
    blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',     header: 'bg-blue-50 border-blue-200',     empty: 'text-blue-300' },
  }[color];

  return (
    <div className={`border rounded-lg overflow-hidden ${member ? colorMap.header : 'border-gray-200'}`}>
      <div className={`px-3 py-1.5 flex items-center justify-between border-b ${member ? colorMap.header : 'bg-gray-50 border-gray-200'}`}>
        <span className={`text-xs font-semibold ${member ? colorMap.text : 'text-gray-500'}`}>{label}</span>
        {member
          ? <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${colorMap.badge}`}>Đã chọn ✓</span>
          : <span className="text-xs text-gray-400">Bắt buộc</span>
        }
      </div>
      {member ? (
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorMap.bg} ${colorMap.text}`}>
            {initials(member.userName)}
          </div>
          <span className="flex-1 text-sm font-medium text-gray-800 truncate">{member.userName}</span>
          <button type="button" onClick={() => onRemove(member.userId)} className="text-gray-300 hover:text-red-400 transition-colors" title="Xóa">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="px-3 py-3 text-center text-xs text-gray-400">
          Chọn từ danh sách bên trái
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Thành viên ───────────────────────────────────────────────────────

function Step2({
  projectId: _projectId,
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
  const [allUsers,   setAllUsers]   = useState<UserItem[]>([]);
  const [keyword,    setKeyword]    = useState('');
  const [loading,    setLoading]    = useState(false);

  // Tải toàn bộ danh sách nhân sự một lần duy nhất
  useEffect(() => {
    setLoading(true);
    fetch('/api/users?limit=500&page=1')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setAllUsers(json.data ?? []);
        else toast.error('Không tải được danh sách nhân sự');
      })
      .catch(() => toast.error('Lỗi kết nối khi tải nhân sự'))
      .finally(() => setLoading(false));
  }, []);

  // Lọc phía client theo keyword
  const filtered = keyword.trim()
    ? allUsers.filter((u) => {
        const q = keyword.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          (u.rank ?? '').toLowerCase().includes(q) ||
          (u.unit ?? '').toLowerCase().includes(q) ||
          (u.department ?? '').toLowerCase().includes(q)
        );
      })
    : allUsers;

  const addMember = (user: UserItem, role: SelectedMember['role']) => {
    if (members.some((m) => m.userId === user.id)) {
      toast.error('Thành viên này đã được chọn');
      return;
    }
    if ((role === 'CHAIRMAN' || role === 'SECRETARY') && members.some((m) => m.role === role)) {
      toast.error(`Đã có ${role === 'CHAIRMAN' ? 'Chủ tịch' : 'Thư ký'} — xóa người cũ trước`);
      return;
    }
    setMembers([...members, { userId: user.id, userName: user.name, role }]);
  };

  const removeMember = (userId: string) => setMembers(members.filter((m) => m.userId !== userId));

  const chairman  = members.find((m) => m.role === 'CHAIRMAN');
  const secretary = members.find((m) => m.role === 'SECRETARY');
  const reviewers = members.filter((m) => m.role === 'REVIEWER' || m.role === 'EXPERT');
  const hasChairman  = !!chairman;
  const hasSecretary = !!secretary;
  const canNext = hasChairman && hasSecretary && members.length >= 3;

  const initials = (name: string) =>
    name.trim().split(' ').map((w) => w[0]).slice(-2).join('').toUpperCase();

  const statusMsg = !hasChairman ? '⚠ Chưa có Chủ tịch'
    : !hasSecretary ? '⚠ Chưa có Thư ký'
    : members.length < 3 ? `⚠ Cần ít nhất 3 thành viên (hiện có ${members.length})`
    : '';

  return (
    <div className="space-y-4">
      {/* Slot status bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border">
        <span className="text-xs text-gray-500 font-medium mr-1">Yêu cầu:</span>
        <SlotBadge label="Chủ tịch"  filled={hasChairman}  required count={hasChairman ? 1 : 0} />
        <SlotBadge label="Thư ký"    filled={hasSecretary} required count={hasSecretary ? 1 : 0} />
        <SlotBadge label="Phản biện / Chuyên gia" filled={reviewers.length >= 1} required={false} count={reviewers.length} minCount={1} />
        <span className={`ml-auto text-xs font-medium ${canNext ? 'text-emerald-600' : 'text-amber-600'}`}>
          {canNext ? '✓ Đủ thành viên' : statusMsg}
        </span>
      </div>

      {/* Two-column: left = danh sách nhân sự, right = thành viên đã chọn */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT — Danh sách nhân sự */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            Chọn nhân sự
            {!loading && <span className="text-xs font-normal text-gray-400">({filtered.length}/{allUsers.length})</span>}
          </p>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Lọc theo tên, cấp bậc, đơn vị..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-8 text-sm h-8"
            />
          </div>

          <div className="border rounded-lg overflow-y-auto" style={{ maxHeight: '420px' }}>
            {loading ? (
              <div className="p-6 text-center text-sm text-gray-400">Đang tải danh sách nhân sự...</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                {allUsers.length === 0 ? 'Không có nhân sự trong hệ thống' : 'Không tìm thấy kết quả phù hợp'}
              </div>
            ) : filtered.map((u) => {
              const alreadyAdded = members.some((m) => m.userId === u.id);
              const info = [u.rank, u.department ?? u.unit].filter(Boolean).join(' • ');
              return (
                <div
                  key={u.id}
                  className={`flex items-start gap-2.5 px-3 py-2.5 border-b last:border-0 transition-colors ${
                    alreadyAdded ? 'bg-emerald-50' : 'hover:bg-violet-50/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    alreadyAdded ? 'bg-emerald-200 text-emerald-800' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {initials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate leading-tight">{u.name}</p>
                    {info && <p className="text-xs text-gray-400 truncate mt-0.5">{info}</p>}
                    {alreadyAdded ? (
                      <span className="text-xs text-emerald-600 mt-1 inline-block">✓ Đã thêm vào hội đồng</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <button type="button" disabled={hasChairman}  onClick={() => addMember(u, 'CHAIRMAN')}
                          className="text-xs px-2 py-0.5 rounded border border-violet-300 text-violet-700 hover:bg-violet-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          + Chủ tịch
                        </button>
                        <button type="button" disabled={hasSecretary} onClick={() => addMember(u, 'SECRETARY')}
                          className="text-xs px-2 py-0.5 rounded border border-blue-300 text-blue-700 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                          + Thư ký
                        </button>
                        <button type="button" onClick={() => addMember(u, 'REVIEWER')}
                          className="text-xs px-2 py-0.5 rounded border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors">
                          + Phản biện
                        </button>
                        <button type="button" onClick={() => addMember(u, 'EXPERT')}
                          className="text-xs px-2 py-0.5 rounded border border-teal-300 text-teal-700 hover:bg-teal-50 transition-colors">
                          + Chuyên gia
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Thành viên đã chọn */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-gray-400" /> Thành viên đã chọn
            <span className="text-xs font-normal text-gray-400">({members.length})</span>
          </p>

          <MemberSlotCard label="Chủ tịch" color="violet" member={chairman}  onRemove={removeMember} initials={initials} />
          <MemberSlotCard label="Thư ký"   color="blue"   member={secretary} onRemove={removeMember} initials={initials} />

          <div className="border rounded-lg overflow-hidden">
            <div className="px-3 py-1.5 bg-gray-50 border-b flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Phản biện & Chuyên gia</span>
              <span className={`text-xs font-medium ${reviewers.length >= 1 ? 'text-emerald-600' : 'text-gray-400'}`}>
                {reviewers.length} người
              </span>
            </div>
            {reviewers.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-400">
                Nhấn "+ Phản biện" hoặc "+ Chuyên gia" ở cột trái
              </div>
            ) : (
              <div className="divide-y">
                {reviewers.map((m) => (
                  <div key={m.userId} className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {initials(m.userName)}
                    </div>
                    <span className="flex-1 text-sm text-gray-800 truncate">{m.userName}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
                      m.role === 'REVIEWER' ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                      {m.role === 'REVIEWER' ? 'Phản biện' : 'Chuyên gia'}
                    </span>
                    <button type="button" onClick={() => removeMember(m.userId)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-1">
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
  const preExpertUserId   = searchParams.get('expertUserId');
  const preProjectId      = searchParams.get('projectId') ?? '';
  const preType           = searchParams.get('type') ?? '';

  const [step,        setStep]        = useState<Step>(1);
  const [projectId,   setProjectId]   = useState(preProjectId);
  const [councilType, setCouncilType] = useState(preType);
  const [meetingDate, setMeetingDate] = useState('');
  const [members,     setMembers]     = useState<SelectedMember[]>([]);
  const [submitting,  setSubmitting]  = useState(false);
  const [prefilledProjectTitle, setPrefilledProjectTitle] = useState('');

  // Fetch tên đề tài khi được pre-fill từ URL
  useEffect(() => {
    if (!preProjectId) return;
    fetch(`/api/science/projects/${preProjectId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data?.title) {
          setPrefilledProjectTitle(json.data.title);
        }
      })
      .catch(() => {/* ignore */});
  }, [preProjectId]);

  // Pre-load expert if navigated from experts page
  useEffect(() => {
    if (!preExpertUserId) return;
    fetch(`/api/science/scientists?userId=${preExpertUserId}&pageSize=1`)
      .then((r) => r.json())
      .then((json) => {
        const s: ScientistItem | undefined = json.data?.[0];
        if (!s) return;
        setMembers([{ userId: s.user.id, userName: s.user.name, role: 'REVIEWER' }]);
      })
      .catch(() => {/* ignore */});
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
    <div className="max-w-5xl mx-auto space-y-4">
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
              prefilledProjectTitle={prefilledProjectTitle}
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
