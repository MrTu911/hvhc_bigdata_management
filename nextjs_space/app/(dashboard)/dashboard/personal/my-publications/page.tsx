'use client';

/**
 * /dashboard/personal/my-publications
 * Giảng viên/NCV tự đăng và theo dõi công bố khoa học cá nhân.
 * Luồng: DRAFT → SUBMITTED → PUBLISHED | REJECTED
 */

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  BookOpen, Plus, ExternalLink, FilePen, Trash2, Send,
  AlertCircle, Loader2, CheckCircle2, Clock, FileText,
  Search, Star, XCircle, Paperclip, Upload, Eye, Download, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
].join(',');

// ─── Label maps ───────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; pill: string; border: string; dot: string }> = {
  DRAFT:     { label: 'Bản nháp',   pill: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',            border: 'border-l-gray-300 dark:border-l-gray-600', dot: 'bg-gray-400' },
  SUBMITTED: { label: 'Chờ duyệt',  pill: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', border: 'border-l-yellow-400',                      dot: 'bg-yellow-400' },
  PUBLISHED: { label: 'Đã duyệt',   pill: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     border: 'border-l-green-500',                       dot: 'bg-green-500' },
  REJECTED:  { label: 'Bị từ chối', pill: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300',             border: 'border-l-red-400',                         dot: 'bg-red-400' },
};

const PUB_TYPE_LABEL: Record<string, string> = {
  BAI_BAO_QUOC_TE:     'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC:  'Bài báo trong nước',
  SACH_CHUYEN_KHAO:    'Sách chuyên khảo',
  GIAO_TRINH:          'Giáo trình',
  SANG_KIEN:           'Sáng kiến',
  PATENT:              'Bằng sáng chế',
  BAO_CAO_KH:          'Báo cáo KH',
  LUAN_VAN:            'Luận văn',
  LUAN_AN:             'Luận án',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicationItem {
  id: string;
  title: string;
  pubType: string;
  journal: string | null;
  publishedYear: number | null;
  doi: string | null;
  impactFactor: number | null;
  status: string;
  reviewNote: string | null;
  submittedAt: string | null;
  publicationAuthors: { authorOrder: number }[];
}

interface AttachmentItem {
  id: string;
  title: string;
  mimeType: string;
  fileSize: string | number | bigint;
  createdAt: string;
}

type FilterKey = 'all' | 'DRAFT' | 'SUBMITTED' | 'PUBLISHED' | 'REJECTED';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cfg(status: string) {
  return STATUS_CFG[status] ?? { label: status, pill: 'bg-gray-100 text-gray-500', border: 'border-l-gray-300', dot: 'bg-gray-400' };
}

function formatBytes(bytes: string | number | bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  return '📎';
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
        active
          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
          : 'bg-background text-muted-foreground border-border hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

// ─── PDF Preview Dialog ───────────────────────────────────────────────────────

function PdfPreviewDialog({
  attachmentId,
  pubId,
  title,
  open,
  onClose,
}: {
  attachmentId: string;
  pubId: string;
  title: string;
  open: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setUrl(null); setErr(null); return; }
    setLoading(true);
    fetch(`/api/personal/my-publications/${pubId}/attachments/${attachmentId}/download`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUrl(res.data.url);
        else setErr(res.error ?? 'Không thể tải file');
      })
      .catch(() => setErr('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [open, pubId, attachmentId]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-red-500" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 px-4 pb-4">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {err && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm">{err}</p>
            </div>
          )}
          {url && !loading && (
            <iframe
              src={url}
              className="w-full h-full rounded-lg border border-border"
              title={title}
            />
          )}
        </div>

        <DialogFooter className="px-4 pb-4 flex-shrink-0">
          {url && (
            <a href={url} download target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-3.5 h-3.5" /> Tải xuống
              </Button>
            </a>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attachment Section ───────────────────────────────────────────────────────

function AttachmentSection({
  pubId,
  editable,
}: {
  pubId: string;
  editable: boolean;
}) {
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = useCallback(() => {
    setLoadingList(true);
    fetch(`/api/personal/my-publications/${pubId}/attachments`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setAttachments(res.data ?? []); })
      .finally(() => setLoadingList(false));
  }, [pubId]);

  useEffect(() => { loadAttachments(); }, [loadAttachments]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name);
      const res = await fetch(`/api/personal/my-publications/${pubId}/attachments`, {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Upload thất bại');
        return;
      }
      toast.success(`Đã upload: ${file.name}`);
      loadAttachments();
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/personal/my-publications/${pubId}/attachments/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) { toast.error('Xóa thất bại'); return; }
    toast.success('Đã xóa file');
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleDownload = async (att: AttachmentItem) => {
    const res = await fetch(`/api/personal/my-publications/${pubId}/attachments/${att.id}/download`);
    const json = await res.json();
    if (!res.ok || !json.success) { toast.error(json.error ?? 'Không thể tải file'); return; }
    window.open(json.data.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
          File minh chứng
          {attachments.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
              {attachments.length}
            </span>
          )}
        </p>
      </div>

      {/* Upload zone */}
      {editable && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Đang upload…</span>
            </div>
          ) : (
            <>
              <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Kéo thả hoặc <span className="text-primary font-medium">chọn file</span>
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                PDF, Word, Excel, Ảnh · Tối đa 100MB
              </p>
            </>
          )}
        </div>
      )}

      {/* File list */}
      {loadingList ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang tải…
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">Chưa có file minh chứng</p>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((att) => {
            const isPdf = att.mimeType === 'application/pdf';
            return (
              <div
                key={att.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 border border-border/50 group"
              >
                <span className="text-lg flex-shrink-0 leading-none">{fileIcon(att.mimeType)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{att.title}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(att.fileSize)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPdf && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-primary"
                      onClick={() => setPreview({ id: att.id, title: att.title })}
                      title="Xem PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => handleDownload(att)}
                    title="Tải xuống"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  {editable && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => handleDelete(att.id)}
                      title="Xóa file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <PdfPreviewDialog
          open
          pubId={pubId}
          attachmentId={preview.id}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (pub: PublicationItem) => void;
}

function CreatePublicationModal({ open, onClose, onCreated }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [pubType, setPubType] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState('');
  const [doi, setDoi] = useState('');
  const [abstract, setAbstract] = useState('');
  const [saving, setSaving] = useState(false);
  // After save: show upload step
  const [savedPub, setSavedPub] = useState<PublicationItem | null>(null);

  const reset = () => {
    setTitle(''); setPubType(''); setJournal(''); setYear('');
    setDoi(''); setAbstract(''); setSavedPub(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!title.trim() || !pubType) {
      toast.error('Vui lòng nhập tiêu đề và loại công bố');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/personal/my-publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          pubType,
          journal: journal.trim() || undefined,
          publishedYear: year ? Number(year) : undefined,
          doi: doi.trim() || undefined,
          abstract: abstract.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Tạo công bố thất bại');
        return;
      }
      toast.success('Đã tạo công bố (Bản nháp)');
      onCreated(json.data as PublicationItem);
      setSavedPub(json.data as PublicationItem);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {savedPub ? 'Thêm file minh chứng' : 'Đăng công bố mới'}
          </DialogTitle>
        </DialogHeader>

        {!savedPub ? (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Tiêu đề <span className="text-destructive">*</span></Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên bài báo, sách, patent..." />
              </div>

              <div className="space-y-1.5">
                <Label>Loại công bố <span className="text-destructive">*</span></Label>
                <Select value={pubType} onValueChange={setPubType}>
                  <SelectTrigger><SelectValue placeholder="Chọn loại..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PUB_TYPE_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tạp chí / Nhà xuất bản</Label>
                  <Input value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Tên tạp chí..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Năm xuất bản</Label>
                  <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" placeholder={String(new Date().getFullYear())} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>DOI</Label>
                <Input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/..." />
              </div>

              <div className="space-y-1.5">
                <Label>Tóm tắt</Label>
                <Textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={3} placeholder="Tóm tắt ngắn gọn (tùy chọn)..." />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={saving}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                Lưu bản nháp
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-2 space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">Đã lưu bản nháp</p>
                  <p className="text-xs text-green-600 dark:text-green-400 truncate">{savedPub.title}</p>
                </div>
              </div>

              <AttachmentSection pubId={savedPub.id} editable />
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Hoàn thành
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Review Note Dialog ───────────────────────────────────────────────────────

function ReviewNoteDialog({ note, open, onClose }: { note: string | null; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-4 h-4" /> Lý do từ chối
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap py-2">{note ?? '(Không có ghi chú)'}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Publication Card ─────────────────────────────────────────────────────────

interface PubCardProps {
  pub: PublicationItem;
  onSubmit: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (pub: PublicationItem) => void;
  onViewNote: (note: string | null) => void;
  submitting: string | null;
}

function PublicationCard({ pub, onSubmit, onDelete, onEdit, onViewNote, submitting }: PubCardProps) {
  const c = cfg(pub.status);
  const myAuthor = pub.publicationAuthors[0];
  const isSubmitting = submitting === pub.id;
  const canEdit = pub.status === 'DRAFT' || pub.status === 'REJECTED';

  return (
    <div className={`bg-card rounded-xl border-l-4 ${c.border} border border-border/60 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2 min-w-0">
          <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground leading-snug line-clamp-2">{pub.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
              {pub.journal && <span>{pub.journal}</span>}
              {pub.publishedYear && <span>{pub.publishedYear}</span>}
              {pub.impactFactor && <span>IF: {pub.impactFactor}</span>}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pl-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${c.pill}`}>{c.label}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            {PUB_TYPE_LABEL[pub.pubType] ?? pub.pubType}
          </span>
          {myAuthor?.authorOrder === 1 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" /> Tác giả 1
            </span>
          )}
          {pub.doi && (
            <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer"
              className="px-2 py-0.5 rounded-full text-xs text-primary border border-primary/30 flex items-center gap-0.5 hover:bg-primary/5">
              <ExternalLink className="w-2.5 h-2.5" /> DOI
            </a>
          )}
        </div>

        {/* Rejection note */}
        {pub.status === 'REJECTED' && pub.reviewNote && (
          <div className="ml-4 flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300 line-clamp-2">{pub.reviewNote}</p>
            <button
              onClick={() => onViewNote(pub.reviewNote)}
              className="text-xs text-red-500 underline hover:no-underline flex-shrink-0"
            >
              Xem đủ
            </button>
          </div>
        )}

        <Separator className="my-0" />

        {/* Actions */}
        <div className="pl-4 flex flex-wrap items-center gap-2">
          {pub.status === 'DRAFT' && (
            <>
              <Button size="sm" className="h-7 text-xs gap-1 px-2.5" onClick={() => onSubmit(pub.id)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Nộp duyệt
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5" onClick={() => onEdit(pub)}>
                <FilePen className="w-3 h-3" /> Chỉnh sửa
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 px-2.5 text-destructive hover:text-destructive" onClick={() => onDelete(pub.id)}>
                <Trash2 className="w-3 h-3" /> Xóa
              </Button>
            </>
          )}

          {pub.status === 'SUBMITTED' && (
            <span className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400">
              <Clock className="w-3.5 h-3.5" />
              Đang chờ phòng khoa học xét duyệt
            </span>
          )}

          {pub.status === 'REJECTED' && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 px-2.5" onClick={() => onEdit(pub)}>
                <FilePen className="w-3 h-3" /> Chỉnh sửa lại
              </Button>
              <Button size="sm" className="h-7 text-xs gap-1 px-2.5" onClick={() => onSubmit(pub.id)} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Nộp lại
              </Button>
            </>
          )}

          {pub.status === 'PUBLISHED' && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã vào CSDL chung
            </span>
          )}

          {/* File button — always visible */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 px-2.5 text-muted-foreground hover:text-foreground ml-auto"
            onClick={() => onEdit(pub)}
            title="Xem / quản lý file minh chứng"
          >
            <Paperclip className="w-3 h-3" /> File
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyPublicationsPage() {
  const [pubs, setPubs] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PublicationItem | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/personal/my-publications')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPubs(res.data);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = pubs;
    if (filter !== 'all') list = list.filter((p) => p.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(q) || (p.journal ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [pubs, filter, search]);

  const counts = useMemo(() => ({
    total: pubs.length,
    published: pubs.filter((p) => p.status === 'PUBLISHED').length,
    submitted: pubs.filter((p) => p.status === 'SUBMITTED').length,
    draft: pubs.filter((p) => p.status === 'DRAFT').length,
  }), [pubs]);

  const handleCreated = (pub: PublicationItem) => {
    setPubs((prev) => [pub, ...prev]);
  };

  const handleSubmit = async (id: string) => {
    setSubmitting(id);
    try {
      const res = await fetch(`/api/personal/my-publications/${id}/submit`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Nộp duyệt thất bại');
        return;
      }
      toast.success('Đã nộp duyệt — Phòng KH sẽ xem xét sớm');
      setPubs((prev) => prev.map((p) => p.id === id ? { ...p, status: 'SUBMITTED', reviewNote: null } : p));
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa công bố này?')) return;
    const res = await fetch(`/api/personal/my-publications/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      toast.error(json.error ?? 'Xóa thất bại');
      return;
    }
    toast.success('Đã xóa');
    setPubs((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEdit = (pub: PublicationItem) => setEditTarget(pub);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu công bố…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={load}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Công bố khoa học của tôi"
        description="Tự đăng và theo dõi trạng thái phê duyệt"
        icon={<BookOpen className="w-5 h-5" />}
        breadcrumbItems={[
          { label: 'Trang cá nhân', href: '/dashboard/personal' },
          { label: 'Công bố khoa học của tôi' },
        ]}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Đăng công bố mới
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Tổng công bố" value={counts.total} icon={<FileText className="w-5 h-5 text-primary" />} />
        <StatCard title="Đã duyệt" value={counts.published} description="Vào CSDL chung"
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />} iconClassName="bg-green-500/10" />
        <StatCard title="Chờ duyệt" value={counts.submitted} description="Phòng KH đang xem xét"
          icon={<Clock className="w-5 h-5 text-yellow-500" />} iconClassName="bg-yellow-500/10" />
        <StatCard title="Bản nháp" value={counts.draft} description="Chưa nộp"
          icon={<FilePen className="w-5 h-5 text-gray-400" />} iconClassName="bg-gray-400/10" />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tên công bố, tạp chí…"
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all',       label: `Tất cả (${counts.total})` },
            { key: 'DRAFT',     label: `Nháp (${counts.draft})` },
            { key: 'SUBMITTED', label: `Chờ duyệt (${counts.submitted})` },
            { key: 'PUBLISHED', label: `Đã duyệt (${counts.published})` },
            { key: 'REJECTED',  label: `Từ chối (${pubs.filter(p => p.status === 'REJECTED').length})` },
          ].map((f) => (
            <FilterChip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key as FilterKey)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <BookOpen className="w-12 h-12 opacity-20" />
            <p className="text-sm font-medium">
              {search ? `Không tìm thấy "${search}"` : 'Chưa có công bố nào'}
            </p>
            {!search && filter === 'all' && (
              <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={() => setCreateOpen(true)}>
                <Plus className="w-3.5 h-3.5" /> Đăng công bố đầu tiên
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((pub) => (
            <PublicationCard
              key={pub.id}
              pub={pub}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onViewNote={(note) => setNoteDialog(note)}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePublicationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      {editTarget && (
        <EditPublicationModal
          pub={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(updated) => {
            setPubs((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
            setEditTarget(null);
          }}
        />
      )}

      <ReviewNoteDialog
        note={noteDialog}
        open={noteDialog !== null}
        onClose={() => setNoteDialog(null)}
      />
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  pub: PublicationItem;
  onClose: () => void;
  onUpdated: (updated: Partial<PublicationItem> & { id: string }) => void;
}

function EditPublicationModal({ pub, onClose, onUpdated }: EditModalProps) {
  const [title, setTitle] = useState(pub.title);
  const [pubType, setPubType] = useState(pub.pubType);
  const [journal, setJournal] = useState(pub.journal ?? '');
  const [year, setYear] = useState(pub.publishedYear ? String(pub.publishedYear) : '');
  const [doi, setDoi] = useState(pub.doi ?? '');
  const [saving, setSaving] = useState(false);

  const canEdit = pub.status === 'DRAFT' || pub.status === 'REJECTED';

  const handleSave = async () => {
    if (!title.trim() || !pubType) {
      toast.error('Vui lòng nhập tiêu đề và loại công bố');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/personal/my-publications/${pub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          pubType,
          journal: journal.trim() || undefined,
          publishedYear: year ? Number(year) : undefined,
          doi: doi.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Cập nhật thất bại');
        return;
      }
      toast.success('Đã cập nhật');
      onUpdated({
        id: pub.id,
        title: title.trim(),
        pubType,
        journal: journal || null,
        publishedYear: year ? Number(year) : null,
        doi: doi || null,
        status: 'DRAFT',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePen className="w-4 h-4" /> Chỉnh sửa công bố
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Form fields */}
          <div className="space-y-1.5">
            <Label>Tiêu đề <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
          </div>
          <div className="space-y-1.5">
            <Label>Loại công bố <span className="text-destructive">*</span></Label>
            <Select value={pubType} onValueChange={setPubType} disabled={!canEdit}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PUB_TYPE_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tạp chí</Label>
              <Input value={journal} onChange={(e) => setJournal(e.target.value)} disabled={!canEdit} />
            </div>
            <div className="space-y-1.5">
              <Label>Năm</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" disabled={!canEdit} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>DOI</Label>
            <Input value={doi} onChange={(e) => setDoi(e.target.value)} placeholder="10.xxxx/..." disabled={!canEdit} />
          </div>

          <Separator />

          {/* Attachments */}
          <AttachmentSection pubId={pub.id} editable={canEdit} />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {canEdit ? 'Hủy' : 'Đóng'}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Lưu
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
