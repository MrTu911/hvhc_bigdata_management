'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, Map, Users, FlaskConical, GraduationCap, Award,
  Loader2, TrendingUp, Building2, Info,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CapacityMapData {
  byUnit: Array<{ unitId: string | null; unitName: string | null; count: number; avgHIndex: number }>
  byField: Array<{ field: string; count: number; totalPublications: number }>
  byRank: Array<{ rank: string; count: number }>
  byDegree: Array<{ degree: string; count: number; avgHIndex: number }>
  entries: Array<{ unitId: string | null; unitName: string | null; researchField: string; scientistCount: number; avgHIndex: number; totalPublications: number }>
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

// ─── Bar helpers ──────────────────────────────────────────────────────────────

function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CapacityMapPage() {
  const [data, setData] = useState<CapacityMapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [unitFilter, setUnitFilter] = useState('')
  const [fieldFilter, setFieldFilter] = useState('')

  async function fetchMap() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (unitFilter) params.set('unitId', unitFilter)
      if (fieldFilter && fieldFilter !== 'all') params.set('researchField', fieldFilter)
      const res = await fetch(`/api/research/scientists/capacity-map?${params}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchMap() }, [unitFilter, fieldFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const maxUnitCount = Math.max(1, ...(data?.byUnit.map((u) => u.count) ?? [0]))
  const maxFieldCount = Math.max(1, ...(data?.byField.map((f) => f.count) ?? [0]))
  const maxDegreeCount = Math.max(1, ...(data?.byDegree.map((d) => d.count) ?? [0]))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/research/scientists">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Danh sách nhà KH
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Map className="h-6 w-6 text-amber-600" />
              Bản đồ năng lực nghiên cứu
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Phân bố chuyên môn theo đơn vị · lĩnh vực · học hàm · học vị
            </p>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2">
          <Select value={fieldFilter || 'all'} onValueChange={(v) => setFieldFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Lọc lĩnh vực" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lĩnh vực</SelectItem>
              {Object.entries(FIELD_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchMap}>Refresh</Button>
        </div>
      </div>

      {/* SELF scope notice */}
      {!loading && data && data.byUnit.length === 1 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Bản đồ đang hiển thị theo phạm vi đơn vị của bạn.
            Tài khoản có phạm vi <strong>ACADEMY</strong> hoặc <strong>DEPARTMENT</strong>
            sẽ thấy dữ liệu toàn Học viện.
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : !data ? (
        <div className="text-center py-16 text-gray-500">Không tải được dữ liệu</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  Đơn vị có nhà KH
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.byUnit.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-violet-500" />
                  Lĩnh vực NC
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.byField.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  GS/PGS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.byRank.reduce((a, r) => a + r.count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Tổng công bố
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.byField.reduce((a, f) => a + f.totalPublications, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* byUnit */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  Phân bố theo đơn vị
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.byUnit.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                ) : (
                  data.byUnit
                    .sort((a, b) => b.count - a.count)
                    .map((u) => (
                      <div key={u.unitId ?? 'unknown'}>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700 font-medium">{u.unitName ?? 'Chưa xác định'}</span>
                          <div className="flex gap-3 text-gray-500">
                            <span>{u.count} người</span>
                            <span className="text-emerald-600 font-medium">H̄={u.avgHIndex}</span>
                          </div>
                        </div>
                        <HBar value={u.count} max={maxUnitCount} color="bg-amber-400" />
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* byField */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-violet-500" />
                  Phân bố theo lĩnh vực NC
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.byField.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                ) : (
                  data.byField.map((f) => (
                    <div key={f.field}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{FIELD_LABELS[f.field] ?? f.field}</span>
                        <div className="flex gap-3 text-gray-500">
                          <span>{f.count} NKH</span>
                          <span className="text-blue-600">{f.totalPublications} CB</span>
                        </div>
                      </div>
                      <HBar value={f.count} max={maxFieldCount} color="bg-violet-400" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* byRank */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Phân bố theo học hàm
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.byRank.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu học hàm</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {data.byRank.sort((a, b) => b.count - a.count).map((r) => (
                      <div key={r.rank} className="flex-1 min-w-[120px] bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-amber-700">{r.count}</div>
                        <div className="text-sm text-amber-600 mt-1">{r.rank}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* byDegree */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500" />
                  Phân bố theo học vị
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.byDegree.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu học vị</p>
                ) : (
                  data.byDegree.sort((a, b) => b.count - a.count).map((d) => (
                    <div key={d.degree}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-medium">{d.degree}</span>
                        <div className="flex gap-3 text-gray-500">
                          <span>{d.count} người</span>
                          <span className="text-emerald-600 font-medium">H̄={d.avgHIndex}</span>
                        </div>
                      </div>
                      <HBar value={d.count} max={maxDegreeCount} color="bg-blue-400" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Heatmap table: Unit × Field */}
          {data.entries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Map className="h-4 w-4 text-teal-500" />
                  Ma trận năng lực: Đơn vị × Lĩnh vực
                </CardTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Mỗi ô: số nhà KH · H-index TB · tổng công bố (CB). Nền đậm = nhiều hơn.
                </p>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <HeatmapTable entries={data.entries} />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── Heatmap sub-component ────────────────────────────────────────────────────

type Entry = CapacityMapData['entries'][0]

function HeatmapTable({ entries }: { entries: Entry[] }) {
  // Build unique units and fields
  const units = Array.from(new Set(entries.map((e) => e.unitName ?? 'N/A')))
  const fields = Array.from(new Set(entries.map((e) => e.researchField)))

  // Aggregate into cell map
  type CellData = { count: number; hSum: number; pubSum: number }
  const cells: Record<string, CellData> = {}
  for (const e of entries) {
    const key = `${e.unitName ?? 'N/A'}:${e.researchField}`
    if (!cells[key]) cells[key] = { count: 0, hSum: 0, pubSum: 0 }
    cells[key].count += e.scientistCount
    cells[key].hSum += e.avgHIndex
    cells[key].pubSum += e.totalPublications
  }

  const maxCount = Math.max(1, ...Object.values(cells).map((c) => c.count))

  function cellBg(count: number) {
    const pct = count / maxCount
    if (pct === 0) return ''
    if (pct < 0.25) return 'bg-teal-50'
    if (pct < 0.5) return 'bg-teal-100'
    if (pct < 0.75) return 'bg-teal-200'
    return 'bg-teal-300'
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[140px]">Đơn vị \ Lĩnh vực</TableHead>
          {fields.map((f) => (
            <TableHead key={f} className="text-center text-xs min-w-[90px]">
              {FIELD_LABELS[f] ?? f}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {units.map((unit) => (
          <TableRow key={unit}>
            <TableCell className="font-medium text-sm text-gray-700 whitespace-nowrap">{unit}</TableCell>
            {fields.map((f) => {
              const cell = cells[`${unit}:${f}`]
              return (
                <TableCell key={f} className={`text-center text-xs ${cellBg(cell?.count ?? 0)}`}>
                  {cell ? (
                    <div>
                      <div className="font-bold">{cell.count} NKH</div>
                      <div className="text-gray-500">{cell.pubSum} CB</div>
                    </div>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
