'use client'

/**
 * Department Head Dashboard – M11 Phase 1
 * Dành cho: Trưởng phòng / trưởng khoa (CHI_HUY_KHOA_PHONG, CHU_NHIEM_BO_MON, ...)
 *
 * Polling 30s thay vì WebSocket (Phase 1).
 * Scope: UNIT – chỉ thấy dữ liệu trong đơn vị quản lý.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, FlaskConical, Trophy,
  Clock, AlertTriangle, RefreshCw, ChevronRight,
  CheckCircle2, Building2, GraduationCap, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const POLL_INTERVAL_MS = 30_000

// ── Types ────────────────────────────────────────────────────────────────────

interface DeptStats {
  unitPersonnel: { total: number; active: number }
  instructors: { total: number }
  workflowPending: number
  rewardPipeline: number
  activeResearch: number
}

interface DashboardMe {
  dashboardKey: string
  unitId: string | null
  allowedWidgetKeys: string[]
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
  href,
  isAlert,
}: {
  title: string
  value: number | string
  sub?: string
  icon: React.ElementType
  accent: string
  href?: string
  isAlert?: boolean
}) {
  const inner = (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${isAlert && Number(value) > 0 ? 'text-red-600' : ''}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
            style={{ background: accent }}
          >
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {isAlert && Number(value) > 0 && (
          <div className="absolute top-2 right-2">
            <span className="w-2 h-2 rounded-full bg-red-500 block animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentDashboardPage() {
  const [stats, setStats] = useState<DeptStats | null>(null)
  const [me, setMe] = useState<DashboardMe | null>(null)
  const [alertCounts, setAlertCounts] = useState({ workflowPending: 0, slaOverdue: 0 })
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/me')
      if (!res.ok) return
      const json = await res.json()
      if (json.success) setMe(json.data)
    } catch {
      // silent – non-critical
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/department-head/overview')
      if (!res.ok) throw new Error('Lỗi tải dữ liệu')
      const json = await res.json()
      setStats({
        unitPersonnel: { total: json.overview?.instructorsCount ?? 0, active: json.overview?.instructorsCount ?? 0 },
        instructors: { total: json.overview?.instructorsCount ?? 0 },
        workflowPending: 0,
        rewardPipeline: 0,
        activeResearch: json.overview?.projectsCount ?? 0,
      })
      setLastUpdated(new Date())
    } catch {
      toast.error('Không thể tải dữ liệu dashboard')
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      const [wfRes, slaRes] = await Promise.all([
        fetch('/api/dashboard/widgets/WORKFLOW_PENDING/data?scope=UNIT'),
        fetch('/api/dashboard/widgets/SLA_OVERDUE/data?scope=UNIT'),
      ])
      const [wf, sla] = await Promise.all([wfRes.json(), slaRes.json()])
      setAlertCounts({
        workflowPending: wf.success ? (wf.data?.count ?? 0) : 0,
        slaOverdue: sla.success ? (sla.data?.count ?? 0) : 0,
      })
    } catch {
      // silent
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchMe(), fetchStats(), fetchAlerts()])
    setLoading(false)
  }, [fetchMe, fetchStats, fetchAlerts])

  useEffect(() => {
    loadAll()
    const timer = setInterval(loadAll, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [loadAll])

  const handleRefresh = () => {
    loadAll()
    fetch('/api/dashboard/me')
      .then(() => null)
      .catch(() => null)
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Trưởng Phòng / Khoa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tổng quan đơn vị
            {lastUpdated && (
              <span className="ml-2 text-xs">
                · Cập nhật {lastUpdated.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(alertCounts.workflowPending > 0 || alertCounts.slaOverdue > 0) && (
            <Badge variant="destructive">
              {alertCounts.workflowPending + alertCounts.slaOverdue} cảnh báo
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            title="Nhân sự đơn vị"
            value={stats?.unitPersonnel.total ?? 0}
            sub={`${stats?.unitPersonnel.active ?? 0} đang công tác`}
            icon={Users}
            accent="#3B82F6"
            href="/dashboard/personnel"
          />
          <KpiCard
            title="Giảng viên"
            value={stats?.instructors.total ?? 0}
            icon={BookOpen}
            accent="#8B5CF6"
            href="/dashboard/faculty-student/overview"
          />
          <KpiCard
            title="Đề tài NCKH"
            value={stats?.activeResearch ?? 0}
            sub="đang thực hiện"
            icon={FlaskConical}
            accent="#06B6D4"
            href="/dashboard/research/overview"
          />
          <KpiCard
            title="Chờ phê duyệt"
            value={alertCounts.workflowPending}
            sub={alertCounts.slaOverdue > 0 ? `${alertCounts.slaOverdue} quá hạn SLA` : undefined}
            icon={Clock}
            accent="#F59E0B"
            href="/dashboard/workflow"
            isAlert={alertCounts.workflowPending > 0}
          />
        </div>
      )}

      {/* Alert bar */}
      {alertCounts.slaOverdue > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>{alertCounts.slaOverdue}</strong> quy trình phê duyệt đang vượt quá thời hạn xử lý.
          </span>
          <Link href="/dashboard/workflow" className="ml-auto text-red-700 underline text-xs">
            Xem ngay
          </Link>
        </div>
      )}

      {/* Navigation tiles */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">
          Chức năng quản lý
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {NAV_TILES.map(tile => (
            <Link key={tile.id} href={tile.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                    style={{ background: tile.accent }}
                  >
                    <tile.icon className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-sm font-medium leading-tight">{tile.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground">{tile.desc}</p>
                  <div className="flex items-center mt-2 text-xs text-primary">
                    Xem chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Status footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        Dashboard tự động làm mới mỗi 30 giây
        {me?.unitId && <span>· Đơn vị: {me.unitId}</span>}
      </div>
    </div>
  )
}

// ── Nav tiles config ──────────────────────────────────────────────────────────

const NAV_TILES = [
  {
    id: 'personnel',
    title: 'Nhân sự đơn vị',
    desc: 'Danh sách cán bộ, lịch sử công tác',
    icon: Users,
    accent: '#3B82F6',
    href: '/dashboard/personnel',
  },
  {
    id: 'faculty',
    title: 'Giảng viên – Học viên',
    desc: 'Tình trạng giảng dạy và học tập',
    icon: BookOpen,
    accent: '#8B5CF6',
    href: '/dashboard/faculty-student/overview',
  },
  {
    id: 'research',
    title: 'Nghiên cứu khoa học',
    desc: 'Đề tài và công bố của đơn vị',
    icon: FlaskConical,
    accent: '#06B6D4',
    href: '/dashboard/research/overview',
  },
  {
    id: 'emulation',
    title: 'Thi đua – Khen thưởng',
    desc: 'Hồ sơ khen thưởng đang xử lý',
    icon: Trophy,
    accent: '#D97706',
    href: '/dashboard/emulation',
  },
  {
    id: 'policy',
    title: 'Chế độ chính sách',
    desc: 'Hồ sơ chính sách của đơn vị',
    icon: FileText,
    accent: '#EC4899',
    href: '/dashboard/policy',
  },
  {
    id: 'workflow',
    title: 'Quy trình phê duyệt',
    desc: 'Hồ sơ chờ duyệt và quá hạn',
    icon: Clock,
    accent: '#F59E0B',
    href: '/dashboard/workflow',
  },
  {
    id: 'education',
    title: 'Giáo dục đào tạo',
    desc: 'Lớp học, điểm, cảnh báo học vụ',
    icon: GraduationCap,
    accent: '#14B8A6',
    href: '/dashboard/education',
  },
  {
    id: 'unit',
    title: 'Thông tin đơn vị',
    desc: 'Cơ cấu tổ chức đơn vị',
    icon: Building2,
    accent: '#6366F1',
    href: '/dashboard/officer-management',
  },
]
