'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, FlaskConical, Plus, X } from 'lucide-react';

// ─── Enum label maps ───────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN:      'Cấp Học viện',
  CAP_TONG_CUC:      'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ Quốc phòng',
  CAP_NHA_NUOC:      'Cấp Nhà nước',
  SANG_KIEN_CO_SO:   'Sáng kiến cơ sở',
};

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT:  'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI:   'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT:              'Công nghệ thông tin',
  Y_DUOC:            'Y dược',
  KHAC:              'Khác',
};

const RESEARCH_TYPE_LABELS: Record<string, string> = {
  CO_BAN:                  'Cơ bản',
  UNG_DUNG:                'Ứng dụng',
  TRIEN_KHAI:              'Triển khai',
  SANG_KIEN_KINH_NGHIEM:   'Sáng kiến kinh nghiệm',
};

const SENSITIVITY_LABELS: Record<string, string> = {
  NORMAL:       'Thường',
  CONFIDENTIAL: 'Mật',
  SECRET:       'Tuyệt mật',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UnitOption { id: string; name: string; code: string }
interface FundSourceOption { id: string; name: string; code: string }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();

  // ── Reference data ──
  const [units,       setUnits]       = useState<UnitOption[]>([]);
  const [fundSources, setFundSources] = useState<FundSourceOption[]>([]);
  const [loadingRef,  setLoadingRef]  = useState(true);

  // ── Form fields ──
  const [title,           setTitle]           = useState('');
  const [titleEn,         setTitleEn]         = useState('');
  const [abstract,        setAbstract]        = useState('');
  const [keywords,        setKeywords]        = useState<string[]>([]);
  const [kwInput,         setKwInput]         = useState('');
  const [category,        setCategory]        = useState('');
  const [field,           setField]           = useState('');
  const [researchType,    setResearchType]    = useState('');
  const [sensitivity,     setSensitivity]     = useState('NORMAL');
  const [startDate,       setStartDate]       = useState('');
  const [endDate,         setEndDate]         = useState('');
  const [budgetRequested, setBudgetRequested] = useState('');
  const [budgetYear,      setBudgetYear]      = useState(String(new Date().getFullYear()));
  const [unitId,          setUnitId]          = useState('');
  const [fundSourceId,    setFundSourceId]    = useState('');
  const [bqpCode,         setBqpCode]         = useState('');

  const [submitting, setSubmitting] = useState(false);
  const kwRef = useRef<HTMLInputElement>(null);

  // ── Load reference data ──
  useEffect(() => {
    async function load() {
      setLoadingRef(true);
      try {
        const [uRes, fRes] = await Promise.all([
          fetch('/api/units?pageSize=200'),
          fetch('/api/science/catalogs?type=FUND_SOURCE&isActive=true&pageSize=100'),
        ]);
        if (uRes.ok) {
          const j = await uRes.json();
          setUnits((j.data ?? j.units ?? []).map((u: any) => ({
            id: u.id, name: u.name, code: u.code ?? '',
          })));
        }
        if (fRes.ok) {
          const j = await fRes.json();
          setFundSources((j.data ?? []).map((f: any) => ({
            id: f.id, name: f.name, code: f.code,
          })));
        }
      } catch {
        // Non-critical — form still usable without dropdowns
      } finally {
        setLoadingRef(false);
      }
    }
    load();
  }, []);

  // ── Keyword management ──
  function addKeyword() {
    const kw = kwInput.trim();
    if (!kw || keywords.includes(kw)) { setKwInput(''); return; }
    setKeywords((prev) => [...prev, kw]);
    setKwInput('');
    kwRef.current?.focus();
  }

  function removeKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  // ── Validation ──
  function validate(): string | null {
    if (title.trim().length < 5)  return 'Tên đề tài phải từ 5 ký tự trở lên';
    if (!category)                 return 'Vui lòng chọn cấp đề tài';
    if (!field)                    return 'Vui lòng chọn lĩnh vực';
    if (!researchType)             return 'Vui lòng chọn loại hình nghiên cứu';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return 'Ngày kết thúc không được trước ngày bắt đầu';
    }
    if (budgetRequested && Number(budgetRequested) < 0) {
      return 'Kinh phí dự kiến không được âm';
    }
    return null;
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title:        title.trim(),
        category,
        field,
        researchType,
        sensitivity,
        keywords,
      };
      if (titleEn.trim())         payload.titleEn         = titleEn.trim();
      if (abstract.trim())        payload.abstract        = abstract.trim();
      if (startDate)              payload.startDate       = new Date(startDate).toISOString();
      if (endDate)                payload.endDate         = new Date(endDate).toISOString();
      if (budgetRequested)        payload.budgetRequested = Number(budgetRequested);
      if (budgetYear)             payload.budgetYear      = Number(budgetYear);
      if (unitId)                 payload.unitId          = unitId;
      if (fundSourceId)           payload.fundSourceId    = fundSourceId;
      if (bqpCode.trim())         payload.bqpProjectCode  = bqpCode.trim();

      const res = await fetch('/api/science/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = typeof json.error === 'string'
          ? json.error
          : JSON.stringify(json.error ?? 'Tạo đề tài thất bại');
        toast.error(msg);
        return;
      }

      toast.success('Đã tạo đề tài thành công');
      router.push('/dashboard/science/projects');
    } catch {
      toast.error('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/science/projects">
            <ArrowLeft size={16} className="mr-1" /> Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical size={20} className="text-indigo-600" />
            Tạo đề tài nghiên cứu
          </h1>
          <p className="text-sm text-gray-500">Đề tài sẽ được lưu ở trạng thái Nháp (DRAFT)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Thông tin cơ bản */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="title">
                Tên đề tài (tiếng Việt) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nghiên cứu về..."
                maxLength={500}
              />
              <p className="text-xs text-gray-400 text-right">{title.length}/500</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="titleEn">Tên đề tài (tiếng Anh)</Label>
              <Input
                id="titleEn"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Research on..."
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abstract">Tóm tắt</Label>
              <Textarea
                id="abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Mô tả mục tiêu, phương pháp và dự kiến kết quả..."
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 text-right">{abstract.length}/5000</p>
            </div>

            {/* Keywords */}
            <div className="space-y-1.5">
              <Label>Từ khoá</Label>
              <div className="flex gap-2">
                <Input
                  ref={kwRef}
                  value={kwInput}
                  onChange={(e) => setKwInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="Nhập từ khoá rồi Enter..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
                  <Plus size={14} />
                </Button>
              </div>
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="hover:text-red-500"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Phân loại */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Phân loại đề tài</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-1.5">
              <Label>Cấp đề tài <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cấp..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Lĩnh vực <span className="text-red-500">*</span></Label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lĩnh vực..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Loại hình nghiên cứu <span className="text-red-500">*</span></Label>
              <Select value={researchType} onValueChange={setResearchType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại hình..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RESEARCH_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Mức độ bảo mật</Label>
              <Select value={sensitivity} onValueChange={setSensitivity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SENSITIVITY_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>

        {/* Thời gian & Ngân sách */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Thời gian & Kinh phí</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budgetRequested">Kinh phí dự kiến (đồng)</Label>
              <Input
                id="budgetRequested"
                type="number"
                min={0}
                step={1000000}
                value={budgetRequested}
                onChange={(e) => setBudgetRequested(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budgetYear">Năm ngân sách</Label>
              <Input
                id="budgetYear"
                type="number"
                min={2000}
                max={2100}
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* Đơn vị & Nguồn kinh phí */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Đơn vị & Nguồn kinh phí</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div className="space-y-1.5">
              <Label>Đơn vị chủ trì</Label>
              {loadingRef ? (
                <div className="h-9 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select value={unitId || 'none'} onValueChange={(v) => setUnitId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không chọn —</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} {u.code ? `(${u.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nguồn kinh phí</Label>
              {loadingRef ? (
                <div className="h-9 bg-gray-100 rounded animate-pulse" />
              ) : (
                <Select value={fundSourceId || 'none'} onValueChange={(v) => setFundSourceId(v === 'none' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nguồn kinh phí..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không chọn —</SelectItem>
                    {fundSources.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bqpCode">Mã đề tài BQP (nếu có)</Label>
              <Input
                id="bqpCode"
                value={bqpCode}
                onChange={(e) => setBqpCode(e.target.value)}
                placeholder="BQP-..."
                maxLength={100}
                className="max-w-xs"
              />
            </div>

          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/science/projects">Huỷ</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Tạo đề tài'}
          </Button>
        </div>

      </form>
    </div>
  );
}
