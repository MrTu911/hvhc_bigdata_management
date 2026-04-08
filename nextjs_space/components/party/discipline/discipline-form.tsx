'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMasterData } from '@/hooks/use-master-data';
import { MasterDataSelect } from '@/components/shared/MasterDataSelect';

const SEVERITY_FALLBACK = 'KHIEN_TRACH';

export function DisciplineForm({ onSubmit, submitting }: { onSubmit: (payload: any) => Promise<void> | void; submitting?: boolean }) {
  const { items: severityItems } = useMasterData('MD_PARTY_DISCIPLINE');

  const [form, setForm] = useState({
    partyMemberId: '',
    severity: SEVERITY_FALLBACK,
    decisionNo: '',
    decisionDate: '',
    expiryDate: '',
    issuer: '',
    reason: '',
    attachmentUrl: '',
  });

  return (
    <div className="space-y-3">
      <div>
        <Label>ID đảng viên *</Label>
        <Input value={form.partyMemberId} onChange={(e) => setForm((x) => ({ ...x, partyMemberId: e.target.value }))} />
      </div>

      <div>
        <Label>Mức độ kỷ luật *</Label>
        <MasterDataSelect
          categoryCode="MD_PARTY_DISCIPLINE"
          value={form.severity}
          onChange={(v) => setForm((x) => ({ ...x, severity: v }))}
          searchable
          placeholder="Chọn mức độ kỷ luật"
        />
        {severityItems.length === 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            MDM chưa có dữ liệu MD_PARTY_DISCIPLINE, đang dùng mã fallback: {SEVERITY_FALLBACK}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Số quyết định</Label>
          <Input value={form.decisionNo} onChange={(e) => setForm((x) => ({ ...x, decisionNo: e.target.value }))} />
        </div>
        <div>
          <Label>Ngày quyết định</Label>
          <Input type="date" value={form.decisionDate} onChange={(e) => setForm((x) => ({ ...x, decisionDate: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Ngày hết hiệu lực</Label>
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm((x) => ({ ...x, expiryDate: e.target.value }))} />
        </div>
        <div>
          <Label>Cơ quan ra quyết định</Label>
          <Input value={form.issuer} onChange={(e) => setForm((x) => ({ ...x, issuer: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label>Tệp đính kèm (URL)</Label>
        <Input value={form.attachmentUrl} onChange={(e) => setForm((x) => ({ ...x, attachmentUrl: e.target.value }))} />
      </div>

      <div>
        <Label>Lý do</Label>
        <Textarea rows={3} value={form.reason} onChange={(e) => setForm((x) => ({ ...x, reason: e.target.value }))} />
      </div>

      <div className="flex justify-end">
        <Button disabled={submitting} onClick={() => onSubmit(form)}>Lưu kỷ luật</Button>
      </div>
    </div>
  );
}
