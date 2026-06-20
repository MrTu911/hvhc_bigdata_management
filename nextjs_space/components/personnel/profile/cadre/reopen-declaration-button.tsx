'use client';

/**
 * Nút "Mở lại khai báo" cho người duyệt (Ban CB/Quân lực tier-2 hoặc admin có grant).
 * Tự tải trạng thái khai báo của cán bộ; chỉ hiện khi hồ sơ ĐÃ chốt khai báo.
 */
import { useCallback, useEffect, useState } from 'react';
import { Unlock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

interface ReopenDeclarationButtonProps {
  /** User.id hoặc Personnel.id của cán bộ. */
  targetId: string;
  onChanged?: () => void;
}

export function ReopenDeclarationButton({ targetId, onChanged }: ReopenDeclarationButtonProps) {
  const [declared, setDeclared] = useState<boolean | null>(null);
  const [declaredAt, setDeclaredAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/personnel/profile-declaration/${targetId}`, { credentials: 'include' });
      const json = await res.json();
      if (res.ok && json.success) {
        setDeclared(json.data.declared);
        setDeclaredAt(json.data.declaredAt);
      } else {
        setDeclared(false);
      }
    } catch {
      setDeclared(false);
    }
  }, [targetId]);

  useEffect(() => {
    load();
  }, [load]);

  // Chưa khóa hoặc không đủ quyền xem → không hiện nút.
  if (!declared) return null;

  async function handleReopen() {
    if (!reason.trim()) {
      toast({ title: 'Vui lòng nhập lý do', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/personnel/profile-declaration/${targetId}/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: 'Không thể mở lại', description: json.error ?? 'Vui lòng thử lại.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã mở lại khai báo', description: 'Cán bộ có thể khai báo/chỉnh sửa trực tiếp lần nữa.' });
      setOpen(false);
      setReason('');
      setDeclared(false);
      onChanged?.();
    } catch (error) {
      toast({ title: 'Lỗi', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  const dateStr = declaredAt ? new Date(declaredAt).toLocaleDateString('vi-VN') : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Unlock className="h-4 w-4 mr-1.5" />
          Mở lại khai báo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mở lại khai báo hồ sơ</DialogTitle>
          <DialogDescription>
            Hồ sơ đã chốt khai báo{dateStr ? ` ngày ${dateStr}` : ''}. Mở lại sẽ cho cán bộ khai báo/chỉnh sửa
            trực tiếp lần nữa (không qua đề nghị 2 cấp). Hành động được ghi nhật ký.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label>
            Lý do mở lại <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="VD: Sai sót lớn ở dữ liệu khai báo, cần khai lại..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={handleReopen} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Xác nhận mở lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
