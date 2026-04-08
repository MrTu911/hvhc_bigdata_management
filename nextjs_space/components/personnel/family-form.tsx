'use client';

/**
 * Family Relation Form Component
 * Tạo/Sửa thông tin gia đình
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  familyRelationSchema,
  FamilyRelationInput,
  FamilyRelationTypes,
  FamilyRelationTypeLabels,
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
import { Checkbox } from '@/components/ui/checkbox';
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

interface FamilyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialData?: any;
  onSuccess?: () => void;
}

export function FamilyForm({
  open,
  onOpenChange,
  userId,
  initialData,
  onSuccess,
}: FamilyFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData?.id;

  const form = useForm<FamilyRelationInput>({
    resolver: zodResolver(familyRelationSchema),
    defaultValues: {
      userId,
      relation: initialData?.relation || undefined,
      fullName: initialData?.fullName || '',
      dateOfBirth: initialData?.dateOfBirth?.split('T')[0] || '',
      citizenId: initialData?.citizenId || '',
      phoneNumber: initialData?.phoneNumber || '',
      occupation: initialData?.occupation || '',
      workplace: initialData?.workplace || '',
      address: initialData?.address || '',
      isDeceased: initialData?.isDeceased || false,
      deceasedDate: initialData?.deceasedDate?.split('T')[0] || '',
      notes: initialData?.notes || '',
    },
  });

  const isDeceased = form.watch('isDeceased');

  const onSubmit = async (data: FamilyRelationInput) => {
    setLoading(true);
    try {
      const url = '/api/personnel/family';
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

      toast.success(isEditing ? 'Cập nhật thành công' : 'Thêm thành công');
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
            {isEditing ? 'Sửa thông tin' : 'Thêm'} Thành viên Gia đình
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin thân nhân của cán bộ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Relation & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quan hệ *</Label>
              <Select
                value={form.watch('relation') || ''}
                onValueChange={(val) => form.setValue('relation', val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quan hệ" />
                </SelectTrigger>
                <SelectContent>
                  {FamilyRelationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {FamilyRelationTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.relation && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.relation.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input {...form.register('fullName')} />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>
          </div>

          {/* Date of Birth & Citizen ID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngày sinh</Label>
              <Input type="date" {...form.register('dateOfBirth')} />
            </div>
            <div className="space-y-2">
              <Label>CCCD/CMND</Label>
              <Input {...form.register('citizenId')} placeholder="Số CCCD" />
            </div>
          </div>

          {/* Phone & Occupation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input {...form.register('phoneNumber')} />
            </div>
            <div className="space-y-2">
              <Label>Nghề nghiệp</Label>
              <Input {...form.register('occupation')} />
            </div>
          </div>

          {/* Workplace & Address */}
          <div className="space-y-2">
            <Label>Nơi làm việc</Label>
            <Input {...form.register('workplace')} />
          </div>
          <div className="space-y-2">
            <Label>Địa chỉ</Label>
            <Input {...form.register('address')} />
          </div>

          {/* Deceased */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDeceased"
              checked={isDeceased}
              onCheckedChange={(checked) => form.setValue('isDeceased', !!checked)}
            />
            <Label htmlFor="isDeceased">Đã mất</Label>
          </div>

          {isDeceased && (
            <div className="space-y-2">
              <Label>Ngày mất</Label>
              <Input type="date" {...form.register('deceasedDate')} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea {...form.register('notes')} rows={2} />
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
              {isEditing ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
