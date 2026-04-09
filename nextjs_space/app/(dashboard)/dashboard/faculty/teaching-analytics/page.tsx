'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import {
  BookOpen,
  Users,
  TrendingUp,
  Download,
  FileSpreadsheet,
  FileText,
  BarChart3,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { exportToPDF, exportToCSV } from '@/lib/export-utils';
import { ACADEMIC_STANDING_COLORS } from '@/lib/constants/academic-standing';

interface SubjectStat {
  maMon: string;
  tenMon: string;
  namHoc: string;
  hocKy: string;
  totalStudents: number;
  avgScore: number;
  xuatSac: number;
  gioi: number;
  kha: number;
  trungBinh: number;
  yeu: number;
  passRate: number;
}

interface TrendData {
  period: string;
  namHoc: string;
  hocKy: string;
  avgScore: number;
}

interface Summary {
  totalStudents: number;
  totalSubjects: number;
  avgScoreAll: number;
  totalClasses: number;
}

export default function TeachingAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalStudents: 0,
    totalSubjects: 0,
    avgScoreAll: 0,
    totalClasses: 0,
  });

  // Additional visualization data
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Available options
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchTeachingStats();
  }, [subjectFilter, yearFilter, semesterFilter]);

  const fetchTeachingStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectFilter) params.append('subject', subjectFilter);
      if (yearFilter) params.append('year', yearFilter);
      if (semesterFilter) params.append('semester', semesterFilter);

      const response = await fetch(`/api/faculty/teaching-stats?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSubjectStats(data.subjectStats);
        setTrendData(data.trendData);
        setSummary(data.summary);

        // Extract unique years and semesters
        const years = Array.from(new Set(data.subjectStats.map((s: SubjectStat) => s.namHoc))) as string[];
        const semesters = Array.from(new Set(data.subjectStats.map((s: SubjectStat) => s.hocKy))) as string[];
        setAvailableYears(years.filter((y) => y !== 'N/A').sort());
        setAvailableSemesters(semesters.filter((s) => s !== 'N/A').sort());

        // Process comparison data (top 10 subjects by avgScore)
        const topSubjects = [...data.subjectStats]
          .sort((a: SubjectStat, b: SubjectStat) => b.avgScore - a.avgScore)
          .slice(0, 10)
          .map((s: SubjectStat) => ({
            name: s.tenMon.length > 25 ? s.tenMon.substring(0, 25) + '...' : s.tenMon,
            score: s.avgScore,
            passRate: s.passRate,
          }));
        setComparisonData(topSubjects);

        // Process distribution data (aggregate all students)
        const totalXuatSac = data.subjectStats.reduce((sum: number, s: SubjectStat) => sum + s.xuatSac, 0);
        const totalGioi = data.subjectStats.reduce((sum: number, s: SubjectStat) => sum + s.gioi, 0);
        const totalKha = data.subjectStats.reduce((sum: number, s: SubjectStat) => sum + s.kha, 0);
        const totalTrungBinh = data.subjectStats.reduce((sum: number, s: SubjectStat) => sum + s.trungBinh, 0);
        const totalYeu = data.subjectStats.reduce((sum: number, s: SubjectStat) => sum + s.yeu, 0);

        setDistributionData(
          [
            { name: 'Xuất sắc',   value: totalXuatSac   },
            { name: 'Giỏi',       value: totalGioi       },
            { name: 'Khá',        value: totalKha        },
            { name: 'Trung bình', value: totalTrungBinh  },
            { name: 'Yếu',        value: totalYeu        },
          ]
            .filter((d) => d.value > 0)
            .map((d) => ({ ...d, color: ACADEMIC_STANDING_COLORS[d.name] ?? '#9ca3af' }))
        );
      } else {
        toast.error(data.error || 'Failed to fetch teaching statistics');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load teaching statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = [
        'Mã môn',
        'Tên môn',
        'Năm học',
        'Học kỳ',
        'Số sinh viên',
        'Điểm TB',
        'Xuất sắc',
        'Giỏi',
        'Khá',
        'Trung bình',
        'Yếu',
        'Tỷ lệ đạt (%)',
      ];

      const data = subjectStats.map((stat) => [
        stat.maMon,
        stat.tenMon,
        stat.namHoc,
        stat.hocKy,
        stat.totalStudents,
        stat.avgScore.toFixed(2),
        stat.xuatSac,
        stat.gioi,
        stat.kha,
        stat.trungBinh,
        stat.yeu,
        stat.passRate.toFixed(1),
      ]);

      exportToCSV({
        headers,
        data,
        filename: `teaching-analytics-${new Date().toISOString().split('T')[0]}.csv`,
      });

      toast.success('Xuất CSV thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi xuất CSV');
    }
  };

  const handleExportPDF = () => {
    try {
      const headers = ['Ma mon', 'Ten mon', 'Hoc ky', 'SV', 'Diem TB', 'Ty le dat'];

      const data = subjectStats.map((stat) => [
        stat.maMon,
        stat.tenMon,
        `${stat.namHoc} - ${stat.hocKy}`,
        stat.totalStudents,
        stat.avgScore.toFixed(2),
        `${stat.passRate.toFixed(1)}%`,
      ]);

      exportToPDF({
        title: 'THONG KE GIANG DAY',
        subtitle: 'Phan tich ket qua giang day theo mon hoc',
        headers,
        data,
        filename: `teaching-analytics-${new Date().toISOString().split('T')[0]}.pdf`,
        summary: [
          { label: 'Tong so lop', value: summary.totalClasses },
          { label: 'Tong so sinh vien', value: summary.totalStudents },
          { label: 'Diem TB chung', value: summary.avgScoreAll.toFixed(2) },
        ],
      });

      toast.success('Xuất PDF thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi xuất PDF');
    }
  };

  const resetFilters = () => {
    setSubjectFilter('');
    setYearFilter('');
    setSemesterFilter('');
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
          <h1 className="text-3xl font-bold text-gray-900">Thống kê giảng dạy</h1>
          <p className="mt-1 text-sm text-gray-500">
            Phân tích kết quả giảng dạy theo môn học và học kỳ
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
          <Button onClick={fetchTeachingStats} variant="outline" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số lớp giảng dạy</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalSubjects} môn học</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sinh viên</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Luợt giảng dạy</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm TB chung</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.avgScoreAll.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trung bình tất cả lớp</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bộ lọc</CardTitle>
            <Filter className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {[subjectFilter, yearFilter, semesterFilter].filter((f) => f).length}
            </div>
            <Button
              onClick={resetFilters}
              variant="link"
              size="sm"
              className="text-xs p-0 h-auto mt-1"
            >
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc dữ liệu</CardTitle>
          <CardDescription>Lọc theo môn học, năm học, học kỳ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Tìm môn học</label>
              <Input
                placeholder="Nhập tên hoặc mã môn..."
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Năm học</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Học kỳ</label>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {availableSemesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng điểm trung bình</CardTitle>
          <CardDescription>Điểm trung bình theo học kỳ</CardDescription>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  name="Điểm trung bình"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              Chưa có dữ liệu xu hướng
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comparison & Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Subject Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>So sánh hiệu suất môn học</CardTitle>
            <CardDescription>Top 10 môn học theo điểm trung bình</CardDescription>
          </CardHeader>
          <CardContent>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 10]} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="score" name="Điểm TB" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                Chưa có dữ liệu so sánh
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố học lực sinh viên</CardTitle>
            <CardDescription>Tổng hợp theo xếp loại</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.value} (${((entry.value / distributionData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                Chưa có dữ liệu phân bố
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng thống kê chi tiết ({subjectStats.length})</CardTitle>
          <CardDescription>Kết quả giảng dạy theo từng lớp</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 border-b">
                    <th className="text-left p-3 text-sm font-semibold">STT</th>
                    <th className="text-left p-3 text-sm font-semibold">Mã môn</th>
                    <th className="text-left p-3 text-sm font-semibold">Tên môn</th>
                    <th className="text-left p-3 text-sm font-semibold">Học kỳ</th>
                    <th className="text-center p-3 text-sm font-semibold">SV</th>
                    <th className="text-center p-3 text-sm font-semibold">Điểm TB</th>
                    <th className="text-center p-3 text-sm font-semibold">Xuất sắc</th>
                    <th className="text-center p-3 text-sm font-semibold">Giỏi</th>
                    <th className="text-center p-3 text-sm font-semibold">Khá</th>
                    <th className="text-center p-3 text-sm font-semibold">TB</th>
                    <th className="text-center p-3 text-sm font-semibold">Yếu</th>
                    <th className="text-center p-3 text-sm font-semibold">Tỷ lệ đạt</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectStats.map((stat, index) => (
                    <tr
                      key={index}
                      className="border-b hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="p-3 text-sm">{index + 1}</td>
                      <td className="p-3 text-sm font-medium">{stat.maMon}</td>
                      <td className="p-3 text-sm">{stat.tenMon}</td>
                      <td className="p-3 text-sm">
                        {stat.namHoc} - {stat.hocKy}
                      </td>
                      <td className="p-3 text-sm text-center">{stat.totalStudents}</td>
                      <td className="p-3 text-sm text-center font-semibold">
                        {stat.avgScore.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {stat.xuatSac}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {stat.gioi}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {stat.kha}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {stat.trungBinh}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {stat.yeu}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-center">
                        <Badge
                          variant="outline"
                          className={
                            stat.passRate >= 90
                              ? 'bg-green-100 text-green-800'
                              : stat.passRate >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {stat.passRate.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <BookOpen className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Không có dữ liệu</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc để xem kết quả</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
