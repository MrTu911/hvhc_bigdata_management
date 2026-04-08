'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MasterDataSelect } from '@/components/shared/MasterDataSelect';
import { useMasterData } from '@/hooks/use-master-data';

const TRANSFER_TYPES = [
  { value: 'CHUYEN_SINH_HOAT_TAM_THOI', label: 'Chuyển sinh hoạt tạm thời' },
  { value: 'CHUYEN_DANG_CHINH_THUC', label: 'Chuyển Đảng chính thức' },
];

export function TransferForm({ onSubmit, submitting }: { onSubmit: (payload: any) => Promise<void> | void; submitting?: boolean }) {
  const { items: transferTypeItems } = useMasterData('MD_PARTY_TRANSFER_TYPE');

  const [form, setForm] = useState({
    partyMemberId: '',
    transferType: TRANSFER_TYPES[0].value,
    fromPartyOrgId: '',
    toPartyOrgId: '',
    transferDate: '',
    introductionLetterNo: '',
    note: '',
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>ID đảng viên *</Label>
        <Input value={form.partyMemberId} onChange={(e) => setForm((x) => ({ ...x, partyMemberId: e.target.value }))} />
      </div>

      <div>
        <Label>Loại chuyển *</Label>
        {transferTypeItems.length > 0 ? (
          <MasterDataSelect
            categoryCode="MD_PARTY_TRANSFER_TYPE"
            value={form.transferType}
            onChange={(v) => setForm((x) => ({ ...x, transferType: v }))}
            searchable
            placeholder="Chọn loại chuyển"
          />
        ) : (
          <div className="space-y-1">
            <Select value={form.transferType} onValueChange={(v) => setForm((x) => ({ ...x, transferType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRANSFER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">MDM chưa có MD_PARTY_TRANSFER_TYPE, đang dùng fallback cục bộ.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Tổ chức nguồn *</Label>
          <Input value={form.fromPartyOrgId} onChange={(e) => setForm((x) => ({ ...x, fromPartyOrgId: e.target.value }))} />
        </div>
        <div>
          <Label>Tổ chức đích *</Label>
          <Input value={form.toPartyOrgId} onChange={(e) => setForm((x) => ({ ...x, toPartyOrgId: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Ngày chuyển *</Label>
          <Input type="date" value={form.transferDate} onChange={(e) => setForm((x) => ({ ...x, transferDate: e.target.value }))} />
        </div>
        <div>
          <Label>Số giấy giới thiệu</Label>
          <Input value={form.introductionLetterNo} onChange={(e) => setForm((x) => ({ ...x, introductionLetterNo: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label>Ghi chú</Label>
        <Textarea rows={3} value={form.note} onChange={(e) => setForm((x) => ({ ...x, note: e.target.value }))} />
      </div>

      <div className="flex justify-end">
        <Button disabled={submitting} onClick={() => onSubmit(form)}>Tạo hồ sơ chuyển</Button>
      </div>
    </div>
  );
}
