'use client';

/**
 * Banner trạng thái "khai báo hồ sơ lần đầu" cho trang tự phục vụ.
 * - Đang khai báo: hướng dẫn + checklist mục tối thiểu + nút "Xác nhận hoàn tất khai báo".
 * - Đã khai báo: thông báo đã chốt + lối tắt sang "Đề nghị thay đổi" (2 cấp).
 */
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Lock, FileEdit, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

export interface DeclarationCheck {
  key: string;
  label: string;
  ok: boolean;
}

export interface DeclarationState {
  declared: boolean;
  declaredAt: string | null;
  declaredBy: string | null;
  completeness: { complete: boolean; checks: DeclarationCheck[] };
}

interface DeclarationBannerProps {
  state: DeclarationState | null;
  loading: boolean;
  /** Gọi sau khi xác nhận khai báo thành công (page tải lại + remount tab). */
  onConfirmed: () => void;
  /** Tải lại trạng thái/độ hoàn thiện (sau khi vừa thêm dữ liệu). */
  onRefresh: () => void;
}

export function DeclarationBanner({ state, loading, onConfirmed, onRefresh }: DeclarationBannerProps) {
  const [submitting, setSubmitting] = useState(false);

  if (loading || !state) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải trạng thái khai báo…
        </CardContent>
      </Card>
    );
  }

  if (state.declared) {
    const dateStr = state.declaredAt ? new Date(state.declaredAt).toLocaleDateString('vi-VN') : '';
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-900">
                Đã hoàn tất khai báo lần đầu{dateStr ? ` · ${dateStr}` : ''}
              </p>
              <p className="text-sm text-emerald-700">
                Hồ sơ đã được chốt. Mọi thay đổi từ nay phải gửi <b>Đề nghị thay đổi</b> để duyệt 2 cấp
                (Chỉ huy đơn vị → Ban cán bộ/Quân lực).
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-emerald-300 shrink-0">
            <Link href="/dashboard/personal/my-profile-changes">
              <FileEdit className="h-4 w-4 mr-1.5" />
              Đề nghị thay đổi
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { complete, checks } = state.completeness;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/profile/declaration', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: 'Chưa thể xác nhận', description: json.error ?? 'Vui lòng kiểm tra lại.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã xác nhận hoàn tất khai báo', description: 'Hồ sơ đã được chốt và lưu vào CSDL.' });
      onConfirmed();
    } catch (error) {
      toast({ title: 'Lỗi', description: (error as Error)?.message ?? 'Vui lòng thử lại.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-900">
          <FileEdit className="h-5 w-5 text-amber-600" />
          Đang khai báo hồ sơ lần đầu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-amber-800">
          Bạn có thể tự thêm/sửa/xóa và nhập từ Excel cho dữ liệu hồ sơ. Khi hoàn tất, bấm{' '}
          <b>Xác nhận hoàn tất khai báo</b> để lưu toàn bộ và chốt hồ sơ. Sau khi chốt, mọi thay đổi sẽ đi qua
          quy trình đề nghị thay đổi 2 cấp.
        </p>
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Mục tối thiểu cần có</p>
          <ul className="space-y-1">
            {checks.map((c) => (
              <li key={c.key} className="flex items-center gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className={c.ok ? 'text-emerald-800' : 'text-muted-foreground'}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={!complete || submitting} className="bg-amber-600 hover:bg-amber-700">
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-1.5" />
                )}
                Xác nhận hoàn tất khai báo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xác nhận hoàn tất khai báo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toàn bộ dữ liệu khai báo sẽ được lưu và hồ sơ sẽ bị khóa khai báo trực tiếp. Sau bước này, mọi
                  thay đổi phải gửi đề nghị duyệt 2 cấp. Bạn chắc chắn?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Xác nhận</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={submitting}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Kiểm tra lại
          </Button>
          {!complete && <span className="text-xs text-muted-foreground">Cần đủ mục tối thiểu để xác nhận.</span>}
        </div>
      </CardContent>
    </Card>
  );
}
