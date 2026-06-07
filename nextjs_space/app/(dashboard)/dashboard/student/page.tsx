'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { AutoDashboard } from '@/components/dashboard/auto-dashboard';
import {
  BookOpen, FileText, Download, Clock, CheckCircle2, AlertCircle,
  TrendingUp, Award, GraduationCap, RefreshCw, Loader2, MapPin,
  User, Video, FileSpreadsheet, FileArchive, File as FileIcon,
  CalendarClock, ClipboardList, Layers, Sparkles, BookMarked, Send,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types (khớp với contract của 5 API hiện có, không đổi) ──────────────────

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

// ─── Bảng màu thống nhất với template (education / bigdata) ──────────────────

const PALETTE = {
  indigo: '#4f46e5',
  blue: '#2563eb',
  sky: '#0ea5e9',
  cyan: '#0891b2',
  teal: '#0d9488',
  green: '#16a34a',
  emerald: '#059669',
  amber: '#d97706',
  orange: '#ea580c',
  red: '#dc2626',
  purple: '#7c3aed',
  slate: '#475569',
};

// ─── Helpers nghiệp vụ hiển thị ──────────────────────────────────────────────

function getGradeMeta(grade: number | null | undefined): { label: string; color: string } {
  if (grade === null || grade === undefined) return { label: 'Chưa có điểm', color: PALETTE.slate };
  if (grade >= 9) return { label: 'Xuất sắc', color: PALETTE.emerald };
  if (grade >= 8) return { label: 'Giỏi', color: PALETTE.green };
  if (grade >= 6.5) return { label: 'Khá', color: PALETTE.blue };
  if (grade >= 5) return { label: 'Trung bình', color: PALETTE.amber };
  return { label: 'Yếu', color: PALETTE.red };
}

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: 'Khẩn cấp', color: PALETTE.red, bg: 'bg-red-50 text-red-700 border-red-200' },
  HIGH: { label: 'Ưu tiên cao', color: PALETTE.orange, bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  MEDIUM: { label: 'Trung bình', color: PALETTE.amber, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Thấp', color: PALETTE.slate, bg: 'bg-slate-50 text-slate-600 border-slate-200' },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: 'Đã nộp', color: PALETTE.green, bg: 'bg-green-50 text-green-700 border-green-200' },
  IN_PROGRESS: { label: 'Đang làm', color: PALETTE.blue, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  PENDING: { label: 'Chưa làm', color: PALETTE.amber, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function getMaterialMeta(type: string): { Icon: typeof FileIcon; color: string; bg: string } {
  switch (type) {
    case 'PDF':
      return { Icon: FileText, color: PALETTE.red, bg: 'bg-red-50' };
    case 'VIDEO':
      return { Icon: Video, color: PALETTE.purple, bg: 'bg-purple-50' };
    case 'CSV':
      return { Icon: FileSpreadsheet, color: PALETTE.green, bg: 'bg-green-50' };
    case 'ZIP':
      return { Icon: FileArchive, color: PALETTE.amber, bg: 'bg-amber-50' };
    default:
      return { Icon: FileIcon, color: PALETTE.slate, bg: 'bg-slate-50' };
  }
}

function getDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getTodayLabel(): string {
  const map = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return map[new Date().getDay()];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-200">
      <div className="absolute inset-0 opacity-[0.04]" style={{ background: color }} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-800 leading-none">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
          </div>
          <div className="rounded-xl p-2.5" style={{ background: `${color}18` }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: color }} />
      </CardContent>
    </Card>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-cyan-500 inline-block" />
        {children}
      </h2>
      {action}
    </div>
  );
}

function RadialProgress({ value, color, caption }: { value: number; color: string; caption: string }) {
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.2" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke={color} strokeWidth="3.2"
          strokeDasharray={`${value} ${100 - value}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{value}%</span>
        <span className="text-[11px] text-slate-500">{caption}</span>
      </div>
    </div>
  );
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, coursesRes, assignmentsRes, materialsRes, scheduleRes] = await Promise.all([
        fetch('/api/dashboard/student/overview'),
        fetch('/api/dashboard/student/courses'),
        fetch('/api/dashboard/student/assignments'),
        fetch('/api/dashboard/student/materials'),
        fetch('/api/dashboard/student/schedule'),
      ]);

      const [overviewData, coursesData, assignmentsData, materialsData, scheduleData] = await Promise.all([
        overviewRes.json(),
        coursesRes.json(),
        assignmentsRes.json(),
        materialsRes.json(),
        scheduleRes.json(),
      ]);

      setOverview(overviewData.overview);
      setCourses(coursesData.courses || []);
      setAssignments(assignmentsData.assignments || []);
      setMaterials(materialsData.materials || []);
      setSchedule(scheduleData.schedule || []);
    } catch (err) {
      console.error('[student/page] fetch error:', err);
      setError('Không thể tải dữ liệu học tập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <Loader2 className="absolute -top-1 -right-1 h-5 w-5 animate-spin text-cyan-400" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu học tập...</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Card className="max-w-sm shadow-lg border-0">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-slate-700 font-medium mb-4">{error}</p>
            <Button onClick={fetchData} className="bg-indigo-600 hover:bg-indigo-700">Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const gradeMeta = getGradeMeta(overview?.averageGrade ?? null);
  const totalAssignments = (overview?.upcomingAssignments ?? 0) + (overview?.completedAssignments ?? 0);
  const completionRate = totalAssignments > 0
    ? Math.round(((overview?.completedAssignments ?? 0) / totalAssignments) * 100)
    : 0;
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;

  const assignmentPie = [
    { name: 'Đã nộp', value: assignments.filter((a) => a.status === 'COMPLETED').length, color: PALETTE.green },
    { name: 'Đang làm', value: assignments.filter((a) => a.status === 'IN_PROGRESS').length, color: PALETTE.blue },
    { name: 'Chưa làm', value: assignments.filter((a) => a.status === 'PENDING').length, color: PALETTE.amber },
  ].filter((d) => d.value > 0);

  const gradedCourses = courses
    .filter((c) => c.grade !== null)
    .map((c) => ({ name: c.code, grade: c.grade as number }));

  const todayLabel = getTodayLabel();
  const sortedAssignments = [...assignments].sort((a, b) => {
    if ((a.status === 'COMPLETED') !== (b.status === 'COMPLETED')) {
      return a.status === 'COMPLETED' ? 1 : -1;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="space-y-6">
      {/* ── Module Hero ──────────────────────────────────────────────────────── */}
      <ModuleHero
        moduleId="student"
        title="Góc học tập của tôi"
        subtitle="Theo dõi tiến độ, bài tập, tài liệu và lịch học trong học kỳ"
        icon={GraduationCap}
        stats={[
          { label: 'Môn học', value: overview?.enrolledCourses ?? 0 },
          { label: 'Điểm TB', value: (overview?.averageGrade ?? 0).toFixed(2) },
          { label: 'Hoàn thành', value: `${completionRate}%` },
        ]}
        controls={
          <Button
            variant="outline" size="sm" onClick={fetchData}
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-1.5"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </Button>
        }
      />

      {/* ── KPI Grid ─────────────────────────────────────────────────────────── */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen} label="Môn học đang theo" value={overview.enrolledCourses}
            sub="Học kỳ hiện tại" color={PALETTE.indigo}
          />
          <StatCard
            icon={AlertCircle} label="Bài tập sắp tới" value={overview.upcomingAssignments}
            sub="Cần hoàn thành" color={PALETTE.amber}
          />
          <StatCard
            icon={CheckCircle2} label="Đã hoàn thành" value={overview.completedAssignments}
            sub={`Tỷ lệ ${completionRate}%`} color={PALETTE.green}
          />
          <StatCard
            icon={Award} label="Điểm trung bình" value={overview.averageGrade.toFixed(2)}
            sub={gradeMeta.label} color={gradeMeta.color}
          />
        </div>
      )}

      {/* ── Snapshot học tập ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tiến độ & học lực */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-500" />
              Tiến độ & học lực
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-5">
              <RadialProgress value={avgProgress} color={PALETTE.cyan} caption="tiến độ TB" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-slate-500">Xếp loại học lực</p>
                  <p className="text-lg font-bold" style={{ color: gradeMeta.color }}>{gradeMeta.label}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Điểm TB (thang 10)</span>
                  <span className="font-bold" style={{ color: gradeMeta.color }}>
                    {(overview?.averageGrade ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Số tín chỉ</span>
                  <span className="font-semibold text-slate-700">
                    {courses.reduce((sum, c) => sum + (c.credits || 0), 0)} TC
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trạng thái bài tập */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-amber-500" />
              Trạng thái bài tập
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentPie.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={130}>
                  <PieChart>
                    <Pie
                      data={assignmentPie} cx="50%" cy="50%"
                      innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value"
                    >
                      {assignmentPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {assignmentPie.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        {entry.name}
                      </span>
                      <span className="font-semibold text-slate-700">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                Chưa có bài tập
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lịch hôm nay */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-indigo-500" />
              Lịch học hôm nay · {todayLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = schedule.find((d) => d.day === todayLabel);
              if (!today || today.sessions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
                    <Sparkles className="h-7 w-7 text-slate-300" />
                    Hôm nay không có lịch học
                  </div>
                );
              }
              return (
                <div className="space-y-2.5">
                  {today.sessions.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-indigo-50/60 px-3 py-2">
                      <div className="text-center shrink-0">
                        <Clock className="h-4 w-4 text-indigo-500 mx-auto" />
                        <p className="text-[11px] font-medium text-indigo-700 mt-0.5 whitespace-nowrap">
                          {s.time.split(' - ')[0]}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.courseName}</p>
                        <p className="text-xs text-slate-500 truncate">{s.room} · {s.instructor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Tabs nội dung chính ──────────────────────────────────────────────── */}
      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="courses" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <BookMarked className="h-4 w-4" /> Môn học
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <ClipboardList className="h-4 w-4" /> Bài tập
          </TabsTrigger>
          <TabsTrigger value="materials" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <Layers className="h-4 w-4" /> Tài liệu
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5">
            <CalendarClock className="h-4 w-4" /> Lịch học
          </TabsTrigger>
        </TabsList>

        {/* ── Courses ───────────────────────────────────────────────────────── */}
        <TabsContent value="courses" className="space-y-4">
          {/* Biểu đồ điểm theo môn */}
          {gradedCourses.length > 0 && (
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Điểm tổng kết theo môn</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={gradedCourses} margin={{ top: 5, right: 16, left: -16, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    <Bar dataKey="grade" name="Điểm" radius={[4, 4, 0, 0]}>
                      {gradedCourses.map((c) => (
                        <Cell key={c.name} fill={getGradeMeta(c.grade).color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <SectionTitle>Môn học đang theo học</SectionTitle>
          {courses.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-14 text-slate-400">
                <BookOpen className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm">Chưa có môn học nào trong học kỳ này</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => {
                const cm = getGradeMeta(course.grade);
                const isDone = course.status === 'COMPLETED';
                return (
                  <Card key={course.id} className="border-0 shadow-md hover:shadow-lg transition-all overflow-hidden">
                    <div className="h-1" style={{ background: isDone ? cm.color : PALETTE.indigo }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                              {course.code}
                            </span>
                            <span
                              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${(isDone ? cm.color : PALETTE.indigo)}15`, color: isDone ? cm.color : PALETTE.indigo }}
                            >
                              {isDone ? 'Đã hoàn thành' : 'Đang học'}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-800 leading-tight truncate">{course.name}</h3>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <User className="h-3 w-3" /> {course.instructor} · {course.credits} tín chỉ
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <CalendarClock className="h-3 w-3" /> {course.schedule}
                          </p>
                        </div>
                        {course.grade !== null && (
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold leading-none" style={{ color: cm.color }}>
                              {course.grade.toFixed(1)}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">Điểm</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Tiến độ học tập</span>
                          <span className="font-semibold text-slate-700">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-1.5 bg-slate-100" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Assignments ───────────────────────────────────────────────────── */}
        <TabsContent value="assignments" className="space-y-4">
          <SectionTitle>Bài tập & đồ án</SectionTitle>
          {assignments.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-14 text-slate-400">
                <ClipboardList className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm">Chưa có bài tập nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedAssignments.map((assignment) => {
                const daysLeft = getDaysUntilDue(assignment.dueDate);
                const priority = PRIORITY_META[assignment.priority] ?? PRIORITY_META.LOW;
                const status = STATUS_META[assignment.status] ?? STATUS_META.PENDING;
                const isDone = assignment.status === 'COMPLETED';
                const overdue = !isDone && daysLeft < 0;
                return (
                  <Card
                    key={assignment.id}
                    className={`border-0 shadow-sm hover:shadow-md transition-all overflow-hidden ${overdue ? 'ring-1 ring-red-200' : ''}`}
                  >
                    <div className="h-1" style={{ background: isDone ? PALETTE.green : priority.color }} />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-semibold text-slate-800">{assignment.title}</h3>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priority.bg}`}>
                              {priority.label}
                            </span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.bg}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-slate-500">{assignment.courseName}</p>
                          <p className="text-sm text-slate-600 mt-1.5">{assignment.description}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs">
                            <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-red-600' : 'text-slate-500'}`}>
                              <Clock className="h-3.5 w-3.5" />
                              {isDone
                                ? (assignment.submittedAt
                                    ? `Đã nộp ${new Date(assignment.submittedAt).toLocaleDateString('vi-VN')}`
                                    : 'Đã nộp')
                                : overdue
                                  ? `Quá hạn ${Math.abs(daysLeft)} ngày`
                                  : daysLeft === 0
                                    ? 'Hạn nộp hôm nay'
                                    : `Còn ${daysLeft} ngày`}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <CalendarClock className="h-3.5 w-3.5" />
                              {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}
                            </span>
                            {assignment.grade !== undefined && (
                              <span className="flex items-center gap-1 font-medium" style={{ color: getGradeMeta(assignment.grade).color }}>
                                <Award className="h-3.5 w-3.5" /> Điểm: {assignment.grade.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {isDone ? (
                            <Button size="sm" variant="outline" disabled className="text-green-600 border-green-200">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Đã nộp
                            </Button>
                          ) : (
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                              <Send className="h-4 w-4 mr-1" /> Nộp bài
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Materials ─────────────────────────────────────────────────────── */}
        <TabsContent value="materials" className="space-y-4">
          <SectionTitle>Tài liệu học tập</SectionTitle>
          {materials.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Layers className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm">Chưa có tài liệu nào</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {materials.map((material) => {
                const { Icon, color, bg } = getMaterialMeta(material.type);
                return (
                  <Card key={material.id} className="border-0 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`rounded-xl p-3 shrink-0 ${bg}`}>
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 text-sm leading-tight truncate">{material.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          <span className="font-medium text-slate-600">{material.course}</span>
                          {' · '}{material.size}{' · '}{material.downloads} lượt tải
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 border-slate-200 hover:bg-slate-50">
                        <Download className="h-4 w-4 mr-1" /> Tải
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Schedule ──────────────────────────────────────────────────────── */}
        <TabsContent value="schedule" className="space-y-4">
          <SectionTitle>Thời khóa biểu trong tuần</SectionTitle>
          {schedule.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-14 text-slate-400">
                <CalendarClock className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm">Chưa có lịch học</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {schedule.map((day, idx) => {
                const isToday = day.day === todayLabel;
                return (
                  <Card
                    key={idx}
                    className={`border-0 shadow-md overflow-hidden ${isToday ? 'ring-2 ring-cyan-300' : ''}`}
                  >
                    <div
                      className="px-4 py-2.5 flex items-center justify-between"
                      style={{ background: isToday ? PALETTE.cyan : '#f8fafc' }}
                    >
                      <span className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                        {day.day}
                      </span>
                      <span className={`text-xs ${isToday ? 'text-white/90' : 'text-slate-400'}`}>
                        {isToday ? 'Hôm nay' : `${day.sessions.length} buổi`}
                      </span>
                    </div>
                    <CardContent className="p-3 space-y-2.5">
                      {day.sessions.map((session, sIdx) => (
                        <div key={sIdx} className="rounded-lg border border-slate-100 bg-white p-3">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-cyan-700 mb-1">
                            <Clock className="h-3.5 w-3.5" /> {session.time}
                          </div>
                          <h4 className="font-semibold text-sm text-slate-800 leading-tight">{session.courseName}</h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {session.room}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              <User className="h-3 w-3 shrink-0" /> {session.instructor}
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dynamic RBAC Widgets (giữ nguyên) ────────────────────────────────── */}
      <AutoDashboard
        title="Chức năng được phân quyền"
        description="Widget hiển thị tự động theo chức năng được gán trong ma trận phân quyền RBAC"
      />
    </div>
  );
}
