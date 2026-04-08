'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search, Users, GraduationCap, FlaskConical, Award,
  Eye, ChevronLeft, ChevronRight, Loader2, Map, TrendingUp, Download,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScientistListItem {
  id: string
  userId: string
  academicRank: string | null
  degree: string | null
  specialization: string | null
  researchFields: string[]
  hIndex: number
  i10Index: number
  totalCitations: number
  totalPublications: number
  projectLeadCount: number
  projectMemberCount: number
  bio: string | null
  user: {
    id: string
    name: string
    rank: string | null
    militaryId: string | null
    email: string
    unitId: string | null
    unitRelation: { id: string; name: string } | null
  }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần kỹ thuật',
  KHOA_HOC_XA_HOI: 'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT: 'CNTT',
  Y_DUOC: 'Y dược',
  KHAC: 'Khác',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScientistsPage() {
  const [scientists, setScientists] = useState<ScientistListItem[]>([])
  const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  // Filters
  const [keyword, setKeyword] = useState('')
  const [degree, setDegree] = useState('')
  const [academicRank, setAcademicRank] = useState('')
  const [researchField, setResearchField] = useState('')
  const [page, setPage] = useState(1)

  // Stats
  const [stats, setStats] = useState({ total: 0, withHIndex: 0, totalPubs: 0, avgHIndex: 0 })
  const [exporting, setExporting] = useState(false)

  const fetchScientists = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (degree && degree !== 'all') params.set('degree', degree)
      if (academicRank && academicRank !== 'all') params.set('academicRank', academicRank)
      if (researchField && researchField !== 'all') params.set('researchField', researchField)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/research/scientists?${params}`)
      const json = await res.json()
      if (json.success) {
        setScientists(json.data ?? [])
        setMeta(json.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 })

        // compute quick stats from page data
        const items: ScientistListItem[] = json.data ?? []
        const withH = items.filter((s) => s.hIndex > 0).length
        const sumH = items.reduce((a, s) => a + s.hIndex, 0)
        const sumPubs = items.reduce((a, s) => a + s.totalPublications, 0)
        setStats({
          total: json.meta?.total ?? 0,
          withHIndex: withH,
          totalPubs: sumPubs,
          avgHIndex: withH > 0 ? Math.round((sumH / withH) * 10) / 10 : 0,
        })
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [keyword, degree, academicRank, researchField, page])

  useEffect(() => { fetchScientists() }, [fetchScientists])

  function resetFilters() {
    setKeyword('')
    setDegree('')
    setAcademicRank('')
    setResearchField('')
    setPage(1)
  }

  const hasFilter = keyword || (degree && degree !== 'all') || (academicRank && academicRank !== 'all') || (researchField && researchField !== 'all')

  async function handleExport() {
    setExporting(true)
    try {
      const body: Record<string, string> = {}
      if (researchField && researchField !== 'all') body.researchField = researchField
      if (academicRank && academicRank !== 'all') body.academicRank = academicRank

      const res = await fetch('/api/research/scientists/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { alert('Xuất thất bại'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scientists_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Lỗi kết nối')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-600" />
            Hồ sơ Nhà khoa học
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Hồ sơ 360° — chỉ số khoa học, công bố, đề tài
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Xuất CSV
          </Button>
          <Link href="/dashboard/research/scientists/capacity-map">
            <Button variant="outline" className="gap-2">
              <Map className="h-4 w-4" />
              Bản đồ năng lực
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              Tổng nhà KH
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              H-index TB
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHIndex}</div>
            <div className="text-xs text-gray-400">{stats.withHIndex} người có H-index</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-violet-500" />
              Công bố (trang này)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPubs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-emerald-500" />
              Trang hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meta.page}/{meta.totalPages}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên..."
                  value={keyword}
                  onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={degree || 'all'} onValueChange={(v) => { setDegree(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Học vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả học vị</SelectItem>
                <SelectItem value="TS">Tiến sĩ</SelectItem>
                <SelectItem value="ThS">Thạc sĩ</SelectItem>
                <SelectItem value="PGS.TS">PGS.TS</SelectItem>
                <SelectItem value="GS.TS">GS.TS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={academicRank || 'all'} onValueChange={(v) => { setAcademicRank(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Học hàm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả học hàm</SelectItem>
                <SelectItem value="GS">Giáo sư</SelectItem>
                <SelectItem value="PGS">Phó Giáo sư</SelectItem>
              </SelectContent>
            </Select>

            <Select value={researchField || 'all'} onValueChange={(v) => { setResearchField(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Lĩnh vực" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilter && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                Xóa lọc
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : scientists.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy nhà khoa học phù hợp
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhà khoa học</TableHead>
                  <TableHead>Học hàm / Học vị</TableHead>
                  <TableHead>Lĩnh vực NC</TableHead>
                  <TableHead className="text-center">H-index</TableHead>
                  <TableHead className="text-center">Công bố</TableHead>
                  <TableHead className="text-center">Đề tài CN</TableHead>
                  <TableHead className="text-center">Trích dẫn</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scientists.map((s) => (
                  <TableRow key={s.id}>
                    {/* Nhà khoa học */}
                    <TableCell>
                      <div className="font-medium text-gray-900">{s.user.name}</div>
                      <div className="text-xs text-gray-400">
                        {s.user.rank && <span>{s.user.rank} · </span>}
                        {s.user.unitRelation?.name ?? '—'}
                      </div>
                      {s.specialization && (
                        <div className="text-xs text-violet-600 mt-0.5">{s.specialization}</div>
                      )}
                    </TableCell>

                    {/* Học hàm / Học vị */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {s.academicRank && (
                          <Badge variant="outline" className="text-xs w-fit bg-amber-50 text-amber-700 border-amber-200">
                            {s.academicRank}
                          </Badge>
                        )}
                        {s.degree && (
                          <Badge variant="outline" className="text-xs w-fit bg-blue-50 text-blue-700 border-blue-200">
                            {s.degree}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Lĩnh vực */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.researchFields.slice(0, 2).map((f) => (
                          <Badge key={f} variant="outline" className="text-xs bg-violet-50 text-violet-700 border-violet-200">
                            {FIELD_LABELS[f] ?? f}
                          </Badge>
                        ))}
                        {s.researchFields.length > 2 && (
                          <span className="text-xs text-gray-400">+{s.researchFields.length - 2}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Chỉ số */}
                    <TableCell className="text-center">
                      <span className={`font-bold text-lg ${s.hIndex >= 5 ? 'text-emerald-600' : s.hIndex > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        {s.hIndex}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-gray-800">{s.totalPublications}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium text-gray-800">{s.projectLeadCount}</span>
                      {s.projectMemberCount > s.projectLeadCount && (
                        <span className="text-xs text-gray-400 block">+{s.projectMemberCount - s.projectLeadCount} tham gia</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {s.totalCitations.toLocaleString()}
                    </TableCell>

                    {/* Action */}
                    <TableCell>
                      <Link href={`/dashboard/research/scientists/${s.userId}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <span className="text-sm text-gray-500">
              {meta.total} nhà khoa học · Trang {meta.page}/{meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
