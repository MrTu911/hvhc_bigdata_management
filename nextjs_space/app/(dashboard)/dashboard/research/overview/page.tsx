'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FlaskConical, FileText, Users, TrendingUp, BookOpen,
  DollarSign, Award, AlertTriangle, CheckCircle2, Clock,
  BarChart3, RefreshCw, ArrowRight, Microscope, Cpu,
  Globe, Star, BookMarked, Zap, Target, Activity,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
  Legend, RadialBarChart, RadialBar,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────

interface KPI {
  totalProjects: number
  inProgressCount: number
  completedCount: number
  totalPublications: number
  totalCitations: number
  scientistCount: number
  totalBudget: number
  avgBudget: number
  isiScopusCount: number
  completedThisYear: number
  overdueCount: number
}

interface OverviewData {
  kpi: KPI
  projectsByStatus: { status: string; label: string; count: number }[]
  projectsByCategory: { category: string; label: string; count: number }[]
  projectsByField: { field: string; label: string; count: number }[]
  yearTrend: { year: number; projects: number; publications: number }[]
  pubsByType: { pubType: string; label: string; count: number }[]
  recentProjects: {
    id: string; projectCode: string; title: string
    status: string; statusLabel: string
    category: string; categoryLabel: string
    field: string; fieldLabel: string
    budgetYear: number | null; budgetApproved: number | null
    startDate: string | null; endDate: string | null
    piName: string | null; unitName: string | null
    memberCount: number; milestoneCount: number
  }[]
  topScientists: {
    id: string; userId: string; name: string
    academicRank: string | null; degree: string | null; specialization: string | null
    hIndex: number; i10Index: number
    totalCitations: number; totalPublications: number; projectLeadCount: number
  }[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8',
  SUBMITTED: '#60a5fa',
  UNDER_REVIEW: '#f59e0b',
  APPROVED: '#34d399',
  REJECTED: '#f87171',
  IN_PROGRESS: '#6366f1',
  PAUSED: '#fb923c',
  COMPLETED: '#10b981',
  CANCELLED: '#6b7280',
}

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  SUBMITTED: 'bg-blue-100 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  PAUSED: 'bg-orange-100 text-orange-700 border-orange-200',
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

const FIELD_COLORS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: '#6366f1',
  HAU_CAN_KY_THUAT: '#f59e0b',
  KHOA_HOC_XA_HOI: '#10b981',
  KHOA_HOC_TU_NHIEN: '#3b82f6',
  CNTT: '#8b5cf6',
  Y_DUOC: '#ec4899',
  KHAC: '#94a3b8',
}

const FIELD_ICONS: Record<string, React.ReactNode> = {
  HOC_THUAT_QUAN_SU: <Target className="h-4 w-4" />,
  HAU_CAN_KY_THUAT: <Zap className="h-4 w-4" />,
  KHOA_HOC_XA_HOI: <Users className="h-4 w-4" />,
  KHOA_HOC_TU_NHIEN: <Microscope className="h-4 w-4" />,
  CNTT: <Cpu className="h-4 w-4" />,
  Y_DUOC: <Activity className="h-4 w-4" />,
  KHAC: <Star className="h-4 w-4" />,
}

const CATEGORY_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ec4899']

function formatBudget(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} tỷ`
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} triệu`
  return val.toLocaleString('vi-VN')
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className ?? ''}`} />
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  gradient: string
  sub?: string
  subColor?: string
  href?: string
}

function KpiCard({ label, value, icon, gradient, sub, subColor, href }: KpiCardProps) {
  const content = (
    <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow ${gradient}`}>
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide truncate">{label}</p>
            <p className="text-white text-2xl font-bold mt-1 leading-tight">{value}</p>
            {sub && (
              <p className={`text-xs mt-1 font-medium ${subColor ?? 'text-white/70'}`}>{sub}</p>
            )}
          </div>
          <div className="text-white/70 ml-3 flex-shrink-0">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ResearchOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/research/overview')
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError(json.error ?? 'Không tải được dữ liệu')
      }
    } catch {
      setError('Lỗi kết nối máy chủ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const kpi = data?.kpi

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-2xl">
        {/* decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                <FlaskConical className="h-7 w-7 text-indigo-300" />
              </div>
              <Badge className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 text-xs uppercase tracking-widest">
                Module M09
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Nghiên cứu Khoa học
            </h1>
            <p className="text-indigo-300/80 mt-1.5 text-sm max-w-xl">
              Tổng quan hoạt động NCKH toàn Học viện — đề tài, công bố, nhà khoa học và xu hướng nghiên cứu
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        {/* mini stat strip inside hero */}
        {!loading && kpi && (
          <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Đề tài đang thực hiện', value: kpi.inProgressCount, color: 'text-indigo-300' },
              { label: 'Hoàn thành năm nay', value: kpi.completedThisYear, color: 'text-emerald-300' },
              { label: 'ISI / Scopus', value: kpi.isiScopusCount, color: 'text-violet-300' },
              { label: 'Quá hạn cần xử lý', value: kpi.overdueCount, color: 'text-rose-300' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Lỗi tải dữ liệu</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="ml-auto">Thử lại</Button>
          </CardContent>
        </Card>
      ) : kpi ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="Tổng đề tài NCKH"
            value={kpi.totalProjects}
            icon={<FlaskConical className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-indigo-600 to-violet-700"
            sub={`${kpi.inProgressCount} đang thực hiện`}
            href="/dashboard/research/management"
          />
          <KpiCard
            label="Công bố khoa học"
            value={kpi.totalPublications}
            icon={<FileText className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-blue-600 to-cyan-600"
            sub={`${kpi.isiScopusCount} ISI/Scopus`}
            href="/dashboard/research/publications"
          />
          <KpiCard
            label="Tổng trích dẫn"
            value={kpi.totalCitations.toLocaleString('vi-VN')}
            icon={<BookOpen className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-violet-600 to-purple-700"
            href="/dashboard/research/publications"
          />
          <KpiCard
            label="Nhà khoa học"
            value={kpi.scientistCount}
            icon={<Users className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            href="/dashboard/research/scientists"
          />
          <KpiCard
            label="Hoàn thành"
            value={kpi.completedCount}
            icon={<CheckCircle2 className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            sub={`${kpi.completedThisYear} năm nay`}
          />
          <KpiCard
            label="Tổng kinh phí"
            value={formatBudget(kpi.totalBudget) || '—'}
            icon={<DollarSign className="h-8 w-8" />}
            gradient="bg-gradient-to-br from-rose-500 to-pink-700"
            sub={kpi.totalBudget > 0 ? `TB: ${formatBudget(kpi.avgBudget)}` : 'Chưa có dữ liệu'}
          />
        </div>
      ) : null}

      {/* ── Charts Row 1: Status Donut + Category Bar ──────────────────────── */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Status Donut */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                Đề tài theo Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.projectsByStatus.length === 0 ? (
                <EmptyChart />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data.projectsByStatus}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {data.projectsByStatus.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                    {data.projectsByStatus.map((s) => (
                      <div key={s.status} className="flex items-center gap-2 text-xs">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                        />
                        <span className="text-muted-foreground truncate">{s.label}</span>
                        <span className="font-semibold text-foreground ml-auto">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Category Bar */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Đề tài theo Cấp độ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.projectsByCategory.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={data.projectsByCategory}
                    layout="vertical"
                    margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={130}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Số đề tài" radius={[0, 4, 4, 0]}>
                      {data.projectsByCategory.map((entry, i) => (
                        <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Year Trend Line ────────────────────────────────────────────────── */}
      {!loading && data && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Xu hướng theo Năm (6 năm gần nhất)
              </CardTitle>
              <Link href="/dashboard/research/ai-trends">
                <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                  Phân tích AI <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.yearTrend.every((y) => y.projects === 0 && y.publications === 0) ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.yearTrend} margin={{ left: 0, right: 16, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line
                    type="monotone"
                    dataKey="projects"
                    name="Đề tài NCKH"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="publications"
                    name="Công bố KH"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Field Distribution + Pub Types ────────────────────────────────── */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Field progress bars */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-500" />
                Phân bố theo Lĩnh vực
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.projectsByField.length === 0 ? (
                <EmptyChart />
              ) : (() => {
                const max = Math.max(...data.projectsByField.map((f) => f.count), 1)
                return data.projectsByField.map((f) => (
                  <div key={f.field} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span style={{ color: FIELD_COLORS[f.field] }}>
                          {FIELD_ICONS[f.field]}
                        </span>
                        {f.label}
                      </div>
                      <span className="font-semibold text-foreground">{f.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(f.count / max) * 100}%`,
                          background: FIELD_COLORS[f.field] ?? '#94a3b8',
                        }}
                      />
                    </div>
                  </div>
                ))
              })()}
            </CardContent>
          </Card>

          {/* Publication types bar */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BookMarked className="h-4 w-4 text-blue-500" />
                Công bố theo Loại hình
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.pubsByType.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data.pubsByType}
                    margin={{ left: -10, right: 8, top: 4, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Số công bố" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {data.pubsByType.map((_, i) => (
                        <Cell key={i} fill={['#6366f1','#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#14b8a6','#f97316','#06b6d4'][i % 9]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Top Scientists + Recent Projects ──────────────────────────────── */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Top Scientists */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Nhà khoa học nổi bật
                </CardTitle>
                <Link href="/dashboard/research/scientists">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    Tất cả <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.topScientists.length === 0 ? (
                <EmptyList message="Chưa có hồ sơ nhà khoa học" />
              ) : data.topScientists.map((s, i) => (
                <Link key={s.id} href={`/dashboard/research/scientists/${s.userId}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer group">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
                      ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-600' : 'bg-indigo-400'}
                    `}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[s.academicRank, s.degree, s.specialization].filter(Boolean).join(' · ') || 'NCKH'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">
                        h={s.hIndex}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{s.totalPublications} công bố</span>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Projects */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  Đề tài mới nhất
                </CardTitle>
                <Link href="/dashboard/research/management">
                  <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                    Quản lý <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.recentProjects.length === 0 ? (
                <EmptyList message="Chưa có đề tài nào" />
              ) : data.recentProjects.map((p) => (
                <Link key={p.id} href={`/dashboard/research/projects/${p.id}`}>
                  <div className="p-3 rounded-xl border border-border/60 hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {p.projectCode}
                          </span>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${STATUS_BADGE[p.status] ?? ''}`}>
                            {p.statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                          {p.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                          {p.piName && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />{p.piName}
                            </span>
                          )}
                          {p.categoryLabel && (
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />{p.categoryLabel}
                            </span>
                          )}
                          {p.budgetYear && (
                            <span>{p.budgetYear}</span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {p.budgetApproved ? (
                          <p className="text-xs font-semibold text-emerald-600">
                            {formatBudget(p.budgetApproved)}
                          </p>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {p.memberCount} TV · {p.milestoneCount} CỐT
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick Access ───────────────────────────────────────────────────── */}
      <Card className="shadow-sm border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground">Truy cập nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { href: '/dashboard/research/management',  icon: <FlaskConical className="h-5 w-5" />,  label: 'Quản lý Đề tài',   color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
              { href: '/dashboard/research/publications',icon: <FileText className="h-5 w-5" />,      label: 'Công bố KH',       color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
              { href: '/dashboard/research/scientists',  icon: <Users className="h-5 w-5" />,         label: 'Nhà khoa học',     color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
              { href: '/dashboard/research/ai-trends',   icon: <TrendingUp className="h-5 w-5" />,    label: 'AI Xu hướng',      color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
              { href: '/dashboard/research/repository',  icon: <BookOpen className="h-5 w-5" />,      label: 'Kho Nghiên cứu',   color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
              { href: '/dashboard/research/activities',  icon: <Activity className="h-5 w-5" />,      label: 'Hoạt động KH',    color: 'text-rose-600 bg-rose-50 hover:bg-rose-100' },
              { href: '/dashboard/research/management',  icon: <BarChart3 className="h-5 w-5" />,     label: 'Báo cáo & Thống kê', color: 'text-slate-600 bg-slate-100 hover:bg-slate-200' },
            ].map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${item.color}`}
              >
                {item.icon}
                <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <BarChart3 className="h-8 w-8 opacity-30" />
      <p className="text-xs">Chưa có dữ liệu</p>
    </div>
  )
}

function EmptyList({ message }: { message: string }) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-muted-foreground gap-2">
      <FlaskConical className="h-7 w-7 opacity-30" />
      <p className="text-xs">{message}</p>
    </div>
  )
}
