/**
 * DASHBOARD WIDGET REGISTRY
 * 
 * Mapping CSDL → Widgets có sẵn
 * Mỗi widget định nghĩa: loại biểu đồ, API endpoint, cách render
 */

import {
  Users,
  UserCheck,
  Shield,
  Award,
  Heart,
  GraduationCap,
  BookOpen,
  FlaskConical,
  TrendingUp,
  PieChart,
  BarChart3,
  Activity,
  Calendar,
  FileText,
  Building2,
  Star,
  LucideIcon,
} from 'lucide-react';

import {
  PERSONNEL,
  PARTY,
  INSURANCE,
  POLICY,
  AWARDS,
  STUDENT,
  FACULTY,
  RESEARCH,
  EDUCATION,
  WORKFLOW,
  SCIENCE,
} from '@/lib/rbac/function-codes';

// ============================================================================
// TYPES
// ============================================================================

export type WidgetType = 'kpi' | 'pie' | 'bar' | 'line' | 'table' | 'list' | 'radar' | 'area';
export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2' | '3x1' | '3x2' | '4x1' | '4x2';

export interface WidgetRefreshPolicy {
  /** Cache layer: 1=60s fast KPI, 2=5min chart, 3=30min complex */
  layer: 1 | 2 | 3;
  ttlSeconds: number;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  type: WidgetType;
  size: WidgetSize;
  apiEndpoint: string;
  requiredFunction: string;      // Function code cần để hiển thị widget
  module: string;                // Module CSDL nguồn
  color: string;                 // Gradient color
  dataKey?: string;              // Key trong response data
  chartConfig?: {
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
  };
  // ── M11 metadata ──────────────────────────────────────────────────────────
  /** Roles mặc định được thêm widget này vào template */
  defaultRoles?: string[];
  /** Là widget cảnh báo – hiển thị badge đỏ khi có giá trị */
  isAlert?: boolean;
  /** Route để drill-down chi tiết khi click widget */
  drilldownRoute?: string;
  /** Chính sách cache. Mặc định layer 2 (5 phút) nếu không khai báo */
  refreshPolicy?: WidgetRefreshPolicy;
}

export interface WidgetData {
  loading: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: {
    widgetId: string;
    x: number;      // Grid column (0-11)
    y: number;      // Grid row
    w: number;      // Width in columns
    h: number;      // Height in rows
  }[];
  createdBy?: string;
  createdAt?: Date;
}

// ============================================================================
// WIDGET DEFINITIONS BY MODULE
// ============================================================================

// ---------- PERSONNEL (CSDL Cán bộ) ----------
export const PERSONNEL_WIDGETS: WidgetConfig[] = [
  {
    id: 'personnel-total',
    name: 'Tổng số cán bộ',
    description: 'Tổng số cán bộ trong hệ thống',
    icon: Users,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/personnel',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-blue-500 to-blue-600',
    dataKey: 'total',
  },
  {
    id: 'personnel-by-rank',
    name: 'Phân bố theo cấp bậc',
    description: 'Biểu đồ tròn phân bố cán bộ theo cấp bậc',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/personnel',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-blue-500 to-indigo-600',
    dataKey: 'byRank',
    chartConfig: { nameKey: 'rank', valueKey: 'count', colors: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'] },
  },
  {
    id: 'personnel-by-unit',
    name: 'Phân bố theo đơn vị',
    description: 'Biểu đồ cột phân bố cán bộ theo đơn vị',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/personnel',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-cyan-500 to-blue-600',
    dataKey: 'byUnit',
    chartConfig: { xKey: 'unit', yKey: 'count' },
  },
  {
    id: 'personnel-by-gender',
    name: 'Tỷ lệ giới tính',
    description: 'Phân bố cán bộ theo giới tính',
    icon: Users,
    type: 'pie',
    size: '1x2',
    apiEndpoint: '/api/stats/personnel',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-pink-500 to-rose-600',
    dataKey: 'byGender',
    chartConfig: { nameKey: 'gender', valueKey: 'count', colors: ['#3b82f6', '#ec4899'] },
  },
  {
    id: 'personnel-recent',
    name: 'Cán bộ mới nhất',
    description: 'Danh sách 10 cán bộ mới nhất',
    icon: UserCheck,
    type: 'list',
    size: '2x2',
    apiEndpoint: '/api/stats/personnel',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-emerald-500 to-green-600',
    dataKey: 'recent',
  },
];

// ---------- PARTY (CSDL Đảng viên) ----------
export const PARTY_WIDGETS: WidgetConfig[] = [
  {
    id: 'party-total',
    name: 'Tổng đảng viên',
    description: 'Tổng số đảng viên',
    icon: Shield,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/party',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-red-500 to-red-600',
    dataKey: 'total',
  },
  {
    id: 'party-official',
    name: 'Đảng viên chính thức',
    description: 'Số đảng viên chính thức',
    icon: Shield,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/party',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-red-600 to-rose-700',
    dataKey: 'official',
  },
  {
    id: 'party-probationary',
    name: 'Đảng viên dự bị',
    description: 'Số đảng viên dự bị',
    icon: Shield,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/party',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-orange-500 to-amber-600',
    dataKey: 'probationary',
  },
  {
    id: 'party-by-unit',
    name: 'Đảng viên theo đơn vị',
    description: 'Phân bố đảng viên theo chi bộ/đơn vị',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/party',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-red-500 to-orange-600',
    dataKey: 'byUnit',
    chartConfig: { xKey: 'unit', yKey: 'count' },
  },
  {
    id: 'party-growth',
    name: 'Phát triển đảng viên',
    description: 'Xu hướng phát triển đảng viên theo năm',
    icon: TrendingUp,
    type: 'line',
    size: '2x2',
    apiEndpoint: '/api/stats/party',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-red-500 to-pink-600',
    dataKey: 'growth',
    chartConfig: { xKey: 'year', yKey: 'count' },
  },
];

// ---------- INSURANCE (CSDL Bảo hiểm) ----------
export const INSURANCE_WIDGETS: WidgetConfig[] = [
  {
    id: 'insurance-total',
    name: 'Tổng người tham gia BHXH',
    description: 'Số người tham gia bảo hiểm xã hội',
    icon: Heart,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/insurance',
    requiredFunction: INSURANCE.VIEW,
    module: 'INSURANCE',
    color: 'from-green-500 to-emerald-600',
    dataKey: 'totalParticipants',
  },
  {
    id: 'insurance-claims',
    name: 'Tổng chi trả',
    description: 'Tổng số tiền đã chi trả',
    icon: Activity,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/insurance',
    requiredFunction: INSURANCE.VIEW,
    module: 'INSURANCE',
    color: 'from-teal-500 to-green-600',
    dataKey: 'totalClaims',
  },
  {
    id: 'insurance-by-type',
    name: 'Phân bố theo loại BH',
    description: 'Phân bố tham gia theo loại bảo hiểm',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/insurance',
    requiredFunction: INSURANCE.VIEW,
    module: 'INSURANCE',
    color: 'from-green-500 to-teal-600',
    dataKey: 'byType',
    chartConfig: { nameKey: 'type', valueKey: 'count', colors: ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'] },
  },
  {
    id: 'insurance-claims-trend',
    name: 'Xu hướng chi trả',
    description: 'Biểu đồ chi trả bảo hiểm theo tháng',
    icon: TrendingUp,
    type: 'area',
    size: '3x2',
    apiEndpoint: '/api/stats/insurance',
    requiredFunction: INSURANCE.VIEW,
    module: 'INSURANCE',
    color: 'from-emerald-500 to-green-600',
    dataKey: 'claimsTrend',
    chartConfig: { xKey: 'month', yKey: 'amount' },
  },
];

// ---------- POLICY (CSDL Chế độ chính sách) ----------
export const POLICY_WIDGETS: WidgetConfig[] = [
  {
    id: 'policy-total',
    name: 'Tổng hồ sơ chế độ',
    description: 'Tổng số hồ sơ chế độ chính sách',
    icon: FileText,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/policy',
    requiredFunction: POLICY.VIEW,
    module: 'POLICY',
    color: 'from-purple-500 to-violet-600',
    dataKey: 'total',
  },
  {
    id: 'policy-pending',
    name: 'Chờ xử lý',
    description: 'Số hồ sơ đang chờ xử lý',
    icon: Calendar,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/policy',
    requiredFunction: POLICY.VIEW,
    module: 'POLICY',
    color: 'from-amber-500 to-yellow-600',
    dataKey: 'pending',
  },
  {
    id: 'policy-by-type',
    name: 'Hồ sơ theo loại',
    description: 'Phân bố hồ sơ theo loại chế độ',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/policy',
    requiredFunction: POLICY.VIEW,
    module: 'POLICY',
    color: 'from-purple-500 to-indigo-600',
    dataKey: 'byType',
    chartConfig: { nameKey: 'type', valueKey: 'count', colors: ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899'] },
  },
  {
    id: 'policy-by-status',
    name: 'Trạng thái xử lý',
    description: 'Phân bố hồ sơ theo trạng thái',
    icon: BarChart3,
    type: 'bar',
    size: '2x1',
    apiEndpoint: '/api/stats/policy',
    requiredFunction: POLICY.VIEW,
    module: 'POLICY',
    color: 'from-violet-500 to-purple-600',
    dataKey: 'byStatus',
    chartConfig: { xKey: 'status', yKey: 'count' },
  },
];

// ---------- AWARDS (CSDL Khen thưởng) ----------
export const AWARDS_WIDGETS: WidgetConfig[] = [
  {
    id: 'awards-total',
    name: 'Tổng danh hiệu',
    description: 'Tổng số danh hiệu đã trao',
    icon: Award,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/awards',
    requiredFunction: AWARDS.VIEW,
    module: 'AWARDS',
    color: 'from-yellow-500 to-amber-600',
    dataKey: 'total',
  },
  {
    id: 'awards-this-year',
    name: 'Khen thưởng năm nay',
    description: 'Số lượt khen thưởng trong năm',
    icon: Star,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/awards',
    requiredFunction: AWARDS.VIEW,
    module: 'AWARDS',
    color: 'from-orange-500 to-red-600',
    dataKey: 'thisYear',
  },
  {
    id: 'awards-by-type',
    name: 'Theo loại danh hiệu',
    description: 'Phân bố khen thưởng theo loại',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/awards',
    requiredFunction: AWARDS.VIEW,
    module: 'AWARDS',
    color: 'from-yellow-500 to-orange-600',
    dataKey: 'byType',
    chartConfig: { nameKey: 'type', valueKey: 'count', colors: ['#f59e0b', '#f97316', '#ef4444', '#dc2626'] },
  },
  {
    id: 'awards-by-unit',
    name: 'Theo đơn vị',
    description: 'Khen thưởng theo đơn vị',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/awards',
    requiredFunction: AWARDS.VIEW,
    module: 'AWARDS',
    color: 'from-amber-500 to-yellow-600',
    dataKey: 'byUnit',
    chartConfig: { xKey: 'unit', yKey: 'count' },
  },
];

// ---------- STUDENT (CSDL Học viên) ----------
export const STUDENT_WIDGETS: WidgetConfig[] = [
  {
    id: 'student-total',
    name: 'Tổng học viên',
    description: 'Tổng số học viên trong hệ thống',
    icon: GraduationCap,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/student',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-green-500 to-emerald-600',
    dataKey: 'total',
  },
  {
    id: 'student-avg-gpa',
    name: 'GPA trung bình',
    description: 'Điểm trung bình toàn hệ thống',
    icon: TrendingUp,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/student',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-blue-500 to-cyan-600',
    dataKey: 'avgGpa',
  },
  {
    id: 'student-by-class',
    name: 'Học viên theo lớp',
    description: 'Phân bố học viên theo lớp',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/student',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-green-500 to-teal-600',
    dataKey: 'byClass',
    chartConfig: { xKey: 'class', yKey: 'count' },
  },
  {
    id: 'student-performance',
    name: 'Phân loại học lực',
    description: 'Tỷ lệ xuất sắc/giỏi/khá/yếu',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/student',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-emerald-500 to-green-600',
    dataKey: 'performance',
    chartConfig: { nameKey: 'level', valueKey: 'count', colors: ['#10b981', '#22c55e', '#84cc16', '#eab308', '#f97316'] },
  },
  {
    id: 'student-gpa-trend',
    name: 'Xu hướng GPA',
    description: 'GPA trung bình theo học kỳ',
    icon: TrendingUp,
    type: 'line',
    size: '3x2',
    apiEndpoint: '/api/stats/student',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-cyan-500 to-blue-600',
    dataKey: 'gpaTrend',
    chartConfig: { xKey: 'semester', yKey: 'avgGpa' },
  },
];

// ---------- FACULTY (CSDL Giảng viên) ----------
export const FACULTY_WIDGETS: WidgetConfig[] = [
  {
    id: 'faculty-total',
    name: 'Tổng giảng viên',
    description: 'Tổng số giảng viên',
    icon: BookOpen,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/faculty',
    requiredFunction: FACULTY.VIEW,
    module: 'FACULTY',
    color: 'from-purple-500 to-violet-600',
    dataKey: 'total',
  },
  {
    id: 'faculty-by-degree',
    name: 'Theo học vị',
    description: 'Phân bố theo học vị (TS/ThS/CN)',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/faculty',
    requiredFunction: FACULTY.VIEW,
    module: 'FACULTY',
    color: 'from-violet-500 to-purple-600',
    dataKey: 'byDegree',
    chartConfig: { nameKey: 'degree', valueKey: 'count', colors: ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899'] },
  },
  {
    id: 'faculty-by-title',
    name: 'Theo học hàm',
    description: 'Phân bố theo học hàm (GS/PGS)',
    icon: PieChart,
    type: 'pie',
    size: '1x2',
    apiEndpoint: '/api/stats/faculty',
    requiredFunction: FACULTY.VIEW,
    module: 'FACULTY',
    color: 'from-indigo-500 to-violet-600',
    dataKey: 'byTitle',
    chartConfig: { nameKey: 'title', valueKey: 'count', colors: ['#6366f1', '#8b5cf6', '#a855f7'] },
  },
  {
    id: 'faculty-by-unit',
    name: 'Theo khoa/bộ môn',
    description: 'Phân bố giảng viên theo đơn vị',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/faculty',
    requiredFunction: FACULTY.VIEW,
    module: 'FACULTY',
    color: 'from-purple-500 to-indigo-600',
    dataKey: 'byUnit',
    chartConfig: { xKey: 'unit', yKey: 'count' },
  },
  {
    id: 'faculty-eis-radar',
    name: 'EIS Radar Chart',
    description: 'Phân tích 6 chiều năng lực giảng viên',
    icon: Activity,
    type: 'radar',
    size: '2x2',
    apiEndpoint: '/api/stats/faculty',
    requiredFunction: FACULTY.VIEW,
    module: 'FACULTY',
    color: 'from-fuchsia-500 to-purple-600',
    dataKey: 'eisRadar',
  },
];

// ---------- RESEARCH (CSDL Nghiên cứu KH) ----------
export const RESEARCH_WIDGETS: WidgetConfig[] = [
  {
    id: 'research-total',
    name: 'Tổng đề tài',
    description: 'Tổng số đề tài nghiên cứu',
    icon: FlaskConical,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/research',
    requiredFunction: RESEARCH.VIEW,
    module: 'RESEARCH',
    color: 'from-cyan-500 to-blue-600',
    dataKey: 'total',
  },
  {
    id: 'research-publications',
    name: 'Công bố khoa học',
    description: 'Tổng số bài báo công bố',
    icon: FileText,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/research',
    requiredFunction: RESEARCH.VIEW,
    module: 'RESEARCH',
    color: 'from-teal-500 to-cyan-600',
    dataKey: 'publications',
  },
  {
    id: 'research-by-status',
    name: 'Theo trạng thái',
    description: 'Đề tài theo trạng thái thực hiện',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/stats/research',
    requiredFunction: RESEARCH.VIEW,
    module: 'RESEARCH',
    color: 'from-blue-500 to-cyan-600',
    dataKey: 'byStatus',
    chartConfig: { nameKey: 'status', valueKey: 'count', colors: ['#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'] },
  },
  {
    id: 'research-by-level',
    name: 'Theo cấp đề tài',
    description: 'Phân bố theo cấp (Bộ/Cơ sở/Khoa)',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/research',
    requiredFunction: RESEARCH.VIEW,
    module: 'RESEARCH',
    color: 'from-cyan-500 to-teal-600',
    dataKey: 'byLevel',
    chartConfig: { xKey: 'level', yKey: 'count' },
  },
  {
    id: 'research-trend',
    name: 'Xu hướng NCKH',
    description: 'Số đề tài/công bố theo năm',
    icon: TrendingUp,
    type: 'area',
    size: '3x2',
    apiEndpoint: '/api/stats/research',
    requiredFunction: RESEARCH.VIEW,
    module: 'RESEARCH',
    color: 'from-blue-500 to-indigo-600',
    dataKey: 'trend',
    chartConfig: { xKey: 'year', yKey: 'count' },
  },
];

// ---------- EDUCATION (CSDL Đào tạo) ----------
export const EDUCATION_WIDGETS: WidgetConfig[] = [
  {
    id: 'education-courses',
    name: 'Tổng môn học',
    description: 'Tổng số môn học trong chương trình',
    icon: BookOpen,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/education',
    requiredFunction: EDUCATION.VIEW_PROGRAM,
    module: 'EDUCATION',
    color: 'from-indigo-500 to-blue-600',
    dataKey: 'totalCourses',
  },
  {
    id: 'education-credits',
    name: 'Tổng tín chỉ',
    description: 'Tổng số tín chỉ chương trình',
    icon: Activity,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/stats/education',
    requiredFunction: EDUCATION.VIEW_PROGRAM,
    module: 'EDUCATION',
    color: 'from-blue-500 to-violet-600',
    dataKey: 'totalCredits',
  },
  {
    id: 'education-schedule',
    name: 'Lịch giảng dạy',
    description: 'Lịch giảng dạy tuần này',
    icon: Calendar,
    type: 'table',
    size: '3x2',
    apiEndpoint: '/api/stats/education',
    requiredFunction: EDUCATION.VIEW_TERM,
    module: 'EDUCATION',
    color: 'from-violet-500 to-indigo-600',
    dataKey: 'schedule',
  },
  {
    id: 'education-by-semester',
    name: 'Môn học theo kỳ',
    description: 'Phân bố môn học theo học kỳ',
    icon: BarChart3,
    type: 'bar',
    size: '2x2',
    apiEndpoint: '/api/stats/education',
    requiredFunction: EDUCATION.VIEW_PROGRAM,
    module: 'EDUCATION',
    color: 'from-indigo-500 to-purple-600',
    dataKey: 'bySemester',
    chartConfig: { xKey: 'semester', yKey: 'count' },
  },
];

// ---------- SCIENCE (CSDL Khoa học Quản lý – M21/M22) ----------
export const SCIENCE_WIDGETS: WidgetConfig[] = [
  {
    id: 'science-projects-active',
    name: 'Đề tài đang thực hiện',
    description: 'Số đề tài NCKH đang ở trạng thái IN_PROGRESS',
    icon: FlaskConical,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/science/dashboard',
    requiredFunction: SCIENCE.DASHBOARD_VIEW,
    module: 'SCIENCE',
    color: 'from-violet-500 to-purple-600',
    dataKey: 'kpi.approvedProjects',
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/science/projects',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'science-publications-total',
    name: 'Công bố khoa học',
    description: 'Tổng số bài báo/công trình khoa học',
    icon: BookOpen,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/science/dashboard',
    requiredFunction: SCIENCE.DASHBOARD_VIEW,
    module: 'SCIENCE',
    color: 'from-blue-500 to-indigo-600',
    dataKey: 'kpi.totalPublications',
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/science/works',
    refreshPolicy: { layer: 2, ttlSeconds: 300 },
  },
  {
    id: 'science-budget-utilization',
    name: 'Kinh phí NCKH',
    description: 'Tỷ lệ sử dụng kinh phí nghiên cứu',
    icon: TrendingUp,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/science/dashboard',
    requiredFunction: SCIENCE.BUDGET_VIEW_FINANCE,
    module: 'SCIENCE',
    color: 'from-amber-500 to-orange-600',
    dataKey: 'kpi.budgetUtilizationPct',
    defaultRoles: ['EXECUTIVE'],
    drilldownRoute: '/dashboard/science/finance',
    refreshPolicy: { layer: 2, ttlSeconds: 300 },
  },
  {
    id: 'science-projects-by-status',
    name: 'Đề tài theo trạng thái',
    description: 'Phân bố đề tài NCKH theo trạng thái thực hiện',
    icon: PieChart,
    type: 'pie',
    size: '2x2',
    apiEndpoint: '/api/science/dashboard',
    requiredFunction: SCIENCE.DASHBOARD_VIEW,
    module: 'SCIENCE',
    color: 'from-violet-500 to-purple-600',
    dataKey: 'distribution.byStatus',
    chartConfig: { nameKey: 'status', valueKey: '_count.id', colors: ['#8b5cf6', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#94a3b8'] },
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/science/projects',
    refreshPolicy: { layer: 2, ttlSeconds: 300 },
  },
  {
    id: 'science-extensions-pending',
    name: 'Gia hạn chờ duyệt',
    description: 'Số yêu cầu gia hạn đề tài đang chờ phê duyệt',
    icon: Activity,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/science/projects/alerts',
    requiredFunction: SCIENCE.PROJECT_APPROVE_DEPT,
    module: 'SCIENCE',
    color: 'from-orange-500 to-amber-600',
    dataKey: 'extensionsPending',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/science/activities/extensions',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'science-proposals-pending',
    name: 'Đề xuất chờ duyệt',
    description: 'Số đề xuất NCKH đang chờ thẩm định',
    icon: FileText,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/science/proposals',
    requiredFunction: SCIENCE.PROJECT_APPROVE_DEPT,
    module: 'SCIENCE',
    color: 'from-teal-500 to-cyan-600',
    dataKey: 'meta.pendingCount',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/science/activities/proposals',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
];

// ---------- ALERT WIDGETS (M11 cảnh báo tổng hợp) ----------
// Các widget này không phải nguồn cảnh báo gốc – chỉ tổng hợp từ module nguồn.
export const ALERT_WIDGETS: WidgetConfig[] = [
  {
    id: 'PERSONNEL_RETIRING',
    name: 'Cán bộ sắp nghỉ hưu',
    description: 'Danh sách cán bộ dự kiến nghỉ hưu trong 3 tháng tới',
    icon: Users,
    type: 'list',
    size: '2x2',
    apiEndpoint: '/api/dashboard/widgets/PERSONNEL_RETIRING/data',
    requiredFunction: PERSONNEL.VIEW,
    module: 'PERSONNEL',
    color: 'from-orange-500 to-red-500',
    dataKey: 'items',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/personnel',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'ACADEMIC_WARNINGS',
    name: 'Cảnh báo học vụ',
    description: 'Học viên đang trong tình trạng cảnh báo học vụ',
    icon: GraduationCap,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/dashboard/widgets/ACADEMIC_WARNINGS/data',
    requiredFunction: STUDENT.VIEW,
    module: 'STUDENT',
    color: 'from-yellow-500 to-orange-500',
    dataKey: 'count',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT', 'EDUCATION'],
    drilldownRoute: '/dashboard/education/warnings',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'PARTY_FEE_DEBT',
    name: 'Nợ đảng phí',
    description: 'Đảng viên nợ đảng phí quá hạn',
    icon: Shield,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/dashboard/widgets/PARTY_FEE_DEBT/data',
    requiredFunction: PARTY.VIEW,
    module: 'PARTY',
    color: 'from-red-500 to-rose-600',
    dataKey: 'count',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'PARTY'],
    drilldownRoute: '/dashboard/party',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'BHYT_EXPIRING',
    name: 'BHYT sắp hết hạn',
    description: 'Hồ sơ BHYT hết hạn trong 30 ngày tới',
    icon: Heart,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/dashboard/widgets/BHYT_EXPIRING/data',
    requiredFunction: INSURANCE.VIEW,
    module: 'INSURANCE',
    color: 'from-pink-500 to-rose-500',
    dataKey: 'count',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/insurance',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'SLA_OVERDUE',
    name: 'Workflow quá hạn SLA',
    description: 'Quy trình phê duyệt đang vượt quá thời hạn xử lý',
    icon: Activity,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/dashboard/widgets/SLA_OVERDUE/data',
    requiredFunction: WORKFLOW.VIEW,
    module: 'WORKFLOW',
    color: 'from-red-600 to-rose-700',
    dataKey: 'count',
    isAlert: true,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT'],
    drilldownRoute: '/dashboard/workflow',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
  {
    id: 'WORKFLOW_PENDING',
    name: 'Chờ phê duyệt',
    description: 'Số lượng quy trình đang chờ phê duyệt của bạn',
    icon: FileText,
    type: 'kpi',
    size: '1x1',
    apiEndpoint: '/api/dashboard/widgets/WORKFLOW_PENDING/data',
    requiredFunction: WORKFLOW.VIEW,
    module: 'WORKFLOW',
    color: 'from-amber-500 to-yellow-600',
    dataKey: 'count',
    isAlert: false,
    defaultRoles: ['EXECUTIVE', 'DEPARTMENT', 'EDUCATION', 'PARTY', 'FACULTY'],
    drilldownRoute: '/dashboard/workflow',
    refreshPolicy: { layer: 1, ttlSeconds: 60 },
  },
];

// ============================================================================
// WIDGET REGISTRY - Combined
// ============================================================================

export const WIDGET_REGISTRY: WidgetConfig[] = [
  ...PERSONNEL_WIDGETS,
  ...PARTY_WIDGETS,
  ...INSURANCE_WIDGETS,
  ...POLICY_WIDGETS,
  ...AWARDS_WIDGETS,
  ...STUDENT_WIDGETS,
  ...FACULTY_WIDGETS,
  ...RESEARCH_WIDGETS,
  ...EDUCATION_WIDGETS,
  ...SCIENCE_WIDGETS,
  ...ALERT_WIDGETS,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Lấy widgets theo module
 */
export function getWidgetsByModule(module: string): WidgetConfig[] {
  return WIDGET_REGISTRY.filter(w => w.module === module);
}

/**
 * Lấy widgets mà user có quyền xem
 */
export function getAvailableWidgets(userFunctions: Set<string> | string[]): WidgetConfig[] {
  const funcSet = userFunctions instanceof Set ? userFunctions : new Set(userFunctions);
  return WIDGET_REGISTRY.filter(w => funcSet.has(w.requiredFunction));
}

/**
 * Lấy widget theo ID
 */
export function getWidgetById(widgetId: string): WidgetConfig | undefined {
  return WIDGET_REGISTRY.find(w => w.id === widgetId);
}

/**
 * Lấy danh sách modules có widgets
 */
export function getAvailableModules(userFunctions: Set<string> | string[]): string[] {
  const available = getAvailableWidgets(userFunctions);
  return [...new Set(available.map(w => w.module))];
}

/**
 * Tạo default layout cho user dựa trên quyền
 */
export function generateDefaultLayout(userFunctions: Set<string> | string[]): DashboardLayout {
  const available = getAvailableWidgets(userFunctions);
  const kpiWidgets = available.filter(w => w.type === 'kpi').slice(0, 4);
  const chartWidgets = available.filter(w => w.type !== 'kpi' && w.type !== 'list').slice(0, 4);
  
  const widgets: DashboardLayout['widgets'] = [];
  let col = 0;
  let row = 0;
  
  // Row 1: KPIs (4 columns each)
  kpiWidgets.forEach((w, i) => {
    widgets.push({ widgetId: w.id, x: i * 3, y: 0, w: 3, h: 1 });
  });
  
  // Row 2+: Charts (6 columns each, 2 per row)
  row = 1;
  col = 0;
  chartWidgets.forEach((w) => {
    widgets.push({ widgetId: w.id, x: col * 6, y: row, w: 6, h: 2 });
    col++;
    if (col >= 2) {
      col = 0;
      row += 2;
    }
  });
  
  return {
    id: 'default',
    name: 'Dashboard mặc định',
    description: 'Layout tự động theo quyền',
    widgets,
  };
}

/** Lấy widgets mặc định cho một role key (dùng khi khởi tạo template) */
export function getWidgetsByRole(roleKey: string): WidgetConfig[] {
  return WIDGET_REGISTRY.filter(w => w.defaultRoles?.includes(roleKey));
}

/** Lấy alert widgets (isAlert=true) mà user có quyền */
export function getAlertWidgets(userFunctions: Set<string> | string[]): WidgetConfig[] {
  const funcSet = userFunctions instanceof Set ? userFunctions : new Set(userFunctions);
  return WIDGET_REGISTRY.filter(w => w.isAlert && funcSet.has(w.requiredFunction));
}

/** Default TTL theo layer */
export const WIDGET_LAYER_TTL: Record<1 | 2 | 3, number> = {
  1: 60,    // Fast KPI
  2: 300,   // Aggregate charts (5 min)
  3: 1800,  // Complex reports (30 min)
};

/** Trả về TTL của widget, fallback về layer 2 nếu không khai báo */
export function getWidgetTtl(widget: WidgetConfig): number {
  return widget.refreshPolicy?.ttlSeconds ?? WIDGET_LAYER_TTL[2];
}

// Module info for display
export const MODULE_INFO: Record<string, { name: string; color: string; icon: LucideIcon }> = {
  PERSONNEL: { name: 'CSDL Cán bộ', color: 'from-blue-500 to-indigo-600', icon: Users },
  PARTY: { name: 'CSDL Đảng viên', color: 'from-red-500 to-rose-600', icon: Shield },
  INSURANCE: { name: 'CSDL Bảo hiểm', color: 'from-green-500 to-emerald-600', icon: Heart },
  POLICY: { name: 'CSDL Chế độ CS', color: 'from-purple-500 to-violet-600', icon: FileText },
  AWARDS: { name: 'CSDL Khen thưởng', color: 'from-yellow-500 to-amber-600', icon: Award },
  STUDENT: { name: 'CSDL Học viên', color: 'from-green-500 to-teal-600', icon: GraduationCap },
  FACULTY: { name: 'CSDL Giảng viên', color: 'from-purple-500 to-violet-600', icon: BookOpen },
  RESEARCH: { name: 'CSDL Nghiên cứu KH', color: 'from-cyan-500 to-blue-600', icon: FlaskConical },
  EDUCATION: { name: 'CSDL Đào tạo', color: 'from-indigo-500 to-purple-600', icon: BookOpen },
  SCIENCE: { name: 'CSDL Khoa học Quản lý', color: 'from-violet-500 to-purple-600', icon: FlaskConical },
};
