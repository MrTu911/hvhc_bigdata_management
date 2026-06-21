/**
 * Loại đơn vị (Unit.type) — nguồn chuẩn DUY NHẤT, đồng bộ với M19 category `MD_UNIT_TYPE`.
 *
 * Trước đây codebase tồn tại 2 nguồn lệch nhau:
 *   - seed/legacy + consumer runtime dùng dạng raw: 'HVHC', 'TIEUDOAN', 'BOMON', 'DAIDOI'…
 *   - M19 `MD_UNIT_TYPE` + admin UI dùng dạng chuẩn: 'HOC_VIEN', 'TIEU_DOAN', 'BO_MON', 'DAI_DOI'…
 *
 * File này lấy M19 làm chuẩn. Mọi consumer phải tham chiếu `UNIT_TYPE.*` thay vì hard-code chuỗi.
 * Dùng `normalizeUnitType()` để quy đổi giá trị legacy về chuẩn khi đọc/migrate.
 */

/** Mã loại đơn vị chuẩn (khớp M19 `MD_UNIT_TYPE`). */
export const UNIT_TYPE = {
  HOC_VIEN: 'HOC_VIEN',
  KHOA: 'KHOA',
  PHONG: 'PHONG',
  HE: 'HE',
  TIEU_DOAN: 'TIEU_DOAN',
  BAN: 'BAN',
  VIEN: 'VIEN',
  BO_MON: 'BO_MON',
  DAI_DOI: 'DAI_DOI',
  LOP: 'LOP',
  XUONG: 'XUONG',
  TRUNG_TAM: 'TRUNG_TAM',
  CHI_HUY: 'CHI_HUY',
  TRUNG_DOI: 'TRUNG_DOI',
  TIEU_DOI: 'TIEU_DOI',
  TO: 'TO',
} as const;

export type UnitTypeCode = (typeof UNIT_TYPE)[keyof typeof UNIT_TYPE];

/** Nhãn tiếng Việt cho từng loại đơn vị. */
export const UNIT_TYPE_LABEL_VI: Record<UnitTypeCode, string> = {
  HOC_VIEN: 'Học viện',
  KHOA: 'Khoa',
  PHONG: 'Phòng',
  HE: 'Hệ',
  TIEU_DOAN: 'Tiểu đoàn',
  BAN: 'Ban',
  VIEN: 'Viện',
  BO_MON: 'Bộ môn',
  DAI_DOI: 'Đại đội',
  LOP: 'Lớp',
  XUONG: 'Xưởng',
  TRUNG_TAM: 'Trung tâm',
  CHI_HUY: 'Cơ quan chỉ huy',
  TRUNG_DOI: 'Trung đội',
  TIEU_DOI: 'Tiểu đội',
  TO: 'Tổ',
};

/**
 * 4 loại đơn vị có thật trong dữ liệu HVHC nhưng còn thiếu trong M19 `MD_UNIT_TYPE`.
 * Script chuẩn hóa sẽ upsert các item này (idempotent) trước khi backfill.
 */
export const UNIT_TYPE_M19_ADDITIONS: ReadonlyArray<{
  code: UnitTypeCode;
  nameVi: string;
  nameEn: string;
  shortName: string;
  sortOrder: number;
}> = [
  { code: 'HE', nameVi: 'Hệ', nameEn: 'System (Hệ)', shortName: 'Hệ', sortOrder: 20 },
  { code: 'VIEN', nameVi: 'Viện', nameEn: 'Institute', shortName: 'Viện', sortOrder: 21 },
  { code: 'XUONG', nameVi: 'Xưởng', nameEn: 'Workshop', shortName: 'Xưởng', sortOrder: 22 },
  { code: 'CHI_HUY', nameVi: 'Cơ quan chỉ huy', nameEn: 'Command Office', shortName: 'CH', sortOrder: 23 },
];

/**
 * Ánh xạ giá trị legacy/biến thể (hoa-thường, không dấu gạch) → mã chuẩn.
 * Dùng cho backfill và khi đọc dữ liệu cũ. Giá trị đã chuẩn map về chính nó.
 */
export const LEGACY_UNIT_TYPE_ALIASES: Record<string, UnitTypeCode> = {
  // Học viện
  HVHC: 'HOC_VIEN',
  HOC_VIEN: 'HOC_VIEN',
  'Học viện': 'HOC_VIEN',
  // Tiểu đoàn
  TIEUDOAN: 'TIEU_DOAN',
  TIEU_DOAN: 'TIEU_DOAN',
  'Tiểu đoàn': 'TIEU_DOAN',
  // Bộ môn
  BOMON: 'BO_MON',
  BO_MON: 'BO_MON',
  'Bộ môn': 'BO_MON',
  // Đại đội
  DAIDOI: 'DAI_DOI',
  DAI_DOI: 'DAI_DOI',
  'Đại đội': 'DAI_DOI',
  // Ban
  BAN: 'BAN',
  Ban: 'BAN',
  // Lớp
  LOP: 'LOP',
  'Lớp': 'LOP',
  // Trung tâm
  'Trung tâm': 'TRUNG_TAM',
  TT: 'TRUNG_TAM',
  TRUNG_TAM: 'TRUNG_TAM',
  // Cơ quan chỉ huy
  CHIHUY: 'CHI_HUY',
  CHI_HUY: 'CHI_HUY',
  // Giữ nguyên các mã đã chuẩn
  KHOA: 'KHOA',
  PHONG: 'PHONG',
  HE: 'HE',
  VIEN: 'VIEN',
  XUONG: 'XUONG',
  TRUNG_DOI: 'TRUNG_DOI',
  TIEU_DOI: 'TIEU_DOI',
  TO: 'TO',
};

/**
 * Quy đổi một giá trị Unit.type bất kỳ về mã chuẩn M19.
 * Thử khớp trực tiếp, rồi thử trim, rồi UPPER không dấu gạch. Trả `null` nếu không nhận diện được.
 */
export function normalizeUnitType(raw: string | null | undefined): UnitTypeCode | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (LEGACY_UNIT_TYPE_ALIASES[trimmed]) return LEGACY_UNIT_TYPE_ALIASES[trimmed];

  const collapsed = trimmed.toUpperCase().replace(/[\s_]+/g, '');
  for (const [alias, code] of Object.entries(LEGACY_UNIT_TYPE_ALIASES)) {
    if (alias.toUpperCase().replace(/[\s_]+/g, '') === collapsed) return code;
  }
  return null;
}

/** Kiểm tra một chuỗi có phải mã loại đơn vị chuẩn không. */
export function isValidUnitType(value: string | null | undefined): value is UnitTypeCode {
  return !!value && value in UNIT_TYPE_LABEL_VI;
}
