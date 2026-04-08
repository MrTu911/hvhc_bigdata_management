'use client';

import { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export interface RollbackTarget {
  version: number;
  fileKey?: string;
  changeNote?: string;
  placeholders?: string[];
}

interface RollbackConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: RollbackTarget | null;
  /** Version hiện tại của template (để hiển thị version mới sẽ được tạo) */
  currentVersion: number;
  /** Gọi khi user xác nhận — trả về changeNote */
  onConfirm: (changeNote: string) => Promise<void>;
}

export function RollbackConfirmModal({
  open,
  onOpenChange,
  target,
  currentVersion,
  onConfirm,
}: RollbackConfirmModalProps) {
  const [changeNote, setChangeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(changeNote);
      setChangeNote('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!submitting) {
      if (!val) setChangeNote('');
      onOpenChange(val);
    }
  };

  if (!target) return null;

  const newVersion = currentVersion + 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-amber-500" />
            Rollback về v{target.version}
          </DialogTitle>
        </DialogHeader>

        {/* Guard warning */}
        <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Hệ thống sẽ tạo <strong>v{newVersion}</strong> từ nội dung v{target.version}.
            Phiên bản hiện tại (v{currentVersion}) không bị xóa — vẫn có thể rollback lại sau.
          </span>
        </div>

        {/* Rollback scope */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Những gì sẽ được khôi phục</p>
          <div className="space-y-1">
            {[
              target.fileKey ? 'File template (DOCX/XLSX/HTML)' : null,
              'Data mapping (field → placeholder)',
              target.placeholders?.length
                ? `${target.placeholders.length} placeholder đã scan`
                : 'Danh sách placeholder',
            ]
              .filter(Boolean)
              .map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  {item}
                </div>
              ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Không thay đổi</p>
          <div className="space-y-1">
            {[
              'Tên, mô tả template',
              'Module nguồn (moduleSource)',
              'Format output',
              'RBAC code',
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-gray-400">
                <MinusCircle className="h-3.5 w-3.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Change note */}
        <div className="space-y-1">
          <Label className="text-xs">Ghi chú lý do rollback</Label>
          <Input
            placeholder="VD: Rollback v3 do lỗi placeholder tên trường..."
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            disabled={submitting}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={submitting} className="bg-amber-500 hover:bg-amber-600">
            {submitting ? 'Đang rollback...' : `Xác nhận Rollback → v${newVersion}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
