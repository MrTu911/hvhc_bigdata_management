'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMasterData } from '@/hooks/use-master-data';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Building,
  Heart,
  Activity,
  Calendar,
  FileText,
  Shield,
  AlertCircle,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  QNCN:     'Quân nhân chuyên nghiệp',
  CNVQP:    'Công nhân viên quốc phòng',
  HSQ:      'Hạ sĩ quan',
  CHIEN_SI: 'Chiến sĩ',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  NGHIA_VU:     'Nghĩa vụ quân sự',
  HOP_DONG:     'Hợp đồng',
  CHUYEN_NGHIEP:'Chuyên nghiệp',
};

// RANK_LABELS replaced by useMasterData('MD_RANK') — see inside component

const HEALTH_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; note: string }> = {
  'Loại 1': {
    label: 'Loại 1 - Tốt',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    note: 'Đủ điều kiện thực hiện mọi nhiệm vụ',
  },
  'Loại 2': {
    label: 'Loại 2 - Khá',
    color: 'bg-blue-100 text-blue-800',
    icon: <Activity className="h-5 w-5 text-blue-500" />,
    note: 'Đủ điều kiện, theo dõi định kỳ 6 tháng',
  },
  'Loại 3': {
    label: 'Loại 3 - Trung bình',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <ClipboardList className="h-5 w-5 text-yellow-500" />,
    note: 'Hạn chế nhiệm vụ nặng, khám lại 3 tháng',
  },
  'Loại 4': {
    label: 'Loại 4 - Yếu',
    color: 'bg-red-100 text-red-800',
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
    note: 'Cần điều trị, báo cáo y vụ ngay',
  },
};

interface SoldierDetail {
  id: string;
  soldierIdNumber: string | null;
  soldierCategory: string | null;
  currentRank: string | null;
  serviceType: string | null;
  enlistmentDate: string | null;
  expectedDischargeDate: string | null;
  actualDischargeDate: string | null;
  healthCategory: string | null;
  lastHealthCheckDate: string | null;
  healthNotes: string | null;
  specialSkills: string | null;
  personnel: {
    id: string;
    personnelCode: string;
    fullName: string;
    dateOfBirth: string | null;
    gender: string | null;
    placeOfOrigin: string | null;
    ethnicity: string | null;
    religion: string | null;
    militaryRank: string | null;
    position: string | null;
    educationLevel: string | null;
    status: string | null;
    unit: { id: string; name: string; code: string } | null;
  };
  serviceRecords: Array<{
    id: string;
    eventType: string;
    eventDate: string;
    decisionNumber: string | null;
    previousRank: string | null;
    newRank: string | null;
    previousUnit: string | null;
    newUnit: string | null;
    description: string | null;
  }>;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground w-44 shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  NHAP_NGU:      'Nhập ngũ',
  PHONG_QUAN_HAM:'Phong quân hàm',
  DIEU_DONG:     'Điều động',
  XUAT_NGU:      'Xuất ngũ',
};

export default function SoldierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { items: rankItems } = useMasterData('MD_RANK');
  const RANK_LABELS = useMemo(
    () => Object.fromEntries(rankItems.map((r) => [r.code, r.nameVi])),
    [rankItems],
  );

  const [soldier, setSoldier] = useState<SoldierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/soldier-profile/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setSoldier(data.data);
        else setError(data.error || 'Không tìm thấy dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối máy chủ'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !soldier) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Quay lại
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <AlertCircle className="h-10 w-10" />
            <p className="text-lg font-medium">{error || 'Không tìm thấy hồ sơ'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const p = soldier.personnel;
  const healthCfg = HEALTH_CONFIG[soldier.healthCategory || ''];
  const rankLabel = RANK_LABELS[soldier.currentRank || ''] || p.militaryRank || '—';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">{p.fullName}</h1>
            <p className="text-sm text-muted-foreground">
              {p.personnelCode} · {rankLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800 border-0">
            <Shield className="h-3 w-3 mr-1" />
            {CATEGORY_LABELS[soldier.soldierCategory || ''] || soldier.soldierCategory || 'Quân nhân'}
          </Badge>
          <Badge variant="outline">{p.unit?.name || '—'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-4">
          {/* Avatar */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <User className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{p.fullName}</p>
                <p className="text-sm text-muted-foreground">{rankLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {CATEGORY_LABELS[soldier.soldierCategory || ''] || '—'}
                </p>
              </div>
              {healthCfg && (
                <Badge className={`${healthCfg.color} border-0 gap-1`}>
                  {healthCfg.icon}
                  {healthCfg.label}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Personal */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Ngày sinh" value={formatDate(p.dateOfBirth)} />
              <InfoRow label="Giới tính" value={p.gender} />
              <InfoRow label="Quê quán" value={p.placeOfOrigin} />
              <InfoRow label="Dân tộc" value={p.ethnicity} />
              <InfoRow label="Tôn giáo" value={p.religion} />
              <InfoRow label="Trình độ" value={p.educationLevel} />
            </CardContent>
          </Card>

          {/* Unit */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building className="h-4 w-4" /> Đơn vị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Tên đơn vị" value={p.unit?.name} />
              <InfoRow label="Mã đơn vị" value={p.unit?.code} />
              <InfoRow label="Chức vụ" value={p.position} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="service">
            <TabsList className="w-full">
              <TabsTrigger value="service" className="flex-1">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Hồ sơ quân nhân
              </TabsTrigger>
              <TabsTrigger value="health" className="flex-1">
                <Heart className="h-3.5 w-3.5 mr-1.5" /> Sức khỏe
              </TabsTrigger>
              <TabsTrigger value="records" className="flex-1">
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Lịch sử ({soldier.serviceRecords.length})
              </TabsTrigger>
            </TabsList>

            {/* Service tab */}
            <TabsContent value="service" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Thông tin quân nhân
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                      <InfoRow label="Số hiệu quân nhân" value={soldier.soldierIdNumber} />
                      <InfoRow label="Loại quân nhân" value={CATEGORY_LABELS[soldier.soldierCategory || '']} />
                      <InfoRow label="Cấp bậc" value={RANK_LABELS[soldier.currentRank || '']} />
                    </div>
                    <div>
                      <InfoRow label="Loại hình phục vụ" value={SERVICE_TYPE_LABELS[soldier.serviceType || '']} />
                      <InfoRow label="Ngày nhập ngũ" value={formatDate(soldier.enlistmentDate)} />
                      <InfoRow label="Dự kiến xuất ngũ" value={formatDate(soldier.expectedDischargeDate)} />
                    </div>
                  </div>
                  {soldier.specialSkills && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Kỹ năng đặc biệt</p>
                      <p className="text-sm">{soldier.specialSkills}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 text-center">
                  <Shield className="h-7 w-7 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Cấp bậc</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                    {RANK_LABELS[soldier.currentRank || ''] || '—'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 text-center">
                  <Calendar className="h-7 w-7 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Nhập ngũ</p>
                  <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {formatDate(soldier.enlistmentDate)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 text-center">
                  <Activity className="h-7 w-7 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Hình thức</p>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">
                    {SERVICE_TYPE_LABELS[soldier.serviceType || ''] || '—'}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Health tab */}
            <TabsContent value="health" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" /> Tình trạng sức khỏe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Health status banner */}
                  {healthCfg ? (
                    <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                      soldier.healthCategory === 'Loại 1' ? 'bg-green-50 border-green-200 dark:bg-green-900/20' :
                      soldier.healthCategory === 'Loại 2' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' :
                      soldier.healthCategory === 'Loại 3' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' :
                      'bg-red-50 border-red-200 dark:bg-red-900/20'
                    }`}>
                      {healthCfg.icon}
                      <div>
                        <p className="font-semibold">{healthCfg.label}</p>
                        <p className="text-sm text-muted-foreground">{healthCfg.note}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
                      <Activity className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Chưa có dữ liệu sức khỏe</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Ngày khám gần nhất</p>
                      <p className="font-semibold mt-0.5">{formatDate(soldier.lastHealthCheckDate)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40">
                      <p className="text-xs text-muted-foreground">Phân loại sức khỏe</p>
                      <p className="font-semibold mt-0.5">{soldier.healthCategory || '—'}</p>
                    </div>
                  </div>

                  {soldier.healthNotes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Ghi chú y tế</p>
                      <p className="text-sm">{soldier.healthNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Service records tab */}
            <TabsContent value="records" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Lịch sử quá trình phục vụ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {soldier.serviceRecords.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm">
                      Chưa có dữ liệu quá trình phục vụ
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sự kiện</TableHead>
                          <TableHead>Ngày</TableHead>
                          <TableHead>Số quyết định</TableHead>
                          <TableHead>Cấp bậc</TableHead>
                          <TableHead>Mô tả</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {soldier.serviceRecords.map(rec => (
                          <TableRow key={rec.id}>
                            <TableCell>
                              <Badge variant="outline">
                                {EVENT_TYPE_LABELS[rec.eventType] || rec.eventType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(rec.eventDate)}</TableCell>
                            <TableCell className="font-mono text-xs">{rec.decisionNumber || '—'}</TableCell>
                            <TableCell className="text-sm">
                              {rec.newRank ? (
                                <span>
                                  <span className="text-muted-foreground">
                                    {RANK_LABELS[rec.previousRank || ''] || '—'}
                                  </span>
                                  {' → '}
                                  <span className="font-medium text-green-700">
                                    {RANK_LABELS[rec.newRank || ''] || rec.newRank}
                                  </span>
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {rec.description || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
