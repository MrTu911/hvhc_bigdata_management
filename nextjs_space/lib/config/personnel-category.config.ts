/**
 * CategoryConfig – M02 UC-13
 * Strategy-pattern config for category-specific profile rules.
 *
 * Each PersonnelCategory defines:
 *  - requiredFields  : fields that must be non-null for this category
 *  - highlightedFields : fields shown prominently in the profile UI
 *  - searchableByFields: filter dimensions meaningful for this category
 *  - label / labelShort : human-readable names
 *
 * This is a static import — NOT fetched from an API.
 * Future M19 integration may override this with DB-backed config.
 */

import type { PersonnelCategory } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PersonnelCategoryConfig {
  category: PersonnelCategory
  label: string
  labelShort: string
  /** Personnel.* fields that are mandatory for this category */
  requiredFields: string[]
  /** Personnel.* fields emphasised in the profile UI */
  highlightedFields: string[]
  /** Logical feature flags for the UI to conditionally render sections */
  showSections: {
    career: boolean
    education: boolean
    family: boolean
    scientificProfile: boolean
    partyMember: boolean
    awards: boolean
    discipline: boolean
    /** FacultyProfile / officer-specific extensions */
    officerCareer: boolean
    facultyProfile: boolean
    soldierProfile: boolean
  }
  /**
   * Talent search dimensions relevant to this category.
   * Used by PlanningService to select scoring inputs.
   */
  talentDimensions: {
    degreeMatters: boolean      // education history scoring applies
    rankMatters: boolean        // military rank scoring applies
    researchMatters: boolean    // scientific publication count applies
    politicalTheoryMatters: boolean
    serviceYearsMatters: boolean
    sameUnitBonus: boolean      // same unit = scoring bonus
  }
}

// ─── Config map ───────────────────────────────────────────────────────────────

const CATEGORY_CONFIGS: Record<PersonnelCategory, PersonnelCategoryConfig> = {
  CAN_BO_CHI_HUY: {
    category: 'CAN_BO_CHI_HUY',
    label: 'Cán bộ chỉ huy',
    labelShort: 'Chỉ huy',
    requiredFields: ['militaryRank', 'position', 'enlistmentDate', 'unitId'],
    highlightedFields: ['militaryRank', 'position', 'positionDate', 'enlistmentDate', 'politicalTheory', 'academicDegree'],
    showSections: {
      career: true,
      education: true,
      family: true,
      scientificProfile: false,
      partyMember: true,
      awards: true,
      discipline: true,
      officerCareer: true,
      facultyProfile: false,
      soldierProfile: false,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: true,
      researchMatters: false,
      politicalTheoryMatters: true,
      serviceYearsMatters: true,
      sameUnitBonus: true,
    },
  },

  GIANG_VIEN: {
    category: 'GIANG_VIEN',
    label: 'Giảng viên',
    labelShort: 'Giảng viên',
    requiredFields: ['educationLevel', 'specialization', 'unitId'],
    highlightedFields: ['academicTitle', 'academicDegree', 'educationLevel', 'specialization', 'politicalTheory'],
    showSections: {
      career: true,
      education: true,
      family: true,
      scientificProfile: true,
      partyMember: true,
      awards: true,
      discipline: true,
      officerCareer: false,
      facultyProfile: true,
      soldierProfile: false,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: false,
      researchMatters: true,
      politicalTheoryMatters: true,
      serviceYearsMatters: true,
      sameUnitBonus: true,
    },
  },

  NGHIEN_CUU_VIEN: {
    category: 'NGHIEN_CUU_VIEN',
    label: 'Nghiên cứu viên',
    labelShort: 'NCV',
    requiredFields: ['educationLevel', 'specialization'],
    highlightedFields: ['academicTitle', 'academicDegree', 'educationLevel', 'specialization'],
    showSections: {
      career: true,
      education: true,
      family: true,
      scientificProfile: true,
      partyMember: true,
      awards: true,
      discipline: true,
      officerCareer: false,
      facultyProfile: false,
      soldierProfile: false,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: false,
      researchMatters: true,
      politicalTheoryMatters: false,
      serviceYearsMatters: true,
      sameUnitBonus: false,
    },
  },

  CONG_NHAN_VIEN: {
    category: 'CONG_NHAN_VIEN',
    label: 'Công nhân viên chức quốc phòng',
    labelShort: 'CNVCQP',
    requiredFields: ['position', 'unitId'],
    highlightedFields: ['position', 'positionDate', 'educationLevel'],
    showSections: {
      career: true,
      education: true,
      family: true,
      scientificProfile: false,
      partyMember: true,
      awards: true,
      discipline: true,
      officerCareer: false,
      facultyProfile: false,
      soldierProfile: false,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: false,
      researchMatters: false,
      politicalTheoryMatters: false,
      serviceYearsMatters: true,
      sameUnitBonus: true,
    },
  },

  HOC_VIEN_QUAN_SU: {
    category: 'HOC_VIEN_QUAN_SU',
    label: 'Học viên quân sự',
    labelShort: 'HV QS',
    requiredFields: ['militaryIdNumber', 'enlistmentDate', 'unitId'],
    highlightedFields: ['militaryRank', 'enlistmentDate', 'educationLevel', 'specialization'],
    showSections: {
      career: true,
      education: true,
      family: true,
      scientificProfile: false,
      partyMember: true,
      awards: true,
      discipline: true,
      officerCareer: false,
      facultyProfile: false,
      soldierProfile: true,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: true,
      researchMatters: false,
      politicalTheoryMatters: false,
      serviceYearsMatters: false,
      sameUnitBonus: false,
    },
  },

  SINH_VIEN_DAN_SU: {
    category: 'SINH_VIEN_DAN_SU',
    label: 'Sinh viên dân sự',
    labelShort: 'SV DS',
    requiredFields: ['studentIdNumber'],
    highlightedFields: ['educationLevel', 'specialization', 'studentIdNumber'],
    showSections: {
      career: false,
      education: true,
      family: true,
      scientificProfile: false,
      partyMember: false,
      awards: true,
      discipline: true,
      officerCareer: false,
      facultyProfile: false,
      soldierProfile: false,
    },
    talentDimensions: {
      degreeMatters: true,
      rankMatters: false,
      researchMatters: false,
      politicalTheoryMatters: false,
      serviceYearsMatters: false,
      sameUnitBonus: false,
    },
  },
}

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getCategoryConfig(category: PersonnelCategory): PersonnelCategoryConfig {
  return CATEGORY_CONFIGS[category]
}

export function getAllCategoryConfigs(): PersonnelCategoryConfig[] {
  return Object.values(CATEGORY_CONFIGS)
}
