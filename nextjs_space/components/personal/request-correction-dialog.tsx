'use client';

/**
 * RequestCorrectionDialog — hướng người dùng tới luồng "Đề nghị cập nhật hồ sơ" 2 cấp.
 *
 * Trước đây dialog POST /api/personal/request-update (PersonalUpdateRequest, 1 cấp,
 * không có handler duyệt → ngõ cụt, TRÙNG ProfileChangeRequest). Đã hợp nhất:
 *   - Trường mô tả nhân thân  → "Đề nghị cập nhật hồ sơ" (duyệt 2 cấp, có commit CSDL).
 *   - Cấp bậc/đơn vị/chức vụ  → do đơn vị/cơ quan cập nhật qua điều động/phong quân hàm.
 * Dialog nay chỉ giải thích + điều hướng (không tự ghi). Giữ nguyên props để các trang
 * đang dùng không phải đổi. Xem docs/design/personal-space-data-flow.md.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PencilLine, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONAL } from '@/lib/rbac/function-codes';

const PROFILE_CHANGES_PATH = '/dashboard/personal/my-profile-changes';

/** Một trường có thể đề nghị đính chính (chỉ dùng để hiển thị ngữ cảnh). */
export interface CorrectableField {
  fieldName: string;
  label: string;
  currentValue?: string | null;
}

interface RequestCorrectionDialogProps {
  fields: CorrectableField[];
  triggerLabel?: string;
  title?: string;
  description?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** Giữ tương thích chữ ký cũ — không còn được gọi (dialog không tự submit). */
  onSubmitted?: () => void;
}

/** Trường do chỉ huy/cơ quan quản lý — không sửa qua đề nghị cá nhân. */
const COMMAND_MANAGED_FIELDS = new Set(['rank', 'unitId', 'positionId', 'position', 'enlistmentDate', 'dischargeDate']);

export function RequestCorrectionDialog({
  fields,
  triggerLabel = 'Đề nghị chỉnh sửa',
  title = 'Đề nghị cập nhật thông tin',
  description = 'Cập nhật hồ sơ được thực hiện qua quy trình duyệt 2 cấp (chỉ huy đơn vị → Ban cán bộ/Quân lực).',
  size = 'sm',
  variant = 'outline',
}: RequestCorrectionDialogProps) {
  const router = useRouter();
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [open, setOpen] = useState(false);

  // Ẩn nút nếu chắc chắn không có quyền gửi đề nghị.
  if (!permLoading && !hasPermission(PERSONAL.REQUEST_INFO_UPDATE)) return null;
  if (fields.length === 0) return null;

  const hasCommandManaged = fields.some((f) => COMMAND_MANAGED_FIELDS.has(f.fieldName));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

        <div className="space-y-3 py-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Thông tin liên quan</p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
              {fields.map((f) => (
                <li key={f.fieldName} className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{f.label}</span>
                  <span className="truncate text-slate-500">{f.currentValue?.trim() || '—'}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasCommandManaged && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Cấp bậc, đơn vị, chức vụ và ngày nhập/xuất ngũ do đơn vị/cơ quan quản lý cập nhật qua quy
                trình điều động, phong quân hàm — không sửa bằng đề nghị cá nhân.
              </span>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Với các thông tin mô tả khác, hãy tạo <span className="font-medium">đề nghị cập nhật hồ sơ</span> để
            chỉ huy đơn vị và Ban cán bộ/Quân lực xét duyệt; sau khi duyệt, dữ liệu được ghi vào CSDL chính.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
          <Button
            onClick={() => {
              setOpen(false);
              router.push(PROFILE_CHANGES_PATH);
            }}
          >
            Mở trang đề nghị cập nhật hồ sơ
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
