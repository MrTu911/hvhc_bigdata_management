'use client';

import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/providers/language-provider';
import { 
  Users, Shield, Trophy, Heart, ShieldCheck, GraduationCap, 
  BookOpen, Database, Brain, BarChart3, FileText, Settings,
  ArrowRight, FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface PublicStats {
  success: boolean;
  data: {
    totalPersonnel: number;
    totalUnits: number;
    totalDatabases: number;
    totalCourses: number;
    totalProjects: number;
    totalStudents: number;
    activeUsers: number;
    totalFaculty: number;
    totalPartyMembers: number;
    totalInsurance: number;
    totalPolicy: number;
    totalPublications: number;
    totalPrograms: number;
    totalRooms: number;
    lastUpdated: string;
  };
}

export default function ModulesSection() {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch real stats from database
    fetch('/api/public/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, []);

  // Dynamic stats from database
  const s = stats?.data;

  const translations = {
    vi: {
      sectionTitle: 'CÁC PHÂN HỆ CHÍNH',
      sectionSubtitle: '8 Cơ sở dữ liệu quản lý toàn diện',
      viewAll: 'Xem tất cả',
      databases: [
        {
          id: 1,
          icon: Users,
          title: 'CSDL Quân nhân',
          code: 'Phân hệ 1',
          description: 'Quản lý thông tin cán bộ, sĩ quan, quân nhân chuyên nghiệp, công nhân viên quốc phòng.',
          stats: `${s?.totalPersonnel || 287} cán bộ`,
          color: 'from-blue-500 to-indigo-600',
          href: '/dashboard/personnel'
        },
        {
          id: 2,
          icon: Shield,
          title: 'CSDL Đảng viên',
          code: 'Phân hệ 2',
          description: 'Quản lý hồ sơ đảng viên, công tác đảng, sinh hoạt chi bộ, kết nạp đảng viên mới.',
          stats: `${s?.totalPartyMembers || 251} đảng viên`,
          color: 'from-red-600 to-red-700',
          href: '/dashboard/party'
        },
        {
          id: 3,
          icon: Trophy,
          title: 'CSDL Thi đua Khen thưởng',
          code: 'Phân hệ 3',
          description: 'Theo dõi thành tích, khen thưởng, kỷ luật, danh hiệu thi đua của cán bộ.',
          stats: 'Khen thưởng & Kỷ luật',
          color: 'from-amber-500 to-orange-600',
          href: '/dashboard/policy/rewards'
        },
        {
          id: 4,
          icon: Heart,
          title: 'CSDL Chính sách',
          code: 'Phân hệ 4',
          description: 'Quản lý chính sách, chế độ, phúc lợi dành cho cán bộ, gia đình chính sách.',
          stats: `${s?.totalPolicy || 287} hồ sơ`,
          color: 'from-pink-500 to-rose-600',
          href: '/dashboard/policy'
        },
        {
          id: 5,
          icon: ShieldCheck,
          title: 'CSDL Bảo hiểm XH',
          code: 'Phân hệ 5',
          description: 'Theo dõi bảo hiểm xã hội, bảo hiểm y tế, chế độ hưu trí cho quân nhân.',
          stats: `${s?.totalInsurance || 287} hồ sơ BHXH`,
          color: 'from-green-500 to-emerald-600',
          href: '/dashboard/insurance'
        },
        {
          id: 6,
          icon: BookOpen,
          title: 'CSDL Giảng viên - Học viên',
          code: 'Phân hệ 6',
          description: 'Quản lý hồ sơ khoa học giảng viên, học viên, môn giảng dạy, hướng dẫn sinh viên.',
          stats: `${s?.totalFaculty || 50} GV - ${s?.totalStudents || 200} HV`,
          color: 'from-purple-500 to-violet-600',
          href: '/dashboard/faculty-student/overview'
        },
        {
          id: 7,
          icon: FlaskConical,
          title: 'CSDL Nghiên cứu Khoa học',
          code: 'Phân hệ 7',
          description: 'Quản lý đề tài NCKH, sáng kiến, giáo trình, công trình khoa học.',
          stats: `${s?.totalProjects || 78} đề tài - ${s?.totalPublications || 94} công bố`,
          color: 'from-indigo-500 to-purple-600',
          href: '/dashboard/research/overview'
        },
        {
          id: 8,
          icon: GraduationCap,
          title: 'CSDL Giáo dục - Đào tạo',
          code: 'Phân hệ 8',
          description: 'Quản lý chương trình đào tạo, khóa học, lớp học phần, điểm số học viên.',
          stats: `${s?.totalPrograms || 8} CTĐT - ${s?.totalCourses || 128} môn`,
          color: 'from-cyan-500 to-blue-600',
          href: '/dashboard/education'
        },
      ],
      additionalFeatures: [
        { icon: Brain, title: 'Trí tuệ nhân tạo', desc: 'Dự báo, phân tích AI/ML' },
        { icon: BarChart3, title: 'Dashboard Chỉ huy', desc: 'Giám sát toàn diện' },
        { icon: FileText, title: 'Báo cáo tự động', desc: 'Xuất Excel, PDF' },
        { icon: Settings, title: 'RBAC Phân quyền', desc: '27 chức vụ người dùng' },
      ]
    },
    en: {
      sectionTitle: 'MAIN MODULES',
      sectionSubtitle: '8 Comprehensive Management Databases',
      viewAll: 'View All',
      databases: [
        {
          id: 1,
          icon: Users,
          title: 'Military Personnel DB',
          code: 'Module 1',
          description: 'Manage officers, NCOs, professional soldiers, defense workers information.',
          stats: `${s?.totalPersonnel || 287} personnel`,
          color: 'from-blue-500 to-indigo-600',
          href: '/dashboard/personnel'
        },
        {
          id: 2,
          icon: Shield,
          title: 'Party Members DB',
          code: 'Module 2',
          description: 'Manage party member profiles, party activities, cell meetings, new member admission.',
          stats: `${s?.totalPartyMembers || 251} members`,
          color: 'from-red-600 to-red-700',
          href: '/dashboard/party'
        },
        {
          id: 3,
          icon: Trophy,
          title: 'Awards & Discipline DB',
          code: 'Module 3',
          description: 'Track achievements, commendations, disciplinary actions, emulation titles.',
          stats: 'Awards & Discipline',
          color: 'from-amber-500 to-orange-600',
          href: '/dashboard/policy/rewards'
        },
        {
          id: 4,
          icon: Heart,
          title: 'Policy DB',
          code: 'Module 4',
          description: 'Manage policies, benefits, welfare for personnel and policy families.',
          stats: `${s?.totalPolicy || 287} records`,
          color: 'from-pink-500 to-rose-600',
          href: '/dashboard/policy'
        },
        {
          id: 5,
          icon: ShieldCheck,
          title: 'Social Insurance DB',
          code: 'Module 5',
          description: 'Track social insurance, health insurance, retirement benefits for military personnel.',
          stats: `${s?.totalInsurance || 287} records`,
          color: 'from-green-500 to-emerald-600',
          href: '/dashboard/insurance'
        },
        {
          id: 6,
          icon: BookOpen,
          title: 'Faculty - Student DB',
          code: 'Module 6',
          description: 'Manage faculty scientific profiles, students, teaching subjects, student guidance.',
          stats: `${s?.totalFaculty || 50} Faculty - ${s?.totalStudents || 200} Students`,
          color: 'from-purple-500 to-violet-600',
          href: '/dashboard/faculty-student/overview'
        },
        {
          id: 7,
          icon: FlaskConical,
          title: 'Research Database',
          code: 'Module 7',
          description: 'Manage research projects, initiatives, textbooks, scientific publications.',
          stats: `${s?.totalProjects || 78} projects - ${s?.totalPublications || 94} papers`,
          color: 'from-indigo-500 to-purple-600',
          href: '/dashboard/research/overview'
        },
        {
          id: 8,
          icon: GraduationCap,
          title: 'Education & Training DB',
          code: 'Module 8',
          description: 'Manage training programs, courses, class sections, student grades.',
          stats: `${s?.totalPrograms || 8} programs - ${s?.totalCourses || 128} courses`,
          color: 'from-cyan-500 to-blue-600',
          href: '/dashboard/education'
        },
      ],
      additionalFeatures: [
        { icon: Brain, title: 'Artificial Intelligence', desc: 'AI/ML Prediction & Analysis' },
        { icon: BarChart3, title: 'Command Dashboard', desc: 'Comprehensive monitoring' },
        { icon: FileText, title: 'Auto Reports', desc: 'Excel, PDF export' },
        { icon: Settings, title: 'RBAC Permissions', desc: '27 user positions' },
      ]
    }
  };

  const lang = t('code') as 'vi' | 'en';
  const tr = translations[lang] || translations.vi;

  return (
    <section id="modules" className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full px-4 py-2 mb-4">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Hệ thống CSDL</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            {tr.sectionTitle}
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            {tr.sectionSubtitle}
          </p>
        </div>

        {/* Database Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {tr.databases.map((db, index) => (
            <Link href={db.href} key={db.id}>
              <Card 
                className={`group relative overflow-hidden p-6 h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Gradient Header */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${db.color}`} />
                
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${db.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <db.icon className="w-7 h-7 text-white" />
                </div>

                {/* Code Badge */}
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {db.code}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors">
                  {db.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                  {db.description}
                </p>

                {/* Stats Badge */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {db.stats}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">
            {lang === 'vi' ? 'Tính năng nổi bật khác' : 'Other Key Features'}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {tr.additionalFeatures.map((feature, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
