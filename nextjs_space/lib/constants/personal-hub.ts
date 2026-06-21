/**
 * Hằng số cho "Trung tâm cá nhân" — bảng màu theo loại CSDL + lưới điều hướng.
 *
 * Tô màu mỗi nhóm theo module nền (M01/M02/M05/M06/M09/M10/M13) để người dùng nhận
 * diện nhanh dữ liệu thuộc hệ nào. Lưới được lọc theo function-code (permission-aware).
 */
import {
  User, Briefcase, Shield, Award, BookOpen, FileEdit, FlaskConical,
  GraduationCap, ClipboardList, FileText, Calendar, type LucideIcon,
} from 'lucide-react';
import type { ModuleId } from '@/lib/constants/module-tokens';

/** Bảng màu CARD theo loại CSDL (light theme) — class literal để Tailwind JIT nhận diện. */
export interface CsdlTheme {
  topBorder: string;
  iconBg: string;
  iconText: string;
  hoverRing: string;
  chip: string;
  dot: string;
}

export const CSDL_THEME: Record<string, CsdlTheme> = {
  personnel: { topBorder: 'border-t-blue-500',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    hoverRing: 'hover:ring-blue-200',    chip: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  policy:    { topBorder: 'border-t-teal-500',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    hoverRing: 'hover:ring-teal-200',    chip: 'bg-teal-50 text-teal-700 border-teal-200',       dot: 'bg-teal-500' },
  insurance: { topBorder: 'border-t-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', hoverRing: 'hover:ring-emerald-200', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  research:  { topBorder: 'border-t-violet-500',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  hoverRing: 'hover:ring-violet-200',  chip: 'bg-violet-50 text-violet-700 border-violet-200',   dot: 'bg-violet-500' },
  education: { topBorder: 'border-t-indigo-500',  iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  hoverRing: 'hover:ring-indigo-200',  chip: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  workflow:  { topBorder: 'border-t-cyan-500',    iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    hoverRing: 'hover:ring-cyan-200',    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200',       dot: 'bg-cyan-500' },
  admin:     { topBorder: 'border-t-slate-500',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   hoverRing: 'hover:ring-slate-200',   chip: 'bg-slate-50 text-slate-600 border-slate-200',     dot: 'bg-slate-500' },
};

export function themeFor(module: ModuleId | string): CsdlTheme {
  return CSDL_THEME[module] ?? CSDL_THEME.personnel;
}

export interface PersonalNavItem {
  code: string;
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  module: ModuleId;
}

export interface PersonalNavGroup {
  tier: number;
  label?: string;
  items: PersonalNavItem[];
}

export const PERSONAL_MENU: PersonalNavGroup[] = [
  {
    tier: 0,
    items: [
      { code: 'MANAGE_MY_PROFILE',         href: '/dashboard/profile',                      icon: User,          title: 'Hồ sơ của tôi',          desc: 'Xem và cập nhật thông tin cơ bản',     module: 'personnel' },
      { code: 'VIEW_OWN_PROFILE_CHANGE',   href: '/dashboard/personal/my-profile-changes',  icon: FileEdit,      title: 'Đề nghị cập nhật hồ sơ',  desc: 'Gửi & theo dõi đề nghị duyệt 2 cấp',   module: 'personnel' },
      { code: 'VIEW_MY_CAREER_HISTORY',    href: '/dashboard/personal/my-career',           icon: Briefcase,     title: 'Quá trình công tác',     desc: 'Lịch sử vị trí, chức vụ, đơn vị',      module: 'personnel' },
      { code: 'VIEW_MY_TASKS',             href: '/dashboard/workflow/my-work',             icon: ClipboardList, title: 'Công việc của tôi',      desc: 'Inbox phê duyệt và nhiệm vụ đang chờ', module: 'workflow' },
      { code: 'VIEW_MY_POLICY',            href: '/dashboard/personal/my-policy',           icon: FileText,      title: 'Chính sách của tôi',     desc: 'Chế độ phúc lợi áp dụng cho bản thân', module: 'policy' },
      { code: 'VIEW_MY_INSURANCE',         href: '/dashboard/personal/my-insurance',        icon: Shield,        title: 'Bảo hiểm',               desc: 'Thông tin BHXH, BHYT',                 module: 'insurance' },
      { code: 'VIEW_MY_AWARD',             href: '/dashboard/personal/my-awards',           icon: Award,         title: 'Khen thưởng & Kỷ luật',  desc: 'Lịch sử thi đua, khen thưởng',         module: 'policy' },
      { code: 'MANAGE_MY_SECURITY',        href: '/dashboard/settings/security',            icon: Shield,        title: 'Bảo mật tài khoản',      desc: 'Đổi mật khẩu, MFA, lịch sử đăng nhập', module: 'admin' },
    ],
  },
  {
    tier: 1,
    label: 'Nghiên cứu khoa học',
    items: [
      { code: 'VIEW_MY_RESEARCH',          href: '/dashboard/personal/my-research',          icon: FlaskConical,  title: 'Đề tài NCKH của tôi',  desc: 'Đề tài là chủ nhiệm hoặc thành viên', module: 'research' },
      { code: 'VIEW_MY_PUBLICATIONS',      href: '/dashboard/personal/my-publications',      icon: BookOpen,      title: 'Công bố khoa học',     desc: 'Bài báo, sách, kỷ yếu',               module: 'research' },
      { code: 'MANAGE_MY_SCIENTIFIC_CV',   href: '/dashboard/profile/scientific-cv',         icon: FileText,      title: 'Lý lịch khoa học',     desc: 'Hồ sơ khoa học, h-index, ORCID',      module: 'research' },
      { code: 'VIEW_MY_GRADE_SUBMISSIONS', href: '/dashboard/personal/my-grade-submissions', icon: ClipboardList, title: 'Điểm đã trình duyệt',  desc: 'Bảng điểm đã ký và lịch sử duyệt',    module: 'education' },
    ],
  },
  {
    tier: 2,
    label: 'Học tập',
    items: [
      { code: 'VIEW_MY_GRADE',      href: '/dashboard/personal/my-grade',      icon: BookOpen,      title: 'Điểm học tập',   desc: 'Điểm từng học phần và GPA',         module: 'education' },
      { code: 'VIEW_MY_CONDUCT',    href: '/dashboard/personal/my-conduct',    icon: Award,         title: 'Điểm rèn luyện', desc: 'Đánh giá tác phong theo học kỳ',    module: 'education' },
      { code: 'VIEW_MY_SCHEDULE',   href: '/dashboard/personal/my-schedule',   icon: Calendar,      title: 'Thời khóa biểu', desc: 'Lịch học kỳ hiện tại',              module: 'education' },
      { code: 'VIEW_MY_GRADUATION', href: '/dashboard/personal/my-graduation', icon: GraduationCap, title: 'Xét tốt nghiệp', desc: 'Tiến độ và kết quả xét tốt nghiệp', module: 'education' },
    ],
  },
];

/** Loại CSDL hiển thị ở chú giải màu trên hero. */
export const CSDL_LEGEND: { module: ModuleId; label: string }[] = [
  { module: 'personnel', label: 'M02 Nhân sự' },
  { module: 'policy', label: 'M05 Chính sách' },
  { module: 'insurance', label: 'M06 Bảo hiểm' },
  { module: 'research', label: 'M09 NCKH' },
  { module: 'education', label: 'M10 Đào tạo' },
  { module: 'workflow', label: 'M13 Quy trình' },
  { module: 'admin', label: 'M01 Hệ thống' },
];
