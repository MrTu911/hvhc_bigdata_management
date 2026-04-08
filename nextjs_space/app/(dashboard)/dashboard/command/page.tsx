'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, GraduationCap, Building2, Shield, Heart,
  FileText, BookOpen, Activity, TrendingUp, Database,
  RefreshCw, ChevronRight, FlaskConical, ShieldCheck,
  Trophy, Clock, Brain, Zap, Flag, Target, AlertTriangle,
  CheckCircle2, Star, BarChart3, Medal, Cpu, HardDrive,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ── Config ─────────────────────────────────────────────────────────────────

const DB_TILES = [
  { id: 'personnel', title: 'CSDL Quân nhân',    icon: Users,        accent: '#3B82F6', href: '/dashboard/personnel' },
  { id: 'party',     title: 'CSDL Đảng viên',    icon: Shield,       accent: '#DC2626', href: '/dashboard/party' },
  { id: 'awards',    title: 'CSDL Thi đua KT',   icon: Trophy,       accent: '#D97706', href: '/dashboard/emulation' },
  { id: 'policy',    title: 'CSDL Chính sách',   icon: Heart,        accent: '#EC4899', href: '/dashboard/policy' },
  { id: 'insurance', title: 'CSDL BHXH',         icon: ShieldCheck,  accent: '#10B981', href: '/dashboard/insurance' },
  { id: 'faculty',   title: 'CSDL Giảng viên',   icon: BookOpen,     accent: '#8B5CF6', href: '/dashboard/faculty-student/overview' },
  { id: 'research',  title: 'CSDL Nghiên cứu KH',icon: FlaskConical, accent: '#06B6D4', href: '/dashboard/research/overview' },
  { id: 'education', title: 'CSDL Giáo dục ĐT',  icon: GraduationCap,accent: '#14B8A6', href: '/dashboard/education' },
];

const ROLE_LABELS: Record<string, string> = {
  QUAN_TRI_HE_THONG:  'Quản trị',
  ADMIN:              'Admin',
  CHI_HUY_HOC_VIEN:  'Chỉ huy HV',
  CHI_HUY_KHOA_PHONG:'Chỉ huy KP',
  CHU_NHIEM_BO_MON:  'Chủ nhiệm BM',
  GIANG_VIEN:        'Giảng viên',
  HOC_VIEN:          'Học viên',
  HOC_VIEN_SINH_VIEN:'HV/SV',
  NGHIEN_CUU_VIEN:   'NCV',
};
const PIE_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16'];
const WORKSTATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang công tác', TRANSFERRED: 'Chuyển đơn vị',
  RETIRED: 'Đã nghỉ hưu',  SUSPENDED: 'Tạm hoãn', RESIGNED: 'Thôi việc',
};
const WORKSTATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10B981', TRANSFERRED: '#3B82F6', RETIRED: '#94A3B8',
  SUSPENDED: '#F59E0B', RESIGNED: '#EF4444',
};

// ── Types ───────────────────────────────────────────────────────────────────

interface ExecData {
  personnel: { total: number; active: number; officers: number; instructors: number; students: number; byRole: Record<string,number>; byWorkStatus: Record<string,number> };
  partyMembers: { total: number; coverage: number; byStatus: Record<string,number> };
  policy: { total: number; byType: Record<string,number> };
  insurance: { total: number; coverage: number };
  medical: { total: number };
  units: { total: number; byLevel: Record<string,number> };
  awards: { total: number; byType: Record<string,number> };
  faculty: { total: number; research: number; publications: number };
  systemModules: { id: string; name: string; status: string; records: number }[];
}
interface TrainingData {
  overview: { totalStudents: number; totalInstructors: number; totalDepartments: number; totalCourses: number };
  byDepartment: { id: string; name: string; students: number; instructors: number; courses: number; averageGrade: number; completionRate: number }[];
  performanceMetrics: { overallCompletionRate: number; averageGrade: number; passRate: number; excellenceRate: number };
}
interface ResearchData {
  overview: { totalProjects: number; activeProjects: number; totalResearchers: number; totalModels: number; publications: number };
  byCategory: { category: string; total: number; inProgress: number; completed: number }[];
}
interface PolicyStats {
  requestsByStatus: { status: string; count: number }[];
  summary: { totalRequests: number };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="text-right select-none">
      <div className="text-2xl font-mono font-bold text-white tracking-widest leading-none">
        {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-xs text-blue-100 mt-0.5 uppercase tracking-wide">
        {now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
      </div>
    </div>
  );
}

function RingGauge({ pct, color, size = 72, stroke = 7 }: { pct: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = Math.min(100, pct) / 100 * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{value.toLocaleString()}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CommandDashboard() {
  const [exec, setExec] = useState<ExecData | null>(null);
  const [training, setTraining] = useState<TrainingData | null>(null);
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [policy, setPolicy] = useState<PolicyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [eRes, tRes, rRes, pRes] = await Promise.all([
        fetch('/api/command/executive-summary'),
        fetch('/api/command/training-stats'),
        fetch('/api/command/research-stats'),
        fetch('/api/policy/stats'),
      ]);
      const [eJson, tJson, rJson, pJson] = await Promise.all([eRes.json(), tRes.json(), rRes.json(), pRes.json()]);
      if (eJson.success) setExec(eJson.data);
      if (tJson.success) setTraining(tJson.data);
      if (rJson.success) setResearch(rJson.data);
      if (pJson && !pJson.error) setPolicy(pJson);
      setLastUpdated(new Date());
    } catch {
      toast.error('Lỗi tải dữ liệu Dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 120_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // ── Derived values ────────────────────────────────────────────────────────

  const pm = training?.performanceMetrics;
  const statusMap = Object.fromEntries((policy?.requestsByStatus ?? []).map(s => [s.status, s.count]));
  const pendingPolicy = (statusMap['SUBMITTED'] ?? 0) + (statusMap['UNDER_REVIEW'] ?? 0);

  const dbValues: Record<string, { value: number; sub: string }> = {
    personnel: { value: exec?.personnel.total ?? 0,      sub: `${exec?.personnel.active ?? 0} đang công tác` },
    party:     { value: exec?.partyMembers.total ?? 0,   sub: `${exec?.partyMembers.coverage ?? 0}% bao phủ` },
    awards:    { value: exec?.awards.total ?? 0,          sub: `${exec?.awards.byType?.KHEN_THUONG ?? 0} khen thưởng` },
    policy:    { value: exec?.policy.total ?? 0,          sub: `${pendingPolicy} đang chờ duyệt` },
    insurance: { value: exec?.insurance.total ?? 0,       sub: `${exec?.insurance.coverage ?? 0}% bao phủ` },
    faculty:   { value: exec?.faculty.total ?? 0,         sub: `${exec?.faculty.publications ?? 0} công bố KH` },
    research:  { value: research?.overview.totalProjects ?? exec?.faculty.research ?? 0, sub: `${research?.overview.activeProjects ?? 0} đang thực hiện` },
    education: { value: training?.overview.totalCourses ?? 0, sub: `${training?.overview.totalStudents ?? 0} học viên` },
  };

  const roleData = Object.entries(exec?.personnel.byRole ?? {})
    .map(([k, v]) => ({ name: ROLE_LABELS[k] ?? k, value: v }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const workStatusData = Object.entries(exec?.personnel.byWorkStatus ?? {})
    .map(([k, v]) => ({ name: WORKSTATUS_LABELS[k] ?? k, value: v, color: WORKSTATUS_COLORS[k] ?? '#94A3B8' }))
    .filter(d => d.value > 0);

  const deptData = (training?.byDepartment ?? [])
    .filter(d => d.students > 0 || d.courses > 0)
    .slice(0, 8)
    .map(d => ({ name: d.name.length > 14 ? d.name.slice(0, 14) + '…' : d.name, 'Điểm TB': d.averageGrade, 'Hoàn thành': d.completionRate }));

  const researchCatData = (research?.byCategory ?? []).slice(0, 6)
    .map(c => ({ name: c.category.length > 16 ? c.category.slice(0,16)+'…' : c.category, 'Đang thực hiện': c.inProgress, 'Hoàn thành': c.completed }));

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading && !exec) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-blue-100 font-medium tracking-wide">Đang tải dữ liệu chỉ huy…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══ HERO HEADER ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600">
        {/* decorative grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.4) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* left: title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-600 shadow-lg shadow-red-900/50 flex items-center justify-center flex-shrink-0">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400 bg-red-950/60 px-2 py-0.5 rounded">
                  Mật — Nội bộ
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-500/30 text-xs">● Trực tuyến</Badge>
              </div>
              <h1 className="text-xl font-bold text-white mt-0.5 tracking-wide">
                DASHBOARD CHỈ HUY — HỌC VIỆN HẬU CẦN
              </h1>
              <p className="text-blue-100 text-sm">Hệ thống Quản lý Dữ liệu Lớn · HVHC BigData v8.9</p>
            </div>
          </div>
          {/* right: clock + refresh */}
          <div className="flex items-center gap-4">
            <LiveClock />
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/40 text-white/80 hover:bg-white/20 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {lastUpdated ? lastUpdated.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-[1600px] mx-auto">

        {/* ══ ALERT BANNER ═════════════════════════════════════════════════ */}
        {pendingPolicy > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-full bg-amber-100"><AlertTriangle className="w-4 h-4 text-amber-600" /></div>
              <p className="text-sm font-semibold text-amber-800">
                <strong>{pendingPolicy}</strong> yêu cầu chính sách đang chờ phê duyệt
              </p>
            </div>
            <Link href="/dashboard/policy/approval">
              <Button size="sm" className="h-8 bg-amber-500 hover:bg-amber-600 text-white text-xs px-3">
                Xét duyệt ngay <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {/* ══ ROW 1: TOP KPI CARDS ═════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { label: 'Tổng cán bộ',     value: exec?.personnel.total ?? 0,      icon: Users,       color: '#3B82F6', bg: 'bg-blue-50',    border: 'border-l-blue-500',   sub: `${exec?.personnel.active ?? 0} đang công tác` },
            { label: 'Tổng đơn vị',     value: exec?.units.total ?? 0,           icon: Building2,   color: '#10B981', bg: 'bg-emerald-50', border: 'border-l-emerald-500', sub: `${exec?.units.byLevel?.level1 ?? 0} cấp cao nhất` },
            { label: 'Đảng viên',        value: exec?.partyMembers.total ?? 0,   icon: Shield,      color: '#DC2626', bg: 'bg-red-50',     border: 'border-l-red-500',    sub: `${exec?.partyMembers.coverage ?? 0}% cán bộ` },
            { label: 'Học viên',         value: training?.overview.totalStudents ?? exec?.personnel.students ?? 0, icon: GraduationCap, color: '#8B5CF6', bg: 'bg-violet-50', border: 'border-l-violet-500', sub: `${training?.overview.totalCourses ?? 0} môn học` },
            { label: 'Đề tài NCKH',      value: research?.overview.totalProjects ?? 0, icon: FlaskConical, color: '#06B6D4', bg: 'bg-cyan-50', border: 'border-l-cyan-500', sub: `${research?.overview.publications ?? 0} công bố` },
            { label: 'Khen thưởng',      value: exec?.awards.byType?.KHEN_THUONG ?? 0, icon: Trophy,  color: '#D97706', bg: 'bg-amber-50',  border: 'border-l-amber-500',  sub: `${exec?.awards.byType?.KY_LUAT ?? 0} kỷ luật` },
          ].map(({ label, value, icon: Icon, color, bg, border, sub }) => (
            <div key={label} className={`${bg} border border-slate-200 border-l-4 ${border} rounded-xl p-4 shadow-sm`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
                  <p className="text-3xl font-bold text-slate-800 mt-0.5 leading-none">{value.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-1.5 truncate">{sub}</p>
                </div>
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: color + '18' }}>
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ ROW 2: 8 CSDL TILES ═════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">8 Cơ sở dữ liệu chính</h2>
            <div className="flex-1 h-px bg-slate-200 ml-2" />
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {exec?.systemModules.filter(m => m.status === 'active').length ?? 0}/8 hoạt động
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {DB_TILES.map(tile => {
              const { value, sub } = dbValues[tile.id] ?? { value: 0, sub: '' };
              const Icon = tile.icon;
              return (
                <Link key={tile.id} href={tile.href}
                  className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  {/* colored top bar */}
                  <div className="h-1.5" style={{ background: tile.accent }} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-lg" style={{ background: tile.accent + '15' }}>
                        <Icon className="w-4 h-4" style={{ color: tile.accent }} />
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-70" />
                    </div>
                    <p className="text-xl font-bold text-slate-800">{value.toLocaleString()}</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-snug">{tile.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug truncate">{sub}</p>
                    <div className="flex items-center gap-1 mt-2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: tile.accent }}>
                      Xem chi tiết <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ══ ROW 3: PERSONNEL CHARTS ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Pie: by role */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-slate-700">Phân bố nhân sự</h3>
            </div>
            <div className="p-4">
              {roleData.length > 0 ? (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie data={roleData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={2}>
                          {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} formatter={(v: any) => [`${v} người`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {roleData.slice(0, 6).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-xs text-slate-600 truncate">{d.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 flex-shrink-0">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Bar: work status */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-slate-700">Trạng thái công tác</h3>
            </div>
            <div className="p-4 space-y-3">
              {workStatusData.length > 0
                ? workStatusData.map(d => (
                    <StatBar key={d.name} label={d.name} value={d.value} max={exec?.personnel.total ?? 1} color={d.color} />
                  ))
                : <div className="h-28 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              }
            </div>
          </div>

          {/* Party coverage */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-semibold text-slate-700">Đảng viên — Thi đua</h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              {/* Party gauge */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <RingGauge pct={exec?.partyMembers.coverage ?? 0} color="#DC2626" size={80} stroke={8} />
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-red-600">
                    {exec?.partyMembers.coverage ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-center">Tỷ lệ Đảng viên</p>
                <p className="text-xs font-bold text-slate-700">{(exec?.partyMembers.total ?? 0).toLocaleString()} đảng viên</p>
              </div>
              {/* Insurance gauge */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <RingGauge pct={exec?.insurance.coverage ?? 0} color="#10B981" size={80} stroke={8} />
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-600">
                    {exec?.insurance.coverage ?? 0}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-center">Bao phủ BHXH</p>
                <p className="text-xs font-bold text-slate-700">{(exec?.insurance.total ?? 0).toLocaleString()} hồ sơ</p>
              </div>
              {/* Awards summary */}
              <div className="col-span-2 pt-2 border-t border-slate-100 space-y-1.5">
                <StatBar label="Khen thưởng" value={exec?.awards.byType?.KHEN_THUONG ?? 0} max={exec?.awards.total ?? 1} color="#D97706" />
                <StatBar label="Kỷ luật" value={exec?.awards.byType?.KY_LUAT ?? 0} max={exec?.awards.total ?? 1} color="#EF4444" />
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 4: TRAINING PERFORMANCE ══════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-slate-700">Giáo dục & Đào tạo</h3>
            </div>
            <div className="flex gap-4">
              {[
                { label: 'Điểm TB toàn viện', value: `${training?.performanceMetrics.averageGrade?.toFixed(1) ?? '—'}/10`, color: 'text-violet-600' },
                { label: 'Tỷ lệ đạt', value: `${training?.performanceMetrics.passRate?.toFixed(0) ?? '—'}%`, color: 'text-emerald-600' },
                { label: 'Xuất sắc', value: `${training?.performanceMetrics.excellenceRate?.toFixed(0) ?? '—'}%`, color: 'text-amber-600' },
                { label: 'Hoàn thành', value: `${training?.performanceMetrics.overallCompletionRate?.toFixed(0) ?? '—'}%`, color: 'text-blue-600' },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Bar: by department */}
            <div className="p-4">
              <p className="text-xs text-slate-500 font-medium mb-3">Điểm TB & Hoàn thành theo khoa/phòng</p>
              {deptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={deptData} barSize={10} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94A3B8' }} angle={-30} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="Điểm TB" fill="#8B5CF6" radius={[3,3,0,0]} />
                    <Bar dataKey="Hoàn thành" fill="#3B82F6" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>

            {/* Progress rings */}
            <div className="p-4 grid grid-cols-2 gap-4">
              {[
                { label: 'Tỷ lệ đạt',    pct: training?.performanceMetrics.passRate ?? 0,              color: '#10B981', textColor: 'text-emerald-600' },
                { label: 'Xuất sắc',      pct: training?.performanceMetrics.excellenceRate ?? 0,        color: '#D97706', textColor: 'text-amber-600' },
                { label: 'Hoàn thành',    pct: training?.performanceMetrics.overallCompletionRate ?? 0, color: '#3B82F6', textColor: 'text-blue-600' },
                { label: 'Tỷ lệ Đảng viên', pct: exec?.partyMembers.coverage ?? 0,                    color: '#DC2626', textColor: 'text-red-600' },
              ].map(({ label, pct, color, textColor }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <RingGauge pct={pct} color={color} size={76} />
                    <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${textColor}`}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 text-center">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ROW 5: RESEARCH + MODULES ════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Research by category */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-semibold text-slate-700">Nghiên cứu khoa học</h3>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-base font-bold text-cyan-600">{research?.overview.totalProjects ?? 0}</p>
                  <p className="text-[10px] text-slate-400">Đề tài</p>
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-600">{research?.overview.publications ?? exec?.faculty.publications ?? 0}</p>
                  <p className="text-[10px] text-slate-400">Công bố</p>
                </div>
                <div>
                  <p className="text-base font-bold text-violet-600">{exec?.faculty.total ?? 0}</p>
                  <p className="text-[10px] text-slate-400">Giảng viên</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {researchCatData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={researchCatData} layout="vertical" barSize={8} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="Đang thực hiện" fill="#06B6D4" radius={[0,3,3,0]} />
                    <Bar dataKey="Hoàn thành" fill="#10B981" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-slate-400 text-sm">Chưa có dữ liệu</div>
              )}
            </div>
          </div>

          {/* System modules + quick actions */}
          <div className="grid grid-rows-2 gap-4">
            {/* Module health */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Trạng thái hệ thống</h3>
                <Badge className="ml-auto bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  {exec?.systemModules.filter(m => m.status === 'active').length ?? 0}/8 Hoạt động
                </Badge>
              </div>
              <div className="p-3 grid grid-cols-2 gap-1.5">
                {exec?.systemModules.map(m => (
                  <div key={m.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.status === 'active' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <span className="text-xs text-slate-600 truncate">{m.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400 flex-shrink-0">{m.records.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden">
              <div className="px-5 pt-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-700">Truy cập nhanh</h3>
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'AI Advisor',       href: '/dashboard/ai-advisor',        icon: Brain,       color: '#8B5CF6' },
                  { label: 'Báo cáo',          href: '/dashboard/reports',            icon: FileText,    color: '#3B82F6' },
                  { label: 'Thi đua KT',       href: '/dashboard/emulation',          icon: Medal,       color: '#D97706' },
                  { label: 'Phân tích',         href: '/dashboard/analytics',          icon: TrendingUp,  color: '#10B981' },
                  { label: 'Giám sát',          href: '/dashboard/monitoring',         icon: Activity,    color: '#06B6D4' },
                  { label: 'Quản trị',          href: '/dashboard/admin',              icon: HardDrive,   color: '#EF4444' },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
                    <div className="p-1 rounded-md" style={{ background: color + '15' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <span className="text-xs text-slate-600 group-hover:text-slate-800 font-medium">{label}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-slate-500 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 6: AI BANNER ═════════════════════════════════════════════ */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-5 shadow-md">
          <div className="absolute right-0 top-0 bottom-0 w-64 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 70%)' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-100 font-semibold uppercase tracking-widest">Tính năng AI</p>
                <h3 className="text-lg font-bold text-white">Phân tích thông minh cho Chỉ huy</h3>
                <p className="text-sm text-purple-100 mt-0.5">
                  Dự báo nhân sự · Phân tích rủi ro · Tư vấn chính sách · Tổng hợp báo cáo tự động
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Link href="/dashboard/ai-advisor">
                <Button size="sm" className="bg-white text-purple-700 hover:bg-purple-50 font-semibold shadow-sm">
                  <Brain className="w-4 h-4 mr-1.5" /> Mở AI Advisor
                </Button>
              </Link>
              <Link href="/dashboard/analytics/advanced">
                <Button size="sm" variant="outline" className="border-white/40 text-purple-700 hover:bg-white/20">
                  <TrendingUp className="w-4 h-4 mr-1.5" /> Phân tích nâng cao
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* footer */}
        <p className="text-center text-xs text-slate-400 pb-2">
          HVHC BigData Management · Dashboard Chỉ huy v8.9 · Dữ liệu thực từ hệ thống · Cập nhật tự động mỗi 2 phút
        </p>
      </div>
    </div>
  );
}
