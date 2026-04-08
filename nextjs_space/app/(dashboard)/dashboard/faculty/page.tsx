'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp,
  RefreshCw,
  Award,
  FileText,
  Building2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import {
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
  ResponsiveContainer
} from 'recharts';
import { toast } from 'sonner';
import { useLanguage } from '@/components/providers/language-provider';

interface FacultyStats {
  overview: {
    totalFaculty: number;
    byRank: Record<string, number>;
    byDegree: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  research: {
    totalProjects: number;
    totalPublications: number;
    totalCitations: number;
    avgProjectsPerFaculty: number;
    avgPublicationsPerFaculty: number;
  };
  experience: {
    avgTeachingYears: number;
    avgIndustryYears: number;
  };
  topResearchers: Array<{
    userId: string;
    name: string;
    email: string;
    academicRank: string | null;
    academicDegree: string | null;
    publications: number;
    citations: number;
    researchProjects: number;
  }>;
}

export default function FacultyDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { t } = useLanguage();

  const [stats, setStats] = useState<FacultyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/faculty/stats');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      // API returns { success: true, stats: {...} }, extract stats
      const statsData = data.stats || data;
      // Normalize the data structure
      setStats({
        overview: {
          totalFaculty: statsData.overview?.totalFaculty || 0,
          byRank: statsData.overview?.byRank || {},
          byDegree: statsData.overview?.byDegree || {},
          byDepartment: statsData.byDepartment || {},
        },
        research: {
          totalProjects: statsData.research?.totalProjects || 0,
          totalPublications: statsData.research?.totalPublications || 0,
          totalCitations: statsData.research?.totalCitations || 0,
          avgProjectsPerFaculty: statsData.research?.avgProjectsPerFaculty || 0,
          avgPublicationsPerFaculty: statsData.research?.publicationsPerFaculty || 0,
        },
        experience: {
          avgTeachingYears: statsData.experience?.avgTeachingYears || 0,
          avgIndustryYears: statsData.experience?.avgIndustryYears || 0,
        },
        topResearchers: statsData.topResearchers || [],
      });
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      toast.error('Lỗi tải thống kê');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={handleRefresh} className="mt-4 mx-auto block">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Không có dữ liệu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const rankData = Object.entries(stats.overview.byRank).map(([rank, count]) => ({
    name: rank || 'Chưa cập nhật',
    value: count
  }));

  const degreeData = Object.entries(stats.overview.byDegree).map(([degree, count]) => ({
    name: degree || 'Chưa cập nhật',
    value: count
  }));

  const departmentData = Object.entries(stats.overview.byDepartment).map(([dept, count]) => ({
    name: dept || 'Chưa xác định',
    value: count
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {t('nav.faculty') || 'Đội ngũ Giảng viên'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Thống kê và quản lý đội ngũ giảng viên
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button onClick={() => router.push('/dashboard/faculty/list')}>
            <Users className="h-4 w-4 mr-2" />
            Danh sách GV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Giảng viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.overview.totalFaculty}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Đội ngũ giảng dạy
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án Nghiên cứu</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.research.totalProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              TB: {stats.research.avgProjectsPerFaculty.toFixed(1)} dự án/GV
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công bố Khoa học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{stats.research.totalPublications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              TB: {stats.research.avgPublicationsPerFaculty.toFixed(1)} bài/GV
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trích dẫn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.research.totalCitations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tác động nghiên cứu
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Experience Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Kinh nghiệm Giảng dạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {stats.experience.avgTeachingYears.toFixed(1)} năm
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Trung bình kinh nghiệm giảng dạy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Kinh nghiệm Thực tiễn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {stats.experience.avgIndustryYears.toFixed(1)} năm
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Trung bình kinh nghiệm thực tiễn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rank Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo Học hàm</CardTitle>
            <CardDescription>Số lượng giảng viên theo học hàm</CardDescription>
          </CardHeader>
          <CardContent>
            {rankData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rankData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Degree Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân bố theo Học vị</CardTitle>
            <CardDescription>Số lượng giảng viên theo học vị</CardDescription>
          </CardHeader>
          <CardContent>
            {degreeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={degreeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {degreeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Phân bố theo Khoa/Phòng</CardTitle>
            <CardDescription>Số lượng giảng viên theo đơn vị</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8b5cf6" name="Số giảng viên" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Researchers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top Nhà Nghiên cứu
          </CardTitle>
          <CardDescription>
            Giảng viên có số lượng công bố và trích dẫn cao nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.topResearchers.length > 0 ? (
            <div className="space-y-4">
              {stats.topResearchers.map((researcher, index) => (
                <div
                  key={researcher.userId}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/faculty/profile?userId=${researcher.userId}`)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{researcher.name}</h4>
                      {researcher.academicRank && (
                        <Badge variant="default">{researcher.academicRank}</Badge>
                      )}
                      {researcher.academicDegree && (
                        <Badge variant="outline">{researcher.academicDegree}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{researcher.email}</p>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {researcher.researchProjects}
                        </div>
                        <div className="text-xs text-muted-foreground">Dự án NC</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {researcher.publications}
                        </div>
                        <div className="text-xs text-muted-foreground">Công bố</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {researcher.citations}
                        </div>
                        <div className="text-xs text-muted-foreground">Trích dẫn</div>
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Không có dữ liệu</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
