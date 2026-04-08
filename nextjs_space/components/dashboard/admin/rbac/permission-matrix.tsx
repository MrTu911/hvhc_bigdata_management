
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const PERMISSIONS = [
  { id: '1', module: 'Data Lake', action: 'Xem', level: 'READ' },
  { id: '2', module: 'Data Lake', action: 'Thêm/Sửa', level: 'WRITE' },
  { id: '3', module: 'Data Lake', action: 'Xóa', level: 'DELETE' },
  { id: '4', module: 'AI/ML', action: 'Xem kết quả', level: 'READ' },
  { id: '5', module: 'AI/ML', action: 'Huấn luyện', level: 'EXECUTE' },
  { id: '6', module: 'AI/ML', action: 'Cấu hình', level: 'ADMIN' },
  { id: '7', module: 'Dashboard', action: 'Xem riêng', level: 'READ' },
  { id: '8', module: 'Dashboard', action: 'Xem toàn bộ', level: 'READ_ALL' },
  { id: '9', module: 'Báo cáo', action: 'Tạo báo cáo', level: 'WRITE' },
  { id: '10', module: 'Báo cáo', action: 'Xuất báo cáo', level: 'EXPORT' },
];

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'QUAN_TRI_HE_THONG': { '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true, '8': true, '9': true, '10': true },
  'CHI_HUY_HOC_VIEN': { '1': true, '2': false, '3': false, '4': true, '5': false, '6': false, '7': true, '8': true, '9': true, '10': true },
  'CHI_HUY_KHOA_PHONG': { '1': true, '2': false, '3': false, '4': true, '5': false, '6': false, '7': true, '8': false, '9': true, '10': true },
  'CHU_NHIEM_BO_MON': { '1': true, '2': false, '3': false, '4': true, '5': false, '6': false, '7': true, '8': false, '9': true, '10': true },
  'GIANG_VIEN': { '1': false, '2': false, '3': false, '4': true, '5': false, '6': false, '7': true, '8': false, '9': true, '10': true },
  'NGHIEN_CUU_VIEN': { '1': true, '2': false, '3': false, '4': true, '5': true, '6': false, '7': true, '8': false, '9': true, '10': true },
  'HOC_VIEN_SINH_VIEN': { '1': false, '2': false, '3': false, '4': false, '5': false, '6': false, '7': true, '8': false, '9': false, '10': false },
  'KY_THUAT_VIEN': { '1': true, '2': true, '3': false, '4': true, '5': false, '6': true, '7': true, '8': false, '9': false, '10': false },
};

const ROLES = [
  'QUAN_TRI_HE_THONG',
  'CHI_HUY_HOC_VIEN',
  'CHI_HUY_KHOA_PHONG',
  'CHU_NHIEM_BO_MON',
  'GIANG_VIEN',
  'NGHIEN_CUU_VIEN',
  'HOC_VIEN_SINH_VIEN',
  'KY_THUAT_VIEN'
];

const ROLE_LABELS: Record<string, string> = {
  'QUAN_TRI_HE_THONG': 'Admin',
  'CHI_HUY_HOC_VIEN': 'CH HVHC',
  'CHI_HUY_KHOA_PHONG': 'CH Khoa',
  'CHU_NHIEM_BO_MON': 'CN Bộ môn',
  'GIANG_VIEN': 'GV',
  'NGHIEN_CUU_VIEN': 'NCV',
  'HOC_VIEN_SINH_VIEN': 'HV/SV',
  'KY_THUAT_VIEN': 'KTV'
};

export function PermissionMatrix() {
  const getPermissionIcon = (hasPermission: boolean) => {
    if (hasPermission) {
      return <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />;
    }
    return <XCircle className="w-5 h-5 text-red-600 mx-auto opacity-30" />;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Ma trận phân quyền</h3>
          <p className="text-sm text-muted-foreground">
            Quyền truy cập của từng vai trò đối với các chức năng hệ thống
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-semibold sticky left-0 bg-muted/50">
                  Module / Quyền
                </th>
                {ROLES.map((role) => (
                  <th key={role} className="text-center py-3 px-2 font-semibold text-xs">
                    <div className="flex flex-col items-center gap-1">
                      <span>{ROLE_LABELS[role]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((permission, idx) => (
                <tr key={permission.id} className={`border-b ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <td className="py-3 px-4 sticky left-0 bg-background">
                    <div>
                      <p className="font-medium text-sm">{permission.module}</p>
                      <p className="text-xs text-muted-foreground">{permission.action}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {permission.level}
                      </Badge>
                    </div>
                  </td>
                  {ROLES.map((role) => (
                    <td key={`${permission.id}-${role}`} className="text-center py-3 px-2">
                      {getPermissionIcon(ROLE_PERMISSIONS[role]?.[permission.id] || false)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Có quyền</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 opacity-30" />
            <span>Không có quyền</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
