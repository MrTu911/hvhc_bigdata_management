'use client';

/**
 * ProfileSettingsTab — Xem & cập nhật hồ sơ cá nhân.
 * Gọi GET/PUT /api/profile/me. Chỉ gửi các field backend cho phép sửa
 * (build payload tường minh — không spread cả object).
 */

import { useEffect, useState } from 'react';
import { User, Loader2, Save, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONAL } from '@/lib/rbac/function-codes';

/** Các field backend cho phép cập nhật (trùng allowedFields ở /api/profile/me PUT) */
const EDITABLE_FIELDS = [
  'name', 'phone', 'dateOfBirth', 'gender', 'citizenId',
  'birthPlace', 'placeOfOrigin', 'permanentAddress', 'temporaryAddress',
  'ethnicity', 'religion', 'bloodType', 'educationLevel', 'specialization',
  'rank', 'position',
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

const BLOOD_TYPES = [
  'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
  'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
];
const BLOOD_TYPE_LABELS: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
};

const NONE_VALUE = '__none__';

type FormState = Record<EditableField, string>;

function buildInitialForm(): FormState {
  return EDITABLE_FIELDS.reduce((acc, field) => {
    acc[field] = '';
    return acc;
  }, {} as FormState);
}

function toDateInputValue(value: unknown): string {
  if (!value || typeof value !== 'string') return '';
  return value.slice(0, 10);
}

export function ProfileSettingsTab() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { hasPermission, isLoading: permLoading } = usePermissions();

  const [form, setForm] = useState<FormState>(buildInitialForm());
  const [readOnly, setReadOnly] = useState({ email: '', militaryId: '', unitName: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canEdit = !permLoading && hasPermission(PERSONAL.MANAGE_PROFILE);

  function setField(field: EditableField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function loadProfile() {
    setLoading(true);
    setError(null);
    fetch('/api/profile/me')
      .then((r) => r.json())
      .then((res) => {
        if (!res.success || !res.data) {
          setError(res.error ?? t('settings.profile.loadError'));
          return;
        }
        const data = res.data;
        const next = buildInitialForm();
        for (const field of EDITABLE_FIELDS) {
          if (field === 'dateOfBirth') {
            next[field] = toDateInputValue(data[field]);
          } else {
            next[field] = data[field] ?? '';
          }
        }
        setForm(next);
        setReadOnly({
          email: data.email ?? '',
          militaryId: data.militaryId ?? '',
          unitName: data.unitName ?? '',
        });
      })
      .catch(() => setError(t('settings.profile.loadError')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Build payload tường minh — chỉ gồm EDITABLE_FIELDS
      const payload: Record<string, string | null> = {};
      for (const field of EDITABLE_FIELDS) {
        payload[field] = form[field] === '' ? null : form[field];
      }

      const res = await fetch('/api/profile/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: t('settings.profile.saved') });
      } else {
        toast({
          title: t('settings.profile.saveError'),
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch {
      toast({ title: t('settings.security.connError'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={loadProfile}>{t('settings.common.retry')}</Button>
        </CardContent>
      </Card>
    );
  }

  const textField = (field: EditableField, label: string) => (
    <div className="space-y-2">
      <Label htmlFor={`profile-${field}`}>{label}</Label>
      <Input
        id={`profile-${field}`}
        value={form[field]}
        onChange={(e) => setField(field, e.target.value)}
        disabled={!canEdit}
      />
    </div>
  );

  return (
    <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" /> {t('settings.profile.title')}
        </CardTitle>
        <CardDescription>{t('settings.profile.desc')}</CardDescription>
      </CardHeader>
      <CardContent>
        {!canEdit && !permLoading && (
          <p className="mb-4 text-sm text-amber-600">{t('settings.profile.noPermission')}</p>
        )}

        {/* Thông tin do tổ chức quản lý — chỉ đọc */}
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Lock className="h-3 w-3" /> {t('settings.profile.managedByOrg')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.profile.email')}</Label>
              <Input value={readOnly.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.profile.militaryId')}</Label>
              <Input value={readOnly.militaryId} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.profile.unit')}</Label>
              <Input value={readOnly.unitName} disabled />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {textField('name', t('settings.profile.name'))}
            {textField('phone', t('settings.profile.phone'))}

            <div className="space-y-2">
              <Label htmlFor="profile-dateOfBirth">{t('settings.profile.dateOfBirth')}</Label>
              <Input
                id="profile-dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField('dateOfBirth', e.target.value)}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-gender">{t('settings.profile.gender')}</Label>
              <Input
                id="profile-gender"
                value={form.gender}
                onChange={(e) => setField('gender', e.target.value)}
                disabled={!canEdit}
              />
            </div>

            {textField('citizenId', t('settings.profile.citizenId'))}

            <div className="space-y-2">
              <Label htmlFor="profile-bloodType">{t('settings.profile.bloodType')}</Label>
              <Select
                value={form.bloodType || NONE_VALUE}
                onValueChange={(v) => setField('bloodType', v === NONE_VALUE ? '' : v)}
                disabled={!canEdit}
              >
                <SelectTrigger id="profile-bloodType">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>—</SelectItem>
                  {BLOOD_TYPES.map((bt) => (
                    <SelectItem key={bt} value={bt}>{BLOOD_TYPE_LABELS[bt]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {textField('ethnicity', t('settings.profile.ethnicity'))}
            {textField('religion', t('settings.profile.religion'))}
            {textField('birthPlace', t('settings.profile.birthPlace'))}
            {textField('placeOfOrigin', t('settings.profile.placeOfOrigin'))}
            {textField('educationLevel', t('settings.profile.educationLevel'))}
            {textField('specialization', t('settings.profile.specialization'))}
            {textField('rank', t('settings.profile.rank'))}
            {textField('position', t('settings.profile.position'))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-permanentAddress">{t('settings.profile.permanentAddress')}</Label>
              <Textarea
                id="profile-permanentAddress"
                rows={2}
                value={form.permanentAddress}
                onChange={(e) => setField('permanentAddress', e.target.value)}
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-temporaryAddress">{t('settings.profile.temporaryAddress')}</Label>
              <Textarea
                id="profile-temporaryAddress"
                rows={2}
                value={form.temporaryAddress}
                onChange={(e) => setField('temporaryAddress', e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={!canEdit || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? t('settings.common.saving') : t('settings.common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
