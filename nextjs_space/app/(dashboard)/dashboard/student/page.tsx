
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award
} from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { AutoDashboard } from '@/components/dashboard/auto-dashboard';

interface Overview {
  enrolledCourses: number;
  upcomingAssignments: number;
  completedAssignments: number;
  averageGrade: number;
}

interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  schedule: string;
  progress: number;
  grade: number | null;
  status: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  courseName: string;
  dueDate: string;
  status: string;
  priority: string;
  description: string;
  grade?: number;
  submittedAt?: string;
}

interface Material {
  id: string;
  title: string;
  course: string;
  type: string;
  size: string;
  uploadedAt: string;
  downloads: number;
}

interface ScheduleSession {
  time: string;
  course: string;
  courseName: string;
  room: string;
  instructor: string;
}

interface ScheduleDay {
  day: string;
  sessions: ScheduleSession[];
}

export default function StudentDashboard() {
  const { t } = useLanguage();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, coursesRes, assignmentsRes, materialsRes, scheduleRes] = await Promise.all([
        fetch('/api/dashboard/student/overview'),
        fetch('/api/dashboard/student/courses'),
        fetch('/api/dashboard/student/assignments'),
        fetch('/api/dashboard/student/materials'),
        fetch('/api/dashboard/student/schedule')
      ]);

      const [overviewData, coursesData, assignmentsData, materialsData, scheduleData] = await Promise.all([
        overviewRes.json(),
        coursesRes.json(),
        assignmentsRes.json(),
        materialsRes.json(),
        scheduleRes.json()
      ]);

      setOverview(overviewData.overview);
      setCourses(coursesData.courses || []);
      setAssignments(assignmentsData.assignments || []);
      setMaterials(materialsData.materials || []);
      setSchedule(scheduleData.schedule || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return '📄';
      case 'VIDEO':
        return '🎥';
      case 'CSV':
        return '📊';
      case 'ZIP':
        return '📦';
      default:
        return '📁';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Học viên</h1>
        <p className="text-muted-foreground">Theo dõi tiến độ học tập và hoàn thành bài tập</p>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Môn học đang theo</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.enrolledCourses}</div>
              <p className="text-xs text-muted-foreground">Học kỳ này</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bài tập sắp tới</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.upcomingAssignments}</div>
              <p className="text-xs text-muted-foreground">Cần hoàn thành</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.completedAssignments}</div>
              <p className="text-xs text-muted-foreground">Bài tập</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm TB</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.averageGrade}</div>
              <p className="text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Khá giỏi
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Môn học</TabsTrigger>
          <TabsTrigger value="assignments">Bài tập</TabsTrigger>
          <TabsTrigger value="materials">Tài liệu</TabsTrigger>
          <TabsTrigger value="schedule">Lịch học</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Môn học đang theo học</CardTitle>
              <CardDescription>Danh sách các môn học trong học kỳ hiện tại</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{course.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course.code} • {course.instructor} • {course.credits} tín chỉ
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          {course.schedule}
                        </p>
                      </div>
                      {course.grade && (
                        <div className="text-right">
                          <div className="text-2xl font-bold">{course.grade}</div>
                          <p className="text-xs text-muted-foreground">Điểm</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Tiến độ học tập</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bài tập và đồ án</CardTitle>
              <CardDescription>Theo dõi và nộp bài tập đúng hạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const daysLeft = getDaysUntilDue(assignment.dueDate);
                  return (
                    <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{assignment.title}</h3>
                            <Badge variant={getPriorityColor(assignment.priority)}>
                              {assignment.priority}
                            </Badge>
                            <Badge variant={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{assignment.courseName}</p>
                          <p className="text-sm mt-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã quá hạn'}
                            </span>
                            {assignment.grade && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Award className="h-3 w-3" />
                                Điểm: {assignment.grade}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          {assignment.status === 'COMPLETED' ? (
                            <Button size="sm" variant="outline" disabled>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Đã nộp
                            </Button>
                          ) : (
                            <Button size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Nộp bài
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu học tập</CardTitle>
              <CardDescription>Tài liệu, bài giảng từ giảng viên</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {materials.map((material) => (
                  <div key={material.id} className="flex items-center justify-between border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{getTypeIcon(material.type)}</div>
                      <div>
                        <h4 className="font-medium">{material.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {material.course} • {material.size} • {material.downloads} lượt tải
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Tải xuống
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lịch học trong tuần</CardTitle>
              <CardDescription>Thời khóa biểu các buổi học</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {schedule.map((day, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold mb-3 text-lg">{day.day}</h3>
                    <div className="space-y-2">
                      {day.sessions.map((session, sessionIdx) => (
                        <div key={sessionIdx} className="border rounded-lg p-4 bg-accent/30">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{session.time}</span>
                              </div>
                              <h4 className="font-semibold text-lg">{session.courseName}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                {session.instructor}
                              </p>
                            </div>
                            <Badge variant="outline">{session.room}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dynamic RBAC Widgets */}
      <AutoDashboard
        title="Chức năng được phân quyền"
        description="Widget hiển thị tự động theo chức năng được gán trong ma trận phân quyền RBAC"
      />
    </div>
  );
}
