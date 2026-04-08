'use client'

/**
 * CategorySpecificSections – M02 UC-13
 * Renders profile sections based on PersonnelCategoryConfig.
 * Each section is conditionally shown via config.showSections flags.
 *
 * Consumers pass the already-fetched sub-record data; this component
 * wires config → visibility, not data-fetching.
 */

import type { PersonnelCategory } from '@prisma/client'
import type { PersonnelCategoryConfig } from '@/lib/config/personnel-category.config'
import { getCategoryConfig } from '@/lib/config/personnel-category.config'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Briefcase,
  GraduationCap,
  Users,
  FlaskConical,
  Star,
  ShieldOff,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CategorySpecificSectionsProps {
  category: PersonnelCategory
  slots: {
    career?: React.ReactNode
    education?: React.ReactNode
    family?: React.ReactNode
    scientificProfile?: React.ReactNode
    partyMember?: React.ReactNode
    awards?: React.ReactNode
    discipline?: React.ReactNode
    officerCareer?: React.ReactNode
    facultyProfile?: React.ReactNode
    soldierProfile?: React.ReactNode
  }
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="w-4 h-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">{children}</CardContent>
    </Card>
  )
}

// ─── Category header banner ───────────────────────────────────────────────────

const CATEGORY_META: Record<
  PersonnelCategory,
  { label: string; description: string; color: string }
> = {
  CAN_BO_CHI_HUY: {
    label: 'Cán bộ chỉ huy',
    description: 'Sĩ quan / QNCN — ưu tiên quân hàm, chức vụ, lịch sử công tác',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  },
  GIANG_VIEN: {
    label: 'Giảng viên',
    description: 'Ưu tiên học hàm, học vị, nghiên cứu khoa học, giờ giảng',
    color: 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800',
  },
  NGHIEN_CUU_VIEN: {
    label: 'Nghiên cứu viên',
    description: 'Ưu tiên học vị, chuyên ngành, thành tích công bố khoa học',
    color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800',
  },
  CONG_NHAN_VIEN: {
    label: 'Công nhân viên chức QP',
    description: 'Ưu tiên chức danh nghề nghiệp, ngạch bậc, chức vụ',
    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  },
  HOC_VIEN_QUAN_SU: {
    label: 'Học viên quân sự',
    description: 'Ưu tiên hệ đào tạo, kết quả học tập, quân hàm',
    color: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  },
  SINH_VIEN_DAN_SU: {
    label: 'Sinh viên dân sự',
    description: 'Ưu tiên thông tin học tập, mã sinh viên',
    color: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
  },
}

// ─── Required-fields hint ─────────────────────────────────────────────────────

function RequiredFieldsHint({
  config,
  personnelFields,
}: {
  config: PersonnelCategoryConfig
  personnelFields: Record<string, unknown>
}) {
  const missing = config.requiredFields.filter((f) => !personnelFields[f])
  if (missing.length === 0) return null

  return (
    <div className="flex items-start gap-2 p-3 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-700 dark:text-amber-400">
      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span>
        Hồ sơ chưa đầy đủ — còn thiếu:{' '}
        <strong>{missing.join(', ')}</strong>
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CategorySpecificSections({
  category,
  slots,
}: CategorySpecificSectionsProps) {
  const config = getCategoryConfig(category)
  const meta = CATEGORY_META[category]

  return (
    <div className="space-y-4">
      {/* Category banner */}
      <div className={`rounded-md border px-4 py-2.5 text-sm ${meta.color}`}>
        <div className="flex items-center gap-2 font-medium">
          <Badge variant="outline" className="text-xs">{meta.label}</Badge>
          <span className="text-muted-foreground font-normal text-xs">{meta.description}</span>
        </div>
      </div>

      {/* Career history */}
      {config.showSections.career && slots.career && (
        <Section icon={Briefcase} title="Lịch sử công tác">
          {slots.career}
        </Section>
      )}

      {/* Education */}
      {config.showSections.education && slots.education && (
        <Section icon={GraduationCap} title="Quá trình đào tạo">
          {slots.education}
        </Section>
      )}

      {/* Officer career (CAN_BO_CHI_HUY / HOC_VIEN_QUAN_SU) */}
      {config.showSections.officerCareer && slots.officerCareer && (
        <Section icon={Briefcase} title="Lý lịch sĩ quan">
          {slots.officerCareer}
        </Section>
      )}

      {/* Faculty profile (GIANG_VIEN) */}
      {config.showSections.facultyProfile && slots.facultyProfile && (
        <Section icon={BookOpen} title="Hồ sơ giảng viên">
          {slots.facultyProfile}
        </Section>
      )}

      {/* Soldier profile (HOC_VIEN_QUAN_SU) */}
      {config.showSections.soldierProfile && slots.soldierProfile && (
        <Section icon={Users} title="Hồ sơ chiến sĩ">
          {slots.soldierProfile}
        </Section>
      )}

      {/* Scientific profile (GIANG_VIEN, NGHIEN_CUU_VIEN) */}
      {config.showSections.scientificProfile && slots.scientificProfile && (
        <Section icon={FlaskConical} title="Nghiên cứu khoa học">
          {slots.scientificProfile}
        </Section>
      )}

      {/* Awards */}
      {config.showSections.awards && slots.awards && (
        <Section icon={Award} title="Khen thưởng">
          {slots.awards}
        </Section>
      )}

      {/* Discipline */}
      {config.showSections.discipline && slots.discipline && (
        <Section icon={ShieldOff} title="Kỷ luật">
          {slots.discipline}
        </Section>
      )}

      {/* Party member */}
      {config.showSections.partyMember && slots.partyMember && (
        <Section icon={Star} title="Đảng viên">
          {slots.partyMember}
        </Section>
      )}

      {/* Family */}
      {config.showSections.family && slots.family && (
        <Section icon={Users} title="Quan hệ gia đình">
          {slots.family}
        </Section>
      )}
    </div>
  )
}
