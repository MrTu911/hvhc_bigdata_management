'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const COUNCIL_TYPE_LABELS: Record<string, string> = {
  REVIEW:     'Thẩm định',
  ACCEPTANCE: 'Nghiệm thu',
  FINAL:      'Tổng kết',
};

const MEMBER_ROLE_LABELS: Record<string, string> = {
  CHAIRMAN:  'Chủ tịch',
  SECRETARY: 'Thư ký',
  REVIEWER:  'Phản biện',
  EXPERT:    'Chuyên gia',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProjectOption {
  id:          string;
  projectCode: string;
  title:       string;
  status:      string;
}

interface ScientistOption {
  userId: string;
  name:   string;
  rank:   string | null;
  unit:   string | null;
}

interface MemberRow {
  key:    number;
  userId: string;
  role:   string;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

function formatScientistLabel(s: ScientistOption) {
  const parts = [s.name];
  if (s.rank) parts.push(s.rank);
  if (s.unit) parts.push(`(${s.unit})`);
  return parts.join(' – ');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCouncilPage() {
  const router = useRouter();

  // ── Remote data ──
  const [projects,   setProjects]   = useState<ProjectOption[]>([]);
  const [scientists, setScientists] = useState<ScientistOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // ── Form fields ──
  const [projectId,   setProjectId]   = useState('');
  const [type,        setType]        = useState('');
  const [chairmanId,  setChairmanId]  = useState('');
  const [secretaryId, setSecretaryId] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [members,     setMembers]     = useState<MemberRow[]>([
    { key: Date.now(), userId: '', role: 'REVIEWER' },
  ]);

  const [submitting, setSubmitting] = useState(false);

  // ── Load reference data ──
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const [pRes, sRes] = await Promise.all([
          fetch('/api/science/projects?pageSize=200'),
          fetch('/api/science/scientists?pageSize=200'),
        ]);

        if (pRes.ok) {
          const pJson = await pRes.json();
          setProjects(
            (pJson.data ?? []).map((p: any) => ({
              id:          p.id,
              projectCode: p.projectCode,
              title:       p.title,
              status:      p.status,
            }))
          );
        }

        if (sRes.ok) {
          const sJson = await sRes.json();
          setScientists(
            (sJson.data ?? []).map((s: any) => ({
              userId: s.user?.id ?? s.userId ?? '',
              name:   s.user?.name ?? s.name ?? '—',
              rank:   s.user?.rank ?? null,
              unit:   s.user?.unitRelation?.name ?? null,
            })).filter((s: ScientistOption) => s.userId)
          );
        }
      } catch {
        toast.error('Không thể tải danh sách dữ liệu');
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, []);

  // ── Member management ──
  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, { key: Date.now(), userId: '', role: 'REVIEWER' }]);
  }, []);

  const removeMember = useCallback((key: number) => {
    setMembers((prev) => prev.filter((m) => m.key !== key));
  }, []);

  const updateMember = useCallback((key: number, field: 'userId' | 'role', value: string) => {
    setMembers((prev) => prev.map((m) => m.key === key ? { ...m, [field]: value } : m));
  }, []);

  // ── Validation ──
  function validate(): string | null {
    if (!projectId)   return 'Vui lòng chọn đề tài';
    if (!type)        return 'Vui lòng chọn loại hội đồng';
    if (!chairmanId)  return 'Vui lòng chọn chủ tịch hội đồng';
    if (!secretaryId) return 'Vui lòng chọn thư ký hội đồng';
    if (chairmanId === secretaryId) return 'Chủ tịch và thư ký phải là hai người khác nhau';
    const validMembers = members.filter((m) => m.userId);
    if (validMembers.length === 0) return 'Vui lòng thêm ít nhất một thành viên';
    const userIds = validMembers.map((m) => m.userId);
    if (new Set(userIds).size !== userIds.length) return 'Danh sách thành viên có người bị trùng';
    return null;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const payload = {
        projectId,
        type,
        chairmanId,
        secretaryId,
        ...(meetingDate ? { meetingDate: new Date(meetingDate).toISOString() } : {}),
        members: members
          .filter((m) => m.userId)
          .map((m) => ({ userId: m.userId, role: m.role })),
      };

      const res = await fetch('/api/science/councils', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = typeof json.error === 'string'
          ? json.error
          : 'Tạo hội đồng thất bại';
        toast.error(msg);
        return;
      }

      toast.success('Đã lập hội đồng thành công');
      router.push('/dashboard/science/councils');
    } catch {
      toast.error('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/science/councils">
            <ArrowLeft size={16} className="mr-1" /> Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Lập hội đồng khoa học
          </h1>
          <p className="text-sm text-gray-500">Thẩm định, nghiệm thu hoặc tổng kết đề tài</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Thông tin cơ bản */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin hội đồng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Đề tài */}
            <div className="space-y-1.5">
              <Label htmlFor="project">Đề tài <span className="text-red-500">*</span></Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Chọn đề tài cần lập hội đồng..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value="__empty" disabled>Không có đề tài nào</SelectItem>
                  ) : (
                    projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        [{p.projectCode}] {p.title} ({p.status})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <p className="text-xs text-amber-600">
                  Chưa có đề tài nào. Vui lòng tạo đề tài trước.
                </p>
              )}
            </div>

            {/* Loại hội đồng */}
            <div className="space-y-1.5">
              <Label htmlFor="type">Loại hội đồng <span className="text-red-500">*</span></Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại hội đồng..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COUNCIL_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ngày họp */}
            <div className="space-y-1.5">
              <Label htmlFor="meetingDate">Ngày họp (tuỳ chọn)</Label>
              <Input
                id="meetingDate"
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-48"
              />
            </div>

          </CardContent>
        </Card>

        {/* Lãnh đạo hội đồng */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lãnh đạo hội đồng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Chủ tịch */}
            <div className="space-y-1.5">
              <Label>Chủ tịch <span className="text-red-500">*</span></Label>
              <Select value={chairmanId} onValueChange={setChairmanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chủ tịch hội đồng..." />
                </SelectTrigger>
                <SelectContent>
                  {scientists.map((s) => (
                    <SelectItem key={s.userId} value={s.userId}>
                      {formatScientistLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Thư ký */}
            <div className="space-y-1.5">
              <Label>Thư ký <span className="text-red-500">*</span></Label>
              <Select value={secretaryId} onValueChange={setSecretaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thư ký hội đồng..." />
                </SelectTrigger>
                <SelectContent>
                  {scientists
                    .filter((s) => s.userId !== chairmanId)
                    .map((s) => (
                      <SelectItem key={s.userId} value={s.userId}>
                        {formatScientistLabel(s)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Thành viên */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Thành viên hội đồng</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addMember}>
                <Plus size={14} className="mr-1" /> Thêm thành viên
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Chưa có thành viên. Nhấn &ldquo;Thêm thành viên&rdquo; để bổ sung.
              </p>
            ) : (
              members.map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select
                      value={m.userId}
                      onValueChange={(v) => updateMember(m.key, 'userId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thành viên..." />
                      </SelectTrigger>
                      <SelectContent>
                        {scientists
                          .filter((s) =>
                            s.userId !== chairmanId &&
                            s.userId !== secretaryId &&
                            (s.userId === m.userId ||
                              !members.some((x) => x.key !== m.key && x.userId === s.userId))
                          )
                          .map((s) => (
                            <SelectItem key={s.userId} value={s.userId}>
                              {formatScientistLabel(s)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-36">
                    <Select
                      value={m.role}
                      onValueChange={(v) => updateMember(m.key, 'role', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEMBER_ROLE_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-600 shrink-0"
                    onClick={() => removeMember(m.key)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))
            )}

            <p className="text-xs text-gray-400 pt-1">
              Chủ tịch và thư ký sẽ được tự động thêm vào danh sách thành viên khi tạo.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/science/councils">Huỷ</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Lập hội đồng'}
          </Button>
        </div>

      </form>
    </div>
  );
}
