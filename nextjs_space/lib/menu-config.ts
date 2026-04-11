/**
 * MENU CONFIG - Cấu hình Menu tập trung
 *
 * NGUYÊN TẮC:
 * 1. Import function codes từ @/lib/rbac/function-codes.ts (SINGLE SOURCE OF TRUTH)
 * 2. Mỗi menu item phải có `functions` array
 * 3. Sidebar sẽ dùng filterMenu để lọc theo permissions
 * 4. Không dùng string literal cho function codes
 *
 * CẤU TRÚC NHÓM CHỨC NĂNG (14 nhóm):
 *  1. Tổng quan
 *  2. Hồ sơ cá nhân
 *  3. CSDL Nhân sự
 *  4. CSDL Chính trị (Đảng viên)
 *  5. CSDL Chính sách
 *  6. CSDL Bảo hiểm Xã hội
 *  7. Thi đua Khen thưởng
 *  8. Giáo dục & Đào tạo
 *  9. Nghiên cứu Khoa học
 * 10. Mẫu biểu & Xuất dữ liệu (M18/M19)
 * 11. AI & Phân tích
 * 12. Hạ tầng & Dữ liệu
 * 13. Quản trị Hệ thống
 * 14. Cài đặt cá nhân
 */

import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Contact,
  UserPlus,
  Star,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Brain,
  FileSpreadsheet,
  Database,
  Upload,
  Search,
  Folder,
  FileText,
  Cpu,
  Key,
  Building2,
  ScrollText,
  Activity,
  CheckCircle,
  Settings,
  Bell,
  UserCog,
  Briefcase,
  Link2,
  TrendingUp,
  Heart,
  Award,
  Trophy,
  Hospital,
  ClipboardList,
  Calendar,
  LucideIcon,
  BookMarked,
  LibraryBig,
  Layers,
  Calculator,
  CalendarCheck,
  CalendarDays,
  CalendarSearch,
  ClipboardCheck,
  DoorOpen,
  HelpCircle,
  FolderOpen,
  TestTube,
  Workflow,
  History,
  LineChart,
  UserSearch,
  FileUp,
  ScanText,
  Network,
  // New icons for missing features
  Archive,
  Download,
  Timer,
  AlertTriangle,
  PieChart,
  Scale,
  GitMerge,
  Hourglass,
  Zap,
  BadgeCheck,
  Sigma,
  UserX,
  Globe,
  HardDrive,
  Coins,
  FileCheck2,
  Gift,
  FolderKanban,
  BookUser,
  CalendarRange,
  Package,
  ShieldBan,
  Target,
  ShieldCheck,
  Swords,
} from 'lucide-react';

import {
  PERSONNEL,
  TRAINING,
  EDUCATION,
  RESEARCH,
  PARTY,
  POLICY,
  INSURANCE,
  AWARDS,
  STUDENT,
  FACULTY,
  DATA,
  SYSTEM,
  DASHBOARD,
  ML,
  AI,
  WORKFLOW,
  DIGITAL_DOCS,
  TEMPLATES,
  EXAM,
  QUESTION_BANK,
  LEARNING_MATERIAL,
  LAB,
  MONITORING,
  AUDIT,
  SECURITY,
  GOVERNANCE,
  ETL,
  DEPARTMENT,
  SCIENCE,
} from '@/lib/rbac/function-codes';

export interface MenuItem {
  name: string;           // i18n key
  href?: string;
  icon: LucideIcon;
  gradient?: string;
  badge?: string;
  functions: string[];    // Required function codes (ANY match = show)
  children?: MenuItem[];
}

export interface MenuGroup {
  title: string;          // i18n key
  items: MenuItem[];
}

// ============================================================================
// MENU CONFIGURATION - Single Source of Truth
// 14 nhóm chức năng theo luồng nghiệp vụ
// ============================================================================
export const MENU_CONFIG: MenuGroup[] = [

  // ========== 1. TỔNG QUAN ==========
  {
    title: 'nav.overview',
    items: [
      {
        name: 'nav.mainDashboard',
        href: '/dashboard',
        icon: BarChart3,
        gradient: 'from-blue-500 to-blue-600',
        badge: '📊',
        functions: [DASHBOARD.VIEW],
      },
      {
        name: 'nav.commandDashboard',
        href: '/dashboard/command',
        icon: Shield,
        gradient: 'from-red-600 via-yellow-600 to-green-600',
        badge: '⭐',
        functions: [DASHBOARD.VIEW_COMMAND],
      },
      {
        name: 'nav.autoDashboard',
        href: '/dashboard/auto',
        icon: Activity,
        gradient: 'from-purple-500 to-violet-600',
        badge: '✨',
        functions: [DASHBOARD.VIEW],
      },
      {
        name: 'nav.myDashboard',
        href: '/dashboard/my-dashboard',
        icon: Cpu,
        gradient: 'from-pink-500 to-rose-600',
        badge: '🎨',
        functions: [DASHBOARD.VIEW],
      },
      {
        name: 'nav.alerts',
        href: '/dashboard/alerts',
        icon: AlertTriangle,
        gradient: 'from-orange-500 to-red-600',
        badge: '🔔',
        functions: [MONITORING.VIEW_ALERTS],
      },
      {
        name: 'nav.realtimeMonitor',
        href: '/dashboard/monitoring/realtime',
        icon: Activity,
        gradient: 'from-green-500 to-emerald-600',
        functions: [SYSTEM.VIEW_SYSTEM_HEALTH],
      },
    ],
  },

  // ========== 2. HỒ SƠ CÁ NHÂN ==========
  {
    title: 'nav.personalProfile',
    items: [
      {
        name: 'nav.myProfile',
        href: '/dashboard/profile',
        icon: Users,
        gradient: 'from-cyan-500 to-cyan-600',
        badge: '📝',
        functions: [], // Luôn hiển thị
      },
      {
        name: 'nav.scientificCV',
        href: '/dashboard/profile/scientific-cv',
        icon: BookUser,
        gradient: 'from-violet-500 to-purple-600',
        badge: '🎓',
        functions: [RESEARCH.VIEW, FACULTY.VIEW],
      },
      {
        name: 'nav.notifications',
        href: '/dashboard/notifications/history',
        icon: Bell,
        gradient: 'from-indigo-500 to-indigo-600',
        functions: [], // Notifications cho tất cả user
      },
    ],
  },

  // ========== 3. CSDL NHÂN SỰ ==========
  {
    title: 'nav.personnelDatabase',
    items: [
      {
        name: 'nav.personnelOverview',
        href: '/dashboard/personnel/overview',
        icon: BarChart3,
        gradient: 'from-blue-600 to-indigo-600',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.personnelList',
        href: '/dashboard/personnel/list',
        icon: Contact,
        gradient: 'from-indigo-500 to-blue-600',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.officerManagement',
        href: '/dashboard/officer-management',
        icon: Star,
        gradient: 'from-yellow-600 to-amber-600',
        badge: 'CB',
        functions: [PERSONNEL.VIEW, PERSONNEL.UPDATE],
      },
      {
        name: 'nav.soldierManagement',
        href: '/dashboard/soldier-management',
        icon: Shield,
        gradient: 'from-green-600 to-emerald-600',
        badge: 'QL',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.personnelAdvancedSearch',
        href: '/dashboard/personnel/advanced-search',
        icon: UserSearch,
        gradient: 'from-indigo-500 to-violet-600',
        badge: '🔍',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.personnelSearch',
        href: '/dashboard/personnel/search',
        icon: Search,
        gradient: 'from-blue-500 to-indigo-500',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.personnelPlanning',
        href: '/dashboard/personnel/planning',
        icon: Target,
        gradient: 'from-violet-500 to-purple-600',
        functions: [PERSONNEL.VIEW],
      },
      {
        name: 'nav.personnelStats',
        href: '/dashboard/personnel/stats',
        icon: FileSpreadsheet,
        gradient: 'from-purple-600 to-violet-600',
        functions: [PERSONNEL.VIEW, PERSONNEL.EXPORT],
      },
      {
        name: 'nav.personnelCreate',
        href: '/dashboard/personnel/create',
        icon: UserPlus,
        gradient: 'from-green-500 to-emerald-600',
        functions: [PERSONNEL.CREATE],
      },
      {
        name: 'nav.personnelImport',
        href: '/dashboard/personnel/import',
        icon: FileUp,
        gradient: 'from-green-500 to-teal-600',
        badge: 'CSV',
        functions: [PERSONNEL.IMPORT],
      },
    ],
  },

  // ========== 4. CSDL CHÍNH TRỊ (ĐẢNG VIÊN) ==========
  {
    title: 'nav.partyDatabase',
    items: [
      {
        name: 'nav.partyOverview',
        href: '/dashboard/party',
        icon: Shield,
        gradient: 'from-red-600 to-red-700',
        badge: '☭',
        functions: [PARTY.VIEW],
      },
      {
        name: 'nav.partyDashboard',
        href: '/dashboard/party/dashboard',
        icon: PieChart,
        gradient: 'from-red-600 to-red-700',
        badge: 'UC-72',
        functions: [PARTY.VIEW_DASHBOARD, PARTY.VIEW],
      },
      {
        name: 'nav.partyOrgStructure',
        href: '/dashboard/party/orgs',
        icon: Network,
        gradient: 'from-rose-600 to-red-700',
        badge: 'UC-64',
        functions: [PARTY.VIEW_ORG, PARTY.VIEW],
      },
      {
        name: 'nav.partyRecruitmentPipeline',
        href: '/dashboard/party/recruitment',
        icon: Workflow,
        gradient: 'from-rose-600 to-pink-700',
        badge: 'UC-65',
        functions: [PARTY.VIEW_ADMISSION, PARTY.VIEW],
      },
      {
        name: 'nav.partyAdmissions',
        href: '/dashboard/party/admissions',
        icon: CheckCircle,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.APPROVE_ADMISSION, PARTY.VIEW_ADMISSION, PARTY.VIEW],
      },
      {
        name: 'nav.partyMeetings',
        href: '/dashboard/party/meetings',
        icon: CalendarDays,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_MEETING, PARTY.MANAGE_MEETING, PARTY.VIEW],
      },
      {
        name: 'nav.partyActivities',
        href: '/dashboard/party/activities',
        icon: Calendar,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_ACTIVITY, PARTY.MANAGE_ACTIVITY, PARTY.VIEW],
      },
      {
        name: 'nav.partyFees',
        href: '/dashboard/party/fees',
        icon: Coins,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_FEE, PARTY.MANAGE_FEE, PARTY.VIEW],
      },
      {
        name: 'nav.partyEvaluations',
        href: '/dashboard/party/evaluations',
        icon: ClipboardCheck,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_REVIEW, PARTY.MANAGE_REVIEW, PARTY.VIEW],
      },
      {
        name: 'nav.partyAnnualReviews',
        href: '/dashboard/party/reviews',
        icon: Star,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_REVIEW, PARTY.MANAGE_REVIEW, PARTY.VIEW],
      },
      {
        name: 'nav.partyAwards',
        href: '/dashboard/party/awards',
        icon: Gift,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_DISCIPLINE, PARTY.VIEW],
      },
      {
        name: 'nav.partyDisciplines',
        href: '/dashboard/party/disciplines',
        icon: Scale,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_DISCIPLINE, PARTY.APPROVE_DISCIPLINE, PARTY.VIEW],
      },
      {
        name: 'nav.partyTransfers',
        href: '/dashboard/party/transfers',
        icon: GitMerge,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_TRANSFER, PARTY.APPROVE_TRANSFER, PARTY.VIEW],
      },
      {
        name: 'nav.partyInspections',
        href: '/dashboard/party/inspections',
        icon: ShieldBan,
        gradient: 'from-red-600 to-red-700',
        badge: 'UC-71',
        functions: [PARTY.VIEW_INSPECTION, PARTY.MANAGE_INSPECTION, PARTY.VIEW],
      },
      {
        name: 'nav.partyMemberList',
        href: '/dashboard/party/list',
        icon: Users,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.VIEW_MEMBER, PARTY.VIEW],
      },
      {
        name: 'nav.partyMemberProfile360',
        href: '/dashboard/party/members',
        icon: Contact,
        gradient: 'from-rose-600 to-red-700',
        badge: '360°',
        functions: [PARTY.VIEW_MEMBER, PARTY.VIEW],
      },
      {
        name: 'nav.partyMemberCreate',
        href: '/dashboard/party/create',
        icon: UserPlus,
        gradient: 'from-red-600 to-red-700',
        functions: [PARTY.CREATE_MEMBER, PARTY.CREATE],
      },
    ],
  },

  // ========== 5. CSDL CHÍNH SÁCH ==========
  {
    title: 'nav.policyDatabase',
    items: [
      {
        name: 'nav.policyOverview',
        href: '/dashboard/policy',
        icon: BookOpen,
        gradient: 'from-amber-500 to-orange-600',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyList',
        href: '/dashboard/policy/list',
        icon: FileText,
        gradient: 'from-orange-500 to-amber-600',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyRequests',
        href: '/dashboard/policy/requests',
        icon: ClipboardList,
        gradient: 'from-yellow-500 to-orange-500',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyApproval',
        href: '/dashboard/policy/approval',
        icon: BadgeCheck,
        gradient: 'from-green-500 to-emerald-600',
        badge: '✓',
        functions: [POLICY.APPROVE],
      },
      {
        name: 'nav.policyRewards',
        href: '/dashboard/policy/rewards',
        icon: Award,
        gradient: 'from-yellow-500 to-amber-600',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyDiscipline',
        href: '/dashboard/policy/discipline',
        icon: Scale,
        gradient: 'from-red-500 to-rose-600',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyWelfare',
        href: '/dashboard/policy/welfare',
        icon: Gift,
        gradient: 'from-pink-500 to-rose-600',
        functions: [POLICY.VIEW],
      },
      {
        name: 'nav.policyCreate',
        href: '/dashboard/policy/create',
        icon: UserPlus,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [POLICY.CREATE, POLICY.CREATE_REQUEST],
      },
    ],
  },

  // ========== 6. CSDL BẢO HIỂM XÃ HỘI ==========
  {
    title: 'nav.insuranceDatabase',
    items: [
      {
        name: 'nav.insuranceOverview',
        href: '/dashboard/insurance',
        icon: Heart,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceList',
        href: '/dashboard/insurance/list',
        icon: Hospital,
        gradient: 'from-cyan-500 to-teal-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceContributions',
        href: '/dashboard/insurance/contributions',
        icon: Coins,
        gradient: 'from-yellow-500 to-amber-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceClaims',
        href: '/dashboard/insurance/claims',
        icon: FileCheck2,
        gradient: 'from-blue-500 to-indigo-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceBenefits',
        href: '/dashboard/insurance/benefits',
        icon: Gift,
        gradient: 'from-green-500 to-emerald-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceDependents',
        href: '/dashboard/insurance/dependents',
        icon: Users,
        gradient: 'from-violet-500 to-purple-600',
        functions: [INSURANCE.VIEW],
      },
      {
        name: 'nav.insuranceCreate',
        href: '/dashboard/insurance/create',
        icon: UserPlus,
        gradient: 'from-emerald-500 to-teal-600',
        functions: [INSURANCE.CREATE],
      },
    ],
  },

  // ========== 7. THI ĐUA KHEN THƯỞNG ==========
  {
    title: 'nav.awardsDatabase',
    items: [
      {
        name: 'nav.awardsOverview',
        href: '/dashboard/emulation',
        icon: Award,
        gradient: 'from-yellow-500 to-amber-600',
        functions: [AWARDS.VIEW],
      },
      {
        name: 'nav.awardsList',
        href: '/dashboard/emulation/rewards',
        icon: Trophy,
        gradient: 'from-amber-500 to-yellow-600',
        functions: [AWARDS.VIEW],
      },
      {
        name: 'nav.emulationManagement',
        href: '/dashboard/emulation/management',
        icon: ClipboardCheck,
        gradient: 'from-orange-500 to-amber-600',
        functions: [AWARDS.VIEW, AWARDS.UPDATE],
      },
      {
        name: 'nav.awardsCreate',
        href: '/dashboard/emulation/rewards/create',
        icon: UserPlus,
        gradient: 'from-green-500 to-emerald-600',
        functions: [AWARDS.CREATE],
      },
      {
        name: 'nav.emulationStats',
        href: '/dashboard/emulation/stats',
        icon: BarChart3,
        gradient: 'from-emerald-500 to-green-600',
        functions: [AWARDS.VIEW],
      },
    ],
  },

  // ========== 8a. TỔNG QUAN ĐÀO TẠO ==========
  {
    title: 'nav.educationOverviewGroup',
    items: [
      {
        name: 'nav.educationOverview',
        href: '/dashboard/education',
        icon: BookMarked,
        gradient: 'from-blue-600 to-indigo-700',
        badge: '📊',
        functions: [EDUCATION.VIEW_PROGRAM],
      },
    ],
  },

  // ========== 8b. QUẢN LÝ GIẢNG VIÊN ==========
  {
    title: 'nav.facultyManagementGroup',
    items: [
      {
        name: 'nav.facultyOverview',
        href: '/dashboard/faculty',
        icon: Users,
        gradient: 'from-violet-600 to-purple-700',
        badge: '👨‍🏫',
        functions: [FACULTY.VIEW],
      },
      {
        name: 'nav.facultyList',
        href: '/dashboard/faculty/list',
        icon: Users,
        gradient: 'from-purple-500 to-violet-600',
        functions: [FACULTY.VIEW],
      },
      {
        name: 'nav.facultyAnalytics',
        href: '/dashboard/faculty/analytics',
        icon: BarChart3,
        gradient: 'from-indigo-500 to-violet-600',
        functions: [FACULTY.VIEW],
      },
      {
        name: 'nav.facultyImport',
        href: '/dashboard/faculty/import',
        icon: FileUp,
        gradient: 'from-teal-500 to-cyan-600',
        badge: 'CSV',
        functions: [FACULTY.UPDATE],
      },
      {
        name: 'nav.studentGuidance',
        href: '/dashboard/faculty/my-students',
        icon: GraduationCap,
        gradient: 'from-cyan-500 to-blue-600',
        functions: [FACULTY.VIEW],
      },
      {
        name: 'nav.teachingStats',
        href: '/dashboard/faculty/teaching-analytics',
        icon: BarChart3,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [EDUCATION.VIEW_TERM, FACULTY.VIEW],
      },
      {
        name: 'nav.educationTeachingAssignment',
        href: '/dashboard/education/teaching-assignment',
        icon: ClipboardCheck,
        gradient: 'from-emerald-500 to-teal-600',
        functions: [EDUCATION.VIEW_TERM, FACULTY.VIEW],
      },
    ],
  },

  // ========== 8c. QUẢN LÝ NGƯỜI HỌC ==========
  {
    title: 'nav.studentManagementGroup',
    items: [
      {
        name: 'nav.militaryStudents',
        href: '/dashboard/education/military-students',
        icon: ShieldCheck,
        gradient: 'from-green-700 to-emerald-700',
        badge: '🎖️',
        functions: [EDUCATION.VIEW_STUDENT],
      },
      {
        name: 'nav.civilStudents',
        href: '/dashboard/education/civil-students',
        icon: GraduationCap,
        gradient: 'from-blue-600 to-sky-600',
        badge: '🎓',
        functions: [EDUCATION.VIEW_STUDENT],
      },
      {
        name: 'nav.educationStudents',
        href: '/dashboard/education/students',
        icon: Users,
        gradient: 'from-sky-500 to-blue-600',
        functions: [EDUCATION.VIEW_STUDENT],
      },
      {
        name: 'nav.educationGrades',
        href: '/dashboard/education/grades',
        icon: ClipboardList,
        gradient: 'from-blue-500 to-cyan-600',
        functions: [EDUCATION.VIEW_GRADE],
      },
      {
        name: 'nav.educationWarnings',
        href: '/dashboard/education/warnings',
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-600',
        badge: '⚠',
        functions: [EDUCATION.VIEW_WARNING],
      },
      {
        name: 'nav.educationConduct',
        href: '/dashboard/education/conduct',
        icon: ShieldCheck,
        gradient: 'from-teal-500 to-emerald-600',
        functions: [EDUCATION.VIEW_CONDUCT],
      },
      {
        name: 'nav.educationAttendance',
        href: '/dashboard/education/attendance',
        icon: CalendarCheck,
        gradient: 'from-green-500 to-emerald-600',
        functions: [EDUCATION.VIEW_ATTENDANCE],
      },
      {
        name: 'nav.educationThesis',
        href: '/dashboard/education/thesis',
        icon: BookOpen,
        gradient: 'from-violet-500 to-purple-600',
        functions: [EDUCATION.VIEW_STUDENT],
      },
      {
        name: 'nav.educationGraduation',
        href: '/dashboard/education/graduation',
        icon: BadgeCheck,
        gradient: 'from-purple-600 to-indigo-700',
        badge: '🎓',
        functions: [EDUCATION.VIEW_GRADUATION],
      },
    ],
  },

  // ========== 8d. CHƯƠNG TRÌNH & VẬN HÀNH ==========
  {
    title: 'nav.educationProgramGroup',
    items: [
      {
        name: 'nav.educationPrograms',
        href: '/dashboard/education/programs',
        icon: LibraryBig,
        gradient: 'from-indigo-500 to-purple-600',
        functions: [EDUCATION.VIEW_PROGRAM],
      },
      {
        name: 'nav.educationCurriculum',
        href: '/dashboard/education/curriculum',
        icon: Layers,
        gradient: 'from-purple-500 to-violet-600',
        functions: [EDUCATION.VIEW_CURRICULUM],
      },
      {
        name: 'nav.educationSubjects',
        href: '/dashboard/education/subjects',
        icon: BookOpen,
        gradient: 'from-violet-500 to-purple-600',
        functions: [EDUCATION.VIEW_PROGRAM],
      },
      {
        name: 'nav.educationPlanning',
        href: '/dashboard/education/planning',
        icon: CalendarDays,
        gradient: 'from-violet-500 to-purple-600',
        functions: [EDUCATION.VIEW_CURRICULUM],
      },
      {
        name: 'nav.educationCourseSections',
        href: '/dashboard/education/course-sections',
        icon: CalendarSearch,
        gradient: 'from-amber-500 to-orange-600',
        functions: [EDUCATION.VIEW_CLASS_SECTION],
      },
      {
        name: 'nav.educationSchedule',
        href: '/dashboard/education/schedule',
        icon: CalendarDays,
        gradient: 'from-green-500 to-emerald-600',
        functions: [EDUCATION.VIEW_TERM],
      },
      {
        name: 'nav.educationCoefficients',
        href: '/dashboard/education/coefficients',
        icon: Calculator,
        gradient: 'from-cyan-500 to-blue-600',
        functions: [EDUCATION.MANAGE_TERM],
      },
      {
        name: 'nav.educationRooms',
        href: '/dashboard/education/rooms',
        icon: DoorOpen,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [EDUCATION.VIEW_TERM],
      },
      {
        name: 'nav.educationExamPlan',
        href: '/dashboard/education/exam-plan',
        icon: ClipboardList,
        gradient: 'from-orange-500 to-amber-600',
        functions: [EDUCATION.VIEW_TERM, EXAM.VIEW_EXAM_PLAN],
      },
      {
        name: 'nav.educationQuestionBank',
        href: '/dashboard/education/question-bank',
        icon: HelpCircle,
        gradient: 'from-amber-500 to-yellow-600',
        functions: [QUESTION_BANK.VIEW],
      },
      {
        name: 'nav.educationLearningMaterials',
        href: '/dashboard/education/learning-materials',
        icon: FolderOpen,
        gradient: 'from-amber-500 to-yellow-600',
        functions: [LEARNING_MATERIAL.VIEW],
      },
      {
        name: 'nav.educationLab',
        href: '/dashboard/education/lab',
        icon: TestTube,
        gradient: 'from-amber-500 to-yellow-600',
        badge: '🔬',
        functions: [LAB.VIEW],
      },
    ],
  },

  // ========== 9. NGHIÊN CỨU KHOA HỌC ==========
  {
    title: 'nav.researchDatabase',
    items: [
      {
        name: 'nav.researchOverview',
        href: '/dashboard/research',
        icon: FlaskConical,
        gradient: 'from-indigo-500 to-violet-600',
        badge: '📊',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.researchProjects',
        href: '/dashboard/research/projects',
        icon: FolderKanban,
        gradient: 'from-violet-500 to-purple-600',
        badge: '🗂',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.researchPublications',
        href: '/dashboard/research/publications',
        icon: LibraryBig,
        gradient: 'from-blue-500 to-indigo-600',
        badge: '📚',
        functions: [RESEARCH.PUB_VIEW],
      },
      {
        name: 'nav.researchRepository',
        href: '/dashboard/research/repository',
        icon: LibraryBig,
        gradient: 'from-violet-500 to-blue-600',
        badge: '🔍',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.researchManagement',
        href: '/dashboard/research/management',
        icon: FileText,
        gradient: 'from-purple-500 to-indigo-600',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.researchScientists',
        href: '/dashboard/research/scientists',
        icon: Users,
        gradient: 'from-amber-500 to-orange-600',
        badge: '🎓',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.facultyResearch',
        href: '/dashboard/faculty/research',
        icon: FlaskConical,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [FACULTY.VIEW, RESEARCH.VIEW],
      },
      {
        name: 'nav.facultyScientificProfile',
        href: '/dashboard/faculty/scientific-profile',
        icon: BookUser,
        gradient: 'from-cyan-500 to-blue-600',
        functions: [FACULTY.VIEW],
      },
      {
        name: 'nav.researchDetailOverview',
        href: '/dashboard/research/overview',
        icon: TrendingUp,
        gradient: 'from-blue-500 to-indigo-600',
        functions: [RESEARCH.VIEW],
      },
      {
        name: 'nav.researchIntegration',
        href: '/dashboard/research/integration',
        icon: Network,
        gradient: 'from-teal-500 to-cyan-600',
        badge: 'INT',
        functions: [RESEARCH.VIEW, DATA.VIEW],
      },
      {
        name: 'nav.aiTrends',
        href: '/dashboard/research/ai-trends',
        icon: Brain,
        gradient: 'from-blue-500 to-indigo-600',
        badge: 'AI',
        functions: [RESEARCH.VIEW, DATA.VIEW],
      },
    ],
  },

  // ========== 9b. CSDL KHOA HỌC QUẢN LÝ (CSDL-KHQL) ==========
  {
    title: 'nav.scienceDatabase',
    items: [
      // -- Tổng quan --
      {
        name: 'nav.scienceDashboard',
        href: '/dashboard/science',
        icon: BarChart3,
        gradient: 'from-violet-500 to-purple-600',
        functions: [SCIENCE.DASHBOARD_VIEW],
      },
      // -- Đề tài & Nhân lực --
      {
        name: 'nav.scienceProjects',
        href: '/dashboard/science/projects',
        icon: FlaskConical,
        gradient: 'from-indigo-500 to-violet-600',
        functions: [SCIENCE.PROJECT_CREATE, SCIENCE.PROJECT_APPROVE_DEPT],
      },
      {
        name: 'nav.scienceActivities',
        href: '/dashboard/science/activities/proposals',
        icon: FlaskConical,
        gradient: 'from-violet-500 to-indigo-600',
        functions: [SCIENCE.PROJECT_CREATE, SCIENCE.PROJECT_APPROVE_DEPT, SCIENCE.PROJECT_APPROVE_ACADEMY],
      },
      {
        name: 'nav.scienceScientists',
        href: '/dashboard/science/resources/scientists',
        icon: Users,
        gradient: 'from-amber-500 to-orange-600',
        functions: [SCIENCE.SCIENTIST_VIEW],
      },
      // -- Quản trị & Tài chính --
      {
        name: 'nav.scienceCouncils',
        href: '/dashboard/science/councils',
        icon: Award,
        gradient: 'from-blue-500 to-indigo-600',
        functions: [SCIENCE.COUNCIL_MANAGE, SCIENCE.COUNCIL_SUBMIT_REVIEW],
      },
      {
        name: 'nav.scienceBudgets',
        href: '/dashboard/science/budgets',
        icon: Coins,
        gradient: 'from-emerald-500 to-teal-600',
        functions: [SCIENCE.BUDGET_MANAGE, SCIENCE.BUDGET_VIEW_FINANCE],
      },
      // -- M22 Data Hub --
      {
        name: 'nav.scienceDataHubOverview',
        href: '/dashboard/science/database/overview',
        icon: Database,
        gradient: 'from-violet-600 to-purple-700',
        functions: [SCIENCE.SCIENTIST_VIEW],
      },
      {
        name: 'nav.scienceDataHubRecords',
        href: '/dashboard/science/database/records',
        icon: Layers,
        gradient: 'from-indigo-600 to-violet-700',
        functions: [SCIENCE.SCIENTIST_VIEW],
      },
      // -- Kho tri thức --
      {
        name: 'nav.scienceWorks',
        href: '/dashboard/science/works',
        icon: BookOpen,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [SCIENCE.WORK_CREATE, SCIENCE.DASHBOARD_VIEW],
      },
      {
        name: 'nav.scienceLibrary',
        href: '/dashboard/science/library',
        icon: LibraryBig,
        gradient: 'from-cyan-500 to-blue-600',
        functions: [SCIENCE.LIBRARY_DOWNLOAD_NORMAL],
      },
      {
        name: 'nav.scienceCatalogs',
        href: '/dashboard/science/catalogs',
        icon: BookMarked,
        gradient: 'from-slate-500 to-gray-600',
        functions: [SCIENCE.CATALOG_VIEW],
      },
      // -- M26 Search / AI / Reports --
      {
        name: 'nav.scienceSearch',
        href: '/dashboard/science/search',
        icon: Search,
        gradient: 'from-teal-500 to-cyan-600',
        functions: [SCIENCE.SEARCH_USE],
      },
      {
        name: 'nav.scienceAiTools',
        href: '/dashboard/science/database/ai-tools',
        icon: Brain,
        gradient: 'from-purple-600 to-violet-700',
        functions: [SCIENCE.AI_USE],
      },
      {
        name: 'nav.scienceReports',
        href: '/dashboard/science/database/reports',
        icon: FileText,
        gradient: 'from-amber-500 to-orange-600',
        functions: [SCIENCE.REPORT_EXPORT],
      },
      {
        name: 'nav.scienceDataQuality',
        href: '/dashboard/science/data-quality',
        icon: CheckCircle,
        gradient: 'from-green-500 to-emerald-600',
        functions: [SCIENCE.DATA_QUALITY_VIEW],
      },
    ],
  },

  // ========== 10. MẪU BIỂU & XUẤT DỮ LIỆU (M18/M19) ==========
  {
    title: 'nav.templateExport',
    items: [
      {
        name: 'nav.templateLibrary',
        href: '/dashboard/templates',
        icon: Archive,
        gradient: 'from-blue-500 to-indigo-600',
        badge: 'M18',
        functions: [TEMPLATES.VIEW],
      },
      {
        name: 'nav.exportJobs',
        href: '/dashboard/templates/export-jobs',
        icon: Download,
        gradient: 'from-blue-500 to-indigo-600',
        badge: '📥',
        functions: [TEMPLATES.VIEW_JOBS],
      },
      {
        name: 'nav.scheduledExports',
        href: '/dashboard/templates/schedules',
        icon: CalendarRange,
        gradient: 'from-emerald-500 to-teal-600',
        badge: 'M19',
        functions: [TEMPLATES.MANAGE_SCHEDULES],
      },
    ],
  },

  // ========== 11. AI & PHÂN TÍCH ==========
  {
    title: 'nav.analyticsReports',
    items: [
      // -- AI --
      {
        name: 'nav.aiAdvisor',
        href: '/dashboard/ai-advisor',
        icon: Brain,
        gradient: 'from-purple-500 via-violet-500 to-fuchsia-500',
        badge: 'AI',
        functions: [DATA.VIEW, SYSTEM.MANAGE_AI_CONFIG],
      },
      {
        name: 'nav.aiPersonnel',
        href: '/dashboard/ai-personnel',
        icon: Brain,
        gradient: 'from-purple-600 via-violet-600 to-indigo-600',
        badge: '🧠',
        functions: [PERSONNEL.VIEW, DATA.VIEW],
      },
      {
        name: 'nav.aiMonitor',
        href: '/dashboard/ai-monitor',
        icon: Activity,
        gradient: 'from-green-500 to-emerald-600',
        badge: 'AI',
        functions: [DATA.VIEW, SYSTEM.MANAGE_AI_CONFIG],
      },
      {
        name: 'nav.aiTraining',
        href: '/dashboard/ai-training',
        icon: Brain,
        gradient: 'from-violet-500 to-fuchsia-600',
        badge: '🏋️',
        functions: [ML.TRAIN_MODELS, SYSTEM.MANAGE_AI_CONFIG],
      },
      {
        name: 'nav.aiUsageLogs',
        href: '/dashboard/ai/usage-logs',
        icon: History,
        gradient: 'from-orange-500 to-red-600',
        badge: '📋',
        functions: [AI.VIEW_MONITOR],
      },
      // -- ML --
      {
        name: 'nav.mlModels',
        href: '/dashboard/ml/models',
        icon: Brain,
        gradient: 'from-violet-500 to-purple-600',
        badge: '🤖',
        functions: [ML.VIEW_MODELS],
      },
      {
        name: 'nav.mlTraining',
        href: '/dashboard/ml/training',
        icon: Activity,
        gradient: 'from-purple-500 to-indigo-600',
        functions: [ML.TRAIN_MODELS],
      },
      {
        name: 'nav.mlExperiments',
        href: '/dashboard/ml/experiments',
        icon: FlaskConical,
        gradient: 'from-indigo-500 to-blue-600',
        functions: [ML.VIEW_MODELS],
      },
      {
        name: 'nav.mlWorkflows',
        href: '/dashboard/ml/workflows',
        icon: Workflow,
        gradient: 'from-blue-500 to-cyan-600',
        functions: [ML.MANAGE_MODELS],
      },
      {
        name: 'nav.mlTracking',
        href: '/dashboard/ml/tracking',
        icon: LineChart,
        gradient: 'from-teal-500 to-emerald-600',
        functions: [ML.VIEW_MODELS],
      },
      // -- Phân tích & Báo cáo --
      {
        name: 'nav.analytics',
        href: '/dashboard/analytics',
        icon: PieChart,
        gradient: 'from-blue-500 to-indigo-600',
        functions: [DATA.VIEW],
      },
      {
        name: 'nav.advancedAnalytics',
        href: '/dashboard/analytics/advanced',
        icon: BarChart3,
        gradient: 'from-indigo-500 to-violet-600',
        badge: 'ADV',
        functions: [DATA.VIEW, DATA.EXPORT],
      },
      {
        name: 'nav.reports',
        href: '/dashboard/reports',
        icon: FileSpreadsheet,
        gradient: 'from-amber-500 to-amber-600',
        functions: [DATA.VIEW, DATA.EXPORT],
      },
      {
        name: 'nav.kpis',
        href: '/dashboard/kpis',
        icon: TrendingUp,
        gradient: 'from-emerald-500 to-emerald-600',
        functions: [DATA.VIEW],
      },
      {
        name: 'nav.realtimeKpis',
        href: '/dashboard/kpis/realtime',
        icon: Activity,
        gradient: 'from-blue-500 to-cyan-600',
        functions: [DATA.VIEW],
      },
    ],
  },

  // ========== 12. HẠ TẦNG & DỮ LIỆU ==========
  {
    title: 'nav.dataManagement',
    items: [
      // -- Datalake & ETL --
      {
        name: 'nav.datalake',
        href: '/dashboard/datalake',
        icon: Database,
        gradient: 'from-cyan-500 to-cyan-600',
        functions: [DATA.VIEW],
      },
      {
        name: 'nav.uploadData',
        href: '/dashboard/data/upload',
        icon: Upload,
        gradient: 'from-emerald-500 to-emerald-600',
        functions: [DATA.CREATE, DATA.IMPORT],
      },
      {
        name: 'nav.queryData',
        href: '/dashboard/data/query',
        icon: Search,
        gradient: 'from-blue-500 to-blue-600',
        functions: [DATA.QUERY],
      },
      {
        name: 'nav.manageData',
        href: '/dashboard/data/manage',
        icon: Folder,
        gradient: 'from-indigo-500 to-indigo-600',
        functions: [DATA.VIEW, DATA.UPDATE],
      },
      {
        name: 'nav.etlAutomation',
        href: '/dashboard/etl/automation',
        icon: Zap,
        gradient: 'from-yellow-500 to-orange-600',
        badge: 'ETL',
        functions: [ETL.VIEW, ETL.EXECUTE],
      },
      {
        name: 'nav.files',
        href: '/dashboard/files',
        icon: FolderOpen,
        gradient: 'from-amber-500 to-yellow-600',
        functions: [DATA.VIEW],
      },
      // -- Workflow & Văn bản số --
      {
        name: 'nav.workflowDashboard',
        href: '/dashboard/workflow',
        icon: Network,
        gradient: 'from-violet-500 to-purple-600',
        badge: '⚙️',
        functions: [WORKFLOW.VIEW],
      },
      {
        name: 'nav.workflowMyWork',
        href: '/dashboard/workflow/my-work',
        icon: ClipboardList,
        gradient: 'from-violet-500 to-purple-600',
        functions: [WORKFLOW.ACT, WORKFLOW.VIEW_DETAIL],
      },
      {
        name: 'nav.workflowInstances',
        href: '/dashboard/workflow/instances',
        icon: Layers,
        gradient: 'from-violet-500 to-purple-600',
        functions: [WORKFLOW.VIEW_ALL_INSTANCES, WORKFLOW.MONITOR],
      },
      {
        name: 'nav.workflowDesigner',
        href: '/dashboard/workflow/designer',
        icon: FolderKanban,
        gradient: 'from-violet-500 to-purple-600',
        functions: [WORKFLOW.DESIGN, WORKFLOW.OVERRIDE],
      },
      {
        name: 'nav.documentRegistry',
        href: '/dashboard/documents',
        icon: FileText,
        gradient: 'from-violet-500 to-purple-600',
        badge: '📄',
        functions: [DIGITAL_DOCS.VIEW],
      },
      {
        name: 'nav.documentOCR',
        href: '/dashboard/documents/ocr',
        icon: ScanText,
        gradient: 'from-violet-500 to-purple-600',
        badge: 'OCR',
        functions: [DIGITAL_DOCS.OCR],
      },
      // -- Quản trị dữ liệu --
      {
        name: 'nav.governanceCompliance',
        href: '/dashboard/governance/compliance',
        icon: Scale,
        gradient: 'from-violet-500 to-purple-600',
        functions: [GOVERNANCE.VIEW_COMPLIANCE],
      },
      {
        name: 'nav.governanceLineage',
        href: '/dashboard/governance/lineage',
        icon: GitMerge,
        gradient: 'from-violet-500 to-purple-600',
        functions: [GOVERNANCE.VIEW_LINEAGE],
      },
      {
        name: 'nav.governanceRetention',
        href: '/dashboard/governance/retention',
        icon: Hourglass,
        gradient: 'from-violet-500 to-purple-600',
        functions: [GOVERNANCE.VIEW_RETENTION],
      },
      // -- Bảo mật --
      {
        name: 'nav.securityAudit',
        href: '/dashboard/security/audit',
        icon: ShieldBan,
        gradient: 'from-violet-500 to-purple-600',
        functions: [AUDIT.VIEW_SUSPICIOUS, SECURITY.VIEW_POLICY],
      },
      {
        name: 'nav.loginAudit',
        href: '/dashboard/security/login-audit',
        icon: History,
        gradient: 'from-orange-500 to-red-600',
        functions: [AUDIT.VIEW_LOGS, SECURITY.VIEW_POLICY],
      },
      {
        name: 'nav.securityPolicy',
        href: '/dashboard/security/policy',
        icon: Shield,
        gradient: 'from-violet-500 to-purple-600',
        functions: [SECURITY.MANAGE_POLICY],
      },
    ],
  },

  // ========== 13. QUẢN TRỊ HỆ THỐNG ==========
  {
    title: 'nav.systemAdmin',
    items: [
      {
        name: 'nav.adminDashboard',
        href: '/dashboard/admin',
        icon: LayoutDashboard,
        gradient: 'from-red-500 to-red-600',
        badge: '👑',
        functions: [DASHBOARD.VIEW_ADMIN],
      },
      // -- Tài khoản & Phân quyền --
      {
        name: 'nav.accountManagement',
        href: '/dashboard/admin/users',
        icon: UserCog,
        gradient: 'from-blue-500 to-blue-600',
        functions: [SYSTEM.MANAGE_USERS],
      },
      {
        name: 'nav.rbacManagement',
        href: '/dashboard/admin/rbac',
        icon: Shield,
        gradient: 'from-purple-500 to-purple-600',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.permissionGrants',
        href: '/dashboard/admin/permission-grants',
        icon: Key,
        gradient: 'from-violet-500 to-purple-600',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.rbacSoD',
        href: '/dashboard/admin/rbac/sod',
        icon: UserX,
        gradient: 'from-red-500 to-red-600',
        badge: 'SoD',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.positionManagement',
        href: '/dashboard/admin/positions',
        icon: Briefcase,
        gradient: 'from-emerald-500 to-emerald-600',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.functionManagement',
        href: '/dashboard/admin/functions',
        icon: Key,
        gradient: 'from-green-500 to-green-600',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      // -- Tổ chức --
      {
        name: 'nav.unitManagement',
        href: '/dashboard/admin/units',
        icon: Building2,
        gradient: 'from-indigo-500 to-indigo-600',
        functions: [SYSTEM.MANAGE_UNITS],
      },
      {
        name: 'nav.departmentManagement',
        href: '/dashboard/admin/departments',
        icon: Building2,
        gradient: 'from-blue-600 to-indigo-600',
        functions: [DEPARTMENT.VIEW, SYSTEM.MANAGE_UNITS],
      },
      // -- Dữ liệu chính & Liên kết --
      {
        name: 'nav.masterData',
        href: '/dashboard/admin/master-data',
        icon: Database,
        gradient: 'from-indigo-500 to-violet-600',
        badge: 'MDM',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.gradeCoefficients',
        href: '/dashboard/admin/he-so-mon-hoc',
        icon: Sigma,
        gradient: 'from-red-500 to-red-600',
        badge: 'HS',
        functions: [EDUCATION.MANAGE_TERM, SYSTEM.MANAGE_RBAC],
      },
      {
        name: 'nav.linkPersonnel',
        href: '/dashboard/admin/link-personnel',
        icon: Link2,
        gradient: 'from-red-500 to-red-600',
        badge: '🔗',
        functions: [SYSTEM.MANAGE_USERS, SYSTEM.MANAGE_RBAC],
      },
      // -- Hạ tầng & Tích hợp --
      {
        name: 'nav.apiGateway',
        href: '/dashboard/admin/api-gateway',
        icon: Globe,
        gradient: 'from-red-500 to-red-600',
        badge: 'API',
        functions: [SYSTEM.VIEW_SYSTEM_HEALTH, SYSTEM.MANAGE_AI_CONFIG],
      },
      {
        name: 'nav.infrastructure',
        href: '/dashboard/admin/infrastructure',
        icon: HardDrive,
        gradient: 'from-red-500 to-red-600',
        functions: [SYSTEM.VIEW_SYSTEM_HEALTH],
      },
      {
        name: 'nav.acceptanceDocs',
        href: '/dashboard/admin/acceptance-docs',
        icon: BadgeCheck,
        gradient: 'from-red-500 to-red-600',
        badge: '📋',
        functions: [SYSTEM.MANAGE_RBAC, DASHBOARD.VIEW_ADMIN],
      },
      {
        name: 'nav.projectReport',
        href: '/dashboard/admin/project-report',
        icon: BookOpen,
        gradient: 'from-indigo-500 to-blue-600',
        badge: '▶',
        functions: [SYSTEM.MANAGE_RBAC, DASHBOARD.VIEW_ADMIN],
      },
      // -- Dashboard & Giao diện --
      {
        name: 'nav.dashboardManagement',
        href: '/dashboard/admin/dashboard-management',
        icon: Cpu,
        gradient: 'from-red-500 to-red-600',
        badge: '📊',
        functions: [SYSTEM.MANAGE_RBAC],
      },
      // -- Giám sát & Kiểm toán --
      {
        name: 'nav.systemMonitoring',
        href: '/dashboard/monitoring',
        icon: Activity,
        gradient: 'from-red-500 to-red-600',
        functions: [SYSTEM.VIEW_SYSTEM_HEALTH],
      },
      {
        name: 'nav.systemHealth',
        href: '/dashboard/system/health',
        icon: CheckCircle,
        gradient: 'from-red-500 to-red-600',
        functions: [SYSTEM.VIEW_SYSTEM_HEALTH],
      },
      {
        name: 'nav.auditLogs',
        href: '/dashboard/admin/audit-logs',
        icon: ScrollText,
        gradient: 'from-red-500 to-red-600',
        functions: [SYSTEM.VIEW_AUDIT_LOG],
      },
      {
        name: 'nav.sessionManagement',
        href: '/dashboard/admin/sessions',
        icon: Shield,
        gradient: 'from-red-500 to-red-600',
        functions: ['VIEW_AUTH_SESSIONS'],
      },
      {
        name: 'nav.securityHardening',
        href: '/dashboard/admin/security/hardening',
        icon: ShieldBan,
        gradient: 'from-red-500 to-red-600',
        functions: [SECURITY.MANAGE_POLICY],
      },
      {
        name: 'nav.aiSettings',
        href: '/admin/ai-settings',
        icon: Brain,
        gradient: 'from-violet-500 to-violet-600',
        badge: 'AI',
        functions: [SYSTEM.MANAGE_AI_CONFIG],
      },
    ],
  },

  // ========== 14. CÀI ĐẶT CÁ NHÂN ==========
  {
    title: 'nav.settings',
    items: [
      {
        name: 'nav.accountSettings',
        href: '/dashboard/settings',
        icon: Settings,
        gradient: 'from-blue-600 to-blue-700',
        functions: [], // Settings cho tất cả user
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Lọc menu theo danh sách functionCodes của user
 */
export function filterMenu(
  menu: MenuGroup[],
  userFunctions: Set<string> | string[],
  isAdmin: boolean = false
): MenuGroup[] {
  // Admin thấy tất cả
  if (isAdmin) {
    return menu;
  }

  const functionSet = userFunctions instanceof Set
    ? userFunctions
    : new Set(userFunctions);

  const seenHrefs = new Set<string>();

  return menu
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        // Loại bỏ item trùng href (guard chống lỗi data)
        if (item.href && seenHrefs.has(item.href)) return false;
        if (item.href) seenHrefs.add(item.href);

        // Menu không yêu cầu quyền → luôn hiện
        if (!item.functions || item.functions.length === 0) {
          return true;
        }
        // Có ít nhất 1 quyền trong danh sách → hiện
        return item.functions.some(f => functionSet.has(f));
      }),
    }))
    .filter(group => group.items.length > 0);
}

/**
 * Lấy tất cả function codes cần thiết để hiện một menu item
 */
export function getRequiredFunctions(href: string): string[] {
  for (const group of MENU_CONFIG) {
    const item = group.items.find(i => i.href === href);
    if (item) {
      return item.functions;
    }
  }
  return [];
}

/**
 * Preview sidebar sẽ như thế nào với một tập functionCodes
 */
export function previewSidebar(functionCodes: string[]): MenuGroup[] {
  return filterMenu(MENU_CONFIG, new Set(functionCodes), false);
}

/**
 * Lấy danh sách tất cả function codes được dùng trong menu
 */
export function getAllMenuFunctions(): string[] {
  const functions: Set<string> = new Set();
  for (const group of MENU_CONFIG) {
    for (const item of group.items) {
      item.functions.forEach(f => functions.add(f));
    }
  }
  return Array.from(functions);
}

/**
 * Map từ function code → menu items
 */
export function getFunctionMenuMap(): Map<string, { group: string; item: string; href: string }[]> {
  const map = new Map<string, { group: string; item: string; href: string }[]>();

  for (const group of MENU_CONFIG) {
    for (const item of group.items) {
      for (const fn of item.functions) {
        if (!map.has(fn)) {
          map.set(fn, []);
        }
        map.get(fn)!.push({
          group: group.title,
          item: item.name,
          href: item.href || '',
        });
      }
    }
  }

  return map;
}
