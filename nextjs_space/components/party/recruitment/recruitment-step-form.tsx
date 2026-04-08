'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { STEPS, STEP_META, type RecruitmentStep } from './recruitment-pipeline-board';

const DOSSIER_OPTIONS = [
  { value: 'IN_PROGRESS', label: 'Đang bổ sung' },
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'COMPLETE', label: 'Đủ hồ sơ' },
];

const DEFAULT_FORM = {
  userId: '',
  targetPartyOrgId: '',
  currentStep: 'THEO_DOI' as RecruitmentStep,
  dossierStatus: 'IN_PROGRESS',
  assistantMember1: '',
  assistantMember2: '',
  note: '',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Record<string, string>) => Promise<void>;
  submitting?: boolean;
}

export function RecruitmentStepForm({ open, onOpenChange, onSubmit, submitting = false }: Props) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [users, setUsers] = useState<{ id: string; name: string; militaryId?: string }[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string; code: string }[]>([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch('/api/party/recruitment?limit=500').then(r => r.json()),
      fetch('/api/party/orgs?limit=200').then(r => r.json()),
    ]).then(([recruitData, orgData]) => {
      const existingUserIds = new Set((recruitData.data?.items ?? []).map((i: any) => i.userId));
      setOrgs(orgData.data ?? []);
      // Load personnel (scoped to current user's access)
      fetch('/api/personnel?limit=500&workStatus=ACTIVE').then(r => r.json()).then(d => {
        const all: any[] = d.data ?? d.items ?? [];
        setUsers(
          all
            .filter((p: any) => p.userId && !existingUserIds.has(p.userId))
            .map((p: any) => ({ id: p.userId, name: p.user?.name ?? p.name ?? '—', militaryId: p.militaryId ?? p.user?.militaryId }))
        );
      }).catch(() => {});
    }).catch(() => {});
  }, [open]);

  const filtered = userSearch.trim()
    ? users.filter(u =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.militaryId ?? '').toLowerCase().includes(userSearch.toLowerCase()),
      )
    : users;

  const handleSubmit = async () => {
    if (!form.userId || !form.targetPartyOrgId) return;
    await onSubmit({ ...form });
    setForm(DEFAULT_FORM);
    setUserSearch('');
  };

  const f = (field: keyof typeof DEFAULT_FORM) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            Thêm ứng viên vào pipeline kết nạp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User search */}
          <div className="space-y-1.5">
            <Label>Tìm ứng viên <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Nhập tên hoặc mã quân nhân…"
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
            />
            {userSearch.trim() && (
              <div className="max-h-40 overflow-y-auto rounded-lg border bg-white shadow-sm divide-y">
                {filtered.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">Không tìm thấy</p>
                ) : (
                  filtered.slice(0, 10).map(u => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => { setForm(prev => ({ ...prev, userId: u.id })); setUserSearch(u.name); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium">{u.name}</span>
                      {u.militaryId && (
                        <span className="text-muted-foreground ml-2">({u.militaryId})</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {form.userId && (
              <p className="text-xs text-emerald-600 font-medium">
                Đã chọn: {users.find(u => u.id === form.userId)?.name ?? form.userId}
              </p>
            )}
          </div>

          {/* Target org */}
          <div className="space-y-1.5">
            <Label>Chi bộ/Đảng bộ đích <span className="text-red-500">*</span></Label>
            <Select value={form.targetPartyOrgId} onValueChange={v => setForm(prev => ({ ...prev, targetPartyOrgId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn tổ chức Đảng…" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {orgs.map(o => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Current step */}
            <div className="space-y-1.5">
              <Label>Bước hiện tại</Label>
              <Select value={form.currentStep} onValueChange={v => setForm(prev => ({ ...prev, currentStep: v as RecruitmentStep }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STEPS.map(s => (
                    <SelectItem key={s} value={s}>{STEP_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dossier status */}
            <div className="space-y-1.5">
              <Label>Tình trạng hồ sơ</Label>
              <Select value={form.dossierStatus} onValueChange={v => setForm(prev => ({ ...prev, dossierStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOSSIER_OPTIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assistants */}
            <div className="space-y-1.5">
              <Label>Đảng viên giúp đỡ 1</Label>
              <Input placeholder="Đ/c …" value={form.assistantMember1} onChange={f('assistantMember1')} />
            </div>
            <div className="space-y-1.5">
              <Label>Đảng viên giúp đỡ 2</Label>
              <Input placeholder="Đ/c …" value={form.assistantMember2} onChange={f('assistantMember2')} />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={form.note} onChange={f('note')} placeholder="Nhận xét, ghi chú thêm…" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.userId || !form.targetPartyOrgId}
          >
            {submitting ? 'Đang lưu…' : 'Thêm ứng viên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
