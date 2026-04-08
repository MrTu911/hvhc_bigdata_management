'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft, ExternalLink, Pencil, Loader2,
  Users, GraduationCap, FlaskConical, Award, BookOpen,
  Quote, TrendingUp, FolderKanban, Mail, Phone, Building2,
  Hash, Globe, BookMarked,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScientistProfile {
  id: string
  userId: string
  academicRank: string | null
  degree: string | null
  specialization: string | null
  researchFields: string[]
  primaryField: string | null
  researchKeywords: string[]
  hIndex: number
  i10Index: number
  totalCitations: number
  totalPublications: number
  projectLeadCount: number
  projectMemberCount: number
  orcidId: string | null
  scopusAuthorId: string | null
  googleScholarId: string | null
  awards: string[]
  bio: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    rank: string | null
    militaryId: string | null
    email: string
    phone: string | null
    unitId: string | null
    academicTitle: string | null
    unitRelation: { id: string; name: string } | null
    facultyProfile: {
      academicRank: string | null
      academicDegree: string | null
      specialization: string | null
      researchInterests: string | null
      orcidId: string | null
      googleScholarUrl: string | null
    } | null
    scientificProfile: {
      summary: string | null
      pdfPath: string | null
      isPublic: boolean
    } | null
  }
  recentPublications: Array<{
    id: string
    title: string
    pubType: string
    publishedYear: number | null
    journal: string | null
    isISI: boolean
    isScopus: boolean
    citationCount: number
    doi: string | null
  }>
  recentProjects: Array<{
    role: string
    project: {
      id: string
      title: string
      projectCode: string
      status: string
      category: string
      budgetYear: number | null
    }
  }>
  awardsRecord: Array<{
    id: string
    type: string
    category: string
    description: string
    year: number
    awardedBy: string | null
  }>
}

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Quốc tế',
  BAI_BAO_TRONG_NUOC: 'Trong nước',
  SACH_CHUYEN_KHAO: 'Sách CK',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Patent',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
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

const ROLE_LABELS: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm',
  THU_KY_KHOA_HOC: 'Thư ký KH',
  THANH_VIEN_CHINH: 'Thành viên chính',
  CONG_TAC_VIEN: 'Cộng tác viên',
}

const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Dự thảo',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang xét duyệt',
  APPROVED: 'Đã phê duyệt',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${color ?? 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <span className="text-sm text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScientistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [profile, setProfile] = useState<ScientistProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/research/scientists/${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProfile(json.data)
        else toast.error(json.error ?? 'Không tải được hồ sơ')
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16 text-gray-500">
        Không tìm thấy hồ sơ nhà khoa học
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>Quay lại</Button>
        </div>
      </div>
    )
  }

  const p = profile
  const u = profile.user

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/research/scientists">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Danh sách nhà khoa học
          </Button>
        </Link>
        <Link href={`/dashboard/research/scientists/${userId}/edit`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      {/* Hero header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar placeholder + identity */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {u.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{u.name}</h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.academicRank && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">{p.academicRank}</Badge>
                    )}
                    {p.degree && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">{p.degree}</Badge>
                    )}
                    {u.rank && (
                      <Badge variant="outline">{u.rank}</Badge>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-3">
                    {u.unitRelation && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {u.unitRelation.name}
                      </span>
                    )}
                    {u.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {u.email}
                      </span>
                    )}
                    {u.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {u.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {(p.bio || p.user.scientificProfile?.summary) && (
                <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border-l-2 border-amber-400">
                  {p.bio ?? p.user.scientificProfile?.summary}
                </p>
              )}
            </div>

            {/* External IDs */}
            <div className="shrink-0 space-y-2 min-w-[200px]">
              {p.orcidId && (
                <a href={`https://orcid.org/${p.orcidId}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-green-700 hover:underline">
                  <Globe className="h-4 w-4" />
                  ORCID: {p.orcidId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {p.scopusAuthorId && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Hash className="h-4 w-4" />
                  Scopus: {p.scopusAuthorId}
                </div>
              )}
              {p.googleScholarId && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookMarked className="h-4 w-4" />
                  Scholar: {p.googleScholarId}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <MetricCard label="H-index" value={p.hIndex} color={p.hIndex >= 5 ? 'text-emerald-600' : 'text-blue-600'} />
        <MetricCard label="i10-index" value={p.i10Index} />
        <MetricCard label="Trích dẫn" value={p.totalCitations.toLocaleString()} color="text-violet-600" />
        <MetricCard label="Công bố" value={p.totalPublications} color="text-blue-600" />
        <MetricCard label="Đề tài CN" value={p.projectLeadCount} color="text-amber-600" />
        <MetricCard label="Tham gia" value={p.projectMemberCount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Research info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Specialization & fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-violet-500" />
                Hướng nghiên cứu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Chuyên ngành" value={p.specialization} />

              {p.researchFields.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Lĩnh vực nghiên cứu</div>
                  <div className="flex flex-wrap gap-2">
                    {p.researchFields.map((f) => (
                      <Badge key={f} variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                        {FIELD_LABELS[f] ?? f}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {p.researchKeywords.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Từ khóa nghiên cứu</div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.researchKeywords.map((kw) => (
                      <span key={kw} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {u.facultyProfile?.researchInterests && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Quan tâm nghiên cứu (từ hồ sơ giảng viên)</div>
                  <p className="text-sm text-gray-700">{u.facultyProfile.researchInterests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent publications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Công bố gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {p.recentPublications.length === 0 ? (
                <div className="text-sm text-gray-400 px-6 py-4">Chưa có công bố trong hệ thống M09</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên công trình</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Năm</TableHead>
                      <TableHead className="text-right">Trích dẫn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.recentPublications.map((pub) => (
                      <TableRow key={pub.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/research/publications/${pub.id}`}
                            className="font-medium text-blue-600 hover:underline line-clamp-2"
                          >
                            {pub.title}
                          </Link>
                          <div className="text-xs text-gray-400 mt-0.5">{pub.journal}</div>
                          <div className="flex gap-1 mt-1">
                            {pub.isISI && <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">ISI</Badge>}
                            {pub.isScopus && <Badge className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">Scopus</Badge>}
                            {pub.doi && (
                              <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer"
                                className="text-xs text-gray-400 hover:text-blue-500 flex items-center gap-0.5">
                                <ExternalLink className="h-3 w-3" />DOI
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {PUB_TYPE_LABELS[pub.pubType] ?? pub.pubType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-gray-600">{pub.publishedYear}</TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1 text-violet-700">
                            <Quote className="h-3 w-3" />{pub.citationCount}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            {p.recentPublications.length > 0 && (
              <div className="px-6 py-3 border-t">
                <Link
                  href={`/dashboard/research/publications?keyword=${encodeURIComponent(u.name)}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Xem tất cả công bố →
                </Link>
              </div>
            )}
          </Card>

          {/* Recent projects */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-amber-500" />
                Đề tài tham gia
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {p.recentProjects.length === 0 ? (
                <div className="text-sm text-gray-400 px-6 py-4">Chưa có đề tài trong hệ thống M09</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đề tài</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {p.recentProjects.map((m, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Link
                            href={`/dashboard/research/projects/${m.project.id}`}
                            className="font-medium text-blue-600 hover:underline line-clamp-2"
                          >
                            {m.project.title}
                          </Link>
                          <div className="text-xs text-gray-400">{m.project.projectCode}</div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={m.role === 'CHU_NHIEM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'}
                          >
                            {ROLE_LABELS[m.role] ?? m.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {PROJECT_STATUS_LABELS[m.project.status] ?? m.project.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Academic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Thông tin học thuật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <InfoRow label="Học hàm" value={p.academicRank} />
              <InfoRow label="Học vị" value={p.degree} />
              <InfoRow label="Chuyên ngành" value={p.specialization} />
              <InfoRow label="Quân hàm" value={u.rank} />
              <InfoRow label="Số quân" value={u.militaryId} />
              <InfoRow label="Đơn vị" value={u.unitRelation?.name} />
              {u.academicTitle && (
                <>
                  <Separator className="my-2" />
                  <InfoRow label="Học hàm (HT)" value={u.academicTitle} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Awards */}
          {(p.awards.length > 0 || p.awardsRecord.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Giải thưởng & Thành tích
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Snapshot awards from NckhScientistProfile */}
                {p.awards.map((a, idx) => (
                  <div key={idx} className="text-sm text-gray-700 flex gap-2">
                    <Award className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {a}
                  </div>
                ))}
                {/* Full awards from AwardsRecord */}
                {p.awardsRecord.slice(0, 5).map((ar) => (
                  <div key={ar.id} className="text-sm">
                    <div className="font-medium text-gray-800">{ar.description}</div>
                    <div className="text-xs text-gray-400">{ar.year} · {ar.category}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Metrics detail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Chỉ số khoa học
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">H-index</span>
                <span className="font-bold text-emerald-600">{p.hIndex}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">i10-index</span>
                <span className="font-bold">{p.i10Index}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng trích dẫn</span>
                <span className="font-bold text-violet-600">{p.totalCitations.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng công bố (M09)</span>
                <span className="font-bold text-blue-600">{p.totalPublications}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đề tài chủ nhiệm</span>
                <span className="font-bold text-amber-600">{p.projectLeadCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Đề tài tham gia</span>
                <span className="font-bold">{p.projectMemberCount}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                Cập nhật: {new Date(p.updatedAt).toLocaleDateString('vi-VN')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
