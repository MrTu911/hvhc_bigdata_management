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
} from '@/lib/rbac/function-codes';

// ============================================================================
// TYPES
// ============================================================================

export type WidgetType = 'kpi' | 'pie' | 'bar' | 'line' | 'table' | 'list' | 'radar' | 'area';
export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2' | '3x1' | '3x2' | '4x1' | '4x2';

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  type: WidgetType;
  size: WidgetSize;
  apiEndpoint: string;
  requiredFunction: string;      // Function code cần để hiển thị widget
  module: string;                // Module CSDL
  color: string;                 // Gradient color
  dataKey?: string;              // Key trong response data
  chartConfig?: {
    xKey?: string;
    yKey?: string;
    nameKey?: string;
    valueKey?: string;
    colors?: string[];
  };
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
};
