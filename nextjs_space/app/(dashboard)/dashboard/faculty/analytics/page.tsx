'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Award, RefreshCw, Info, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '@/components/providers/language-provider';
import FacultyEISChart from '@/components/charts/FacultyEISChart';
import InsightCard from '@/components/insights/InsightCard';

interface EISResult {
  facultyId: string;
  facultyName: string;
  department?: string;
  score: number;
  level: string;
  color: string;
}

interface EISStatistics {
  total: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    needsImprovement: number;
  };
}

interface EISData {
  faculty: EISResult[];
  statistics: EISStatistics;
}

export default function FacultyAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<EISData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/faculty/eis?all=true');
      if (!res.ok) {
        throw new Error('Failed to load EIS data');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Error loading EIS data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getLevelBadgeVariant = (level: string) => {
    if (level === 'Xuất sắc') return 'default';
    if (level === 'Tốt') return 'secondary';
    return 'outline';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Không có dữ liệu</p>
      </div>
    );
  }

  // Prepare chart data
  const distributionData = [
    { name: 'Xuất sắc (80-100)', value: data.statistics.distribution.excellent, fill: '#10b981' },
    { name: 'Tốt (60-79)', value: data.statistics.distribution.good, fill: '#3b82f6' },
    { name: 'Trung bình (40-59)', value: data.statistics.distribution.average, fill: '#eab308' },
    { name: 'Cần cải thiện (<40)', value: data.statistics.distribution.needsImprovement, fill: '#f97316' }
  ];

  // Top 10 faculty by score
  const topFaculty = data.faculty.slice(0, 10);
  const topFacultyChartData = topFaculty.map(f => ({
    name: f.facultyName.split(' ').slice(-2).join(' '), // Last 2 words of name
    score: f.score
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            AI Analytics - Chỉ số Năng lực Giảng viên (EIS)
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân tích đánh giá năng lực giảng dạy và nghiên cứu
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Giới thiệu về EIS (Education Impact Score)</h3>
              <p className="text-sm text-blue-800 mb-2">
                Chỉ số EIS đo lường mức độ ảnh hưởng của giảng viên trong giảng dạy và nghiên cứu, dựa trên các yếu tố:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Số lượng đề tài nghiên cứu, công bố khoa học, và trích dẫn</li>
                <li>• Kinh nghiệm giảng dạy và thực tiễn</li>
                <li>• Học hàm, học vị</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng số giảng viên</CardDescription>
            <CardTitle className="text-3xl">{data.statistics.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {data.statistics.averageScore}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Xuất sắc</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">
              {data.statistics.distribution.excellent}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tốt</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {data.statistics.distribution.good}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố mức độ năng lực</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Faculty Bar Chart with AI Insights */}
        <FacultyEISChart />
      </div>

      {/* Faculty Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng xếp hạng giảng viên</CardTitle>
          <CardDescription>
            Sắp xếp theo chỉ số EIS từ cao đến thấp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Thứ hạng</th>
                  <th className="text-left p-3 font-semibold">Họ tên</th>
                  <th className="text-left p-3 font-semibold">Khoa/Phòng</th>
                  <th className="text-center p-3 font-semibold">EIS Score</th>
                  <th className="text-center p-3 font-semibold">Mức độ</th>
                  <th className="text-center p-3 font-semibold">AI Insight</th>
                </tr>
              </thead>
              <tbody>
                {data.faculty.map((faculty, index) => (
                  <tr key={faculty.facultyId} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {index < 3 && (
                          <Award className="h-4 w-4 text-yellow-500" />
                        )}
                        #{index + 1}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{faculty.facultyName}</td>
                    <td className="p-3 text-muted-foreground">
                      {faculty.department || 'N/A'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold ${getScoreColor(faculty.score)}`}>
                        {faculty.score}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant={getLevelBadgeVariant(faculty.level)}>
                        {faculty.level}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <InsightCard type="faculty" id={faculty.facultyId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
