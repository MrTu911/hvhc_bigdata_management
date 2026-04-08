'use client'

/**
 * PersonnelTabs – M02 UC-09/13
 * Renders the full 11-tab profile view for a personnel record.
 *
 * Extracted from profile360/page.tsx to keep the page component
 * focused on data-fetching / routing only.
 *
 * Props:
 *   profile     – full Profile360Data payload from the API
 *   id          – personnelId (from URL param), passed to editable sub-components
 *   canViewSensitive – RBAC flag from profile meta
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  User, GraduationCap, Briefcase, Shield, Heart,
  Award, Ban, Landmark, BookOpen, FlaskConical, Users, Info,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { SensitiveFieldsGuard } from './sensitive-fields-guard'
import { ScientificProfilePanel } from './scientific-profile-panel'
import { CareerTimeline } from '@/components/personnel/career/career-timeline'
import type { CareerEvent } from '@/components/personnel/career/career-timeline'
import { EducationTable } from '@/components/personnel/education/education-table'
import type { EducationRecord } from '@/components/personnel/education/education-table'
import { FamilyMemberTable } from '@/components/personnel/family/family-member-table'
import type { FamilyMember } from '@/components/personnel/family/family-member-table'

// ─── Profile360Data (mirror of API response) ──────────────────────────────────

export interface Profile360Data {
  personnel: {
    id: string; personnelCode: string; fullName: string; fullNameEn?: string | null
    dateOfBirth?: string | null; gender?: string | null; bloodType?: string | null
    placeOfOrigin?: string | null; birthPlace?: string | null
    permanentAddress?: string | null; temporaryAddress?: string | null
    ethnicity?: string | null; religion?: string | null
    category?: string | null; managingOrgan?: string | null
    militaryRank?: string | null; rankDate?: string | null
    position?: string | null; positionDate?: string | null
    enlistmentDate?: string | null; dischargeDate?: string | null
    educationLevel?: string | null; specialization?: string | null
    politicalTheory?: string | null; academicTitle?: string | null; academicDegree?: string | null
    status: string; unit?: { id: string; name: string; code: string } | null
  }
  careerHistory: Array<{
    id: string; eventType: string; eventDate: string; effectiveDate?: string | null
    title?: string | null; oldPosition?: string | null; newPosition?: string | null
    oldRank?: string | null; newRank?: string | null
    oldUnit?: string | null; newUnit?: string | null
    decisionNumber?: string | null; notes?: string | null
  }>
  educationHistory: Array<{
    id: string; level: string; trainingSystem?: string | null; major?: string | null
    institution: string; startDate?: string | null; endDate?: string | null
    gpa?: number | null; thesisTitle?: string | null; classification?: string | null
  }>
  familyMembers: Array<{
    id: string; relation: string; fullName: string; dateOfBirth?: string | null
    occupation?: string | null; workplace?: string | null; isDeceased: boolean; dependentFlag: boolean
  }>
  partyMember: {
    id: string; partyCardNumber?: string | null; joinDate?: string | null; officialDate?: string | null
    partyCell?: string | null; currentPosition?: string | null; status: string
    organization?: { id: string; name: string } | null
  } | null
  rewards: Array<{
    id: string; recordType: string; level: string; title: string; reason: string
    decisionNumber?: string | null; decisionDate?: string | null; status: string; year?: number | null
  }>
  disciplines: Array<{
    id: string; recordType: string; level: string; title: string; reason: string
    decisionNumber?: string | null; decisionDate?: string | null; status: string; year?: number | null
  }>
  insurance: {
    id: string; insuranceNumber?: string | null; insuranceStartDate?: string | null
    healthInsuranceNumber?: string | null; healthInsuranceHospital?: string | null
  } | null
  allowances: []
  scientificProfile: {
    summary?: string | null; publicationCount?: number | null; hIndex?: number | null
    publications?: Array<{ id: string; type: string; title: string; year: number; role: string; publisher?: string | null; coAuthors?: string | null }>
    awardsRecords?: Array<{ id: string; type: string; category: string; description: string; year: number }>
  } | null
  researchProjects: Array<{
    id: string; projectCode: string; title: string; status: string; phase: string
    category: string; field: string; role: string; startDate?: string | null; endDate?: string | null
  }>
  facultyProfile: {
    id: string; academicRank?: string | null; academicDegree?: string | null
    specialization?: string | null; researchInterests?: string | null
    publications: number; researchProjects: number; citations: number
    orcidId?: string | null; googleScholarUrl?: string | null
  } | null
  warnings: Array<{ source: string; message: string }>
  _bridge: { personnelId: string; userId: string | null }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PersonnelTabsProps {
  profile: Profile360Data
  id: string
  canViewSensitive: boolean
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const GENDER_MAP: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }
const BLOOD_MAP: Record<string, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A−', B_POSITIVE: 'B+', B_NEGATIVE: 'B−',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB−', O_POSITIVE: 'O+', O_NEGATIVE: 'O−',
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtDate(d?: string | null, fmt = 'dd/MM/yyyy') {
  if (!d) return '—'
  try { return format(new Date(d), fmt, { locale: vi }) }
  catch { return d }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="font-medium flex-1">{value}</span>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground py-6 text-center">{label}</p>
}

function StubBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
      <Info className="w-3 h-3 shrink-0" />
      {label}
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────────

function BasicInfoTab({
  personnel,
  canViewSensitive,
}: {
  personnel: NonNullable<Profile360Data['personnel']>
  canViewSensitive: boolean
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Mã cán bộ" value={personnel.personnelCode} />
          <InfoRow label="Họ và tên" value={personnel.fullName} />
          <InfoRow label="Tên tiếng Anh" value={personnel.fullNameEn} />
          <InfoRow label="Ngày sinh" value={fmtDate(personnel.dateOfBirth)} />
          <InfoRow label="Giới tính" value={personnel.gender ? GENDER_MAP[personnel.gender] ?? personnel.gender : null} />
          <InfoRow label="Nhóm máu" value={
            <SensitiveFieldsGuard canView={canViewSensitive}>
              {personnel.bloodType ? BLOOD_MAP[personnel.bloodType] ?? personnel.bloodType : '—'}
            </SensitiveFieldsGuard>
          } />
          <InfoRow label="Quê quán" value={personnel.placeOfOrigin} />
          <InfoRow label="Nơi sinh" value={personnel.birthPlace} />
          <InfoRow label="Thường trú" value={
            <SensitiveFieldsGuard canView={canViewSensitive}>
              {personnel.permanentAddress ?? '—'}
            </SensitiveFieldsGuard>
          } />
          <InfoRow label="Tạm trú" value={
            <SensitiveFieldsGuard canView={canViewSensitive}>
              {personnel.temporaryAddress ?? '—'}
            </SensitiveFieldsGuard>
          } />
          <InfoRow label="Dân tộc" value={personnel.ethnicity} />
          <InfoRow label="Tôn giáo" value={personnel.religion} />
          <Separator className="col-span-2 my-1" />
          <InfoRow label="Quân hàm" value={personnel.militaryRank} />
          <InfoRow label="Ngày phong / thăng" value={fmtDate(personnel.rankDate)} />
          <InfoRow label="Chức vụ" value={personnel.position} />
          <InfoRow label="Ngày bổ nhiệm" value={fmtDate(personnel.positionDate)} />
          <InfoRow label="Ngày nhập ngũ" value={fmtDate(personnel.enlistmentDate)} />
          <InfoRow label="Học vấn" value={personnel.educationLevel} />
          <InfoRow label="Chuyên ngành" value={personnel.specialization} />
          <InfoRow label="Lý luận chính trị" value={personnel.politicalTheory} />
          <InfoRow label="Học hàm" value={personnel.academicTitle} />
          <InfoRow label="Học vị" value={personnel.academicDegree} />
          <InfoRow label="Đơn vị" value={
            personnel.unit
              ? `${personnel.unit.name} (${personnel.unit.code})`
              : null
          } />
        </div>
      </CardContent>
    </Card>
  )
}

function PartyMemberTab({ partyMember }: { partyMember: Profile360Data['partyMember'] }) {
  if (!partyMember) return <EmptyState label="Không phải đảng viên hoặc chưa có dữ liệu" />
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Thông tin Đảng viên
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Số thẻ Đảng" value={partyMember.partyCardNumber} />
          <InfoRow label="Ngày vào Đảng (dự bị)" value={fmtDate(partyMember.joinDate)} />
          <InfoRow label="Ngày chính thức" value={fmtDate(partyMember.officialDate)} />
          <InfoRow label="Chi bộ" value={partyMember.partyCell} />
          <InfoRow label="Chức vụ Đảng" value={partyMember.currentPosition} />
          <InfoRow label="Tổ chức Đảng" value={partyMember.organization?.name} />
          <InfoRow label="Trạng thái" value={
            <Badge variant={partyMember.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {partyMember.status === 'ACTIVE' ? 'Sinh hoạt' : partyMember.status}
            </Badge>
          } />
        </div>
      </CardContent>
    </Card>
  )
}

function PolicyRecordsTab({
  items,
  emptyLabel,
}: {
  items: Profile360Data['rewards'] | Profile360Data['disciplines']
  emptyLabel: string
}) {
  if (items.length === 0) return <EmptyState label={emptyLabel} />
  return (
    <div className="space-y-3">
      {items.map(item => (
        <Card key={item.id}>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge>{item.level}</Badge>
              {item.decisionDate && (
                <span className="text-sm text-muted-foreground">{fmtDate(item.decisionDate)}</span>
              )}
              {item.year && <span className="text-xs text-muted-foreground">Năm {item.year}</span>}
            </div>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.reason}</p>
            {item.decisionNumber && (
              <p className="text-xs text-muted-foreground mt-1">Số QĐ: {item.decisionNumber}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function InsuranceTab({ insurance }: { insurance: Profile360Data['insurance'] }) {
  if (!insurance) return <EmptyState label="Chưa có thông tin bảo hiểm" />
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <InfoRow label="Số sổ BHXH" value={insurance.insuranceNumber} />
          <InfoRow label="Ngày tham gia BH" value={fmtDate(insurance.insuranceStartDate)} />
          <InfoRow label="Số thẻ BHYT" value={insurance.healthInsuranceNumber} />
          <InfoRow label="Nơi KCB ban đầu" value={insurance.healthInsuranceHospital} />
        </div>
      </CardContent>
    </Card>
  )
}

function AllowancesTab() {
  return (
    <StubBanner label="Dữ liệu phụ cấp (M05 AllowanceRecord) chưa được triển khai. Sẽ hiển thị khi module M05 hoàn thiện." />
  )
}

function FacultyTab({ facultyProfile }: { facultyProfile: Profile360Data['facultyProfile'] }) {
  if (!facultyProfile) return <EmptyState label="Không có hồ sơ giảng viên hoặc không phải giảng viên" />
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Hồ sơ giảng dạy – M07</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
          <InfoRow label="Học hàm" value={facultyProfile.academicRank} />
          <InfoRow label="Học vị" value={facultyProfile.academicDegree} />
          <InfoRow label="Chuyên ngành" value={facultyProfile.specialization} />
          <InfoRow label="Hướng nghiên cứu" value={facultyProfile.researchInterests} />
          {facultyProfile.orcidId && (
            <InfoRow label="ORCID" value={
              <span className="font-mono text-xs">{facultyProfile.orcidId}</span>
            } />
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Công trình', value: facultyProfile.publications },
            { label: 'Đề tài', value: facultyProfile.researchProjects },
            { label: 'Trích dẫn', value: facultyProfile.citations },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

export function PersonnelTabs({ profile, id, canViewSensitive }: PersonnelTabsProps) {
  const {
    personnel, careerHistory, educationHistory, familyMembers,
    partyMember, rewards, disciplines, insurance,
    scientificProfile, researchProjects, facultyProfile,
  } = profile

  return (
    <Tabs defaultValue="basic" className="space-y-4">
      <TabsList className="flex flex-wrap gap-1 h-auto">
        <TabsTrigger value="basic" className="gap-1.5">
          <User className="w-3.5 h-3.5" />Cơ bản
        </TabsTrigger>
        <TabsTrigger value="education" className="gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />Học vấn
        </TabsTrigger>
        <TabsTrigger value="career" className="gap-1.5">
          <Briefcase className="w-3.5 h-3.5" />Công tác
        </TabsTrigger>
        <TabsTrigger value="family" className="gap-1.5">
          <Users className="w-3.5 h-3.5" />Gia đình
        </TabsTrigger>
        <TabsTrigger value="party" className="gap-1.5">
          <Shield className="w-3.5 h-3.5" />Đảng viên
        </TabsTrigger>
        <TabsTrigger value="rewards" className="gap-1.5">
          <Award className="w-3.5 h-3.5" />Khen thưởng
          {rewards.length > 0 && (
            <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{rewards.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="disciplines" className="gap-1.5">
          <Ban className="w-3.5 h-3.5" />Kỷ luật
          {disciplines.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">{disciplines.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="insurance" className="gap-1.5">
          <Landmark className="w-3.5 h-3.5" />Bảo hiểm
        </TabsTrigger>
        <TabsTrigger value="allowances" className="gap-1.5">
          <Heart className="w-3.5 h-3.5" />Phụ cấp
        </TabsTrigger>
        <TabsTrigger value="scientific" className="gap-1.5">
          <FlaskConical className="w-3.5 h-3.5" />Lý lịch KH
        </TabsTrigger>
        <TabsTrigger value="faculty" className="gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />Giảng dạy
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic">
        <BasicInfoTab personnel={personnel} canViewSensitive={canViewSensitive} />
      </TabsContent>

      <TabsContent value="education">
        {/* Profile360 returns partial shape — cast to full EducationRecord for component */}
        <EducationTable
          records={educationHistory as unknown as EducationRecord[]}
          personnelId={id}
          canEdit={false}
        />
      </TabsContent>

      <TabsContent value="career">
        {/* Profile360 returns partial shape — cast to full CareerEvent for component */}
        <CareerTimeline
          events={careerHistory as unknown as CareerEvent[]}
          canEdit={false}
        />
      </TabsContent>

      <TabsContent value="family">
        {/* Profile360 returns partial shape — cast to full FamilyMember for component */}
        <FamilyMemberTable
          members={familyMembers as unknown as FamilyMember[]}
          personnelId={id}
          canEdit={false}
          includeSensitive={canViewSensitive}
        />
      </TabsContent>

      <TabsContent value="party">
        <PartyMemberTab partyMember={partyMember} />
      </TabsContent>

      <TabsContent value="rewards">
        <PolicyRecordsTab items={rewards} emptyLabel="Chưa có quyết định khen thưởng" />
      </TabsContent>

      <TabsContent value="disciplines">
        <PolicyRecordsTab items={disciplines} emptyLabel="Không có quyết định kỷ luật" />
      </TabsContent>

      <TabsContent value="insurance">
        <InsuranceTab insurance={insurance} />
      </TabsContent>

      <TabsContent value="allowances">
        <AllowancesTab />
      </TabsContent>

      <TabsContent value="scientific">
        <ScientificProfilePanel
          scientificProfile={scientificProfile ?? undefined}
          researchProjects={researchProjects}
        />
      </TabsContent>

      <TabsContent value="faculty">
        <FacultyTab facultyProfile={facultyProfile} />
      </TabsContent>
    </Tabs>
  )
}
