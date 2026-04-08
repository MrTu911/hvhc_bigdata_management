'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface PersonalInfoTabProps {
  data: any;
  onUpdate: () => void;
}

export function PersonalInfoTab({ data, onUpdate }: PersonalInfoTabProps) {
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Không có dữ liệu
      </div>
    );
  }

  const infoItems = [
    { label: 'Họ và tên', value: data.name, icon: User },
    { label: 'Email', value: data.email, icon: Mail },
    { label: 'Điện thoại', value: data.phone, icon: Phone },
    { label: 'Cấp bậc', value: data.rank, icon: Shield },
    { label: 'Chức vụ', value: data.position, icon: Shield },
    { label: 'Đơn vị', value: data.unit, icon: MapPin },
    { label: 'Ngày sinh', value: data.dateOfBirth ? format(new Date(data.dateOfBirth), 'dd/MM/yyyy') : null, icon: Calendar },
    { label: 'Giới tính', value: data.gender, icon: User },
    { label: 'Địa chỉ', value: data.address, icon: MapPin },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {infoItems.map((item, index) => {
              const Icon = item.icon;
              return item.value ? (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-medium mt-1">{item.value}</p>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Lưu ý:</strong> Thông tin cá nhân được đồng bộ từ hệ thống quản lý nhân sự. 
          Để cập nhật, vui lòng liên hệ phòng Tổ chức cán bộ.
        </p>
      </div>
    </div>
  );
}
