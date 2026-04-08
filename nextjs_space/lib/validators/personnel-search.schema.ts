/**
 * Personnel search validators – M02 UC-13 / UC-14
 *
 * personnelSearchSchema   → GET /api/personnel/search  (query-string params)
 * talentSearchSchema      → POST /api/personnel/talent-search (JSON body)
 */

import { z } from 'zod'
import { PersonnelCategory, PersonnelStatus } from '@prisma/client'

// ─── GET /api/personnel/search ───────────────────────────────────────────────

export const personnelSearchSchema = z.object({
  /** Free-text: fullName, personnelCode, militaryIdNumber */
  keyword: z.string().max(200).optional(),

  category: z.nativeEnum(PersonnelCategory).optional(),

  unitId: z.string().cuid().optional(),

  /** Filters by Personnel.militaryRank (string) */
  rank: z.string().max(100).optional(),

  /** Filters by Personnel.position (string) */
  position: z.string().max(200).optional(),

  /** Filters by Personnel.academicDegree (string) – e.g. "TS", "PGS.TS" */
  degree: z.string().max(100).optional(),

  /** Filters by Personnel.academicTitle (string) – e.g. "PGS", "GS" */
  academicTitle: z.string().max(100).optional(),

  /** Filters by Personnel.specialization (string) */
  major: z.string().max(200).optional(),

  /** Filters by Personnel.politicalTheory (string) */
  politicalTheory: z.string().max(100).optional(),

  status: z.nativeEnum(PersonnelStatus).optional(),

  /** Age range – computed from Personnel.dateOfBirth */
  ageMin: z.coerce.number().int().min(18).max(70).optional(),
  ageMax: z.coerce.number().int().min(18).max(70).optional(),

  /**
   * Service years – computed from Personnel.enlistmentDate.
   * Applied as: (current_year − enlistment_year) >= serviceYearsMin
   */
  serviceYearsMin: z.coerce.number().int().min(0).max(50).optional(),

  /**
   * When true, only return Personnel that have a linked ScientificProfile.
   * (Does NOT filter on publication count — Phase 2 can add that.)
   */
  hasResearch: z
    .string()
    .optional()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined)),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
  .refine(
    (d) => {
      if (d.ageMin !== undefined && d.ageMax !== undefined) return d.ageMax >= d.ageMin
      return true
    },
    { message: 'ageMax phải >= ageMin', path: ['ageMax'] },
  )

export type PersonnelSearchInput = z.infer<typeof personnelSearchSchema>

// ─── POST /api/personnel/talent-search ───────────────────────────────────────

export const talentSearchSchema = z
  .object({
    /** Human-readable label for the planning slot/position */
    targetPosition: z.string().max(300).optional(),

    /** If set, restrict search to personnel in this unit (scope-gated) */
    requiredUnitId: z.string().cuid().optional(),

    /** Minimum required degree – hard filter when enforceDegree = true */
    requiredDegree: z.string().max(100).optional(),

    /** Minimum required political theory level */
    requiredPoliticalTheory: z.string().max(100).optional(),

    /** Minimum service years (hard filter or soft signal depending on config) */
    requiredServiceYearsMin: z.number().int().min(0).max(50).optional(),

    /** Preferred specialization/major keywords (soft scoring) */
    preferredMajor: z.array(z.string().max(200)).max(10).optional(),

    /** Preferred academic title keywords */
    preferredAcademicTitle: z.string().max(100).optional(),

    /**
     * Category to search within.
     * Defaults to all categories if omitted.
     */
    category: z.nativeEnum(PersonnelCategory).optional(),

    /** Max candidates to return (after scoring) */
    topN: z.number().int().min(1).max(200).default(50),
  })
  .refine(
    (d) =>
      // At least one meaningful criterion must be supplied
      d.targetPosition !== undefined ||
      d.requiredUnitId !== undefined ||
      d.requiredDegree !== undefined ||
      d.requiredPoliticalTheory !== undefined ||
      d.requiredServiceYearsMin !== undefined ||
      (d.preferredMajor && d.preferredMajor.length > 0) ||
      d.preferredAcademicTitle !== undefined ||
      d.category !== undefined,
    {
      message: 'Phải có ít nhất 1 tiêu chí tìm kiếm',
    },
  )

export type TalentSearchInput = z.infer<typeof talentSearchSchema>
