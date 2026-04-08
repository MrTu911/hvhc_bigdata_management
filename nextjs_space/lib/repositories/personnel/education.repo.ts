/**
 * EducationRepo – M02 Phase 2
 * Data access for EducationHistory. Primary key: personnelId.
 */
import 'server-only'
import db from '@/lib/db'
import type { EducationLevel } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EducationCreateData {
  personnelId: string
  /** userId bridge – required by schema FK */
  userId: string
  level: EducationLevel
  trainingSystem?: string | null
  /** Hình thức đào tạo – lookup MD_STUDY_MODE (M19) */
  studyMode?: string | null
  /** Chuyên ngành – lookup MD_MAJOR (M19) */
  major?: string | null
  /** Cơ sở đào tạo – lookup MD_INSTITUTION (M19) */
  institution: string
  startDate?: Date | null
  endDate?: Date | null
  gpa?: number | null
  thesisTitle?: string | null
  supervisor?: string | null
  certificateCode?: string | null
  certificateDate?: Date | null
  defenseDate?: Date | null
  defenseLocation?: string | null
  examSubject?: string | null
  /** Xếp loại tốt nghiệp */
  classification?: string | null
  notes?: string | null
}

export type EducationUpdateData = Partial<
  Omit<EducationCreateData, 'personnelId' | 'userId'>
>

// ─── Select shape ─────────────────────────────────────────────────────────────

const EDUCATION_SELECT = {
  id: true,
  personnelId: true,
  level: true,
  trainingSystem: true,
  studyMode: true,
  major: true,
  institution: true,
  startDate: true,
  endDate: true,
  gpa: true,
  thesisTitle: true,
  supervisor: true,
  certificateCode: true,
  certificateDate: true,
  defenseDate: true,
  defenseLocation: true,
  examSubject: true,
  classification: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const

// ─── Repository ───────────────────────────────────────────────────────────────

export const EducationRepo = {
  /**
   * List all education records for a personnel, ordered by startDate desc.
   */
  async findByPersonnelId(personnelId: string) {
    return db.educationHistory.findMany({
      where: { personnelId },
      select: EDUCATION_SELECT,
      orderBy: [{ startDate: 'desc' }],
    })
  },

  async findById(id: string) {
    return db.educationHistory.findFirst({
      where: { id },
      select: EDUCATION_SELECT,
    })
  },

  async create(data: EducationCreateData) {
    return db.educationHistory.create({ data, select: EDUCATION_SELECT })
  },

  async update(id: string, data: EducationUpdateData) {
    return db.educationHistory.update({
      where: { id },
      data,
      select: EDUCATION_SELECT,
    })
  },

  async delete(id: string) {
    return db.educationHistory.delete({
      where: { id },
      select: { id: true, personnelId: true, institution: true, level: true },
    })
  },
}
