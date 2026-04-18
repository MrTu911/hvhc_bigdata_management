'use client';

/**
 * Tạo đề xuất NCKH mới — PI self-service form
 * Multi-step: Thông tin cơ bản → Kế hoạch & Ngân sách
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';

const RESEARCH_TYPES = [
  { value: 'CAP_HOC_VIEN', label: 'Cấp Học viện' },
  { value: 'CAP_TONG_CUC', label: 'Cấp Tổng cục' },
  { value: 'CAP_BO', label: 'Cấp Bộ' },
  { value: 'CAP_NHA_NUOC', label: 'Cấp Nhà nước' },
];
const CATEGORIES = [
  { value: 'CO_BAN', label: 'Nghiên cứu cơ bản' },
  { value: 'UNG_DUNG', label: 'Nghiên cứu ứng dụng' },
  { value: 'PHAT_TRIEN', label: 'Nghiên cứu phát triển' },
];
const FIELDS = [
  { value: 'QUAN_SU', label: 'Khoa học Quân sự' },
  { value: 'KY_THUAT', label: 'Kỹ thuật – Công nghệ' },
  { value: 'XA_HOI', label: 'Khoa học Xã hội' },
  { value: 'KINH_TE', label: 'Kinh tế – Quản lý' },
  { value: 'Y_HOC', label: 'Y học' },
  { value: 'KHAC', label: 'Khác' },
];

export default function NewProposalPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', titleEn: '', abstract: '', keywords: '',
    researchType: '', category: '', field: '',
    budgetRequested: '', durationMonths: '12',
    reviewDeadline: '',
  });

  const setField = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep1 = () => {
    if (!form.title.trim()) { toast.error('Tên đề tài không được để trống'); return false; }
    if (!form.researchType) { toast.error('Vui lòng chọn cấp đề tài'); return false; }
    if (!form.category) { toast.error('Vui lòng chọn loại nghiên cứu'); return false; }
    if (!form.field) { toast.error('Vui lòng chọn lĩnh vực'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.budgetRequested || Number(form.budgetRequested) <= 0) {
      toast.error('Vui lòng nhập kinh phí đề nghị'); return false;
    }
    if (!form.durationMonths || Number(form.durationMonths) <= 0) {
      toast.error('Thời gian thực hiện phải lớn hơn 0'); return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(2);
  };

  const handleSubmit = async (asDraft = true) => {
    if (!validateStep1() || !validateStep2()) return;

    setSubmitting(true);
    try {
      const body = {
        title: form.title.trim(),
        titleEn: form.titleEn.trim() || undefined,
        abstract: form.abstract.trim() || undefined,
        keywords: form.keywords ? form.keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        researchType: form.researchType,
        category: form.category,
        field: form.field,
        budgetRequested: Number(form.budgetRequested.replace(/,/g, '')),
        durationMonths: Number(form.durationMonths),
        reviewDeadline: form.reviewDeadline || undefined,
      };

      const res = await fetch('/api/science/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        toast.error(json.error ?? 'Tạo đề xuất thất bại');
        return;
      }

      const proposalId = json.data.id;

      if (!asDraft) {
        // Nộp ngay
        const submitRes = await fetch(`/api/science/proposals/${proposalId}/submit`, { method: 'POST' });
        const submitJson = await submitRes.json();
        if (!submitJson.success) {
          toast.error(submitJson.error ?? 'Nộp đề xuất thất bại');
          router.push('/dashboard/science/activities/proposals');
          return;
        }
        toast.success('Đề xuất đã được tạo và nộp thành công');
      } else {
        toast.success('Đề xuất đã lưu nháp');
      }

      router.push('/dashboard/science/activities/proposals');
    } catch { toast.error('Lỗi kết nối'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/science/activities/proposals">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Đề xuất NCKH mới</h1>
          <div className="flex items-center gap-2 mt-1">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium ${
                  step >= s ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{s}</div>
                <span className="text-xs text-muted-foreground">
                  {s === 1 ? 'Thông tin cơ bản' : 'Kế hoạch & Ngân sách'}
                </span>
                {s < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin đề tài</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên đề tài (tiếng Việt) <span className="text-red-500">*</span></Label>
              <Input placeholder="Nghiên cứu về..." value={form.title} onChange={(e) => setField('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tên đề tài (tiếng Anh)</Label>
              <Input placeholder="Research on..." value={form.titleEn} onChange={(e) => setField('titleEn', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Cấp đề tài <span className="text-red-500">*</span></Label>
                <Select value={form.researchType} onValueChange={(v) => setField('researchType', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>{RESEARCH_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loại nghiên cứu <span className="text-red-500">*</span></Label>
                <Select value={form.category} onValueChange={(v) => setField('category', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lĩnh vực <span className="text-red-500">*</span></Label>
                <Select value={form.field} onValueChange={(v) => setField('field', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
                  <SelectContent>{FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tóm tắt đề tài</Label>
              <Textarea rows={4} placeholder="Mục tiêu, phương pháp, kết quả dự kiến..."
                value={form.abstract} onChange={(e) => setField('abstract', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Từ khóa (phân cách bằng dấu phẩy)</Label>
              <Input placeholder="an ninh quốc gia, trí tuệ nhân tạo, vũ khí..."
                value={form.keywords} onChange={(e) => setField('keywords', e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={handleNext}>
                Tiếp theo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Kế hoạch & Ngân sách</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kinh phí đề nghị (VNĐ) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" placeholder="100000000"
                  value={form.budgetRequested} onChange={(e) => setField('budgetRequested', e.target.value)} />
                {form.budgetRequested && (
                  <p className="text-xs text-muted-foreground">
                    {Number(form.budgetRequested).toLocaleString('vi-VN')} đồng
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Thời gian thực hiện (tháng) <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" max="60"
                  value={form.durationMonths} onChange={(e) => setField('durationMonths', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Hạn thẩm định đề xuất</Label>
              <Input type="date" value={form.reviewDeadline}
                onChange={(e) => setField('reviewDeadline', e.target.value)} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" />Quay lại
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={submitting}
                  onClick={() => handleSubmit(true)}>
                  Lưu nháp
                </Button>
                <Button type="button" disabled={submitting} onClick={() => handleSubmit(false)}>
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? 'Đang gửi...' : 'Tạo & Nộp ngay'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
