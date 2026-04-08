
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Key, Edit } from 'lucide-react';

const ROLES = [
  {
    id: '1',
    name: 'QUAN_TRI_HE_THONG',
    label: 'Quản trị hệ thống',
    description: 'Quyền quản trị toàn bộ hệ thống, cấu hình và bảo mật',
    userCount: 5,
    permissions: 25,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  {
    id: '2',
    name: 'CHI_HUY_HOC_VIEN',
    label: 'Chỉ huy Học viện',
    description: 'Xem tổng quan toàn viện, báo cáo tổng hợp, ra quyết định cấp cao',
    userCount: 3,
    permissions: 20,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  },
  {
    id: '3',
    name: 'CHI_HUY_KHOA_PHONG',
    label: 'Chỉ huy Khoa/Phòng',
    description: 'Quản lý đơn vị, theo dõi KPI, quản lý vật tư và nhân sự',
    userCount: 12,
    permissions: 18,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  {
    id: '4',
    name: 'CHU_NHIEM_BO_MON',
    label: 'Chủ nhiệm Bộ môn',
    description: 'Quản lý học phần, giáo trình, theo dõi kết quả học tập',
    userCount: 18,
    permissions: 15,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  {
    id: '5',
    name: 'GIANG_VIEN',
    label: 'Giảng viên',
    description: 'Quản lý lớp học, học viên, chấm điểm, phản hồi',
    userCount: 85,
    permissions: 12,
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
  },
  {
    id: '6',
    name: 'NGHIEN_CUU_VIEN',
    label: 'Nghiên cứu viên',
    description: 'Truy cập dữ liệu nghiên cứu, phân tích, xuất báo cáo',
    userCount: 25,
    permissions: 10,
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
  },
  {
    id: '7',
    name: 'HOC_VIEN_SINH_VIEN',
    label: 'Học viên/Sinh viên',
    description: 'Xem điểm, tiến độ học tập, nhận gợi ý AI',
    userCount: 1250,
    permissions: 5,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  },
  {
    id: '8',
    name: 'KY_THUAT_VIEN',
    label: 'Kỹ thuật viên',
    description: 'Hỗ trợ kỹ thuật, quản lý hệ thống, xử lý sự cố',
    userCount: 8,
    permissions: 8,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
];

export function RoleManagement() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Quản lý vai trò</h3>
            <p className="text-sm text-muted-foreground">
              Cấu hình vai trò và quyền hạn trong hệ thống
            </p>
          </div>
          <Button className="gap-2">
            <Shield className="w-4 h-4" />
            Tạo vai trò mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <Card key={role.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${role.color}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{role.label}</h4>
                    <p className="text-xs text-muted-foreground">{role.name}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
              
              <div className="flex items-center gap-4 pt-3 border-t">
                <div className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{role.userCount}</span>
                  <span className="text-muted-foreground">người dùng</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{role.permissions}</span>
                  <span className="text-muted-foreground">quyền</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
