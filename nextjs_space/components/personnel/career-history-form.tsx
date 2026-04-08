'use client';

/**
 * Career History Form Component
 * Tạo/Sửa bản ghi lịch sử công tác
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  careerHistorySchema,
  CareerHistoryInput,
  CareerEventTypes,
  CareerEventTypeLabels,
} from '@/lib/validations/personnel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CareerHistoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialData?: any;
  onSuccess?: () => void;
}

export function CareerHistoryForm({
  open,
  onOpenChange,
  userId,
  initialData,
  onSuccess,
}: CareerHistoryFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<CareerHistoryInput>({
    resolver: zodResolver(careerHistorySchema),
    defaultValues: {
      userId,
      eventType: initialData?.eventType || undefined,
      eventDate: initialData?.eventDate?.split('T')[0] || '',
      effectiveDate: initialData?.effectiveDate?.split('T')[0] || '',
      oldPosition: initialData?.oldPosition || '',
      newPosition: initialData?.newPosition || '',
      oldRank: initialData?.oldRank || '',
      newRank: initialData?.newRank || '',
      oldUnit: initialData?.oldUnit || '',
      newUnit: initialData?.newUnit || '',
      trainingName: initialData?.trainingName || '',
      trainingInstitution: initialData?.trainingInstitution || '',
      trainingResult: initialData?.trainingResult || '',
      certificateNumber: initialData?.certificateNumber || '',
      decisionNumber: initialData?.decisionNumber || '',
      decisionDate: initialData?.decisionDate?.split('T')[0] || '',
      signerName: initialData?.signerName || '',
      signerPosition: initialData?.signerPosition || '',
      notes: initialData?.notes || '',
    },
  });

  const selectedEventType = form.watch('eventType');

  const onSubmit = async (data: CareerHistoryInput) => {
    setLoading(true);
    try {
      const url = '/api/personnel/career-history';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing ? { id: initialData.id, ...data } : data;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Lỗi không xác định');
      }

      toast.success(isEditing ? 'Cập nhật thành công' : 'Tạo mới thành công');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Sửa thông tin' : 'Thêm mới'} Quá trình Công tác
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin lịch sử công tác của cán bộ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Event Type & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại sự kiện *</Label>
              <Select
                value={form.watch('eventType') || ''}
                onValueChange={(val) => form.setValue('eventType', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent>
                  {CareerEventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {CareerEventTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.eventType && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.eventType.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ngày sự kiện *</Label>
              <Input type="date" {...form.register('eventDate')} />
              {form.formState.errors.eventDate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.eventDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Position Changes (show for PROMOTION, APPOINTMENT, TRANSFER) */}
          {['PROMOTION', 'APPOINTMENT', 'TRANSFER'].includes(selectedEventType || '') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chức vụ cũ</Label>
                  <Input {...form.register('oldPosition')} />
                </div>
                <div className="space-y-2">
                  <Label>Chức vụ mới</Label>
                  <Input {...form.register('newPosition')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cấp bậc cũ</Label>
                  <Input {...form.register('oldRank')} />
                </div>
                <div className="space-y-2">
                  <Label>Cấp bậc mới</Label>
                  <Input {...form.register('newRank')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Đơn vị cũ</Label>
                  <Input {...form.register('oldUnit')} />
                </div>
                <div className="space-y-2">
                  <Label>Đơn vị mới</Label>
                  <Input {...form.register('newUnit')} />
                </div>
              </div>
            </>
          )}

          {/* Training (show for TRAINING) */}
          {selectedEventType === 'TRAINING' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên khóa đào tạo</Label>
                  <Input {...form.register('trainingName')} />
                </div>
                <div className="space-y-2">
                  <Label>Cơ sở đào tạo</Label>
                  <Input {...form.register('trainingInstitution')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kết quả</Label>
                  <Input {...form.register('trainingResult')} />
                </div>
                <div className="space-y-2">
                  <Label>Số chứng chỉ</Label>
                  <Input {...form.register('certificateNumber')} />
                </div>
              </div>
            </>
          )}

          {/* Decision Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số quyết định</Label>
              <Input {...form.register('decisionNumber')} />
            </div>
            <div className="space-y-2">
              <Label>Ngày quyết định</Label>
              <Input type="date" {...form.register('decisionDate')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Người ký</Label>
              <Input {...form.register('signerName')} />
            </div>
            <div className="space-y-2">
              <Label>Chức vụ người ký</Label>
              <Input {...form.register('signerPosition')} />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea {...form.register('notes')} rows={3} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
