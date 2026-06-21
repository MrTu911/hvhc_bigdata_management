'use client';

/**
 * Form "Thông tin mở rộng" hồ sơ cán bộ điện tử — các trường scalar trên User + Đoàn (1:1).
 * GET/PATCH /api/personnel/[id]/profile-extended. Chia nhóm theo EXTENDED_FIELD_GROUPS.
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CadreFieldInput } from './cadre-field-input';
import { EvidenceButton } from '../evidence/evidence-button';
import { EXTENDED_FIELD_GROUPS } from '@/lib/constants/cadre-profile-sections';

interface CadreExtendedFormProps {
  personnelId: string;
  canEdit: boolean;
  /** Override API base URL — default: /api/personnel/[id]/profile-extended */
  apiBase?: string;
  /** Bật minh chứng theo trường (chỉ ngữ cảnh tự phục vụ — minh chứng là SELF-only). */
  evidenceEnabled?: boolean;
  /** Cho upload/xóa minh chứng (tách khỏi khóa khai báo). */
  evidenceCanEdit?: boolean;
}

const ALL_FIELDS = EXTENDED_FIELD_GROUPS.flatMap((g) => g.fields);

export function CadreExtendedForm({
  personnelId,
  canEdit,
  apiBase,
  evidenceEnabled = false,
  evidenceCanEdit = false,
}: CadreExtendedFormProps) {
  const base = apiBase ?? `/api/personnel/${personnelId}/profile-extended`;
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(base);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setForm(json.data ?? {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(name: string, value: unknown) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of ALL_FIELDS) payload[f.name] = form[f.name] ?? null;
      const res = await fetch(base, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi lưu');
      toast.success('Đã lưu thông tin mở rộng');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-6 text-sm text-gray-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end sticky top-0 z-10 bg-background py-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Lưu thông tin mở rộng
          </Button>
        </div>
      )}
      {EXTENDED_FIELD_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader className="py-3">
            <CardTitle className="text-base">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.fields.map((f) =>
              evidenceEnabled ? (
                <div key={f.name} className="flex items-start gap-1">
                  <div className="min-w-0 flex-1">
                    <CadreFieldInput field={f} value={form[f.name]} disabled={!canEdit} onChange={setField} />
                  </div>
                  <div className="shrink-0 pt-6">
                    <EvidenceButton
                      targetType="PROFILE_FIELD"
                      targetId={personnelId}
                      fieldKey={f.name}
                      sectionSlug={group.title}
                      canEdit={evidenceCanEdit}
                      title={f.label}
                    />
                  </div>
                </div>
              ) : (
                <CadreFieldInput key={f.name} field={f} value={form[f.name]} disabled={!canEdit} onChange={setField} />
              ),
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
