'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  FlaskConical, FileText, TrendingUp, Users, Award, RefreshCw,
  BookOpen, Lightbulb, Newspaper, BookMarked, GraduationCap,
  ChevronRight, ClipboardList, ExternalLink,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  overview: {
    totalPublications: number;
    totalActivities: number;
    totalScientists: number;
    totalProjects: number;
  };
  pubByType: Array<{ type: string; label: string; count: number; color: string }>;
  yearTrend: Array<{ year: number; publications: number; activities: number }>;
  actByLevel: Array<{ level: string; count: number }>;
  topScientists: Array<{
    id: string; name: string; rank: string | null; unit: string;
    degree: string | null; academicRank: string | null;
    pubCount: number; actCount: number;
  }>;
  recentPublications: Array<{
    id: string; type: string; typeLabel: string; typeColor: string;
    title: string; year: number; month: number | null; role: string;
    publisher: string | null; organization: string | null;
    coAuthors: string | null; author: string; authorRank: string | null;
  }>;
  recentActivities: Array<{
    id: string; title: string; year: number; role: string;
    level: string; type: string; institution: string | null;
    result: string | null; author: string; authorRank: string | null;
  }>;
  actByRole: Array<{ role: string; count: number }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  CHU_BIEN: '#8b5cf6', CHU_NHIEM: '#8b5cf6',
  THAM_GIA: '#3b82f6', DONG_TAC_GIA: '#14b8a6',
  THANH_VIEN: '#94a3b8',
};
const ROLE_LABELS: Record<string, string> = {
  CHU_BIEN: 'Chủ biên', CHU_NHIEM: 'Chủ nhiệm',
  THAM_GIA: 'Tham gia', DONG_TAC_GIA: 'Đồng tác giả',
  THANH_VIEN: 'Thành viên',
};

const PUB_ICONS: Record<string, any> = {
  SANG_KIEN: Lightbulb, GIAO_TRINH: BookOpen, GIAO_TRINH_DT: BookMarked,
  TAI_LIEU: FileText, BAI_TAP: ClipboardList, BAI_BAO: Newspaper, DE_TAI: FlaskConical,
};

const LEVEL_COLORS: Record<string, string> = {
  'Cấp Học viện': '#6366f1', 'ACADEMY': '#6366f1',
  'Bộ': '#3b82f6', 'Nhà nước': '#f59e0b', 'Cơ sở': '#22c55e',
  'Cấp Bộ': '#3b82f6', 'Cấp Quốc gia': '#f59e0b', 'Cấp Cơ sở': '#22c55e',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ResearchDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'pub' | 'act'>('pub');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard/research');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Lỗi tải dữ liệu');
      }
    } catch {
      setError('Không thể kết nối server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 h-40 animate-pulse" />
        <div className="p-6 grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
        </Button>
      </div>
    );
  }

  const d = data!;
  const totalAll = d.overview.totalPublications + d.overview.totalActivities;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 -m-4 md:-m-6 lg:-m-8">

      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Nghiên cứu Khoa học</h1>
              <p className="text-indigo-100 text-sm">Thống kê ấn phẩm, hoạt động và nhà khoa học</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Làm mới
          </Button>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {/* Total publications */}
          <div className="bg-white/95 hover:bg-white rounded-xl p-4 shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-slate-500 font-medium">Tổng ấn phẩm</span>
            </div>
            <div className="text-3xl font-bold text-indigo-600">{d.overview.totalPublications}</div>
            <div className="text-xs text-slate-400 mt-1">
              {d.pubByType.map(t => `${t.count} ${t.label}`).join(' · ')}
            </div>
          </div>

          {/* Total activities */}
          <div className="bg-white/95 hover:bg-white rounded-xl p-4 shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <span className="text-xs text-slate-500 font-medium">Hoạt động NC</span>
            </div>
            <div className="text-3xl font-bold text-violet-600">{d.overview.totalActivities}</div>
            <div className="text-xs text-slate-400 mt-1">
              {d.actByLevel.slice(0, 3).map(a => `${a.count} ${a.level}`).join(' · ')}
            </div>
          </div>

          {/* Total scientists */}
          <div className="bg-white/95 hover:bg-white rounded-xl p-4 shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-slate-500 font-medium">Nhà khoa học</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{d.overview.totalScientists}</div>
            <div className="text-xs text-slate-400 mt-1">Giảng viên · Nghiên cứu viên</div>
          </div>

          {/* Combined output */}
          <div className="bg-white/95 hover:bg-white rounded-xl p-4 shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-slate-500 font-medium">Tổng đầu ra</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{totalAll}</div>
            <div className="text-xs text-slate-400 mt-1">Ấn phẩm + Hoạt động NCKH</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ── Quick nav cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/research/management', icon: FlaskConical, label: 'Quản lý ấn phẩm', sub: `${d.overview.totalPublications} công trình`, color: 'from-violet-500 to-purple-600' },
            { href: '/dashboard/research/scientists', icon: Users, label: 'Nhà khoa học', sub: `${d.overview.totalScientists} người`, color: 'from-amber-500 to-orange-600' },
            { href: '/dashboard/research/overview', icon: TrendingUp, label: 'Tổng quan chi tiết', sub: 'Biểu đồ & phân tích', color: 'from-blue-500 to-indigo-600' },
            { href: '/dashboard/research/ai-trends', icon: Award, label: 'AI Xu hướng', sub: 'Phân tích thông minh', color: 'from-pink-500 to-rose-600' },
          ].map(({ href, icon: Icon, label, sub, color }) => (
            <Link key={href} href={href} className="group bg-white rounded-xl p-4 border hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5 text-white" size={18} />
              </div>
              <div className="font-semibold text-gray-800 text-sm">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 mt-2 transition-colors" />
            </Link>
          ))}
        </div>

        {/* ── Charts row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Year trend — 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Xu hướng theo năm</h3>
                <p className="text-xs text-gray-500">Ấn phẩm và hoạt động NCKH</p>
              </div>
              <div className="flex gap-2">
                <button
                  className={`text-xs px-3 py-1 rounded-full ${activeSection === 'pub' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setActiveSection('pub')}
                >Ấn phẩm</button>
                <button
                  className={`text-xs px-3 py-1 rounded-full ${activeSection === 'act' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                  onClick={() => setActiveSection('act')}
                >Hoạt động</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.yearTrend} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="publications" name="Ấn phẩm" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }}
                  hide={activeSection === 'act'} />
                <Line type="monotone" dataKey="activities" name="Hoạt động NC" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4, fill: '#a855f7' }} strokeDasharray="4 2"
                  hide={activeSection === 'pub'} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pub by type — 1 col */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Loại ấn phẩm</h3>
            <p className="text-xs text-gray-500 mb-4">Phân bố theo loại công trình</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={d.pubByType} dataKey="count" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                  {d.pubByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val, name) => [val, '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {d.pubByType.map(t => {
                const Icon = PUB_ICONS[t.type] || FileText;
                return (
                  <div key={t.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <Icon className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{t.label}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{t.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Activity by level + Top scientists ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Activity by level bar chart */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-800 mb-1">Hoạt động NC theo cấp độ</h3>
            <p className="text-xs text-gray-500 mb-4">Phân bố {d.overview.totalActivities} hoạt động theo cấp</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={d.actByLevel} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="level" type="category" tick={{ fontSize: 11 }} width={95} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Số hoạt động" radius={[0, 4, 4, 0]}>
                  {d.actByLevel.map((entry, i) => (
                    <Cell key={i} fill={LEVEL_COLORS[entry.level] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top scientists */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800">Top Nhà khoa học</h3>
                <p className="text-xs text-gray-500">Nhiều ấn phẩm nhất</p>
              </div>
              <Link href="/dashboard/research/scientists" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                Xem tất cả <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {d.topScientists.slice(0, 6).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-gray-200 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.degree && <span className="text-purple-600 mr-1">{s.degree}</span>}
                      {s.unit}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-indigo-600">{s.pubCount}</div>
                    <div className="text-xs text-gray-400">ấn phẩm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent publications ─────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Ấn phẩm gần đây</h3>
              <p className="text-xs text-gray-500 mt-0.5">10 ấn phẩm mới nhất theo năm</p>
            </div>
            <Link href="/dashboard/research/management" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Quản lý <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y">
            {d.recentPublications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">Chưa có ấn phẩm nào</div>
            ) : d.recentPublications.map(p => {
              const Icon = PUB_ICONS[p.type] || FileText;
              return (
                <div key={p.id} className="px-5 py-3 flex items-start gap-4 hover:bg-indigo-50/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: p.typeColor + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: p.typeColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 line-clamp-1">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium text-gray-700">{p.author}</span>
                      {p.authorRank && <span className="text-gray-400 ml-1">· {p.authorRank}</span>}
                      {p.coAuthors && <span className="text-gray-400 ml-1">· {p.coAuthors}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: p.typeColor + '15', color: p.typeColor }}>
                      {p.typeLabel}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{p.year}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Recent activities ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Hoạt động Nghiên cứu gần đây</h3>
              <p className="text-xs text-gray-500 mt-0.5">5 hoạt động mới nhất</p>
            </div>
            <Link href="/dashboard/research/management" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Xem hết <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y">
            {d.recentActivities.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-4 hover:bg-indigo-50/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 line-clamp-1">{a.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">{a.author}</span>
                    {a.institution && <span className="text-gray-400 ml-1">· {a.institution}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">{a.level}</span>
                  <span className="text-xs text-gray-400 font-mono">{a.year}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
