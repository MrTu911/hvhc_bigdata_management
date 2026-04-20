'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Plus, X, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MasterDataOption {
  code: string
  nameVi: string
  shortName?: string | null
}

interface ProfileForm {
  academicRank: string
  degree: string
  specialization: string
  researchFields: string[]
  researchKeywords: string[]
  hIndex: string
  i10Index: string
  totalCitations: string
  orcidId: string
  scopusAuthorId: string
  googleScholarId: string
  awards: string[]
  bio: string
}

const RESEARCH_FIELDS = [
  { value: 'HOC_THUAT_QUAN_SU', label: 'Học thuật quân sự' },
  { value: 'HAU_CAN_KY_THUAT', label: 'Hậu cần kỹ thuật' },
  { value: 'KHOA_HOC_XA_HOI', label: 'Khoa học xã hội' },
  { value: 'KHOA_HOC_TU_NHIEN', label: 'Khoa học tự nhiên' },
  { value: 'CNTT', label: 'CNTT' },
  { value: 'Y_DUOC', label: 'Y dược' },
  { value: 'KHAC', label: 'Khác' },
]

const FIELD_LABEL: Record<string, string> = Object.fromEntries(
  RESEARCH_FIELDS.map((f) => [f.value, f.label])
)

// ─── Tag input helper ─────────────────────────────────────────────────────────

function TagInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const val = input.trim()
    if (val && !values.includes(val)) onChange([...values, val])
    setInput('')
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder ?? 'Nhập rồi Enter'}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScientistEditPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [form, setForm] = useState<ProfileForm>({
    academicRank: '', degree: '', specialization: '',
    researchFields: [], researchKeywords: [],
    hIndex: '0', i10Index: '0', totalCitations: '0',
    orcidId: '', scopusAuthorId: '', googleScholarId: '',
    awards: [], bio: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [academicTitleOptions, setAcademicTitleOptions] = useState<MasterDataOption[]>([])
  const [academicDegreeOptions, setAcademicDegreeOptions] = useState<MasterDataOption[]>([])

  // Load M19 options for học hàm / học vị
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/master-data/MD_ACADEMIC_TITLE/items').then(r => r.json()),
      fetch('/api/admin/master-data/MD_ACADEMIC_DEGREE/items').then(r => r.json()),
    ]).then(([titles, degrees]) => {
      if (Array.isArray(titles)) setAcademicTitleOptions(titles)
      if (Array.isArray(degrees)) setAcademicDegreeOptions(degrees)
    }).catch(() => {/* silently ignore — user can still type if M19 unavailable */})
  }, [])

  // Load profile
  useEffect(() => {
    fetch(`/api/research/scientists/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { toast.error(json.error ?? 'Không tải được hồ sơ'); return }
        const p = json.data
        setForm({
          academicRank: p.academicRank ?? '',
          degree: p.degree ?? '',
          specialization: p.specialization ?? '',
          researchFields: p.researchFields ?? [],
          researchKeywords: p.researchKeywords ?? [],
          hIndex: String(p.hIndex ?? 0),
          i10Index: String(p.i10Index ?? 0),
          totalCitations: String(p.totalCitations ?? 0),
          orcidId: p.orcidId ?? '',
          scopusAuthorId: p.scopusAuthorId ?? '',
          googleScholarId: p.googleScholarId ?? '',
          awards: p.awards ?? [],
          bio: p.bio ?? '',
        })
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false))
  }, [userId])

  function set(field: keyof ProfileForm, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleField(field: string) {
    setForm((prev) => ({
      ...prev,
      researchFields: prev.researchFields.includes(field)
        ? prev.researchFields.filter((f) => f !== field)
        : [...prev.researchFields, field],
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/research/scientists/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicRank: form.academicRank || null,
          degree: form.degree || null,
          specialization: form.specialization || null,
          researchFields: form.researchFields,
          researchKeywords: form.researchKeywords,
          hIndex: form.hIndex ? Number(form.hIndex) : undefined,
          i10Index: form.i10Index ? Number(form.i10Index) : undefined,
          totalCitations: form.totalCitations ? Number(form.totalCitations) : undefined,
          orcidId: form.orcidId || null,
          scopusAuthorId: form.scopusAuthorId || null,
          googleScholarId: form.googleScholarId || null,
          awards: form.awards,
          bio: form.bio || null,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Lưu thất bại'); return }
      toast.success('Đã lưu hồ sơ')
      router.refresh()
      router.push(`/dashboard/research/scientists/${userId}`)
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setSaving(false)
    }
  }

  async function handleRefreshStats() {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/research/scientists/${userId}/compute-stats`, { method: 'POST' })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Refresh thất bại'); return }
      const d = json.data
      toast.success(`Đã cập nhật: ${d.totalPublications} công bố, ${d.projectLeadCount} chủ nhiệm`)
      setForm((prev) => ({
        ...prev,
        // stats là computed – không hiển thị trong form, chỉ notify
      }))
    } catch {
      toast.error('Lỗi kết nối')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/research/scientists/${userId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Cập nhật hồ sơ nhà khoa học</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefreshStats} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh chỉ số
          </Button>
          <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Lưu
          </Button>
        </div>
      </div>

      {/* Academic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin học thuật</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Học hàm</Label>
            <Select
              value={form.academicRank || '__NONE__'}
              onValueChange={(v) => set('academicRank', v === '__NONE__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Không có học hàm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">— Không có học hàm —</SelectItem>
                {academicTitleOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.nameVi}>
                    {opt.nameVi}{opt.shortName ? ` (${opt.shortName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Học vị</Label>
            <Select
              value={form.degree || '__NONE__'}
              onValueChange={(v) => set('degree', v === '__NONE__' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Không có học vị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__NONE__">— Không có học vị —</SelectItem>
                {academicDegreeOptions.map((opt) => (
                  <SelectItem key={opt.code} value={opt.nameVi}>
                    {opt.nameVi}{opt.shortName ? ` (${opt.shortName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Chuyên ngành</Label>
            <Input
              id="specialization"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
              placeholder="Chuyên ngành chính"
            />
          </div>
        </CardContent>
      </Card>

      {/* Research fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lĩnh vực nghiên cứu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {RESEARCH_FIELDS.map((f) => {
              const active = form.researchFields.includes(f.value)
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => toggleField(f.value)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                  }`}
                >
                  {active && <span className="mr-1">✓</span>}
                  {f.label}
                </button>
              )
            })}
          </div>
          {form.researchFields.length === 0 && (
            <p className="text-xs text-gray-400">Chọn ít nhất một lĩnh vực</p>
          )}
          <TagInput
            label="Từ khóa nghiên cứu"
            values={form.researchKeywords}
            onChange={(v) => set('researchKeywords', v)}
            placeholder="Nhập từ khóa rồi Enter"
          />
        </CardContent>
      </Card>

      {/* Citation metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chỉ số khoa học (nhập thủ công)</CardTitle>
          <p className="text-xs text-gray-400">
            Chỉ số H-index, i10, trích dẫn cập nhật thủ công hoặc qua UC-48 (Scopus/ORCID sync).
            Số công bố và đề tài là computed — dùng nút &quot;Refresh chỉ số&quot;.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hIndex">H-index</Label>
            <Input
              id="hIndex"
              type="number"
              min={0}
              value={form.hIndex}
              onChange={(e) => set('hIndex', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="i10Index">i10-index</Label>
            <Input
              id="i10Index"
              type="number"
              min={0}
              value={form.i10Index}
              onChange={(e) => set('i10Index', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalCitations">Tổng trích dẫn</Label>
            <Input
              id="totalCitations"
              type="number"
              min={0}
              value={form.totalCitations}
              onChange={(e) => set('totalCitations', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* External IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Định danh ngoài</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orcidId">ORCID ID</Label>
            <Input
              id="orcidId"
              value={form.orcidId}
              onChange={(e) => set('orcidId', e.target.value)}
              placeholder="0000-0000-0000-0000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scopusAuthorId">Scopus Author ID</Label>
            <Input
              id="scopusAuthorId"
              value={form.scopusAuthorId}
              onChange={(e) => set('scopusAuthorId', e.target.value)}
              placeholder="57..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="googleScholarId">Google Scholar ID</Label>
            <Input
              id="googleScholarId"
              value={form.googleScholarId}
              onChange={(e) => set('googleScholarId', e.target.value)}
              placeholder="xxxxx"
            />
          </div>
        </CardContent>
      </Card>

      {/* Awards + Bio */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thành tích & Mô tả</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TagInput
            label="Thành tích nổi bật"
            values={form.awards}
            onChange={(v) => set('awards', v)}
            placeholder="Nhập thành tích rồi Enter"
          />
          <div className="space-y-2">
            <Label htmlFor="bio">Mô tả / Giới thiệu</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              placeholder="Giới thiệu ngắn về hướng nghiên cứu, thành tựu..."
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-400 text-right">{form.bio.length}/2000</p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex justify-end gap-2 pb-8">
        <Link href={`/dashboard/research/scientists/${userId}`}>
          <Button variant="outline">Hủy</Button>
        </Link>
        <Button className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Lưu hồ sơ
        </Button>
      </div>
    </div>
  )
}
