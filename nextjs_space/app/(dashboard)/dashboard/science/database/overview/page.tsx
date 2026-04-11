'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FlaskConical, Users, BookOpen, FileText, Library, Tags,
  CheckCircle2, Clock, Database, ArrowRight, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DataHubOverview {
  totalProjects:     number;
  totalScientists:   number;
  totalWorks:        number;
  totalPublications: number;
  totalLibraryItems: number;
  totalCatalogs:     number;
  activeProjects:    number;
  completedProjects: number;
  generatedAt:       string;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: typeof Database;
  color: string;
  href?: string;
}) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString('vi-VN')}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ─── Quick Links ──────────────────────────────────────────────────────────────

const QUICK_LINKS = [
  {
    title: 'Duyệt bản ghi',
    description: 'Xem unified records: đề tài, nhà KH, đơn vị',
    href: '/dashboard/science/database/records',
    icon: Database,
    color: 'text-violet-600 bg-violet-50',
  },
  {
    title: 'Danh mục KH',
    description: 'Quản lý lĩnh vực, loại công trình, nguồn kinh phí',
    href: '/dashboard/science/database/catalogs',
    icon: Tags,
    color: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Chất lượng dữ liệu',
    description: 'Theo dõi completeness, accuracy, timeliness',
    href: '/dashboard/science/database/quality',
    icon: CheckCircle2,
    color: 'text-emerald-600 bg-emerald-50',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DataHubOverviewPage() {
  const [overview, setOverview] = useState<DataHubOverview | null>(null);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/science/records/overview');
      if (!res.ok) throw new Error('Tải dữ liệu thất bại');
      const json = await res.json();
      setOverview(json.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={24} className="text-violet-600" />
            Kho dữ liệu Khoa học — M22
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tổng quan dữ liệu hợp nhất của miền nghiên cứu khoa học
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin mr-1' : 'mr-1'} />
          Làm mới
        </Button>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="h-14 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard
              label="Đề tài NCKH"
              value={overview.totalProjects}
              sub={`${overview.activeProjects} đang hoạt động`}
              icon={FlaskConical}
              color="bg-violet-500"
              href="/dashboard/science/database/records?type=PROJECT"
            />
            <KpiCard
              label="Nhà Khoa học"
              value={overview.totalScientists}
              icon={Users}
              color="bg-blue-500"
              href="/dashboard/science/database/records?type=SCIENTIST"
            />
            <KpiCard
              label="Công trình KH"
              value={overview.totalWorks}
              sub="Sách, giáo trình, chuyên đề"
              icon={BookOpen}
              color="bg-teal-500"
              href="/dashboard/science/works"
            />
            <KpiCard
              label="Công bố KH"
              value={overview.totalPublications}
              sub="Bài báo, hội thảo"
              icon={FileText}
              color="bg-indigo-500"
            />
            <KpiCard
              label="Tài liệu thư viện"
              value={overview.totalLibraryItems}
              icon={Library}
              color="bg-cyan-500"
              href="/dashboard/science/library"
            />
            <KpiCard
              label="Danh mục KH"
              value={overview.totalCatalogs}
              sub="Đang hoạt động"
              icon={Tags}
              color="bg-amber-500"
              href="/dashboard/science/database/catalogs"
            />
            <KpiCard
              label="Đề tài hoàn thành"
              value={overview.completedProjects}
              icon={CheckCircle2}
              color="bg-emerald-500"
            />
            <KpiCard
              label="Đề tài đang hoạt động"
              value={overview.activeProjects}
              icon={Clock}
              color="bg-orange-500"
            />
          </div>

          <p className="text-xs text-gray-400">
            Cập nhật: {new Date(overview.generatedAt).toLocaleString('vi-VN')}
          </p>
        </>
      ) : null}

      {/* Quick Links */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:shadow-md transition-shadow border-0 shadow-sm h-full">
                <CardContent className="pt-5 pb-5 px-5 flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${link.color}`}>
                    <link.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">{link.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{link.description}</div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 mt-1 flex-shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
