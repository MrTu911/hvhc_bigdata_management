
'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { OverviewCards } from '@/components/dashboard/department-head/overview-cards';
import { CoursesTable } from '@/components/dashboard/department-head/courses-table';
import { InstructorsTable } from '@/components/dashboard/department-head/instructors-table';
import { ResearchProjects } from '@/components/dashboard/department-head/research-projects';
import { WorkloadChart } from '@/components/dashboard/department-head/workload-chart';

interface OverviewData {
  overview: {
    coursesCount: number;
    instructorsCount: number;
    classesCount: number;
    projectsCount: number;
  };
  recentClasses: any[];
}

interface CoursesData {
  courses: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    classesCount: number;
    studentsCount: number;
    instructors: string[];
  }>;
}

interface InstructorsData {
  instructors: Array<{
    id: string;
    name: string;
    email: string;
    classesCount: number;
    studentsCount: number;
    teachingHours: number;
    researchProjects: number;
  }>;
}

interface ResearchData {
  projects: any[];
  stats: {
    total: number;
    active: number;
    completed: number;
    totalBudget: number;
    averageProgress: number;
  };
}

interface StatisticsData {
  teaching: any;
  research: any;
  workload: Array<{
    name: string;
    hours: number;
    classes: number;
  }>;
}

export default function DepartmentHeadDashboard() {
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [coursesData, setCoursesData] = useState<CoursesData | null>(null);
  const [instructorsData, setInstructorsData] = useState<InstructorsData | null>(null);
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'courses' && !coursesData) {
      fetchCourses();
    } else if (activeTab === 'instructors' && !instructorsData) {
      fetchInstructors();
    } else if (activeTab === 'research' && !researchData) {
      fetchResearch();
    } else if (activeTab === 'statistics' && !statisticsData) {
      fetchStatistics();
    }
  }, [activeTab]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/department-head/overview');
      if (response.ok) {
        const data = await response.json();
        setOverviewData(data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/dashboard/department-head/courses');
      if (response.ok) {
        const data = await response.json();
        setCoursesData(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/dashboard/department-head/instructors');
      if (response.ok) {
        const data = await response.json();
        setInstructorsData(data);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    }
  };

  const fetchResearch = async () => {
    try {
      const response = await fetch('/api/dashboard/department-head/research');
      if (response.ok) {
        const data = await response.json();
        setResearchData(data);
      }
    } catch (error) {
      console.error('Error fetching research:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/dashboard/department-head/statistics');
      if (response.ok) {
        const data = await response.json();
        setStatisticsData(data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Header Skeleton */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-pink-500/80 p-6 shadow-lg">
          <Skeleton className="h-8 w-72 bg-white/20" />
          <Skeleton className="h-5 w-96 mt-2 bg-white/20" />
          <div className="flex gap-3 mt-4">
            <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
            <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
            <Skeleton className="h-8 w-24 rounded-full bg-white/20" />
          </div>
        </div>
        
        {/* Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="text-4xl">📚</span>
            Dashboard Chủ nhiệm Bộ môn
          </h1>
          <p className="text-white/80 mt-2 text-lg">
            Quản lý hoạt động giảng dạy và nghiên cứu khoa học của bộ môn
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              📖 Giảng dạy
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              🔬 Nghiên cứu
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-medium">
              👥 Nhân sự
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            📊 Tổng quan
          </TabsTrigger>
          <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            📖 Môn học
          </TabsTrigger>
          <TabsTrigger value="instructors" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            👨‍🏫 Giảng viên
          </TabsTrigger>
          <TabsTrigger value="research" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            🔬 Nghiên cứu
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
            📈 Thống kê
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overviewData && (
            <>
              <OverviewCards overview={overviewData.overview} />
              
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">🎓</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">Lớp học gần đây</CardTitle>
                      <CardDescription>
                        Các lớp học được tạo gần đây trong bộ môn
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {overviewData.recentClasses.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-3">
                      <span className="text-4xl">📭</span>
                      <span>Chưa có lớp học nào</span>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {overviewData.recentClasses.map((cls: any) => (
                        <div key={cls.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                              {cls.name?.substring(0, 2).toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">{cls.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {cls.course?.name || 'N/A'} • {cls.instructor?.name || 'Chưa phân công'}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {new Date(cls.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Môn học</CardTitle>
              <CardDescription>
                Các môn học thuộc bộ môn quản lý
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesData ? (
                <CoursesTable courses={coursesData.courses} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Đang tải dữ liệu...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách Giảng viên</CardTitle>
              <CardDescription>
                Giảng viên và khối lượng công việc
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instructorsData ? (
                <InstructorsTable instructors={instructorsData.instructors} />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Đang tải dữ liệu...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
          {researchData ? (
            <ResearchProjects projects={researchData.projects} stats={researchData.stats} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đang tải dữ liệu...
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statisticsData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Thống kê Giảng dạy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tổng số lớp</span>
                      <span className="text-2xl font-bold">{statisticsData.teaching?.totalClasses || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tổng sinh viên</span>
                      <span className="text-2xl font-bold">{statisticsData.teaching?.totalStudents || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tổng tín chỉ</span>
                      <span className="text-2xl font-bold">{statisticsData.teaching?.totalCredits || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Quy mô lớp TB</span>
                      <span className="text-2xl font-bold">
                        {Math.round(statisticsData.teaching?.averageClassSize || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Thống kê Nghiên cứu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tổng dự án</span>
                      <span className="text-2xl font-bold">{statisticsData.research?.totalProjects || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Đang thực hiện</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {statisticsData.research?.activeProjects || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hoàn thành</span>
                      <span className="text-2xl font-bold text-green-600">
                        {statisticsData.research?.completedProjects || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tiến độ TB</span>
                      <span className="text-2xl font-bold">
                        {Math.round(statisticsData.research?.averageProgress || 0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {statisticsData.workload && statisticsData.workload.length > 0 && (
                <WorkloadChart data={statisticsData.workload} />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Đang tải dữ liệu...
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
