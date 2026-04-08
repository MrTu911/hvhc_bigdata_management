/**
 * Promotion Deadline Utilities
 * Calculates promotion eligibility dates for officers and soldiers
 * based on Vietnamese military regulations.
 */

// ─── Officer Rank Order (0 = highest) ────────────────────────────────────────

export const OFFICER_RANK_ORDER = [
  'DAI_TUONG',
  'THUONG_TUONG',
  'TRUNG_TUONG',
  'THIEU_TUONG',
  'DAI_TA',
  'THUONG_TA',
  'TRUNG_TA',
  'THIEU_TA',
  'DAI_UY',
  'THUONG_UY',
  'TRUNG_UY',
  'THIEU_UY',
] as const;

export type OfficerRankKey = (typeof OFFICER_RANK_ORDER)[number];

// ─── Soldier Rank Order (0 = highest) ────────────────────────────────────────

export const SOLDIER_RANK_ORDER = [
  'THUONG_SI',
  'TRUNG_SI',
  'HA_SI',
  'BINH_NHAT',
  'BINH_NHI',
] as const;

export type SoldierRankKey = (typeof SOLDIER_RANK_ORDER)[number];

// ─── Standard Promotion Timelines (months) ───────────────────────────────────

/** Months required at current rank before eligibility for next rank */
export const OFFICER_PROMOTION_MONTHS: Partial<Record<OfficerRankKey, number>> = {
  THIEU_UY:    24,  // → TRUNG_UY  (2 years)
  TRUNG_UY:    36,  // → DAI_UY    (3 years)
  DAI_UY:      36,  // → THIEU_TA  (3 years)
  THIEU_TA:    48,  // → TRUNG_TA  (4 years)
  TRUNG_TA:    48,  // → DAI_TA    (4 years)
  DAI_TA:      48,  // → THIEU_TUONG (4 years)
  THIEU_TUONG: 48,  // → TRUNG_TUONG (4 years)
  TRUNG_TUONG: 48,  // → THUONG_TUONG (4 years)
  THUONG_TUONG: 48, // → DAI_TUONG (4 years)
};

export const SOLDIER_PROMOTION_MONTHS: Partial<Record<SoldierRankKey, number>> = {
  BINH_NHI:  6,   // → BINH_NHAT (6 months)
  BINH_NHAT: 6,   // → HA_SI     (6 months)
  HA_SI:     12,  // → TRUNG_SI  (12 months)
  TRUNG_SI:  12,  // → THUONG_SI (12 months)
};

// ─── Max Promotion Age for General Ranks ─────────────────────────────────────

/** Age limit (years) for promotion from COLONEL to BRIGADIER GENERAL */
export const DAI_TA_MAX_PROMOTION_AGE = 57;

// ─── Labels ──────────────────────────────────────────────────────────────────

export const OFFICER_RANK_LABELS: Record<OfficerRankKey, string> = {
  DAI_TUONG:    'Đại tướng',
  THUONG_TUONG: 'Thượng tướng',
  TRUNG_TUONG:  'Trung tướng',
  THIEU_TUONG:  'Thiếu tướng',
  DAI_TA:       'Đại tá',
  THUONG_TA:    'Thượng tá',
  TRUNG_TA:     'Trung tá',
  THIEU_TA:     'Thiếu tá',
  DAI_UY:       'Đại úy',
  THUONG_UY:    'Thượng úy',
  TRUNG_UY:     'Trung úy',
  THIEU_UY:     'Thiếu úy',
};

export const SOLDIER_RANK_LABELS: Record<SoldierRankKey, string> = {
  THUONG_SI: 'Thượng sĩ',
  TRUNG_SI:  'Trung sĩ',
  HA_SI:     'Hạ sĩ',
  BINH_NHAT: 'Binh nhất',
  BINH_NHI:  'Binh nhì',
};

export const SPECIAL_CASE_TYPE_LABELS: Record<string, string> = {
  CHIEN_SI_THI_DUA_TOAN_QUAN: 'Chiến sĩ thi đua toàn quân',
  TIEN_SI:                    'Tiến sĩ',
  THANH_TICH_DAC_BIET:        'Thành tích đặc biệt',
  NGHI_QUYET_CAP_TREN:        'Theo nghị quyết cấp trên',
  KHAC:                       'Khác',
};

export function getNextOfficerRank(rank: string): OfficerRankKey | null {
  const idx = OFFICER_RANK_ORDER.indexOf(rank as OfficerRankKey);
  if (idx <= 0 || idx >= OFFICER_RANK_ORDER.length) return null;
  return OFFICER_RANK_ORDER[idx - 1]; // lower index = higher rank
}

export function getNextSoldierRank(rank: string): SoldierRankKey | null {
  const idx = SOLDIER_RANK_ORDER.indexOf(rank as SoldierRankKey);
  if (idx <= 0 || idx >= SOLDIER_RANK_ORDER.length) return null;
  return SOLDIER_RANK_ORDER[idx - 1];
}

// ─── Alert Status ─────────────────────────────────────────────────────────────

export type DeadlineStatus =
  | 'OVERDUE'       // past eligibility date – should already be promoted
  | 'CRITICAL'      // ≤ 30 days
  | 'WARNING'       // ≤ 90 days
  | 'UPCOMING'      // ≤ 180 days
  | 'NOT_YET'       // > 180 days
  | 'MAX_RANK'      // already at the highest rank in the group
  | 'NO_DATA';      // missing rank date

export function getDeadlineStatus(daysUntilEligible: number | null): DeadlineStatus {
  if (daysUntilEligible === null) return 'NO_DATA';
  if (daysUntilEligible < 0)   return 'OVERDUE';
  if (daysUntilEligible <= 30)  return 'CRITICAL';
  if (daysUntilEligible <= 90)  return 'WARNING';
  if (daysUntilEligible <= 180) return 'UPCOMING';
  return 'NOT_YET';
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

export interface PromotionDeadlineResult {
  standardMonths: number | null;
  totalReductionMonths: number;
  effectiveMonths: number | null;
  lastRankDate: Date | null;
  eligibilityDate: Date | null;
  daysUntilEligible: number | null;
  status: DeadlineStatus;
  nextRank: string | null;
  ageWarning: boolean; // true if DAI_TA & age > 57
}

export function calcPromotionDeadline(
  currentRank: string | null,
  lastRankDate: Date | null,
  totalReductionMonths: number,
  dateOfBirth?: Date | null,
  rankType: 'OFFICER' | 'SOLDIER' = 'OFFICER',
): PromotionDeadlineResult {
  if (!currentRank) {
    return {
      standardMonths: null,
      totalReductionMonths,
      effectiveMonths: null,
      lastRankDate: null,
      eligibilityDate: null,
      daysUntilEligible: null,
      status: 'NO_DATA',
      nextRank: null,
      ageWarning: false,
    };
  }

  const monthsMap = rankType === 'OFFICER' ? OFFICER_PROMOTION_MONTHS : SOLDIER_PROMOTION_MONTHS;
  const standardMonths = (monthsMap as Record<string, number>)[currentRank] ?? null;
  const nextRank =
    rankType === 'OFFICER'
      ? getNextOfficerRank(currentRank)
      : getNextSoldierRank(currentRank);

  if (standardMonths === null || nextRank === null) {
    return {
      standardMonths: null,
      totalReductionMonths,
      effectiveMonths: null,
      lastRankDate,
      eligibilityDate: null,
      daysUntilEligible: null,
      status: 'MAX_RANK',
      nextRank: null,
      ageWarning: false,
    };
  }

  const effectiveMonths = Math.max(1, standardMonths - totalReductionMonths);

  if (!lastRankDate) {
    return {
      standardMonths,
      totalReductionMonths,
      effectiveMonths,
      lastRankDate: null,
      eligibilityDate: null,
      daysUntilEligible: null,
      status: 'NO_DATA',
      nextRank,
      ageWarning: false,
    };
  }

  const eligibilityDate = new Date(lastRankDate);
  eligibilityDate.setMonth(eligibilityDate.getMonth() + effectiveMonths);

  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEligible = Math.round((eligibilityDate.getTime() - now.getTime()) / msPerDay);

  // Age check: DAI_TA → THIEU_TUONG, max age 57
  let ageWarning = false;
  if (currentRank === 'DAI_TA' && dateOfBirth) {
    const ageAtEligibility =
      (eligibilityDate.getFullYear() - dateOfBirth.getFullYear());
    if (ageAtEligibility > DAI_TA_MAX_PROMOTION_AGE) {
      ageWarning = true;
    }
  }

  return {
    standardMonths,
    totalReductionMonths,
    effectiveMonths,
    lastRankDate,
    eligibilityDate,
    daysUntilEligible,
    status: getDeadlineStatus(daysUntilEligible),
    nextRank,
    ageWarning,
  };
}
