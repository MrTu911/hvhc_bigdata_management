'use client';

/**
 * Trang hub cá nhân — /dashboard/personal
 * Hiển thị tổng quan tất cả mục cá nhân: quá trình công tác, chính sách,
 * bảo hiểm, khen thưởng. Các mục Tầng 1/2 chỉ hiện nếu có quyền.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User, Briefcase, Shield, Award, BookOpen,
  FlaskConical, GraduationCap, ClipboardList, FileText, Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MyPermissions {
  functionCodes: string[];
}

const PERSONAL_MENU = [
  {
    tier: 0,
    items: [
      { code: 'MANAGE_MY_PROFILE',      href: '/dashboard/profile',             icon: User,          title: 'Hồ sơ của tôi',            desc: 'Xem và cập nhật thông tin cơ bản' },
      { code: 'VIEW_MY_TASKS',           href: '/dashboard/workflow/my-work',    icon: ClipboardList, title: 'Công việc của tôi',         desc: 'Inbox phê duyệt và nhiệm vụ đang chờ' },
      { code: 'VIEW_MY_CAREER_HISTORY',  href: '/dashboard/personal/my-career',  icon: Briefcase,     title: 'Quá trình công tác',        desc: 'Lịch sử vị trí, chức vụ, đơn vị' },
      { code: 'VIEW_MY_POLICY',          href: '/dashboard/personal/my-policy',  icon: FileText,      title: 'Chính sách của tôi',        desc: 'Chế độ phúc lợi áp dụng cho bản thân' },
      { code: 'VIEW_MY_INSURANCE',       href: '/dashboard/personal/my-insurance', icon: Shield,      title: 'Bảo hiểm',                  desc: 'Thông tin BHXH, BHYT' },
      { code: 'VIEW_MY_AWARD',           href: '/dashboard/personal/my-awards',  icon: Award,         title: 'Khen thưởng & Kỷ luật',     desc: 'Lịch sử thi đua' },
      { code: 'MANAGE_MY_SECURITY',      href: '/dashboard/profile?tab=security', icon: Shield,       title: 'Bảo mật tài khoản',         desc: 'Đổi mật khẩu, MFA, lịch sử đăng nhập' },
    ],
  },
  {
    tier: 1,
    label: 'Nghiên cứu khoa học',
    items: [
      { code: 'VIEW_MY_RESEARCH',        href: '/dashboard/personal/my-research',      icon: FlaskConical,  title: 'Đề tài NCKH của tôi',     desc: 'Đề tài là chủ nhiệm hoặc thành viên' },
      { code: 'VIEW_MY_PUBLICATIONS',    href: '/dashboard/personal/my-publications',  icon: BookOpen,      title: 'Công bố khoa học',         desc: 'Bài báo, sách, kỷ yếu' },
      { code: 'MANAGE_MY_SCIENTIFIC_CV', href: '/dashboard/profile/scientific-cv',     icon: FileText,      title: 'Lý lịch khoa học',         desc: 'Hồ sơ khoa học, h-index, ORCID' },
      { code: 'VIEW_MY_GRADE_SUBMISSIONS', href: '/dashboard/personal/my-grade-submissions', icon: ClipboardList, title: 'Điểm đã trình duyệt', desc: 'Bảng điểm đã ký và lịch sử duyệt' },
    ],
  },
  {
    tier: 2,
    label: 'Học tập',
    items: [
      { code: 'VIEW_MY_GRADE',      href: '/dashboard/personal/my-grade',      icon: BookOpen,       title: 'Điểm học tập',         desc: 'Điểm từng học phần và GPA' },
      { code: 'VIEW_MY_CONDUCT',    href: '/dashboard/personal/my-conduct',    icon: Award,          title: 'Điểm rèn luyện',       desc: 'Đánh giá tác phong theo học kỳ' },
      { code: 'VIEW_MY_SCHEDULE',   href: '/dashboard/personal/my-schedule',   icon: Calendar,       title: 'Thời khóa biểu',       desc: 'Lịch học kỳ hiện tại' },
      { code: 'VIEW_MY_GRADUATION', href: '/dashboard/personal/my-graduation', icon: GraduationCap,  title: 'Xét tốt nghiệp',       desc: 'Tiến độ và kết quả xét tốt nghiệp' },
    ],
  },
];

export default function PersonalHubPage() {
  const [myCodes, setMyCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/my-permissions')
      .then((r) => r.json())
      .then((data: { data?: MyPermissions }) => {
        if (data?.data?.functionCodes) {
          setMyCodes(new Set(data.data.functionCodes));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasCode = (code: string) => myCodes.has(code);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Không gian cá nhân</h1>
        <p className="text-muted-foreground mt-1">Quản lý thông tin, công việc và hồ sơ của bạn</p>
      </div>

      {PERSONAL_MENU.map((group) => {
        const visibleItems = group.items.filter((item) => hasCode(item.code));
        if (visibleItems.length === 0) return null;

        return (
          <section key={group.tier}>
            {group.label && (
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">{group.label}</h2>
                <Badge variant="outline">Tầng {group.tier}</Badge>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.code} href={item.href}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{item.desc}</CardDescription>
                      </CardContent>
                    </Card>
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
