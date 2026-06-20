'use client';

/**
 * Trang hub cá nhân — /dashboard/personal
 *
 * Tổng quan toàn bộ "không gian cá nhân", nhóm theo tầng và TÔ MÀU theo từng LOẠI CSDL
 * (module nền): M02 Nhân sự · M05 Chính sách · M06 Bảo hiểm · M09 NCKH · M10 Đào tạo ·
 * M13 Quy trình · M01 Hệ thống. Mục Tầng 1/2 chỉ hiện khi có quyền.
 * Liên thông: card "Đề nghị cập nhật hồ sơ" là điểm vào duy nhất của luồng duyệt 2 cấp.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User, Briefcase, Shield, Award, BookOpen, FileEdit, ArrowRight,
  FlaskConical, GraduationCap, ClipboardList, FileText, Calendar, type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MODULE_TOKENS, type ModuleId } from '@/lib/constants/module-tokens';

interface MyPermissions {
  functionCodes: string[];
}

/** Bảng màu CARD theo loại CSDL (light theme) — class literal để Tailwind JIT nhận diện. */
interface CsdlTheme {
  topBorder: string;
  iconBg: string;
  iconText: string;
  hoverRing: string;
  chip: string;
}

const CSDL_THEME: Record<string, CsdlTheme> = {
  personnel: { topBorder: 'border-t-blue-500',    iconBg: 'bg-blue-100',    iconText: 'text-blue-600',    hoverRing: 'hover:ring-blue-200',    chip: 'bg-blue-50 text-blue-700 border-blue-200' },
  policy:    { topBorder: 'border-t-teal-500',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600',    hoverRing: 'hover:ring-teal-200',    chip: 'bg-teal-50 text-teal-700 border-teal-200' },
  insurance: { topBorder: 'border-t-emerald-500', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', hoverRing: 'hover:ring-emerald-200', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  research:  { topBorder: 'border-t-violet-500',  iconBg: 'bg-violet-100',  iconText: 'text-violet-600',  hoverRing: 'hover:ring-violet-200',  chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  education: { topBorder: 'border-t-indigo-500',  iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  hoverRing: 'hover:ring-indigo-200',  chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  workflow:  { topBorder: 'border-t-cyan-500',    iconBg: 'bg-cyan-100',    iconText: 'text-cyan-600',    hoverRing: 'hover:ring-cyan-200',    chip: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  admin:     { topBorder: 'border-t-slate-500',   iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   hoverRing: 'hover:ring-slate-200',   chip: 'bg-slate-50 text-slate-600 border-slate-200' },
};

interface PersonalItem {
  code: string;
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  module: ModuleId;
}

interface PersonalGroup {
  tier: number;
  label?: string;
  items: PersonalItem[];
}

const PERSONAL_MENU: PersonalGroup[] = [
  {
    tier: 0,
    items: [
      { code: 'MANAGE_MY_PROFILE',         href: '/dashboard/profile',                  icon: User,          title: 'Hồ sơ của tôi',          desc: 'Xem và cập nhật thông tin cơ bản',           module: 'personnel' },
      { code: 'VIEW_OWN_PROFILE_CHANGE',   href: '/dashboard/personal/my-profile-changes', icon: FileEdit,   title: 'Đề nghị cập nhật hồ sơ',  desc: 'Gửi & theo dõi đề nghị duyệt 2 cấp',         module: 'personnel' },
      { code: 'VIEW_MY_CAREER_HISTORY',    href: '/dashboard/personal/my-career',       icon: Briefcase,     title: 'Quá trình công tác',     desc: 'Lịch sử vị trí, chức vụ, đơn vị',            module: 'personnel' },
      { code: 'VIEW_MY_TASKS',             href: '/dashboard/workflow/my-work',         icon: ClipboardList, title: 'Công việc của tôi',      desc: 'Inbox phê duyệt và nhiệm vụ đang chờ',       module: 'workflow' },
      { code: 'VIEW_MY_POLICY',            href: '/dashboard/personal/my-policy',       icon: FileText,      title: 'Chính sách của tôi',     desc: 'Chế độ phúc lợi áp dụng cho bản thân',       module: 'policy' },
      { code: 'VIEW_MY_INSURANCE',         href: '/dashboard/personal/my-insurance',    icon: Shield,        title: 'Bảo hiểm',               desc: 'Thông tin BHXH, BHYT',                       module: 'insurance' },
      { code: 'VIEW_MY_AWARD',             href: '/dashboard/personal/my-awards',       icon: Award,         title: 'Khen thưởng & Kỷ luật',  desc: 'Lịch sử thi đua, khen thưởng',               module: 'policy' },
      { code: 'MANAGE_MY_SECURITY',        href: '/dashboard/profile?tab=security',     icon: Shield,        title: 'Bảo mật tài khoản',      desc: 'Đổi mật khẩu, MFA, lịch sử đăng nhập',       module: 'admin' },
    ],
  },
  {
    tier: 1,
    label: 'Nghiên cứu khoa học',
    items: [
      { code: 'VIEW_MY_RESEARCH',          href: '/dashboard/personal/my-research',          icon: FlaskConical,  title: 'Đề tài NCKH của tôi',  desc: 'Đề tài là chủ nhiệm hoặc thành viên',   module: 'research' },
      { code: 'VIEW_MY_PUBLICATIONS',      href: '/dashboard/personal/my-publications',      icon: BookOpen,      title: 'Công bố khoa học',     desc: 'Bài báo, sách, kỷ yếu',                 module: 'research' },
      { code: 'MANAGE_MY_SCIENTIFIC_CV',   href: '/dashboard/profile/scientific-cv',         icon: FileText,      title: 'Lý lịch khoa học',     desc: 'Hồ sơ khoa học, h-index, ORCID',        module: 'research' },
      { code: 'VIEW_MY_GRADE_SUBMISSIONS', href: '/dashboard/personal/my-grade-submissions', icon: ClipboardList, title: 'Điểm đã trình duyệt',  desc: 'Bảng điểm đã ký và lịch sử duyệt',      module: 'education' },
    ],
  },
  {
    tier: 2,
    label: 'Học tập',
    items: [
      { code: 'VIEW_MY_GRADE',      href: '/dashboard/personal/my-grade',      icon: BookOpen,      title: 'Điểm học tập',     desc: 'Điểm từng học phần và GPA',          module: 'education' },
      { code: 'VIEW_MY_CONDUCT',    href: '/dashboard/personal/my-conduct',    icon: Award,         title: 'Điểm rèn luyện',   desc: 'Đánh giá tác phong theo học kỳ',     module: 'education' },
      { code: 'VIEW_MY_SCHEDULE',   href: '/dashboard/personal/my-schedule',   icon: Calendar,      title: 'Thời khóa biểu',   desc: 'Lịch học kỳ hiện tại',               module: 'education' },
      { code: 'VIEW_MY_GRADUATION', href: '/dashboard/personal/my-graduation', icon: GraduationCap, title: 'Xét tốt nghiệp',   desc: 'Tiến độ và kết quả xét tốt nghiệp',  module: 'education' },
    ],
  },
];

/** Loại CSDL hiển thị ở chú giải màu. */
const CSDL_LEGEND: { module: ModuleId; label: string }[] = [
  { module: 'personnel', label: 'M02 Nhân sự' },
  { module: 'policy', label: 'M05 Chính sách' },
  { module: 'insurance', label: 'M06 Bảo hiểm' },
  { module: 'research', label: 'M09 NCKH' },
  { module: 'education', label: 'M10 Đào tạo' },
  { module: 'workflow', label: 'M13 Quy trình' },
  { module: 'admin', label: 'M01 Hệ thống' },
];

function themeFor(module: ModuleId): CsdlTheme {
  return CSDL_THEME[module] ?? CSDL_THEME.personnel;
}

export default function PersonalHubPage() {
  const [myCodes, setMyCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/my-permissions')
      .then((r) => r.json())
      .then((data: { data?: MyPermissions }) => {
        if (data?.data?.functionCodes) setMyCodes(new Set(data.data.functionCodes));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasCode = (code: string) => myCodes.has(code);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">Đang tải...</div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
      {/* Hero — sắc M02 (Nhân sự) cho không gian cá nhân */}
      <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-md', MODULE_TOKENS.personnel.heroGradient)}>
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">M02 · Hồ sơ cá nhân</p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">Không gian cá nhân</h1>
            <p className="mt-1 max-w-xl text-sm text-blue-100">
              Quản lý thông tin, công việc và hồ sơ của bạn. Mỗi nhóm được tô màu theo loại CSDL.
            </p>
          </div>
          <div className="rounded-xl bg-white/15 p-3 ring-1 ring-white/20">
            <User className="h-7 w-7" />
          </div>
        </div>
        {/* Chú giải màu theo loại CSDL */}
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          {CSDL_LEGEND.map((l) => (
            <span key={l.module} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white ring-1 ring-white/15">
              <span className={cn('h-2 w-2 rounded-full', themeFor(l.module).iconBg)} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {PERSONAL_MENU.map((group) => {
        const visibleItems = group.items.filter((item) => hasCode(item.code));
        if (visibleItems.length === 0) return null;

        return (
          <section key={group.tier}>
            {group.label && (
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-800">{group.label}</h2>
                <Badge variant="outline" className="text-slate-500">Tầng {group.tier}</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const theme = themeFor(item.module);
                const moduleCode = MODULE_TOKENS[item.module]?.code ?? '';
                return (
                  <Link key={item.code} href={item.href} className="group">
                    <div
                      className={cn(
                        'flex h-full flex-col rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm',
                        'ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                        theme.topBorder,
                        theme.hoverRing,
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('shrink-0 rounded-lg p-2.5', theme.iconBg, theme.iconText)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-slate-800">{item.title}</h3>
                            {moduleCode && (
                              <span className={cn('shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold', theme.chip)}>
                                {moduleCode}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-end pt-3 text-xs font-medium text-slate-400 group-hover:text-slate-600">
                        Mở <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
