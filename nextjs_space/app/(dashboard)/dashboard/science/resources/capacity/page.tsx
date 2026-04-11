'use client';

/**
 * M21 — Science Resources: Capacity Overview
 * Dashboard tổng quan tiềm lực khoa học: nhân lực, chỉ số, phân bổ lĩnh vực.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users, GraduationCap, BookOpen, FlaskConical,
  TrendingUp, Award, Building2,
} from 'lucide-react';

interface Scientist {
  id: string;
  hIndex?: number;
  i10Index?: number;
  totalCitations?: number;
  totalPublications?: number;
  primaryField?: string;
  degree?: string;
  projectLeadCount?: number;
  user: {
    name: string;
    rank?: string;
    academicTitle?: string;
    unitRelation?: { name: string };
  };
}

interface UnitCapacity {
  unitId: string;
  unitName: string;
  scientistCount: number;
  doctoralCount: number;
  projectLeadCount: number;
  totalPublications: number;
  totalCitations: number;
}

interface CapacityStats {
  totalScientists: number;
  doctoralCount: number;
  masterCount: number;
  totalPublications: number;
  totalCitations: number;
  avgHIndex: number;
  totalProjectsLed: number;
  fieldDistribution: { field: string; count: number }[];
  degreeDistribution: { degree: string; count: number }[];
  topScientists: Scientist[];
  topUnits: UnitCapacity[];
}

export default function CapacityPage() {
  const [stats, setStats] = useState<CapacityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/science/scientists?pageSize=100').then(r => r.json()),
      fetch('/api/science/units/capacity').then(r => r.json()),
    ])
      .then(([scientistRes, unitRes]) => {
        if (!scientistRes.success) throw new Error('Lỗi tải dữ liệu nhà khoa học');
        const scientists: Scientist[] = scientistRes.data ?? [];
        const units: UnitCapacity[] = unitRes.success ? (unitRes.data ?? []) : [];

        // Aggregate stats
        const doctoralCount = scientists.filter(s => ['TS', 'TSKH'].includes(s.degree ?? '')).length;
        const masterCount = scientists.filter(s => ['ThS', 'CK2'].includes(s.degree ?? '')).length;
        const totalPublications = scientists.reduce((sum, s) => sum + (s.totalPublications ?? 0), 0);
        const totalCitations = scientists.reduce((sum, s) => sum + (s.totalCitations ?? 0), 0);
        const avgHIndex = scientists.length > 0
          ? Math.round((scientists.reduce((sum, s) => sum + (s.hIndex ?? 0), 0) / scientists.length) * 10) / 10
          : 0;
        const totalProjectsLed = scientists.reduce((sum, s) => sum + (s.projectLeadCount ?? 0), 0);

        // Field distribution
        const fieldMap = new Map<string, number>();
        for (const s of scientists) {
          if (s.primaryField) fieldMap.set(s.primaryField, (fieldMap.get(s.primaryField) ?? 0) + 1);
        }
        const fieldDistribution = [...fieldMap.entries()]
          .map(([field, count]) => ({ field, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        // Degree distribution
        const degreeMap = new Map<string, number>();
        for (const s of scientists) {
          if (s.degree) degreeMap.set(s.degree, (degreeMap.get(s.degree) ?? 0) + 1);
        }
        const degreeDistribution = [...degreeMap.entries()]
          .map(([degree, count]) => ({ degree, count }))
          .sort((a, b) => b.count - a.count);

        // Top scientists by h-index
        const topScientists = [...scientists]
          .sort((a, b) => (b.hIndex ?? 0) - (a.hIndex ?? 0))
          .slice(0, 5);

        // Top units by scientist count
        const topUnits = [...units].slice(0, 5);

        setStats({
          totalScientists: scientists.length,
          doctoralCount,
          masterCount,
          totalPublications,
          totalCitations,
          avgHIndex,
          totalProjectsLed,
          fieldDistribution,
          degreeDistribution,
          topScientists,
          topUnits,
        });
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!stats) return null;

  const maxField = stats.fieldDistribution[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tổng quan Tiềm lực KH</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tổng hợp nhân lực và năng lực khoa học toàn học viện.</p>
      </div>

      <ResourcesNav active="capacity" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={<Users className="h-5 w-5 text-violet-500" />} value={stats.totalScientists} label="Nhà khoa học" color="text-violet-700" />
        <KpiCard icon={<GraduationCap className="h-5 w-5 text-blue-500" />} value={stats.doctoralCount} label="Tiến sĩ trở lên" color="text-blue-700" />
        <KpiCard icon={<BookOpen className="h-5 w-5 text-teal-500" />} value={stats.totalPublications} label="Tổng công trình" color="text-teal-700" />
        <KpiCard icon={<TrendingUp className="h-5 w-5 text-amber-500" />} value={stats.totalCitations} label="Tổng trích dẫn" color="text-amber-700" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard icon={<FlaskConical className="h-5 w-5 text-orange-500" />} value={stats.avgHIndex} label="H-index TB" color="text-orange-700" />
        <KpiCard icon={<Award className="h-5 w-5 text-purple-500" />} value={stats.totalProjectsLed} label="Đề tài chủ nhiệm" color="text-purple-700" />
        <KpiCard icon={<GraduationCap className="h-5 w-5 text-gray-500" />} value={stats.masterCount} label="Thạc sĩ" color="text-gray-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FlaskConical className="h-4 w-4" /> Phân bổ theo lĩnh vực
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {stats.fieldDistribution.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            ) : (
              stats.fieldDistribution.map(({ field, count }) => (
                <div key={field} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate max-w-[200px]">{field}</span>
                    <span className="font-medium text-gray-600 flex-shrink-0 ml-2">{count} người</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-400 rounded-full"
                      style={{ width: `${Math.round((count / maxField) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Degree distribution */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Phân bổ theo học vị
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {stats.degreeDistribution.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {stats.degreeDistribution.map(({ degree, count }) => (
                  <div key={degree} className="text-center px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-800">{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{degree}</p>
                    <p className="text-xs text-gray-400">
                      {stats.totalScientists > 0 ? Math.round(count / stats.totalScientists * 100) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top scientists */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Award className="h-4 w-4" /> Top nhà khoa học (H-index)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {stats.topScientists.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            ) : (
              stats.topScientists.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700'
                    : i === 1 ? 'bg-gray-200 text-gray-600'
                    : i === 2 ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {s.user.rank ? `${s.user.rank} ` : ''}{s.user.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{s.user.unitRelation?.name}</p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0 text-xs text-right">
                    <div>
                      <p className="font-bold text-violet-700">{s.hIndex ?? 0}</p>
                      <p className="text-gray-400">H</p>
                    </div>
                    <div>
                      <p className="font-bold text-blue-700">{s.totalPublications ?? 0}</p>
                      <p className="text-gray-400">CT</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top units */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Top đơn vị (số nhà KH)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {stats.topUnits.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
            ) : (
              stats.topUnits.map((u, i) => (
                <div key={u.unitId} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700'
                    : i <= 2 ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-50 text-gray-400'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.unitName}</p>
                    <p className="text-xs text-gray-400">{u.doctoralCount} TS · {u.projectLeadCount} đề tài CN</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-base font-bold text-violet-700">{u.scientistCount}</p>
                    <p className="text-xs text-gray-400">NKH</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-shrink-0">{icon}</div>
        <div>
          <p className={`text-xl font-bold ${color}`}>{value.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourcesNav({ active }: { active: 'scientists' | 'units' | 'experts' | 'capacity' }) {
  const items = [
    { key: 'scientists', label: 'Nhà Khoa học', href: '/dashboard/science/resources/scientists' },
    { key: 'units',      label: 'Năng lực ĐV',  href: '/dashboard/science/resources/units' },
    { key: 'experts',    label: 'Chuyên gia',    href: '/dashboard/science/resources/experts' },
    { key: 'capacity',   label: 'Tổng quan',     href: '/dashboard/science/resources/capacity' },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
