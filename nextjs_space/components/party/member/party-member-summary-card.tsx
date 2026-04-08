'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Shield, User, Users } from 'lucide-react';

interface SummaryProps {
  profile: any;
}

const STATUS_LABEL: Record<string, string> = {
  QUAN_CHUNG: 'Quần chúng',
  CAM_TINH: 'Cảm tình Đảng',
  DOI_TUONG: 'Đối tượng kết nạp',
  DU_BI: 'Đảng viên dự bị',
  CHINH_THUC: 'Đảng viên chính thức',
  CHUYEN_DI: 'Chuyển đi',
  XOA_TEN_TU_NGUYEN: 'Xóa tên tự nguyện',
  KHAI_TRU: 'Khai trừ',
  ACTIVE: 'Đang sinh hoạt',
  TRANSFERRED: 'Chuyển sinh hoạt',
  SUSPENDED: 'Tạm dừng',
  EXPELLED: 'Khai trừ',
};

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}

export function PartyMemberSummaryCard({ profile }: SummaryProps) {
  const partyMember = profile?.partyMember || {};
  const user = profile?.user || {};
  const organization = profile?.organization || {};

  return (
    <Card className="border-l-4 border-l-red-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-red-600" />
          Tổng quan hồ sơ Đảng viên
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{user.name || 'N/A'}</h3>
            <p className="text-sm text-muted-foreground">{user.email || '-'}</p>
            <p className="text-sm text-muted-foreground">
              {user.rank || '-'} {user.position ? `• ${user.position}` : ''}
            </p>
          </div>
          <Badge variant="destructive">{STATUS_LABEL[partyMember.status] || partyMember.status || 'N/A'}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              Số thẻ & chức vụ Đảng
            </div>
            <p className="font-medium">Số thẻ: {partyMember.partyCardNumber || 'Chưa có'}</p>
            <p className="text-sm">Chức vụ: {partyMember.partyRole || '-'}</p>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Tổ chức Đảng hiện tại
            </div>
            <p className="font-medium">{organization.name || '-'}</p>
            <p className="text-sm text-muted-foreground">{organization.code || '-'}</p>
          </div>

          <div className="rounded-md border p-3">
            <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Mốc thời gian chính
            </div>
            <p className="text-sm">Ngày dự bị: {fmtDate(partyMember.joinDate)}</p>
            <p className="text-sm">Ngày chính thức: {fmtDate(partyMember.officialDate)}</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-sm">Xếp loại gần nhất: {partyMember.currentReviewGrade || '-'}</p>
            <p className="text-sm">Nợ đảng phí: {partyMember.currentDebtAmount ?? 0}</p>
            <p className="text-sm">Giới thiệu: {partyMember.recommender1 || '-'} / {partyMember.recommender2 || '-'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
