'use client';

/**
 * /dashboard/science/activities/publications-review
 * Phòng khoa học duyệt / từ chối công bố do cán bộ tự đăng.
 * Quyền: RESEARCH.PUB_REVIEW (REVIEW_RESEARCH_PUB)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, CheckCircle2, XCircle, AlertCircle, Loader2,
  Search, Star, ExternalLink, Clock, Paperclip, ChevronDown,
  ChevronUp, Eye, Download, FileText, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import toast from 'react-hot-toast';

// ─── Label maps ───────────────────────────────────────────────────────────────

const PUB_TYPE_LABEL: Record<string, string> = {
  BAI_BAO_QUOC_TE:     'Bài báo QT',
  BAI_BAO_TRONG_NUOC:  'Bài báo TN',
  SACH_CHUYEN_KHAO:    'Sách CK',
  GIAO_TRINH:          'Giáo trình',
  SANG_KIEN:           'Sáng kiến',
  PATENT:              'Bằng sáng chế',
  BAO_CAO_KH:          'Báo cáo KH',
  LUAN_VAN:            'Luận văn',
  LUAN_AN:             'Luận án',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubmittedPub {
  id: string;
  title: string;
  pubType: string;
  journal: string | null;
  publishedYear: number | null;
  doi: string | null;
  impactFactor: number | null;
  submittedAt: string | null;
  author: { id: string; name: string | null; username: string; unit: string | null };
  publicationAuthors: { authorOrder: number; authorName: string }[];
}

interface AttachmentItem {
  id: string;
  title: string;
  mimeType: string;
  fileSize: string | number | bigint;
}

// ─── Reviewer helpers ─────────────────────────────────────────────────────────

function formatBytes(bytes: string | number | bigint): string {
  const n = Number(bytes);
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileEmoji(mimeType: string) {
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  return '📎';
}

function PdfPreviewDialog({
  attachmentId,
  title,
  open,
  onClose,
}: {
  attachmentId: string;
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
    fetch(`/api/science/attachments/${attachmentId}/download`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setUrl(res.data.url);
        else setErr(res.error ?? 'Không thể tải file');
      })
      .catch(() => setErr('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [open, attachmentId]);

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
            <iframe src={url} className="w-full h-full rounded-lg border border-border" title={title} />
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

function ReviewerAttachments({ pubId }: { pubId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState<{ id: string; title: string } | null>(null);

  const load = useCallback(() => {
    if (loaded) return;
    setLoading(true);
    fetch(`/api/science/attachments?entityType=PUBLICATION&entityId=${pubId}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setAttachments(res.data ?? []); })
      .finally(() => { setLoading(false); setLoaded(true); });
  }, [pubId, loaded]);

  const handleToggle = () => {
    if (!expanded && !loaded) load();
    setExpanded((v) => !v);
  };

  const handleDownload = async (att: AttachmentItem) => {
    const res = await fetch(`/api/science/attachments/${att.id}/download`);
    const json = await res.json();
    if (!res.ok || !json.success) { return; }
    window.open(json.data.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Paperclip className="w-3 h-3" />
        File minh chứng
        {loaded && attachments.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-muted text-xs">{attachments.length}</span>
        )}
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" /> Đang tải…
            </div>
          )}
          {!loading && loaded && attachments.length === 0 && (
            <p className="text-xs text-muted-foreground/60 italic">Không có file minh chứng</p>
          )}
          {attachments.map((att) => {
            const isPdf = att.mimeType === 'application/pdf';
            return (
              <div
                key={att.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/50 border border-border/50 group"
              >
                <span className="text-base flex-shrink-0 leading-none">{fileEmoji(att.mimeType)}</span>
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {preview && (
        <PdfPreviewDialog
          open
          attachmentId={preview.id}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

interface ReviewModalProps {
  pub: SubmittedPub | null;
  action: 'APPROVE' | 'REJECT' | null;
  onClose: () => void;
  onDone: (id: string) => void;
}

function ReviewModal({ pub, action, onClose, onDone }: ReviewModalProps) {
  const [reviewNote, setReviewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setReviewNote(''); }, [pub, action]);

  if (!pub || !action) return null;

  const isReject = action === 'REJECT';

  const handleConfirm = async () => {
    if (isReject && !reviewNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/research/publications/${pub.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote: reviewNote.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Thao tác thất bại');
        return;
      }
      toast.success(isReject ? 'Đã từ chối và thông báo tác giả' : 'Đã duyệt — công bố vào CSDL chung');
      onDone(pub.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isReject ? 'text-red-600' : 'text-green-600'}`}>
            {isReject
              ? <><XCircle className="w-4 h-4" /> Từ chối công bố</>
              : <><CheckCircle2 className="w-4 h-4" /> Duyệt công bố</>
            }
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-3">
          <p className="text-sm font-medium text-foreground line-clamp-3">{pub.title}</p>
          <p className="text-xs text-muted-foreground">
            Tác giả: <span className="font-medium">{pub.author.name ?? pub.author.username}</span>
            {pub.author.unit && <> · {pub.author.unit}</>}
          </p>

          {isReject ? (
            <div className="space-y-1.5">
              <Label>Lý do từ chối <span className="text-destructive">*</span></Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Nêu rõ lý do để tác giả chỉnh sửa lại..."
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Ghi chú (tùy chọn)</Label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                placeholder="Ghi chú khi duyệt (không bắt buộc)..."
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
          <Button
            onClick={handleConfirm}
            disabled={saving}
            variant={isReject ? 'destructive' : 'default'}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
            {isReject ? 'Xác nhận từ chối' : 'Xác nhận duyệt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Publication Row ──────────────────────────────────────────────────────────

function PubRow({
  pub,
  onAction,
}: {
  pub: SubmittedPub;
  onAction: (pub: SubmittedPub, action: 'APPROVE' | 'REJECT') => void;
}) {
  const submittedDate = pub.submittedAt
    ? new Date(pub.submittedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

  return (
    <div className="bg-card rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground leading-snug line-clamp-2">{pub.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{pub.author.name ?? pub.author.username}</span>
              {pub.author.unit && <span>{pub.author.unit}</span>}
              {pub.journal && <span>{pub.journal}</span>}
              {pub.publishedYear && <span>{pub.publishedYear}</span>}
              {pub.impactFactor && <span>IF: {pub.impactFactor}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
            {PUB_TYPE_LABEL[pub.pubType] ?? pub.pubType}
          </span>
          {pub.publicationAuthors[0]?.authorOrder === 1 && (
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
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> Nộp: {submittedDate}
          </span>
        </div>

        <ReviewerAttachments pubId={pub.id} />

        <Separator className="my-0" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 px-3 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onAction(pub, 'APPROVE')}
          >
            <CheckCircle2 className="w-3 h-3" /> Duyệt
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 px-3 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => onAction(pub, 'REJECT')}
          >
            <XCircle className="w-3 h-3" /> Từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicationsReviewPage() {
  const [pubs, setPubs] = useState<SubmittedPub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<SubmittedPub | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/research/publications?status=SUBMITTED&limit=100')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPubs(res.data ?? []);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = pubs.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.author.name ?? '').toLowerCase().includes(q) ||
      (p.author.username).toLowerCase().includes(q)
    );
  });

  const openAction = (pub: SubmittedPub, action: 'APPROVE' | 'REJECT') => {
    setReviewTarget(pub);
    setReviewAction(action);
  };

  const handleDone = (id: string) => {
    setPubs((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách công bố chờ duyệt…</p>
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
        title="Duyệt công bố khoa học"
        description="Xem xét và phê duyệt công bố do cán bộ tự đăng"
        icon={<BookOpen className="w-5 h-5" />}
        breadcrumbItems={[
          { label: 'Hoạt động KH', href: '/dashboard/science/activities' },
          { label: 'Duyệt công bố' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Chờ duyệt"
          value={pubs.length}
          description="Cần xem xét"
          icon={<Clock className="w-5 h-5 text-yellow-500" />}
          iconClassName="bg-yellow-500/10"
        />
        <StatCard
          title="Kết quả tìm kiếm"
          value={filtered.length}
          icon={<BookOpen className="w-5 h-5 text-primary" />}
        />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tên công bố, tác giả…"
          className="pl-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 opacity-20 text-green-500" />
            <p className="text-sm font-medium">
              {search ? `Không tìm thấy "${search}"` : 'Không có công bố nào đang chờ duyệt'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((pub) => (
            <PubRow key={pub.id} pub={pub} onAction={openAction} />
          ))}
        </div>
      )}

      <ReviewModal
        pub={reviewTarget}
        action={reviewAction}
        onClose={() => { setReviewTarget(null); setReviewAction(null); }}
        onDone={handleDone}
      />
    </div>
  );
}
