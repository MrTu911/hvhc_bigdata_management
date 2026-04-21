'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft, FlaskConical, Plus, X, CheckCircle2,
  UploadCloud, FileText, File, Eye, Trash2, Loader2, Paperclip,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// ─── Label maps ───────────────────────────────────────────────────────────────

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

const PROPOSAL_DOC_CATEGORIES = [
  { value: 'THUYET_MINH_DE_TAI', label: 'Thuyết minh đề tài' },
  { value: 'CV_CHU_NHIEM',       label: 'CV chủ nhiệm đề tài' },
  { value: 'THU_GIOI_THIEU',     label: 'Thư giới thiệu / hỗ trợ' },
  { value: 'TAI_LIEU_KHAC',      label: 'Tài liệu khác' },
];

const DOC_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  PROPOSAL_DOC_CATEGORIES.map((c) => [c.value, c.label])
);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx';
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

function getMimeLabel(mime: string): string {
  if (mime === 'application/pdf') return 'PDF';
  if (mime.includes('word')) return 'Word';
  if (mime.includes('excel') || mime.includes('spreadsheet')) return 'Excel';
  return mime.split('/')[1]?.toUpperCase() ?? 'File';
}

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024).toFixed(0)} KB`;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UnitOption { id: string; name: string; code: string }
interface FundSourceOption { id: string; name: string; code: string }

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface PendingFile {
  id: string;
  file: File;
  title: string;
  docCategory: string;
  status: UploadStatus;
  progress: number;
  errorMsg?: string;
  blobUrl?: string;
}

interface ExistingAttachment {
  id: string;
  title: string;
  docCategory: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

// ─── Attachment step (identical logic to new/page.tsx, supports existing files) ─

function AttachmentStep({
  projectId,
  onFinish,
}: {
  projectId: string;
  onFinish: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [existing, setExisting] = useState<ExistingAttachment[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load existing attachments
  useEffect(() => {
    fetch(`/api/science/attachments?entityType=PROJECT&entityId=${projectId}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setExisting(res.data ?? []); })
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, [projectId]);

  useEffect(() => {
    return () => {
      pending.forEach((f) => { if (f.blobUrl) URL.revokeObjectURL(f.blobUrl); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(rawFiles: FileList | File[]) {
    const arr = Array.from(rawFiles);
    const entries: PendingFile[] = [];
    for (const file of arr) {
      if (!ALLOWED_MIME_TYPES.has(file.type)) { toast.error(`"${file.name}": định dạng không hỗ trợ`); continue; }
      if (file.size > MAX_FILE_SIZE_BYTES) { toast.error(`"${file.name}": vượt quá 100MB`); continue; }
      const blobUrl = file.type === 'application/pdf' ? URL.createObjectURL(file) : undefined;
      entries.push({ id: crypto.randomUUID(), file, title: file.name.replace(/\.[^/.]+$/, ''), docCategory: 'THUYET_MINH_DE_TAI', status: 'pending', progress: 0, blobUrl });
    }
    if (entries.length > 0) setPending((prev) => [...prev, ...entries]);
  }

  function removePending(id: string) {
    setPending((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.blobUrl) URL.revokeObjectURL(entry.blobUrl);
      if (pdfPreview?.url === entry?.blobUrl) setPdfPreview(null);
      return prev.filter((f) => f.id !== id);
    });
  }

  function updatePending(id: string, patch: Partial<Pick<PendingFile, 'title' | 'docCategory'>>) {
    setPending((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  async function uploadSingle(entry: PendingFile) {
    if (!entry.title.trim()) { toast.error(`Vui lòng nhập tên tài liệu cho "${entry.file.name}"`); return; }
    setPending((prev) => prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading' as UploadStatus, progress: 10 } : f)));
    try {
      const fd = new FormData();
      fd.append('file', entry.file);
      fd.append('entityType', 'PROJECT');
      fd.append('entityId', projectId);
      fd.append('docCategory', entry.docCategory);
      fd.append('title', entry.title.trim());

      const ticker = setInterval(() => {
        setPending((prev) => prev.map((f) => f.id === entry.id && f.status === 'uploading' && f.progress < 85 ? { ...f, progress: f.progress + 15 } : f));
      }, 400);

      const res = await fetch('/api/science/attachments', { method: 'POST', body: fd });
      clearInterval(ticker);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(typeof json.error === 'string' ? json.error : 'Upload thất bại');

      // Move to existing list
      const newItem: ExistingAttachment = {
        id: json.data?.id,
        title: entry.title.trim(),
        docCategory: entry.docCategory,
        mimeType: entry.file.type,
        fileSize: entry.file.size,
        createdAt: new Date().toISOString(),
      };
      setExisting((prev) => [...prev, newItem]);
      setPending((prev) => prev.filter((f) => f.id !== entry.id));
      if (entry.blobUrl) URL.revokeObjectURL(entry.blobUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi upload';
      setPending((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: 'error' as UploadStatus, progress: 0, errorMsg: msg } : f));
      toast.error(`"${entry.file.name}": ${msg}`);
    }
  }

  async function uploadAll() {
    const toUpload = pending.filter((f) => f.status === 'pending' || f.status === 'error');
    if (toUpload.length === 0) { toast('Không có file nào chờ tải lên.'); return; }
    if (toUpload.some((f) => !f.title.trim())) { toast.error('Vui lòng nhập tên tài liệu cho tất cả các file.'); return; }
    setUploading(true);
    await Promise.all(toUpload.map(uploadSingle));
    setUploading(false);
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = pending.filter((f) => f.status === 'pending' || f.status === 'error').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Đã lưu thông tin đề tài</p>
          <p className="text-xs text-emerald-600 mt-0.5">Kiểm tra lại tài liệu đính kèm bên dưới.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Tài liệu đính kèm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Existing attachments */}
          {loadingExisting ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải tài liệu hiện có…
            </div>
          ) : existing.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Đã tải lên</p>
              {existing.map((att) => (
                <div key={att.id} className="flex items-center gap-3 bg-gray-50 border rounded-lg px-3 py-2">
                  {att.mimeType === 'application/pdf'
                    ? <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                    : <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{att.title}</p>
                    <p className="text-xs text-gray-400">
                      {DOC_CATEGORY_LABEL[att.docCategory] ?? att.docCategory}
                      {att.fileSize ? ` · ${fmtBytes(att.fileSize)}` : ''}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Drop zone for new files */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'rounded-lg border-2 border-dashed p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors',
              dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50',
            ].join(' ')}
          >
            <UploadCloud className="h-7 w-7 text-gray-300" />
            <p className="text-sm text-gray-500 text-center">
              Thêm tài liệu mới — kéo thả hoặc <span className="text-violet-600 underline">chọn file</span>
            </p>
            <p className="text-xs text-gray-400">PDF, Word, Excel · tối đa 100 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS}
            className="hidden"
            onChange={(e) => { if (e.target.files) { addFiles(e.target.files); e.target.value = ''; } }}
          />

          {/* Pending uploads */}
          {pending.length > 0 && (
            <div className="space-y-3">
              {pending.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    {entry.file.type === 'application/pdf'
                      ? <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                      : <File className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                      <p className="text-xs text-gray-400">{getMimeLabel(entry.file.type)} · {fmtBytes(entry.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {entry.file.type === 'application/pdf' && entry.blobUrl && entry.status !== 'uploading' && (
                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs"
                          onClick={() => setPdfPreview({ url: entry.blobUrl!, name: entry.file.name })}>
                          <Eye className="h-3.5 w-3.5" /> Xem
                        </Button>
                      )}
                      {(entry.status === 'pending' || entry.status === 'error') && (
                        <Button type="button" variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs"
                          disabled={uploading} onClick={() => uploadSingle(entry)}>
                          <UploadCloud className="h-3.5 w-3.5" /> Tải lên
                        </Button>
                      )}
                      {entry.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
                      {entry.status !== 'uploading' && (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-500"
                          onClick={() => removePending(entry.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {entry.status === 'uploading' && <Progress value={entry.progress} className="h-1.5" />}
                  {entry.status === 'error' && entry.errorMsg && (
                    <p className="text-xs text-red-600">{entry.errorMsg}</p>
                  )}
                  {entry.status !== 'uploading' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Tên tài liệu *</Label>
                        <Input value={entry.title} onChange={(e) => updatePending(entry.id, { title: e.target.value })}
                          placeholder="Ví dụ: Thuyết minh đề tài NCKH 2026" className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Loại tài liệu</Label>
                        <Select value={entry.docCategory} onValueChange={(v) => updatePending(entry.id, { docCategory: v })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PROPOSAL_DOC_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {pendingCount > 0 && (
                <Button type="button" onClick={uploadAll} disabled={uploading} className="w-full gap-2" variant="secondary">
                  {uploading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tải lên…</>
                    : <><UploadCloud className="h-4 w-4" /> Tải lên tất cả ({pendingCount} file)</>
                  }
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-6">
        <Button variant="outline" onClick={onFinish}>Về danh sách đề xuất</Button>
        <Button onClick={onFinish} className="gap-1.5">
          <CheckCircle2 className="h-4 w-4" /> Hoàn thành
        </Button>
      </div>

      {/* PDF Viewer */}
      <Dialog open={!!pdfPreview} onOpenChange={(open) => { if (!open) setPdfPreview(null); }}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden" style={{ height: '90vh', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader className="px-4 py-3 border-b" style={{ flexShrink: 0 }}>
            <DialogTitle className="text-sm font-medium truncate">{pdfPreview?.name}</DialogTitle>
          </DialogHeader>
          {pdfPreview && (
            <embed src={pdfPreview.url} type="application/pdf" style={{ flex: 1, width: '100%', minHeight: 0, border: 'none' }} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [step, setStep] = useState<'form' | 'attachments'>('form');
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [units,       setUnits]       = useState<UnitOption[]>([]);
  const [fundSources, setFundSources] = useState<FundSourceOption[]>([]);
  const [loadingRef,  setLoadingRef]  = useState(true);

  // Form fields
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
  const [projectStatus,   setProjectStatus]   = useState('');

  const [submitting, setSubmitting] = useState(false);
  const kwRef = useRef<HTMLInputElement>(null);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    setLoadingProject(true);
    fetch(`/api/science/projects/${projectId}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) { setLoadError(res.error ?? 'Không tìm thấy đề tài'); return; }
        const p = res.data;
        setTitle(p.title ?? '');
        setTitleEn(p.titleEn ?? '');
        setAbstract(p.abstract ?? '');
        setKeywords(p.keywords ?? []);
        setCategory(p.category ?? '');
        setField(p.field ?? '');
        setResearchType(p.researchType ?? '');
        setSensitivity(p.sensitivity ?? 'NORMAL');
        setStartDate(p.startDate ? p.startDate.slice(0, 10) : '');
        setEndDate(p.endDate ? p.endDate.slice(0, 10) : '');
        setBudgetRequested(p.budgetRequested != null ? String(p.budgetRequested) : '');
        setBudgetYear(p.budgetYear != null ? String(p.budgetYear) : String(new Date().getFullYear()));
        setUnitId(p.unitId ?? '');
        setFundSourceId(p.fundSourceId ?? '');
        setBqpCode(p.bqpProjectCode ?? '');
        setProjectStatus(p.status ?? '');
      })
      .catch(() => setLoadError('Lỗi kết nối server'))
      .finally(() => setLoadingProject(false));
  }, [projectId]);

  // Load reference data
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
          setUnits((j.data ?? j.units ?? []).map((u: { id: string; name: string; code?: string }) => ({
            id: u.id, name: u.name, code: u.code ?? '',
          })));
        }
        if (fRes.ok) {
          const j = await fRes.json();
          setFundSources((j.data ?? []).map((f: { id: string; name: string; code: string }) => ({
            id: f.id, name: f.name, code: f.code,
          })));
        }
      } catch {
        // Non-critical
      } finally {
        setLoadingRef(false);
      }
    }
    load();
  }, []);

  function addKeyword() {
    const kw = kwInput.trim();
    if (!kw || keywords.includes(kw)) { setKwInput(''); return; }
    setKeywords((prev) => [...prev, kw]);
    setKwInput('');
    kwRef.current?.focus();
  }

  function validate(): string | null {
    if (title.trim().length < 5)  return 'Tên đề tài phải từ 5 ký tự trở lên';
    if (!category)                 return 'Vui lòng chọn cấp đề tài';
    if (!field)                    return 'Vui lòng chọn lĩnh vực';
    if (!researchType)             return 'Vui lòng chọn loại hình nghiên cứu';
    if (startDate && endDate && new Date(endDate) < new Date(startDate))
      return 'Ngày kết thúc không được trước ngày bắt đầu';
    if (budgetRequested && Number(budgetRequested) < 0)
      return 'Kinh phí dự kiến không được âm';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(), category, field, researchType, sensitivity, keywords,
      };
      if (titleEn.trim())     payload.titleEn         = titleEn.trim();
      if (abstract.trim())    payload.abstract        = abstract.trim();
      if (startDate)          payload.startDate       = new Date(startDate).toISOString();
      if (endDate)            payload.endDate         = new Date(endDate).toISOString();
      if (budgetRequested)    payload.budgetRequested = Number(budgetRequested);
      if (budgetYear)         payload.budgetYear      = Number(budgetYear);
      if (unitId)             payload.unitId          = unitId;
      if (fundSourceId)       payload.fundSourceId    = fundSourceId;
      if (bqpCode.trim())     payload.bqpProjectCode  = bqpCode.trim();

      const res = await fetch(`/api/science/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(typeof json.error === 'string' ? json.error : JSON.stringify(json.error ?? 'Lưu thất bại'));
        return;
      }

      toast.success('Đã lưu thông tin đề tài');
      setStep('attachments');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      toast.error('Lỗi kết nối, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Loading / error states ──

  if (loadingProject) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-500">Đang tải đề tài…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-500">{loadError}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard/personal/my-research">Quay lại</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isRejected = projectStatus === 'REJECTED';
  const stepLabel  = step === 'form' ? 'Chỉnh sửa thông tin đề tài' : 'Tài liệu đính kèm';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/personal/my-research">
            <ArrowLeft size={16} className="mr-1" /> Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FlaskConical size={20} className="text-indigo-600" />
            {isRejected ? 'Chỉnh sửa lại đề tài bị từ chối' : 'Tiếp tục soạn đề tài'}
          </h1>
          <p className="text-sm text-gray-500">{stepLabel}</p>
        </div>
      </div>

      {/* Rejected note */}
      {isRejected && step === 'form' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Đề tài này đã bị từ chối. Vui lòng chỉnh sửa nội dung theo phản hồi của ban xét duyệt trước khi nộp lại.
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Thông tin đề tài' },
          { n: 2, label: 'Đính kèm tài liệu' },
        ].map(({ n, label }, i, arr) => {
          const active = (step === 'form' && n === 1) || (step === 'attachments' && n === 2);
          const done   = step === 'attachments' && n === 1;
          return (
            <div key={n} className="flex items-center gap-2">
              <div className={[
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500',
              ].join(' ')}>
                {done ? '✓' : n}
              </div>
              <span className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
              {i < arr.length - 1 && <div className="w-8 h-px bg-gray-200 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Form */}
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title">Tên đề tài (tiếng Việt) <span className="text-red-500">*</span></Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nghiên cứu về..." maxLength={500} />
                <p className="text-xs text-gray-400 text-right">{title.length}/500</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="titleEn">Tên đề tài (tiếng Anh)</Label>
                <Input id="titleEn" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Research on..." maxLength={500} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="abstract">Tóm tắt</Label>
                <Textarea id="abstract" value={abstract} onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Mô tả mục tiêu, phương pháp và dự kiến kết quả..." rows={4} maxLength={5000} />
                <p className="text-xs text-gray-400 text-right">{abstract.length}/5000</p>
              </div>
              <div className="space-y-1.5">
                <Label>Từ khoá</Label>
                <div className="flex gap-2">
                  <Input ref={kwRef} value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                    placeholder="Nhập từ khoá rồi Enter..." className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={addKeyword}><Plus size={14} /></Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {keywords.map((kw) => (
                      <span key={kw} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                        {kw}
                        <button type="button" onClick={() => setKeywords((prev) => prev.filter((k) => k !== kw))} className="hover:text-red-500">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Phân loại đề tài</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cấp đề tài <span className="text-red-500">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Chọn cấp..." /></SelectTrigger>
                  <SelectContent>{Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Lĩnh vực <span className="text-red-500">*</span></Label>
                <Select value={field} onValueChange={setField}>
                  <SelectTrigger><SelectValue placeholder="Chọn lĩnh vực..." /></SelectTrigger>
                  <SelectContent>{Object.entries(FIELD_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Loại hình nghiên cứu <span className="text-red-500">*</span></Label>
                <Select value={researchType} onValueChange={setResearchType}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại hình..." /></SelectTrigger>
                  <SelectContent>{Object.entries(RESEARCH_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mức độ bảo mật</Label>
                <Select value={sensitivity} onValueChange={setSensitivity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SENSITIVITY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Thời gian & Kinh phí</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budgetRequested">Kinh phí dự kiến (đồng)</Label>
                <Input id="budgetRequested" type="number" min={0} step={1000000} value={budgetRequested}
                  onChange={(e) => setBudgetRequested(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budgetYear">Năm ngân sách</Label>
                <Input id="budgetYear" type="number" min={2000} max={2100} value={budgetYear}
                  onChange={(e) => setBudgetYear(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Đơn vị & Nguồn kinh phí</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Đơn vị chủ trì</Label>
                {loadingRef ? <div className="h-9 bg-gray-100 rounded animate-pulse" /> : (
                  <Select value={unitId || 'none'} onValueChange={(v) => setUnitId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn đơn vị..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Không chọn —</SelectItem>
                      {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}{u.code ? ` (${u.code})` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Nguồn kinh phí</Label>
                {loadingRef ? <div className="h-9 bg-gray-100 rounded animate-pulse" /> : (
                  <Select value={fundSourceId || 'none'} onValueChange={(v) => setFundSourceId(v === 'none' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn nguồn kinh phí..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Không chọn —</SelectItem>
                      {fundSources.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="bqpCode">Mã đề tài BQP (nếu có)</Label>
                <Input id="bqpCode" value={bqpCode} onChange={(e) => setBqpCode(e.target.value)}
                  placeholder="BQP-..." maxLength={100} className="max-w-xs" />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pb-6">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/personal/my-research">Huỷ</Link>
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu…</>
                : 'Lưu & Tiếp theo →'
              }
            </Button>
          </div>
        </form>
      )}

      {/* Step 2 — Attachments */}
      {step === 'attachments' && (
        <AttachmentStep
          projectId={projectId}
          onFinish={() => router.push('/dashboard/personal/my-research')}
        />
      )}
    </div>
  );
}
