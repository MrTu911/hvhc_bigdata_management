'use client';

/**
 * Template Wizard – M18
 * Multi-step wizard cho tạo và chỉnh sửa template.
 *
 * Step 1 – Thông tin cơ bản   → READY
 * Step 2 – Upload file        → READY (gọi /api/templates/[id]/upload)
 * Step 3 – Data Map           → SKELETON (Phase Data Map, chưa triển khai)
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, Upload, Map, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TemplateWizardValues {
  code: string;
  name: string;
  description: string;
  category: string;
  moduleSource: string[];
  outputFormats: string[];
  rbacCode: string;
}

interface TemplateWizardProps {
  /** Nếu có templateId → wizard ở mode edit; không có → mode create */
  templateId?: string;
  /** Giá trị ban đầu khi edit */
  initialValues?: Partial<TemplateWizardValues>;
  /** Gọi sau khi hoàn thành bước cuối */
  onSuccess?: (templateId: string) => void;
  /** Gọi khi người dùng huỷ */
  onCancel?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Thông tin cơ bản', icon: CheckCircle },
  { id: 2, label: 'Upload file mẫu', icon: Upload },
  { id: 3, label: 'Data Map', icon: Map },
] as const;

const CATEGORIES: Record<string, string> = {
  NHAN_SU: 'Nhân sự',
  DANG_VIEN: 'Đảng viên',
  BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ',
  KHEN_THUONG: 'Khen thưởng',
  DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH',
  TONG_HOP: 'Tổng hợp',
};

const MODULES = ['M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'M09', 'M10', 'M13'];
const FORMATS = ['DOCX', 'XLSX', 'PDF', 'HTML'] as const;

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
  HTML: 'bg-purple-100 text-purple-700',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateWizard({
  templateId: initialTemplateId,
  initialValues,
  onSuccess,
  onCancel,
}: TemplateWizardProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [form, setForm] = useState<TemplateWizardValues>({
    code: initialValues?.code ?? '',
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    category: initialValues?.category ?? '',
    moduleSource: initialValues?.moduleSource ?? [],
    outputFormats: initialValues?.outputFormats ?? [],
    rbacCode: initialValues?.rbacCode ?? 'EXPORT_DATA',
  });

  // templateId là kết quả sau step 1 (create) hoặc prop (edit)
  const [resolvedTemplateId, setResolvedTemplateId] = useState<string | null>(
    initialTemplateId ?? null,
  );

  // Step 2 state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState('');
  const [uploadResult, setUploadResult] = useState<{
    version: number;
    placeholders: string[];
    reliable: boolean;
    note?: string;
  } | null>(null);

  // ─── Step 1 handlers ──────────────────────────────────────────────────────

  const toggleFormat = (fmt: string) => {
    setForm((prev) => ({
      ...prev,
      outputFormats: prev.outputFormats.includes(fmt)
        ? prev.outputFormats.filter((f) => f !== fmt)
        : [...prev.outputFormats, fmt],
    }));
  };

  const toggleModule = (mod: string) => {
    setForm((prev) => ({
      ...prev,
      moduleSource: prev.moduleSource.includes(mod)
        ? prev.moduleSource.filter((m) => m !== mod)
        : [...prev.moduleSource, mod],
    }));
  };

  const handleStep1Submit = async () => {
    if (!form.code || !form.name || form.outputFormats.length === 0 || form.moduleSource.length === 0) {
      toast.error('Vui lòng điền đầy đủ: Mã, Tên, Module nguồn và ít nhất 1 định dạng xuất');
      return;
    }
    setSubmitting(true);
    try {
      if (resolvedTemplateId) {
        // Edit mode — PUT metadata
        const res = await fetch(`/api/templates/${resolvedTemplateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            description: form.description,
            category: form.category,
            moduleSource: form.moduleSource,
            outputFormats: form.outputFormats,
            rbacCode: form.rbacCode,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Lỗi cập nhật');
        toast.success('Đã cập nhật thông tin template');
      } else {
        // Create mode — POST
        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Lỗi tạo template');
        setResolvedTemplateId(json.data.id);
        toast.success('Đã tạo template. Tiếp tục upload file mẫu.');
      }
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2 handlers ──────────────────────────────────────────────────────

  const handleStep2Submit = async () => {
    if (!resolvedTemplateId) return;

    if (!uploadFile) {
      // Skip upload — đi thẳng bước 3
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (changeNote) formData.append('changeNote', changeNote);

      const res = await fetch(`/api/templates/${resolvedTemplateId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Lỗi upload');

      setUploadResult({
        version: json.data.version,
        placeholders: json.data.placeholders ?? [],
        reliable: json.data.placeholderParseReliable ?? true,
        note: json.data.placeholderNote,
      });

      toast.success(`Upload thành công — v${json.data.version}`);
      if (!json.data.placeholderParseReliable) {
        toast.warning(json.data.placeholderNote ?? 'Placeholder parse chưa chính xác');
      }
      setStep(3);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi upload');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 3: Data Map skeleton ────────────────────────────────────────────

  const handleFinish = () => {
    if (resolvedTemplateId) {
      onSuccess?.(resolvedTemplateId);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active && 'bg-blue-50 text-blue-700',
                  done && 'text-green-600',
                  !active && !done && 'text-gray-400',
                )}
                onClick={() => done && setStep(s.id)}
                disabled={!done && !active}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={cn('flex-1 h-0.5 mx-1', done ? 'bg-green-300' : 'bg-gray-200')} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Metadata ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>
                Mã template <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="VD: TMPL_NS_01"
                value={form.code}
                disabled={!!resolvedTemplateId}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''),
                  }))
                }
                className="font-mono"
              />
              <p className="text-xs text-gray-400">Chỉ A-Z, 0-9, _, - · Không thể đổi sau khi tạo</p>
            </div>
            <div className="space-y-1">
              <Label>Nhóm nghiệp vụ</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhóm" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>
              Tên mẫu biểu <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="VD: Lý lịch cán bộ 2A-LLDV"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Mô tả mục đích sử dụng..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Định dạng xuất <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-4 flex-wrap">
              {FORMATS.map((fmt) => (
                <label key={fmt} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.outputFormats.includes(fmt)}
                    onCheckedChange={() => toggleFormat(fmt)}
                  />
                  <span
                    className={`text-sm px-2 py-0.5 rounded font-medium ${FORMAT_COLORS[fmt] ?? ''}`}
                  >
                    {fmt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Module nguồn dữ liệu <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {MODULES.map((mod) => (
                <label key={mod} className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox
                    checked={form.moduleSource.includes(mod)}
                    onCheckedChange={() => toggleModule(mod)}
                  />
                  <span className="text-sm">{mod}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>RBAC Code</Label>
            <Select
              value={form.rbacCode}
              onValueChange={(v) => setForm((p) => ({ ...p, rbacCode: v }))}
            >
              <SelectTrigger className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPORT_DATA">EXPORT_DATA — Xuất đơn lẻ</SelectItem>
                <SelectItem value="EXPORT_BATCH">EXPORT_BATCH — Xuất hàng loạt</SelectItem>
                <SelectItem value="MANAGE_TEMPLATES">MANAGE_TEMPLATES — Quản trị</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onCancel}>Hủy</Button>
            <Button onClick={handleStep1Submit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {resolvedTemplateId ? 'Lưu & Tiếp theo' : 'Tạo & Tiếp theo'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Upload ───────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center space-y-3">
            <Upload className="h-10 w-10 mx-auto text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-700">Chọn file mẫu biểu</p>
              <p className="text-xs text-gray-400 mt-1">
                Hỗ trợ: .docx, .xlsx, .html · Tối đa 20MB
              </p>
            </div>
            <input
              type="file"
              accept=".docx,.xlsx,.html,.htm"
              className="hidden"
              id="template-file-input"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('template-file-input')?.click()}
            >
              Chọn file
            </Button>
            {uploadFile && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {uploadFile.name}
                </Badge>
                <span className="text-xs text-gray-400">
                  ({(uploadFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  className="text-xs text-red-400 hover:text-red-600"
                  onClick={() => setUploadFile(null)}
                >
                  Xóa
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Ghi chú version (tuỳ chọn)</Label>
            <Input
              placeholder="VD: Cập nhật theo mẫu BQP 2025..."
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Quay lại
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep(3)}>
                Bỏ qua
              </Button>
              <Button onClick={handleStep2Submit} disabled={submitting || !uploadFile}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload & Tiếp theo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Data Map (SKELETON) ──────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-green-800">
                Upload thành công — v{uploadResult.version}
              </p>
              {uploadResult.placeholders.length > 0 ? (
                <div>
                  <p className="text-xs text-green-700 mb-2">
                    Phát hiện {uploadResult.placeholders.length} placeholder
                    {!uploadResult.reliable && (
                      <span className="ml-1 text-amber-600">(kết quả ước tính)</span>
                    )}
                    :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {uploadResult.placeholders.map((p) => (
                      <Badge key={p} variant="outline" className="text-xs font-mono">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-green-700">Không phát hiện placeholder trong file.</p>
              )}
            </div>
          )}

          {/* Data Map skeleton */}
          <div className="border rounded-lg p-6 text-center space-y-3 bg-gray-50">
            <Map className="h-10 w-10 mx-auto text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Data Map</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Ánh xạ placeholder ↔ field dữ liệu từ module nguồn.
              Tính năng này sẽ được triển khai trong Phase Data Map (UC-T03).
            </p>
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              Sắp có
            </Badge>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" />Quay lại
            </Button>
            <Button onClick={handleFinish}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Hoàn thành
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
