'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Building2, Shield, Users, FlaskConical, BookOpen, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonnelSummaryCardProps {
  personnel: {
    id: string;
    fullName: string;
    fullNameEn?: string | null;
    militaryRank?: string | null;
    position?: string | null;
    category?: string | null;
    status: string;
    unit?: { name: string; code: string } | null;
  };
  scientificProfile?: {
    publicationCount?: number | null;
    hIndex?: number | null;
  } | null;
  researchProjectCount?: number;
  facultyProfile?: {
    academicRank?: string | null;
    academicDegree?: string | null;
    citations?: number;
  } | null;
  warnings?: { source: string; message: string }[];
  canViewSensitive: boolean;
}

// ─── Maps ─────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  DANG_CONG_TAC: { label: 'Đang công tác', variant: 'default' },
  NGHI_HUU: { label: 'Nghỉ hưu', variant: 'secondary' },
  CHUYEN_CONG_TAC: { label: 'Chuyển công tác', variant: 'outline' },
  DI_HOC: { label: 'Đi học', variant: 'outline' },
  TAM_NGHI: { label: 'Tạm nghỉ', variant: 'outline' },
  XUAT_NGU: { label: 'Xuất ngũ', variant: 'secondary' },
  TU_TRAN: { label: 'Từ trần', variant: 'destructive' },
};

const CATEGORY_MAP: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Cán bộ chỉ huy',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  CONG_NHAN_VIEN: 'Công nhân viên',
  HOC_VIEN_QUAN_SU: 'Học viên quân sự',
  SINH_VIEN_DAN_SU: 'Sinh viên dân sự',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonnelSummaryCard({
  personnel,
  scientificProfile,
  researchProjectCount = 0,
  facultyProfile,
  warnings = [],
  canViewSensitive,
}: PersonnelSummaryCardProps) {
  const statusInfo = STATUS_MAP[personnel.status] ?? { label: personnel.status, variant: 'outline' as const };
  const initials = personnel.fullName
    .split(' ')
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const kpis = [
    {
      icon: Shield,
      label: 'Quân hàm',
      value: personnel.militaryRank ?? '—',
    },
    {
      icon: Building2,
      label: 'Đơn vị',
      value: personnel.unit?.name ?? '—',
    },
    {
      icon: BookOpen,
      label: 'Công trình KH',
      value: String(scientificProfile?.publicationCount ?? 0),
    },
    {
      icon: FlaskConical,
      label: 'Đề tài NCKH',
      value: String(researchProjectCount),
    },
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <Avatar className="w-20 h-20 shrink-0">
            <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Identity */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{personnel.fullName}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              {canViewSensitive && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Nhạy cảm hiển thị
                </Badge>
              )}
            </div>

            {personnel.fullNameEn && (
              <p className="text-muted-foreground text-sm italic">{personnel.fullNameEn}</p>
            )}

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {personnel.position && <span>{personnel.position}</span>}
              {personnel.category && (
                <>
                  <span>·</span>
                  <span>{CATEGORY_MAP[personnel.category] ?? personnel.category}</span>
                </>
              )}
              {facultyProfile?.academicDegree && (
                <>
                  <span>·</span>
                  <span>{facultyProfile.academicDegree}</span>
                </>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                <span>{warnings.length} cảnh báo dữ liệu</span>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {kpis.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center p-3 rounded-lg bg-muted/50 min-w-[90px]">
                <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-lg font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
