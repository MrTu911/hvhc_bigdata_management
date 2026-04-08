/**
 * Insurance Info Form Component
 * CRUD form cho thông tin BHXH/BHYT
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Heart, Shield, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface InsuranceInfo {
  id: string;
  userId: string;
  insuranceNumber?: string | null;
  insuranceStartDate?: string | null;
  insuranceEndDate?: string | null;
  healthInsuranceNumber?: string | null;
  healthInsuranceStartDate?: string | null;
  healthInsuranceEndDate?: string | null;
  healthInsuranceHospital?: string | null;
  beneficiaryName?: string | null;
  beneficiaryRelation?: string | null;
  beneficiaryPhone?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialData?: InsuranceInfo | null;
  onSuccess: () => void;
}

export function InsuranceForm({ open, onOpenChange, userId, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    insuranceNumber: '',
    insuranceStartDate: '',
    insuranceEndDate: '',
    healthInsuranceNumber: '',
    healthInsuranceStartDate: '',
    healthInsuranceEndDate: '',
    healthInsuranceHospital: '',
    beneficiaryName: '',
    beneficiaryRelation: '',
    beneficiaryPhone: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        insuranceNumber: initialData.insuranceNumber || '',
        insuranceStartDate: initialData.insuranceStartDate ? format(new Date(initialData.insuranceStartDate), 'yyyy-MM-dd') : '',
        insuranceEndDate: initialData.insuranceEndDate ? format(new Date(initialData.insuranceEndDate), 'yyyy-MM-dd') : '',
        healthInsuranceNumber: initialData.healthInsuranceNumber || '',
        healthInsuranceStartDate: initialData.healthInsuranceStartDate ? format(new Date(initialData.healthInsuranceStartDate), 'yyyy-MM-dd') : '',
        healthInsuranceEndDate: initialData.healthInsuranceEndDate ? format(new Date(initialData.healthInsuranceEndDate), 'yyyy-MM-dd') : '',
        healthInsuranceHospital: initialData.healthInsuranceHospital || '',
        beneficiaryName: initialData.beneficiaryName || '',
        beneficiaryRelation: initialData.beneficiaryRelation || '',
        beneficiaryPhone: initialData.beneficiaryPhone || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        insuranceNumber: '',
        insuranceStartDate: '',
        insuranceEndDate: '',
        healthInsuranceNumber: '',
        healthInsuranceStartDate: '',
        healthInsuranceEndDate: '',
        healthInsuranceHospital: '',
        beneficiaryName: '',
        beneficiaryRelation: '',
        beneficiaryPhone: '',
        notes: '',
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        userId,
        ...(initialData?.id && { id: initialData.id }),
      };

      const response = await fetch('/api/personnel/insurance', {
        method: initialData?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }

      toast.success(initialData?.id ? 'Cập nhật thành công' : 'Thêm mới thành công');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            {initialData?.id ? 'Cập nhật BHXH/BHYT' : 'Thêm thông tin BHXH/BHYT'}
          </DialogTitle>
          <DialogDescription>
            Thông tin bảo hiểm xã hội và bảo hiểm y tế của cán bộ.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* BHXH Section */}
          <div className="border rounded-lg p-4 bg-blue-50/50">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-blue-700">
              <Shield className="h-4 w-4" />
              Bảo hiểm Xã hội (BHXH)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceNumber">Số sổ BHXH</Label>
                <Input
                  id="insuranceNumber"
                  placeholder="Nhập số sổ"
                  value={formData.insuranceNumber}
                  onChange={(e) => handleChange('insuranceNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceStartDate">Ngày tham gia</Label>
                <Input
                  id="insuranceStartDate"
                  type="date"
                  value={formData.insuranceStartDate}
                  onChange={(e) => handleChange('insuranceStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceEndDate">Ngày kết thúc</Label>
                <Input
                  id="insuranceEndDate"
                  type="date"
                  value={formData.insuranceEndDate}
                  onChange={(e) => handleChange('insuranceEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* BHYT Section */}
          <div className="border rounded-lg p-4 bg-green-50/50">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-green-700">
              <Heart className="h-4 w-4" />
              Bảo hiểm Y tế (BHYT)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="healthInsuranceNumber">Số thẻ BHYT</Label>
                <Input
                  id="healthInsuranceNumber"
                  placeholder="Nhập số thẻ"
                  value={formData.healthInsuranceNumber}
                  onChange={(e) => handleChange('healthInsuranceNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthInsuranceHospital">Nơi KCB ban đầu</Label>
                <Input
                  id="healthInsuranceHospital"
                  placeholder="Tên bệnh viện/phòng khám"
                  value={formData.healthInsuranceHospital}
                  onChange={(e) => handleChange('healthInsuranceHospital', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthInsuranceStartDate">Ngày bắt đầu</Label>
                <Input
                  id="healthInsuranceStartDate"
                  type="date"
                  value={formData.healthInsuranceStartDate}
                  onChange={(e) => handleChange('healthInsuranceStartDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthInsuranceEndDate">Ngày hết hạn</Label>
                <Input
                  id="healthInsuranceEndDate"
                  type="date"
                  value={formData.healthInsuranceEndDate}
                  onChange={(e) => handleChange('healthInsuranceEndDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Beneficiary Section */}
          <div className="border rounded-lg p-4 bg-orange-50/50">
            <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-700">
              <Building2 className="h-4 w-4" />
              Người thụ hưởng
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Họ tên</Label>
                <Input
                  id="beneficiaryName"
                  placeholder="Họ tên người thụ hưởng"
                  value={formData.beneficiaryName}
                  onChange={(e) => handleChange('beneficiaryName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryRelation">Quan hệ</Label>
                <Input
                  id="beneficiaryRelation"
                  placeholder="VD: Vợ, Chồng, Con..."
                  value={formData.beneficiaryRelation}
                  onChange={(e) => handleChange('beneficiaryRelation', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiaryPhone">Số điện thoại</Label>
                <Input
                  id="beneficiaryPhone"
                  placeholder="Nhập SĐT"
                  value={formData.beneficiaryPhone}
                  onChange={(e) => handleChange('beneficiaryPhone', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú nếu có"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData?.id ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
