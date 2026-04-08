'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StudentPerformanceChart from '@/components/charts/StudentPerformanceChart';
import InsightCard from '@/components/insights/InsightCard';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  RefreshCw,
} from 'lucide-react';

interface StudentPerformance {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  avgGPA: number;
  trend: string;
  riskLevel: string;
}

interface Statistics {
  total: number;
  xuatSac: number;
  binhThuong: number;
  nguyCoThap: number;
  avgGPAAll: number;
  trendTang: number;
  trendGiam: number;
  trendOnDinh: number;
}

export default function StudentAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<StudentPerformance[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    xuatSac: 0,
    binhThuong: 0,
    nguyCoThap: 0,
    avgGPAAll: 0,
    trendTang: 0,
    trendGiam: 0,
    trendOnDinh: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student/performance-analysis');
      const data = await response.json();

      if (data.success) {
        setPerformance(data.performance);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const colorMap: { [key: string]: string } = {
      'Xuất sắc': 'bg-green-100 text-green-800 border-green-300',
      'Bình thường': 'bg-blue-100 text-blue-800 border-blue-300',
      'Nguy cơ thấp': 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <Badge variant="outline" className={colorMap[riskLevel] || 'bg-gray-100 text-gray-800'}>
        {riskLevel}
      </Badge>
    );
  };

  const getTrendBadge = (trend: string) => {
    const colorMap: { [key: string]: string } = {
      'tăng': 'bg-green-100 text-green-800',
      'giảm': 'bg-red-100 text-red-800',
      'ổn định': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant="outline" className={colorMap[trend] || 'bg-gray-100 text-gray-800'}>
        {trend === 'tăng' ? '↑ Tăng' : trend === 'giảm' ? '↓ Giảm' : '→ Ổn định'}
      </Badge>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phân tích Học viên</h1>
          <p className="mt-1 text-sm text-gray-500">
            Đánh giá hiệu suất học tập và xu hướng phát triển
          </p>
        </div>
        <Button onClick={fetchPerformanceData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Đã phân tích</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA Trung bình</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.avgGPAAll.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Điểm trung bình chung</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học viên xuất sắc</CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{statistics.xuatSac}</div>
            <p className="text-xs text-muted-foreground mt-1">
              GPA ≥ 8.0 và xu hướng tăng
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nguy cơ thấp</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.nguyCoThap}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cần hỗ trợ và can thiệp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <StudentPerformanceChart />

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết Hiệu suất Học tập ({performance.length})</CardTitle>
          <CardDescription>
            Phân tích đầy đủ từng học viên với AI Insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 border-b">
                    <th className="text-left p-3 text-sm font-semibold">STT</th>
                    <th className="text-left p-3 text-sm font-semibold">Mã HV</th>
                    <th className="text-left p-3 text-sm font-semibold">Họ tên</th>
                    <th className="text-left p-3 text-sm font-semibold">Lớp</th>
                    <th className="text-center p-3 text-sm font-semibold">GPA</th>
                    <th className="text-center p-3 text-sm font-semibold">Xu hướng</th>
                    <th className="text-center p-3 text-sm font-semibold">Mức rủi ro</th>
                    <th className="text-center p-3 text-sm font-semibold">AI Insight</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.slice(0, 20).map((student, index) => (
                    <tr key={student.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3 text-sm font-medium">{student.maHocVien}</td>
                      <td className="p-3 text-sm">{student.hoTen}</td>
                      <td className="p-3 text-sm">{student.lop || 'N/A'}</td>
                      <td className="p-3 text-sm text-center font-semibold">
                        {student.avgGPA.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-center">{getTrendBadge(student.trend)}</td>
                      <td className="p-3 text-sm text-center">
                        {getRiskBadge(student.riskLevel)}
                      </td>
                      <td className="p-3 text-sm">
                        <InsightCard type="student" id={student.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Không có dữ liệu</p>
              <p className="text-sm mt-1">Chưa có dữ liệu học viên để phân tích</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
