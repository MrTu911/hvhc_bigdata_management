/**
 * Trang chi tiết Tiểu đoàn
 * /dashboard/education/battalions/[id]
 *
 * Tabs: Tổng quan | Danh sách HV | Kết quả học tập | Đảng phí
 * View: CHI_HUY_TIEU_DOAN thấy TĐ mình; CHI_HUY_HE thấy TĐ thuộc Hệ mình
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users,
  AlertTriangle,
  Shield,
  RefreshCw,
  Eye,
  Loader2,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang học',
  TEMP_SUSPENDED: 'Tạm ngưng',
  STUDY_DELAY: 'Bảo lưu',
  REPEATING: 'Học lại',
  DROPPED_OUT: 'Thôi học',
  GRADUATED: 'Tốt nghiệp',
};
const STATUS_VARIANTS: Record<string, any> = {
  ACTIVE: 'default',
  GRADUATED: 'secondary',
  DROPPED_OUT: 'destructive',
};
const WARNING_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
};

export default function BattalionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);

  const fetchDetail = useCallback(
    async (currentTab = tab, currentPage = page) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/education/battalions/${id}?tab=${currentTab}&page=${currentPage}&limit=20`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
        setData(json.data);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [id, tab, page]
  );

  useEffect(() => { fetchDetail(tab, page); }, [tab, page]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const { battalion, stats, students, studentMeta, academicRating } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" size="sm"
          onClick={() =>
            battalion?.parent?.id
              ? router.push(`/dashboard/education/training-systems/${battalion.parent.id}`)
              : router.push('/dashboard/education/training-systems')
          }
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            {battalion?.name}
          </h1>
          {battalion?.parent && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Thuộc: {battalion.parent.name}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDetail(tab, page)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      {/* Commander */}
      {battalion?.commander && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3 flex items-center gap-4">
            <Users className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                {battalion.commander.rank} {battalion.commander.name}
              </p>
              <p className="text-xs text-blue-600">{battalion.commander.position ?? 'Tiểu đoàn trưởng'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tổng học viên</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats?.activeStudents ?? 0}</p>
            <p className="text-xs text-muted-foreground">Đang học</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">
              {stats?.avgGPA?.toFixed(2) ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground">GPA trung bình</p>
          </CardContent>
        </Card>
        <Card className={stats?.warningCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold ${stats?.warningCount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {stats?.warningCount ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">Cảnh báo</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="students">Danh sách HV</TabsTrigger>
          <TabsTrigger value="grades">Kết quả học tập</TabsTrigger>
          <TabsTrigger value="party">Đảng phí</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Học viên gần đây */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Học viên mới nhất</CardTitle>
              </CardHeader>
              <CardContent>
                {students && students.length > 0 ? (
                  <div className="space-y-2">
                    {students.slice(0, 8).map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between border-b pb-1 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{s.hoTen}</p>
                          <p className="text-xs text-muted-foreground">{s.maHocVien} · {s.lop}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.academicWarnings?.[0] && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${WARNING_COLORS[s.academicWarnings[0].warningLevel] ?? ''}`}>
                              {s.academicWarnings[0].warningLevel}
                            </span>
                          )}
                          <span className={`text-sm font-bold ${(s.diemTrungBinh ?? 0) < 5 ? 'text-red-600' : 'text-gray-700'}`}>
                            {s.diemTrungBinh?.toFixed(1) ?? '—'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Chưa có học viên</p>
                )}
              </CardContent>
            </Card>

            {/* Xếp loại học lực */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  Xếp loại học lực
                </CardTitle>
              </CardHeader>
              <CardContent>
                {academicRating && academicRating.length > 0 ? (
                  <div className="space-y-2">
                    {academicRating.map((r: any) => (
                      <div key={r.rating} className="flex items-center justify-between">
                        <span className="text-sm">{r.rating}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, (r.count / (stats?.totalStudents || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-6 text-right">{r.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Chưa có dữ liệu xếp loại</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STUDENTS */}
        <TabsContent value="students">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Danh sách học viên — {studentMeta?.total ?? 0} người
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã HV</TableHead>
                      <TableHead>Họ tên</TableHead>
                      <TableHead>Lớp / Ngành</TableHead>
                      <TableHead>GPA</TableHead>
                      <TableHead>Xếp loại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Cảnh báo</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(students || []).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.maHocVien}</TableCell>
                        <TableCell className="font-medium">{s.hoTen}</TableCell>
                        <TableCell>
                          <div className="text-xs">{s.lop}</div>
                          <div className="text-xs text-muted-foreground">{s.nganh}</div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${(s.diemTrungBinh ?? 0) < 5 ? 'text-red-600' : ''}`}>
                            {s.diemTrungBinh?.toFixed(2) ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{s.xepLoaiHocLuc ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANTS[s.currentStatus] || 'outline'} className="text-xs">
                            {STATUS_LABELS[s.currentStatus] || s.currentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.academicWarnings?.[0] && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${WARNING_COLORS[s.academicWarnings[0].warningLevel] ?? ''}`}>
                              {s.academicWarnings[0].warningLevel}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/education/students/${s.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="h-3 w-3" /></Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {studentMeta && studentMeta.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Trang {page}/{studentMeta.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                        Trước
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(studentMeta.totalPages, p + 1))} disabled={page === studentMeta.totalPages}>
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* GRADES */}
        <TabsContent value="grades">
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Báo cáo kết quả học tập</p>
              <Button
                variant="outline" className="mt-4"
                onClick={() => router.push(`/dashboard/education/grades?battalionUnitId=${id}`)}
              >
                Xem điểm học phần
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PARTY FEES (placeholder) */}
        <TabsContent value="party">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="font-medium text-gray-700">Quản lý Đảng phí</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tiểu đoàn có <strong>{stats?.partyMemberCount ?? 0}</strong> học viên có tài khoản hệ thống
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Chức năng thu/chi đảng phí sẽ tích hợp với module Đảng (M03)
              </p>
              <Button
                variant="outline" className="mt-4"
                onClick={() => router.push('/dashboard/party/members')}
              >
                Xem danh sách đảng viên
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
