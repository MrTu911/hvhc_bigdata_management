'use client';

/**
 * Import Template Wizard – M18 UC-T12
 * /dashboard/templates/import
 *
 * 3 bước:
 *   Step 1 – Upload   : chọn file .docx/.xlsx, submit để phân tích
 *   Step 2 – Review   : xem placeholder, override mapping
 *   Step 3 – Confirm  : đặt tên / code / category, tạo template
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SuggestedMapping {
  placeholder: string;
  suggestedKey: string | null;
  confidence: number;
}

interface FileStats {
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  reliable: boolean;
  note?: string;
}

interface AnalyzeResponse {
  analysisId: string;
  expiresAt: string;
  placeholders: string[];
  suggestedMappings: SuggestedMapping[];
  fileStats: FileStats;
}

// ─── Field catalog (flat list for Select) ──────────────────────────────────────

const FIELD_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: 'hoTen', label: 'Họ và tên', group: 'Cơ bản' },
  { value: 'gioiTinh', label: 'Giới tính', group: 'Cơ bản' },
  { value: 'ngaySinh', label: 'Ngày sinh', group: 'Cơ bản' },
  { value: 'noiSinh', label: 'Nơi sinh', group: 'Cơ bản' },
  { value: 'queQuan', label: 'Quê quán', group: 'Cơ bản' },
  { value: 'danToc', label: 'Dân tộc', group: 'Cơ bản' },
  { value: 'militaryId', label: 'Số quân nhân', group: 'Cơ bản' },
  { value: 'dienThoai', label: 'Điện thoại', group: 'Cơ bản' },
  { value: 'diaChiLienLac', label: 'Địa chỉ', group: 'Cơ bản' },
  { value: 'capBac', label: 'Cấp bậc', group: 'Chức vụ' },
  { value: 'chucVu', label: 'Chức vụ', group: 'Chức vụ' },
  { value: 'donViCongTac', label: 'Đơn vị công tác', group: 'Chức vụ' },
  { value: 'daoTao_DH_hinhThuc', label: 'ĐH – Hình thức', group: 'Đào tạo' },
  { value: 'daoTao_DH_tuNam', label: 'ĐH – Từ năm', group: 'Đào tạo' },
  { value: 'daoTao_DH_denNam', label: 'ĐH – Đến năm', group: 'Đào tạo' },
  { value: 'daoTao_DH_noiHoc', label: 'ĐH – Nơi học', group: 'Đào tạo' },
  { value: 'daoTao_DH_chuyenNganh', label: 'ĐH – Chuyên ngành', group: 'Đào tạo' },
  { value: 'daoTao_ThS_tuNam', label: 'ThS – Từ năm', group: 'Đào tạo' },
  { value: 'daoTao_ThS_tenLV', label: 'ThS – Tên luận văn', group: 'Đào tạo' },
  { value: 'daoTao_ThS_nguoiHD', label: 'ThS – Người HD', group: 'Đào tạo' },
  { value: 'daoTao_TS_tenLA', label: 'TS – Tên luận án', group: 'Đào tạo' },
  { value: 'daoTao_TS_nguoiHD_1', label: 'TS – Người HD 1', group: 'Đào tạo' },
  { value: 'daoTao_TS_nguoiHD_2', label: 'TS – Người HD 2', group: 'Đào tạo' },
  { value: 'ngoaiNgu', label: 'Ngoại ngữ', group: 'Đào tạo' },
  { value: 'khenThuong', label: 'Khen thưởng', group: 'Khen thưởng' },
  { value: 'kyLuat', label: 'Kỷ luật', group: 'Khen thưởng' },
  { value: 'ngayVaoDang', label: 'Ngày vào Đảng', group: 'Đảng' },
  { value: 'ngayChinhThuc', label: 'Ngày chính thức', group: 'Đảng' },
  { value: 'chiBoHienTai', label: 'Chi bộ hiện tại', group: 'Đảng' },
  { value: 'thoiGianKy', label: 'Thời gian ký', group: 'Xác nhận' },
  { value: 'mssv', label: 'Mã học viên', group: 'Học viên' },
  { value: 'lop', label: 'Lớp', group: 'Học viên' },
  { value: 'congTac_list', label: 'Quá trình công tác (list)', group: 'Danh sách' },
  { value: 'giaoTrinh_list', label: 'Giáo trình (list)', group: 'Danh sách' },
  { value: 'deTai_list', label: 'Đề tài NCKH (list)', group: 'Danh sách' },
  { value: 'baiBao_list', label: 'Bài báo (list)', group: 'Danh sách' },
  { value: 'ketQua_list', label: 'Kết quả học tập (list)', group: 'Danh sách' },
];

const ENTITY_TYPES = [
  { value: 'personnel', label: 'Cán bộ / Nhân sự' },
  { value: 'student', label: 'Học viên' },
  { value: 'party_member', label: 'Đảng viên' },
  { value: 'faculty', label: 'Giảng viên' },
];

const OUTPUT_FORMAT_OPTIONS = ['DOCX', 'XLSX', 'PDF'];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Upload file' },
    { n: 2, label: 'Xem xét mapping' },
    { n: 3, label: 'Xác nhận' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                s.n < current
                  ? 'bg-green-600 border-green-600 text-white'
                  : s.n === current
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
              }`}
            >
              {s.n < current ? <CheckCircle2 className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={`text-xs mt-1 whitespace-nowrap ${s.n === current ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-0.5 w-16 mx-2 mb-4 ${s.n < current ? 'bg-green-600' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 90)
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs">
        {confidence}% khớp
      </Badge>
    );
  if (confidence >= 60)
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
        {confidence}% gần đúng
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-gray-400 text-xs">
      Chưa khớp
    </Badge>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function TemplateImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Step 2 — from analyze response
  const [analysisId, setAnalysisId] = useState('');
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [suggestedMappings, setSuggestedMappings] = useState<SuggestedMapping[]>([]);

  // Step 3 — template metadata
  const [templateName, setTemplateName] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [entityType, setEntityType] = useState('');
  const [outputFormats, setOutputFormats] = useState<string[]>(['DOCX']);

  // ── Step 1: File selection ───────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  }

  function handleFileDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError('Vui lòng chọn file trước khi phân tích.');
      return;
    }

    const MAX_MB = 10;
    if (selectedFile.size > MAX_MB * 1024 * 1024) {
      setError(`File vượt quá giới hạn ${MAX_MB}MB.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append('file', selectedFile);

      const res = await fetch('/api/templates/import/analyze', {
        method: 'POST',
        body: form,
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? 'Phân tích thất bại.');
        return;
      }

      const data = json.data as AnalyzeResponse;
      setAnalysisId(data.analysisId);
      setFileStats(data.fileStats);
      setPlaceholders(data.placeholders);
      setSuggestedMappings(data.suggestedMappings);

      // Khởi tạo mappings từ gợi ý
      const initial: Record<string, string> = {};
      for (const m of data.suggestedMappings) {
        initial[m.placeholder] = m.suggestedKey ?? '';
      }
      setMappings(initial);

      // Default template name từ tên file
      const baseName = selectedFile.name.replace(/\.(docx|xlsx|html)$/i, '').replace(/[_-]/g, ' ');
      setTemplateName(baseName);
      setTemplateCode(
        baseName
          .toUpperCase()
          .replace(/[^A-Z0-9 ]/g, '')
          .replace(/\s+/g, '_')
          .slice(0, 30),
      );

      // Default output format từ file type
      setOutputFormats([data.fileStats.fileType === 'XLSX' ? 'XLSX' : 'DOCX']);

      setStep(2);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Confirm ──────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!templateName.trim()) {
      setError('Vui lòng nhập tên template.');
      return;
    }
    if (!templateCode.trim()) {
      setError('Vui lòng nhập mã template.');
      return;
    }
    if (!/^[A-Z0-9_-]+$/.test(templateCode)) {
      setError('Mã template chỉ được chứa chữ HOA, số, dấu gạch dưới và gạch ngang.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/templates/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisId,
          templateName: templateName.trim(),
          templateCode: templateCode.trim().toUpperCase(),
          description: description.trim() || undefined,
          category: category.trim() || undefined,
          entityType: entityType || undefined,
          outputFormats,
          confirmedMappings: mappings,
        }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? 'Tạo template thất bại.');
        return;
      }

      router.push(`/dashboard/templates/${json.data.templateId}`);
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const mappedCount = Object.values(mappings).filter((v) => v).length;
  const unmappedCount = placeholders.length - mappedCount;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Template</h1>
        <p className="text-muted-foreground mt-1">
          Nhập file Word/Excel hiện có để tạo template mới trong M18
        </p>
      </div>

      <StepIndicator current={step} />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Chọn file template
            </CardTitle>
            <CardDescription>
              Hỗ trợ .docx, .xlsx, .html — tối đa 10MB.
              File DOCX cần có placeholder dạng <code className="bg-muted px-1 rounded">{'{tenTruong}'}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="font-medium text-blue-700">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Badge variant="outline">{selectedFile.name.split('.').pop()?.toUpperCase()}</Badge>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium">Kéo thả file vào đây hoặc click để chọn</p>
                  <p className="text-sm text-muted-foreground">.docx, .xlsx, .html — tối đa 10MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.html,.htm"
              className="hidden"
              onChange={handleFileChange}
            />

            {selectedFile && (
              <div className="flex items-center justify-between bg-muted/50 rounded p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleAnalyze} disabled={!selectedFile || loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Phân tích file
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Review mappings ─────────────────────────────────────────── */}
      {step === 2 && fileStats && (
        <div className="space-y-4">
          {/* File info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">{fileStats.fileName}</span>
                </div>
                <Badge variant="outline">{fileStats.fileType}</Badge>
                <span className="text-sm text-muted-foreground">
                  {(fileStats.fileSizeBytes / 1024).toFixed(0)} KB
                </span>
                {fileStats.reliable ? (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Phân tích chính xác
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Kết quả gần đúng
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {placeholders.length} placeholder phát hiện
                </span>
              </div>
              {fileStats.note && (
                <p className="text-xs text-muted-foreground mt-2">{fileStats.note}</p>
              )}
            </CardContent>
          </Card>

          {/* Mapping table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Xem xét và điều chỉnh mapping</CardTitle>
              <CardDescription>
                Mỗi placeholder sẽ được điền bằng trường dữ liệu tương ứng khi xuất file.
                Để trống nếu placeholder này không cần mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {placeholders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                  <p>Không phát hiện placeholder nào trong file.</p>
                  <p className="text-sm mt-1">
                    Đảm bảo file DOCX có placeholder dạng <code>{'{tenTruong}'}</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_1.5fr_auto] gap-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span>Placeholder trong file</span>
                    <span>Field dữ liệu</span>
                    <span>Độ khớp</span>
                  </div>
                  <Separator />
                  {placeholders.map((ph) => {
                    const suggestion = suggestedMappings.find((m) => m.placeholder === ph);
                    const currentValue = mappings[ph] ?? '';
                    return (
                      <div
                        key={ph}
                        className={`grid grid-cols-[1fr_1.5fr_auto] gap-3 items-center px-2 py-1.5 rounded ${!currentValue ? 'bg-amber-50 border border-amber-200' : ''}`}
                      >
                        <code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded truncate">
                          {'{'}
                          {ph}
                          {'}'}
                        </code>
                        <Select
                          value={currentValue || '__none__'}
                          onValueChange={(val) =>
                            setMappings((prev) => ({
                              ...prev,
                              [ph]: val === '__none__' ? '' : val,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="— Không map —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Không map —</SelectItem>
                            {FIELD_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({f.group})
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <ConfidenceBadge
                          confidence={currentValue && currentValue === suggestion?.suggestedKey ? (suggestion?.confidence ?? 0) : currentValue ? 100 : 0}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {placeholders.length > 0 && (
                <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                  <span className="text-green-700 font-medium">{mappedCount} đã mapping</span>
                  {unmappedCount > 0 && (
                    <span className="text-amber-700">{unmappedCount} chưa mapping</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Button>
            <Button onClick={() => { setError(null); setStep(3); }}>
              Tiếp theo
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirm ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin template</CardTitle>
              <CardDescription>
                Template sẽ được tạo với trạng thái <strong>chưa kích hoạt</strong>.
                Admin cần bật template trước khi sử dụng để xuất dữ liệu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="templateName">
                    Tên template <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="VD: Lý lịch cán bộ quân đội"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="templateCode">
                    Mã template <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="templateCode"
                    value={templateCode}
                    onChange={(e) =>
                      setTemplateCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
                    }
                    placeholder="VD: LY_LICH_CB"
                    className="mt-1 font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Chỉ chữ HOA, số, _ và -
                  </p>
                </div>

                <div>
                  <Label htmlFor="category">Danh mục</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="VD: Nhân sự, Đào tạo..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="entityType">Loại đối tượng dữ liệu</Label>
                  <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="— Chọn loại —" />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Định dạng xuất</Label>
                  <div className="flex gap-2 mt-2">
                    {OUTPUT_FORMAT_OPTIONS.map((fmt) => (
                      <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={outputFormats.includes(fmt)}
                          onChange={(e) =>
                            setOutputFormats((prev) =>
                              e.target.checked ? [...prev, fmt] : prev.filter((f) => f !== fmt),
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-sm">{fmt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về template này..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mapping summary */}
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2">Tóm tắt mapping</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Tổng placeholder: </span>
                  <span className="font-medium">{placeholders.length}</span>
                </div>
                <div>
                  <span className="text-green-700">Đã mapping: </span>
                  <span className="font-medium text-green-700">{mappedCount}</span>
                </div>
                {unmappedCount > 0 && (
                  <div>
                    <span className="text-amber-700">Chưa mapping: </span>
                    <span className="font-medium text-amber-700">{unmappedCount}</span>
                  </div>
                )}
              </div>
              {unmappedCount > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Placeholder chưa mapping sẽ được để trống khi xuất file.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => { setError(null); setStep(2); }}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Quay lại
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Tạo template
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
