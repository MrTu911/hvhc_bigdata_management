'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, FlaskConical, CheckCircle2, DollarSign, AlertTriangle, Loader2 } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện',
  CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ Quốc phòng',
  CAP_NHA_NUOC: 'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI: 'KHXH & NV',
  KHOA_HOC_TU_NHIEN: 'KH tự nhiên',
  CNTT: 'CNTT',
  Y_DUOC: 'Y dược',
  KHAC: 'Khác',
};

const TYPE_LABELS: Record<string, string> = {
  CO_BAN: 'Cơ bản',
  UNG_DUNG: 'Ứng dụng',
  TRIEN_KHAI: 'Triển khai',
  SANG_KIEN_KINH_NGHIEM: 'Sáng kiến kinh nghiệm',
};

// Budget category descriptions for guidance
const BUDGET_NOTES: Record<string, string> = {
  CAP_HOC_VIEN: 'Đề tài cấp Học viện: kinh phí thường từ 20–100 triệu đồng',
  CAP_TONG_CUC: 'Đề tài cấp Tổng cục: kinh phí thường từ 100–500 triệu đồng',
  CAP_BO_QUOC_PHONG: 'Đề tài cấp Bộ: kinh phí thường từ 500 triệu – 2 tỷ đồng',
  CAP_NHA_NUOC: 'Đề tài cấp Nhà nước: kinh phí thường từ 1 tỷ đồng trở lên',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở: thường không yêu cầu kinh phí chính thức',
};

const STEPS = [
  { label: 'Thông tin cơ bản', description: 'Mã, tên, phân loại, chủ nhiệm' },
  { label: 'Lịch trình', description: 'Thời gian thực hiện' },
  { label: 'Kinh phí', description: 'Ngân sách & năm kế hoạch' },
  { label: 'Tóm tắt & Xác nhận', description: 'Mô tả, từ khóa, xem lại' },
];

const emptyForm = {
  projectCode: '',
  title: '',
  titleEn: '',
  category: '',
  field: '',
  researchType: '',
  principalInvestigatorId: '',
  unitId: '',
  budgetRequested: '',
  budgetYear: String(new Date().getFullYear()),
  startDate: '',
  endDate: '',
  abstract: '',
  keywords: '',
};

interface DuplicateMatch {
  id: string;
  projectCode: string;
  title: string;
  status: string;
  similarity: number;
  reasons: string[];
}

export default function NewNckhProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [dupRisk, setDupRisk] = useState<'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | null>(null);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.projectCode.trim()) { toast.error('Vui lòng nhập mã đề tài'); return false; }
      if (!form.title.trim()) { toast.error('Vui lòng nhập tên đề tài'); return false; }
      if (!form.category) { toast.error('Vui lòng chọn cấp đề tài'); return false; }
      if (!form.field) { toast.error('Vui lòng chọn lĩnh vực'); return false; }
      if (!form.researchType) { toast.error('Vui lòng chọn loại nghiên cứu'); return false; }
      if (!form.principalInvestigatorId.trim()) { toast.error('Vui lòng nhập ID chủ nhiệm'); return false; }
    }
    if (step === 1) {
      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        toast.error('Ngày kết thúc phải sau ngày bắt đầu');
        return false;
      }
    }
    if (step === 2) {
      const budget = form.budgetRequested ? parseFloat(form.budgetRequested) : 0;
      if (budget < 0) { toast.error('Kinh phí không hợp lệ'); return false; }
    }
    return true;
  };

  const runDuplicateCheck = async () => {
    if (!form.title.trim()) return;
    setChecking(true);
    try {
      const res = await fetch('/api/research/ai/duplicate-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDuplicates(data.data.duplicates ?? []);
        setDupRisk(data.data.risk ?? 'NONE');
        if (data.data.risk === 'HIGH') toast.error('Cảnh báo: phát hiện đề tài có khả năng trùng lặp cao!');
        else if (data.data.risk === 'MEDIUM') toast('Lưu ý: có đề tài tương tự trong hệ thống', { icon: '⚠️' });
      }
    } catch {
      // Silent – duplicate check is advisory only
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (!validateStep()) return;
    // Run duplicate check when leaving step 0 (title is now set)
    if (step === 0) void runDuplicateCheck();
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body = {
        ...form,
        budgetRequested: form.budgetRequested ? parseFloat(form.budgetRequested) : undefined,
        budgetYear: form.budgetYear ? parseInt(form.budgetYear) : undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        titleEn: form.titleEn || undefined,
        unitId: form.unitId || undefined,
        abstract: form.abstract || undefined,
      };
      const res = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đề tài');
      toast.success('Tạo đề tài thành công');
      router.push(`/dashboard/research/projects/${data.data.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi khi tạo đề tài');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/research/projects')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-100">
            <FlaskConical className="h-5 w-5 text-violet-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thêm đề tài NCKH mới</h1>
            <p className="text-xs text-gray-500">Điền thông tin qua {STEPS.length} bước</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                idx < step
                  ? 'bg-emerald-500 text-white'
                  : idx === step
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {idx < step ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              <span className={`text-xs hidden sm:block text-center ${idx === step ? 'text-violet-700 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-2 mb-4 ${idx < step ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{STEPS[step].label}</CardTitle>
          <p className="text-sm text-gray-500">{STEPS[step].description}</p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Step 0: Basic info */}
          {step === 0 && (
            <>
              <div className="space-y-1">
                <Label>Mã đề tài <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="VD: NCKH-2026-001"
                  value={form.projectCode}
                  onChange={(e) => set('projectCode', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tên đề tài (tiếng Việt) <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Nhập tên đề tài..."
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tên đề tài (tiếng Anh)</Label>
                <Input
                  placeholder="English title (optional)"
                  value={form.titleEn}
                  onChange={(e) => set('titleEn', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Cấp đề tài <span className="text-red-500">*</span></Label>
                  <Select value={form.category} onValueChange={(v) => set('category', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn cấp..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Lĩnh vực <span className="text-red-500">*</span></Label>
                  <Select value={form.field} onValueChange={(v) => set('field', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn lĩnh vực..." /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FIELD_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Loại nghiên cứu <span className="text-red-500">*</span></Label>
                <Select value={form.researchType} onValueChange={(v) => set('researchType', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại nghiên cứu..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>ID Chủ nhiệm đề tài <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="User ID của chủ nhiệm..."
                  value={form.principalInvestigatorId}
                  onChange={(e) => set('principalInvestigatorId', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>ID Đơn vị (tùy chọn)</Label>
                <Input
                  placeholder="Unit ID..."
                  value={form.unitId}
                  onChange={(e) => set('unitId', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 1: Schedule */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Ngày bắt đầu</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ngày kết thúc dự kiến</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                  />
                </div>
              </div>
              {form.startDate && form.endDate && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-xs text-emerald-700">
                    Thời gian thực hiện:{' '}
                    <span className="font-medium">
                      {Math.ceil(
                        (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) /
                        (1000 * 60 * 60 * 24 * 30)
                      )}{' '}
                      tháng
                    </span>
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  Mốc tiến độ chi tiết (milestone) sẽ được thêm sau khi đề tài được phê duyệt.
                </p>
              </div>
            </>
          )}

          {/* Step 2: Budget */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Năm ngân sách <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    placeholder={String(new Date().getFullYear())}
                    value={form.budgetYear}
                    onChange={(e) => set('budgetYear', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kinh phí yêu cầu (triệu đồng)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="VD: 150"
                      className="pl-8"
                      value={form.budgetRequested}
                      onChange={(e) => set('budgetRequested', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {form.category && (
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {BUDGET_NOTES[form.category] ?? ''}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 border p-3 space-y-1.5 text-xs text-gray-500">
                <p className="font-medium text-gray-700">Lưu ý:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Kinh phí phê duyệt sẽ được xác nhận trong quá trình xét duyệt</li>
                  <li>Kinh phí thực tế theo dõi trong giai đoạn thực hiện</li>
                  <li>Đề tài sáng kiến cơ sở có thể để trống nếu không có kinh phí</li>
                </ul>
              </div>
            </>
          )}

          {/* Step 3: Summary & confirm */}
          {step === 3 && (
            <>
              <div className="space-y-1">
                <Label>Tóm tắt đề tài</Label>
                <Textarea
                  rows={5}
                  placeholder="Mô tả mục tiêu, phương pháp, kết quả dự kiến của đề tài..."
                  value={form.abstract}
                  onChange={(e) => set('abstract', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Từ khóa (phân cách bằng dấu phẩy)</Label>
                <Input
                  placeholder="VD: hậu cần, tối ưu hóa, AI"
                  value={form.keywords}
                  onChange={(e) => set('keywords', e.target.value)}
                />
                {form.keywords && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {form.keywords.split(',').map((k) => k.trim()).filter(Boolean).map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs border border-violet-100">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Duplicate check results */}
              {checking && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Đang kiểm tra trùng lặp...
                </div>
              )}
              {!checking && dupRisk && dupRisk !== 'NONE' && duplicates.length > 0 && (
                <div className={`rounded-lg border p-3 space-y-2 ${
                  dupRisk === 'HIGH'   ? 'bg-red-50 border-red-200' :
                  dupRisk === 'MEDIUM' ? 'bg-amber-50 border-amber-200' :
                                         'bg-yellow-50 border-yellow-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${dupRisk === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                    <p className={`text-xs font-semibold ${dupRisk === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}>
                      {dupRisk === 'HIGH'   ? 'Cảnh báo: Phát hiện đề tài có khả năng trùng lặp cao' :
                       dupRisk === 'MEDIUM' ? 'Lưu ý: Có đề tài tương tự trong hệ thống' :
                                              'Có một số đề tài liên quan'}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {duplicates.slice(0, 5).map((d) => (
                      <li key={d.id} className="text-xs">
                        <span className="font-medium text-gray-800">{d.title}</span>
                        <span className="ml-2 text-gray-500">({d.projectCode})</span>
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          d.similarity >= 0.75 ? 'bg-red-100 text-red-700' :
                          d.similarity >= 0.55 ? 'bg-amber-100 text-amber-700' :
                                                  'bg-gray-100 text-gray-600'
                        }`}>
                          {Math.round(d.similarity * 100)}% tương đồng
                        </span>
                        {d.reasons[0] && <span className="ml-1 text-gray-400">· {d.reasons[0]}</span>}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-400">Đây là cảnh báo tham khảo. Bạn vẫn có thể tiếp tục tạo đề tài.</p>
                </div>
              )}

              {/* Review summary */}
              <div className="rounded-lg bg-gray-50 border p-4 space-y-2 text-sm">
                <p className="font-semibold text-gray-800 pb-1 border-b">Xem lại thông tin đề tài</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <span className="text-gray-500">Mã đề tài</span>
                  <span className="font-medium text-gray-900">{form.projectCode || '—'}</span>
                  <span className="text-gray-500">Tên đề tài</span>
                  <span className="font-medium text-gray-900 col-span-1 break-words">{form.title || '—'}</span>
                  <span className="text-gray-500">Cấp</span>
                  <span className="font-medium text-gray-900">{CATEGORY_LABELS[form.category] || '—'}</span>
                  <span className="text-gray-500">Lĩnh vực</span>
                  <span className="font-medium text-gray-900">{FIELD_LABELS[form.field] || '—'}</span>
                  <span className="text-gray-500">Loại NC</span>
                  <span className="font-medium text-gray-900">{TYPE_LABELS[form.researchType] || '—'}</span>
                  <span className="text-gray-500">Năm NS</span>
                  <span className="font-medium text-gray-900">{form.budgetYear || '—'}</span>
                  <span className="text-gray-500">Kinh phí yêu cầu</span>
                  <span className="font-medium text-gray-900">
                    {form.budgetRequested ? `${parseFloat(form.budgetRequested).toLocaleString('vi-VN')} triệu đồng` : '—'}
                  </span>
                  <span className="text-gray-500">Thời gian</span>
                  <span className="font-medium text-gray-900">
                    {form.startDate && form.endDate
                      ? `${form.startDate} → ${form.endDate}`
                      : form.startDate || form.endDate || '—'}
                  </span>
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="bg-violet-600 hover:bg-violet-700 text-white">
            Tiếp theo
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {submitting ? 'Đang tạo...' : 'Tạo đề tài'}
            <CheckCircle2 className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
