'use client';

/**
 * EvidenceButton — nút minh chứng gọn (icon ghim + badge số lượng) mở dialog quản lý minh chứng.
 *
 * Dùng cạnh một trường (field-level) hoặc một bản ghi (record-level) để KHÔNG làm rối form/bảng:
 * chỉ hiện 1 icon nhỏ; bấm vào mới mở danh sách upload/xem/xóa (EvidenceManager).
 */
import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { EvidenceManager, type EvidenceTargetType } from './evidence-manager';

interface EvidenceButtonProps {
  targetType: EvidenceTargetType;
  targetId: string;
  sectionSlug?: string;
  fieldKey?: string;
  canEdit: boolean;
  /** Số minh chứng để hiển thị badge (caller cấp; không tự fetch để tránh N request). */
  count?: number;
  /** Tiêu đề dialog + nhãn để người dùng biết đang gắn minh chứng cho mục nào. */
  title: string;
  className?: string;
}

export function EvidenceButton({
  targetType,
  targetId,
  sectionSlug,
  fieldKey,
  canEdit,
  count,
  title,
  className,
}: EvidenceButtonProps) {
  const [open, setOpen] = useState(false);
  const hasEvidence = (count ?? 0) > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={hasEvidence ? `${count} minh chứng` : 'Minh chứng (ảnh/PDF)'}
        className={cn(
          'relative inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600',
          hasEvidence && 'text-blue-600 hover:text-blue-700',
          className,
        )}
      >
        <Paperclip className="h-4 w-4" />
        {hasEvidence && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-blue-600 px-0.5 text-[9px] font-bold leading-none text-white">
            {count}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Minh chứng — {title}</DialogTitle>
          </DialogHeader>
          <EvidenceManager
            targetType={targetType}
            targetId={targetId}
            sectionSlug={sectionSlug}
            fieldKey={fieldKey}
            canEdit={canEdit}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
