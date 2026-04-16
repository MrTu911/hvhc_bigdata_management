/**
 * Trang chi tiết Hệ đào tạo
 * /dashboard/education/training-systems/[id]
 *
 * Tabs: Tổng quan | Danh sách HV | Tiểu đoàn | Hoạt động
 * View: CHI_HUY_HE thấy Hệ mình; ADMIN thấy tất cả
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  GraduationCap,
  Users,
  AlertTriangle,
  Building2,
  RefreshCw,
  Eye,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

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

export default function TrainingSystemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);

  const fetchDetail = useCallback(async (currentTab = tab, currentPage = page) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/education/training-systems/${id}?tab=${currentTab}&page=${currentPage}&limit=20`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setData(json.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, tab, page]);

  useEffect(() => { fetchDetail(tab, page); }, [tab, page]);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data) return null;

  const { system, stats, topWarnings, majorDistribution, students, studentMeta } = data;

  const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/education/training-systems')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            {system?.name}
          </h1>
          {system?.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{system.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDetail(tab, page)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      {/* Commander info */}
      {system?.commander && (
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="py-3 flex items-center gap-4">
            <Users className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-indigo-900">
                {system.commander.rank} {system.commander.name}
              </p>
              <p className="text-xs text-indigo-600">{system.commander.position ?? 'Chỉ huy trưởng'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tổng học viên</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats?.activeStudents ?? 0}</p>
            <p className="text-xs text-muted-foreground">Đang học</p>
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
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-purple-700">{stats?.graduatedCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Tốt nghiệp</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="students">Danh sách HV</TabsTrigger>
          <TabsTrigger value="battalions">Tiểu đoàn</TabsTrigger>
          <TabsTrigger value="activities">Hoạt động</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Phân bổ ngành */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Phân bổ theo ngành</CardTitle>
              </CardHeader>
              <CardContent>
                {majorDistribution && majorDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={majorDistribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="nganh" type="category" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#6366f1">
                        {majorDistribution.map((_: any, i: number) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>

            {/* Top cảnh báo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Cảnh báo học vụ gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topWarnings && topWarnings.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {topWarnings.map((w: any, i: number) => (
                      <div key={i} className="flex items-center justify-between border-b pb-1 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{w.student?.hoTen}</p>
                          <p className="text-xs text-muted-foreground">
                            {w.student?.maHocVien} · {w.student?.lop}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WARNING_COLORS[w.warningLevel] ?? ''}`}>
                          {w.warningLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Không có cảnh báo</p>
                )}
                {topWarnings?.length > 0 && (
                  <Button
                    variant="outline" size="sm" className="w-full mt-3"
                    onClick={() => router.push('/dashboard/education/warnings')}
                  >
                    Xem tất cả cảnh báo
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STUDENTS */}
        <TabsContent value="students">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
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
                      <TableHead>Tiểu đoàn</TableHead>
                      <TableHead>GPA</TableHead>
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
                        <TableCell className="text-xs">{s.battalionUnit?.name ?? '—'}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${(s.diemTrungBinh ?? 0) < 5 ? 'text-red-600' : 'text-gray-800'}`}>
                            {s.diemTrungBinh?.toFixed(2) ?? '—'}
                          </span>
                        </TableCell>
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
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3 mr-1" /> Xem
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {studentMeta && studentMeta.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Trang {page}/{studentMeta.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >Trước</Button>
                      <Button
                        variant="outline" size="sm"
                        onClick={() => setPage((p) => Math.min(studentMeta.totalPages, p + 1))}
                        disabled={page === studentMeta.totalPages}
                      >Sau</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BATTALIONS */}
        <TabsContent value="battalions">
          {system?.battalions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {system.battalions.map((bat: any) => (
                <Card
                  key={bat.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/education/battalions/${bat.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{bat.name}</CardTitle>
                      <Badge variant="outline" className="text-xs">{bat.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span className="text-lg font-bold">{bat.studentCount}</span>
                        <span className="text-sm text-muted-foreground">học viên</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Chi tiết <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Hệ này không có Tiểu đoàn trực thuộc
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ACTIVITIES (placeholder) */}
        <TabsContent value="activities">
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">Quản lý hoạt động đang phát triển</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sẽ tích hợp với module Đảng (M03) trong giai đoạn tiếp theo
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
