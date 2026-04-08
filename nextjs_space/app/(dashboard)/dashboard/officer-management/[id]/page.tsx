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
  Star,
  TrendingUp,
  Calendar,
  FileText,
  Shield,
  Award,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';

// RANK_LABELS replaced by useMasterData('MD_RANK') — see inside component

const PROMO_TYPE_LABELS: Record<string, string> = {
  THANG_CAP:   'Thăng cấp',
  BO_NHIEM:    'Bổ nhiệm',
  DIEU_DONG:   'Điều động',
  LUAN_CHUYEN: 'Luân chuyển',
  GIANG_CHUC:  'Giáng chức',
  CACH_CHUC:   'Cách chức',
  NGHI_HUU:    'Nghỉ hưu',
  XUAT_NGU:    'Xuất ngũ',
};

const PROMO_TYPE_COLORS: Record<string, string> = {
  THANG_CAP:   'bg-green-100 text-green-800',
  BO_NHIEM:    'bg-blue-100 text-blue-800',
  DIEU_DONG:   'bg-purple-100 text-purple-800',
  LUAN_CHUYEN: 'bg-indigo-100 text-indigo-800',
  GIANG_CHUC:  'bg-orange-100 text-orange-800',
  CACH_CHUC:   'bg-red-100 text-red-800',
  NGHI_HUU:    'bg-gray-100 text-gray-800',
  XUAT_NGU:    'bg-yellow-100 text-yellow-800',
};

interface OfficerDetail {
  id: string;
  officerIdNumber: string | null;
  currentRank: string | null;
  currentPosition: string | null;
  commissionedDate: string | null;
  lastEvaluationDate: string | null;
  lastEvaluationResult: string | null;
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
    specialization: string | null;
    status: string | null;
    unit: { id: string; name: string; code: string } | null;
  };
  promotions: Array<{
    id: string;
    promotionType: string;
    effectiveDate: string;
    decisionNumber: string | null;
    decisionDate: string | null;
    previousRank: string | null;
    newRank: string | null;
    previousPosition: string | null;
    newPosition: string | null;
    reason: string | null;
  }>;
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || '—'}</span>
    </div>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function OfficerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { items: rankItems } = useMasterData('MD_RANK');
  const RANK_LABELS = useMemo(
    () => Object.fromEntries(rankItems.map((r) => [r.code, r.nameVi])),
    [rankItems],
  );

  const [officer, setOfficer] = useState<OfficerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/officer-career/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setOfficer(data.data);
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

  if (error || !officer) {
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

  const p = officer.personnel;
  const rankLabel = RANK_LABELS[officer.currentRank || ''] || p.militaryRank || '—';

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
          <Badge className="bg-blue-100 text-blue-800 border-0">
            <Shield className="h-3 w-3 mr-1" />
            Sĩ quan
          </Badge>
          <Badge variant="outline">{p.unit?.name || '—'}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Personal Info */}
        <div className="space-y-4">
          {/* Avatar card */}
          <Card>
            <CardContent className="pt-6 flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-10 w-10 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{p.fullName}</p>
                <p className="text-sm text-muted-foreground">{rankLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">{p.position || '—'}</p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-0">
                {p.status === 'DANG_CONG_TAC' ? 'Đang công tác' : p.status || '—'}
              </Badge>
            </CardContent>
          </Card>

          {/* Personal details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" /> Thông tin cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Ngày sinh" value={formatDate(p.dateOfBirth)} />
              <InfoRow label="Giới tính" value={p.gender} />
              <InfoRow label="Quê quán" value={p.placeOfOrigin} />
              <InfoRow label="Dân tộc" value={p.ethnicity} />
              <InfoRow label="Tôn giáo" value={p.religion} />
              <InfoRow label="Trình độ" value={p.educationLevel} />
              <InfoRow label="Chuyên ngành" value={p.specialization} />
            </CardContent>
          </Card>

          {/* Unit info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building className="h-4 w-4" /> Đơn vị
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Tên đơn vị" value={p.unit?.name} />
              <InfoRow label="Mã đơn vị" value={p.unit?.code} />
              <InfoRow label="Chức vụ" value={officer.currentPosition || p.position} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="career">
            <TabsList className="w-full">
              <TabsTrigger value="career" className="flex-1">
                <Star className="h-3.5 w-3.5 mr-1.5" /> Hồ sơ sĩ quan
              </TabsTrigger>
              <TabsTrigger value="promotions" className="flex-1">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Lịch sử thăng cấp ({officer.promotions.length})
              </TabsTrigger>
              <TabsTrigger value="evaluation" className="flex-1">
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Đánh giá
              </TabsTrigger>
            </TabsList>

            {/* Career tab */}
            <TabsContent value="career" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Thông tin hồ sơ sĩ quan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                      <InfoRow label="Số hiệu sĩ quan" value={officer.officerIdNumber} />
                      <InfoRow label="Cấp bậc hiện tại" value={RANK_LABELS[officer.currentRank || ''] || officer.currentRank} />
                      <InfoRow label="Chức vụ hiện tại" value={officer.currentPosition} />
                    </div>
                    <div>
                      <InfoRow label="Ngày phong quân hàm" value={formatDate(officer.commissionedDate)} />
                      <InfoRow label="Mã nhân sự" value={p.personnelCode} />
                      <InfoRow label="Đơn vị" value={p.unit?.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rank badge display */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="h-4 w-4" /> Cấp bậc & Chức danh
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col items-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 min-w-[120px]">
                      <Shield className="h-8 w-8 text-blue-500 mb-2" />
                      <span className="text-xs text-muted-foreground">Cấp bậc</span>
                      <span className="text-sm font-bold text-blue-700 dark:text-blue-300 text-center">
                        {RANK_LABELS[officer.currentRank || ''] || p.militaryRank || '—'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 min-w-[120px]">
                      <Building className="h-8 w-8 text-green-500 mb-2" />
                      <span className="text-xs text-muted-foreground">Chức vụ</span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300 text-center">
                        {officer.currentPosition || p.position || '—'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 min-w-[120px]">
                      <Calendar className="h-8 w-8 text-purple-500 mb-2" />
                      <span className="text-xs text-muted-foreground">Nhập ngũ</span>
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300 text-center">
                        {formatDate(officer.commissionedDate)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 min-w-[120px]">
                      <TrendingUp className="h-8 w-8 text-orange-500 mb-2" />
                      <span className="text-xs text-muted-foreground">Lần thăng cấp</span>
                      <span className="text-sm font-bold text-orange-700 dark:text-orange-300 text-center">
                        {officer.promotions.length} lần
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Promotions tab */}
            <TabsContent value="promotions" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Lịch sử thăng cấp / Bổ nhiệm
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {officer.promotions.length === 0 ? (
                    <p className="text-center py-10 text-muted-foreground text-sm">
                      Chưa có lịch sử thăng cấp
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại</TableHead>
                          <TableHead>Ngày hiệu lực</TableHead>
                          <TableHead>Số quyết định</TableHead>
                          <TableHead>Cấp bậc cũ → mới</TableHead>
                          <TableHead>Lý do</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {officer.promotions.map(promo => (
                          <TableRow key={promo.id}>
                            <TableCell>
                              <Badge className={PROMO_TYPE_COLORS[promo.promotionType] || 'bg-gray-100 text-gray-800'}>
                                {PROMO_TYPE_LABELS[promo.promotionType] || promo.promotionType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(promo.effectiveDate)}</TableCell>
                            <TableCell className="font-mono text-xs">{promo.decisionNumber || '—'}</TableCell>
                            <TableCell className="text-sm">
                              <span className="text-muted-foreground">
                                {RANK_LABELS[promo.previousRank || ''] || '—'}
                              </span>
                              {' → '}
                              <span className="font-medium text-green-700">
                                {RANK_LABELS[promo.newRank || ''] || '—'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {promo.reason || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evaluation tab */}
            <TabsContent value="evaluation" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Kết quả đánh giá
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {officer.lastEvaluationDate ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày đánh giá gần nhất</p>
                          <p className="font-semibold">{formatDate(officer.lastEvaluationDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Kết quả</p>
                          <Badge className={
                            officer.lastEvaluationResult === 'Xuất sắc' ? 'bg-green-100 text-green-800' :
                            officer.lastEvaluationResult === 'Tốt' ? 'bg-blue-100 text-blue-800' :
                            officer.lastEvaluationResult === 'Khá' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {officer.lastEvaluationResult || '—'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-10 text-muted-foreground text-sm">
                      Chưa có dữ liệu đánh giá
                    </p>
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
