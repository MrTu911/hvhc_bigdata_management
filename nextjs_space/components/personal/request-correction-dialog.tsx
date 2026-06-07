'use client';

/**
 * RequestCorrectionDialog — gửi đề nghị đính chính thông tin cá nhân nhạy cảm.
 *
 * Các trường nhạy cảm (cấp bậc, đơn vị, chức vụ, ngày nhập ngũ...) không cho người
 * dùng tự sửa mà phải qua admin M02 duyệt. Dialog gọi POST /api/personal/request-update
 * (backend tự enforce REQUEST_MY_INFO_UPDATE + danh sách field nhạy cảm). Nút tự ẩn
 * nếu người dùng không có quyền gửi đề nghị.
 */

import { useState } from 'react';
import { PencilLine, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONAL } from '@/lib/rbac/function-codes';

/** Một trường có thể đề nghị đính chính (fieldName phải nằm trong SENSITIVE_FIELDS backend). */
export interface CorrectableField {
  fieldName: string;
  label: string;
  currentValue?: string | null;
}

interface RequestCorrectionDialogProps {
  fields: CorrectableField[];
  triggerLabel?: string;
  /** Tiêu đề/mô tả dialog (ghi đè mặc định, dùng cho đính chính 1 mục cụ thể). */
  title?: string;
  description?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  onSubmitted?: () => void;
}

export function RequestCorrectionDialog({
  fields,
  triggerLabel = 'Đề nghị chỉnh sửa',
  title = 'Đề nghị đính chính thông tin',
  description = 'Thông tin nhạy cảm cần đơn vị quản lý phê duyệt trước khi thay đổi. Đề nghị của bạn sẽ được gửi tới admin để xem xét.',
  size = 'sm',
  variant = 'outline',
  onSubmitted,
}: RequestCorrectionDialogProps) {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [open, setOpen] = useState(false);
  const [fieldName, setFieldName] = useState<string>(fields[0]?.fieldName ?? '');
  const [requestedValue, setRequestedValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Ẩn nút nếu chắc chắn không có quyền gửi đề nghị.
  if (!permLoading && !hasPermission(PERSONAL.REQUEST_INFO_UPDATE)) return null;
  if (fields.length === 0) return null;

  const selectedField = fields.find((f) => f.fieldName === fieldName) ?? fields[0];
  const singleMode = fields.length === 1;

  function resetForm() {
    setFieldName(fields[0]?.fieldName ?? '');
    setRequestedValue('');
  }

  async function handleSubmit() {
    if (!fieldName) {
      toast.error('Vui lòng chọn thông tin cần đính chính');
      return;
    }
    if (!requestedValue.trim()) {
      toast.error('Vui lòng nhập nội dung đề nghị');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/personal/request-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldName,
          requestedValue: requestedValue.trim(),
          currentValue: selectedField?.currentValue ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Không gửi được đề nghị');
      }
      toast.success('Đã gửi đề nghị, đang chờ admin phê duyệt');
      setOpen(false);
      resetForm();
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi gửi đề nghị');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <PencilLine className="mr-1.5 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {singleMode ? (
            <div className="space-y-1.5">
              <Label>Nội dung cần đính chính</Label>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {selectedField?.label}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="correction-field">Thông tin cần đính chính</Label>
              <Select value={fieldName} onValueChange={setFieldName}>
                <SelectTrigger id="correction-field">
                  <SelectValue placeholder="Chọn thông tin" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((f) => (
                    <SelectItem key={f.fieldName} value={f.fieldName}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Giá trị hiện tại</Label>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {selectedField?.currentValue?.trim() ? selectedField.currentValue : 'Chưa có dữ liệu'}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="correction-value">Nội dung đề nghị</Label>
            <Textarea
              id="correction-value"
              value={requestedValue}
              onChange={(e) => setRequestedValue(e.target.value)}
              placeholder="Nhập giá trị đúng hoặc mô tả nội dung cần đính chính..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            Gửi đề nghị
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
