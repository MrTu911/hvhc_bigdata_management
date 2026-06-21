'use client';

/**
 * EvidenceManager — quản lý minh chứng (ảnh/PDF) cho MỘT trường/bản ghi của hồ sơ điện tử.
 *
 * Dùng chung cho mọi chỗ: bản ghi list section, trường đơn (tab Cơ bản), sub-record...
 * Truyền target descriptor + canEdit. Component tự gọi /api/profile/evidence.
 *
 * - Xem: mở /api/profile/evidence/[id]/download (presigned URL mới) ở tab mới.
 * - Upload (canEdit): chọn nhiều file ảnh/PDF, validate phía client trước khi gửi.
 * - Xóa (canEdit): soft-delete.
 *
 * KHÔNG bắt buộc có minh chứng — chỉ là tùy chọn bổ sung.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Paperclip, Upload, Trash2, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type EvidenceTargetType =
  | 'CADRE_SECTION'
  | 'PROFILE_FIELD'
  | 'WORK_EXPERIENCE'
  | 'EDUCATION'
  | 'FOREIGN_CERT'
  | 'TECH_CERT'
  | 'PUBLICATION'
  | 'RANK_DECL';

export interface EvidenceItem {
  id: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  note: string | null;
  uploadedAt: string;
}

interface EvidenceManagerProps {
  targetType: EvidenceTargetType;
  targetId: string;
  sectionSlug?: string;
  /** Có giá trị → minh chứng gắn theo trường đơn lẻ. */
  fieldKey?: string;
  canEdit: boolean;
  /** Hiển thị gọn (inline cạnh field). Mặc định false = block đầy đủ. */
  compact?: boolean;
  label?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(mime: string | null): boolean {
  return !!mime && mime.startsWith('image/');
}

export function EvidenceManager({
  targetType,
  targetId,
  sectionSlug,
  fieldKey,
  canEdit,
  compact = false,
  label = 'Minh chứng',
}: EvidenceManagerProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams({ targetType, targetId });
    if (sectionSlug) q.set('sectionSlug', sectionSlug);
    if (fieldKey !== undefined) q.set('fieldKey', fieldKey);
    return q.toString();
  }, [targetType, targetId, sectionSlug, fieldKey]);

  const load = useCallback(async () => {
    if (!targetId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/evidence?${buildQuery()}`);
      const json = await res.json();
      if (res.ok && json.success) setItems(json.data ?? []);
    } catch {
      /* giữ trạng thái cũ; UI có empty/loading riêng */
    } finally {
      setLoading(false);
    }
  }, [buildQuery, targetId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePick = () => fileInputRef.current?.click();

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    // Validate phía client để phản hồi nhanh; backend vẫn validate lại.
    for (const f of files) {
      if (!ALLOWED_MIME.has(f.type)) {
        toast({ title: 'File không hợp lệ', description: `Chỉ chấp nhận ảnh hoặc PDF: ${f.name}`, variant: 'destructive' });
        return;
      }
      if (f.size <= 0 || f.size > MAX_BYTES) {
        toast({ title: 'File quá lớn', description: `Tối đa 10MB: ${f.name}`, variant: 'destructive' });
        return;
      }
    }

    setUploading(true);
    let okCount = 0;
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('targetType', targetType);
        fd.append('targetId', targetId);
        if (sectionSlug) fd.append('sectionSlug', sectionSlug);
        if (fieldKey !== undefined) fd.append('fieldKey', fieldKey);

        const res = await fetch('/api/profile/evidence', { method: 'POST', body: fd });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success) {
          okCount += 1;
        } else if (json.code === 'REQUIRES_APPROVAL') {
          toast({
            title: 'Hồ sơ đã chốt khai báo',
            description: 'Bổ sung minh chứng sau khi chốt phải gửi qua đề nghị cập nhật 2 cấp.',
            variant: 'destructive',
          });
          break;
        } else {
          toast({ title: 'Lỗi tải lên', description: json.error || `Không tải được ${file.name}`, variant: 'destructive' });
        }
      }
      if (okCount > 0) {
        toast({ title: 'Đã tải minh chứng', description: `${okCount} file đã được lưu.` });
        await load();
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/profile/evidence/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setItems((prev) => prev.filter((it) => it.id !== id));
        toast({ title: 'Đã xóa minh chứng' });
      } else if (json.code === 'REQUIRES_APPROVAL') {
        toast({ title: 'Hồ sơ đã chốt khai báo', description: 'Không thể xóa minh chứng trực tiếp.', variant: 'destructive' });
      } else {
        toast({ title: 'Lỗi', description: json.error || 'Không xóa được minh chứng', variant: 'destructive' });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const hasItems = items.length > 0;

  // Ẩn hoàn toàn khi không có quyền sửa VÀ chưa có minh chứng nào (giữ UI sạch).
  if (!canEdit && !loading && !hasItems) return null;

  return (
    <div className={cn('rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-2.5', compact && 'p-2')}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <Paperclip className="h-3.5 w-3.5" />
          {label}
          {hasItems && <span className="text-slate-400">({items.length})</span>}
        </span>
        {canEdit && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-blue-700 hover:bg-blue-50"
            onClick={handlePick}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            <span className="ml-1">Tải lên</span>
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {loading ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...
        </div>
      ) : hasItems ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
            >
              {isImage(it.mimeType) ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <FileText className="h-4 w-4 shrink-0 text-rose-600" />
              )}
              <a
                href={`/api/profile/evidence/${it.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-1 truncate font-medium text-slate-700 hover:text-blue-700 hover:underline"
                title={it.fileName}
              >
                <span className="truncate">{it.fileName}</span>
                <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
              </a>
              {it.fileSize ? <span className="shrink-0 text-slate-400">{formatSize(it.fileSize)}</span> : null}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(it.id)}
                  disabled={deletingId === it.id}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  title="Xóa minh chứng"
                >
                  {deletingId === it.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        canEdit && <p className="mt-1.5 text-xs text-slate-400">Chưa có minh chứng. Có thể tải ảnh/PDF (không bắt buộc).</p>
      )}
    </div>
  );
}
