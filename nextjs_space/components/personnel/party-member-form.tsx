/**
 * Party Member Form Component
 * CRUD form cho hồ sơ Đảng viên
 */

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang sinh hoạt' },
  { value: 'TRANSFERRED', label: 'Đã chuyển sinh hoạt' },
  { value: 'SUSPENDED', label: 'Tạm ngưng sinh hoạt' },
  { value: 'EXPELLED', label: 'Bị khai trừ' },
];

interface PartyMember {
  id: string;
  userId: string;
  partyCardNumber?: string | null;
  joinDate?: string | null;
  officialDate?: string | null;
  partyCell?: string | null;
  partyCommittee?: string | null;
  recommender1?: string | null;
  recommender2?: string | null;
  status: string;
  statusChangeDate?: string | null;
  statusChangeReason?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialData?: PartyMember | null;
  onSuccess: () => void;
}

export function PartyMemberForm({ open, onOpenChange, userId, initialData, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partyCardNumber: '',
    joinDate: '',
    officialDate: '',
    partyCell: '',
    partyCommittee: '',
    recommender1: '',
    recommender2: '',
    status: 'ACTIVE',
    statusChangeDate: '',
    statusChangeReason: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        partyCardNumber: initialData.partyCardNumber || '',
        joinDate: initialData.joinDate ? format(new Date(initialData.joinDate), 'yyyy-MM-dd') : '',
        officialDate: initialData.officialDate ? format(new Date(initialData.officialDate), 'yyyy-MM-dd') : '',
        partyCell: initialData.partyCell || '',
        partyCommittee: initialData.partyCommittee || '',
        recommender1: initialData.recommender1 || '',
        recommender2: initialData.recommender2 || '',
        status: initialData.status || 'ACTIVE',
        statusChangeDate: initialData.statusChangeDate ? format(new Date(initialData.statusChangeDate), 'yyyy-MM-dd') : '',
        statusChangeReason: initialData.statusChangeReason || '',
      });
    } else {
      setFormData({
        partyCardNumber: '',
        joinDate: '',
        officialDate: '',
        partyCell: '',
        partyCommittee: '',
        recommender1: '',
        recommender2: '',
        status: 'ACTIVE',
        statusChangeDate: '',
        statusChangeReason: '',
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

      const response = await fetch('/api/personnel/party-member', {
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            {initialData?.id ? 'Cập nhật Hồ sơ Đảng viên' : 'Thêm Hồ sơ Đảng viên'}
          </DialogTitle>
          <DialogDescription>
            Thông tin hồ sơ Đảng viên theo quy định. Các trường có dấu (*) là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Số thẻ Đảng */}
            <div className="space-y-2">
              <Label htmlFor="partyCardNumber">Số thẻ Đảng viên</Label>
              <Input
                id="partyCardNumber"
                placeholder="Nhập số thẻ"
                value={formData.partyCardNumber}
                onChange={(e) => handleChange('partyCardNumber', e.target.value)}
              />
            </div>

            {/* Trạng thái */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ngày vào Đảng */}
            <div className="space-y-2">
              <Label htmlFor="joinDate">Ngày vào Đảng</Label>
              <Input
                id="joinDate"
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
              />
            </div>

            {/* Ngày chính thức */}
            <div className="space-y-2">
              <Label htmlFor="officialDate">Ngày chính thức</Label>
              <Input
                id="officialDate"
                type="date"
                value={formData.officialDate}
                onChange={(e) => handleChange('officialDate', e.target.value)}
              />
            </div>

            {/* Chi bộ */}
            <div className="space-y-2">
              <Label htmlFor="partyCell">Chi bộ</Label>
              <Input
                id="partyCell"
                placeholder="Tên chi bộ"
                value={formData.partyCell}
                onChange={(e) => handleChange('partyCell', e.target.value)}
              />
            </div>

            {/* Đảng ủy */}
            <div className="space-y-2">
              <Label htmlFor="partyCommittee">Đảng ủy</Label>
              <Input
                id="partyCommittee"
                placeholder="Tên Đảng ủy"
                value={formData.partyCommittee}
                onChange={(e) => handleChange('partyCommittee', e.target.value)}
              />
            </div>

            {/* Người giới thiệu 1 */}
            <div className="space-y-2">
              <Label htmlFor="recommender1">Người giới thiệu 1</Label>
              <Input
                id="recommender1"
                placeholder="Họ tên người giới thiệu"
                value={formData.recommender1}
                onChange={(e) => handleChange('recommender1', e.target.value)}
              />
            </div>

            {/* Người giới thiệu 2 */}
            <div className="space-y-2">
              <Label htmlFor="recommender2">Người giới thiệu 2</Label>
              <Input
                id="recommender2"
                placeholder="Họ tên người giới thiệu"
                value={formData.recommender2}
                onChange={(e) => handleChange('recommender2', e.target.value)}
              />
            </div>
          </div>

          {/* Status change section */}
          {formData.status !== 'ACTIVE' && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-3 text-gray-700">Thông tin thay đổi trạng thái</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusChangeDate">Ngày thay đổi</Label>
                  <Input
                    id="statusChangeDate"
                    type="date"
                    value={formData.statusChangeDate}
                    onChange={(e) => handleChange('statusChangeDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="statusChangeReason">Lý do</Label>
                  <Textarea
                    id="statusChangeReason"
                    placeholder="Nhập lý do thay đổi trạng thái"
                    value={formData.statusChangeReason}
                    onChange={(e) => handleChange('statusChangeReason', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {initialData?.id ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
