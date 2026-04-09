/**
 * Template Field Matcher – M18 Integration
 *
 * Rule-based matching: ánh xạ tên placeholder trong template
 * sang field key trong catalog của data-resolver-service.
 *
 * Không dùng AI thật — dùng:
 *   1. Exact match (confidence 100)
 *   2. Normalized match — lowercase + strip diacritics (confidence 90)
 *   3. Substring match — một chuỗi chứa trong chuỗi kia (confidence 60)
 *   4. No match (suggestedKey null, confidence 0)
 *
 * Thiết kế mở: có thể thay thế bằng embedding-based matcher sau này
 * mà không thay đổi interface.
 */

export interface SuggestedMapping {
  placeholder: string;
  suggestedKey: string | null;
  confidence: number; // 0–100
}

// ─── Known field keys từ field catalog (data-resolver-service output) ─────────

const PERSONNEL_KEYS = [
  'hoTen', 'gioiTinh', 'ngaySinh', 'noiSinh', 'queQuan', 'danToc',
  'militaryId', 'dienThoai', 'diaChiLienLac',
  'capBac', 'chucVu', 'donViCongTac',
  'daoTao_DH_hinhThuc', 'daoTao_DH_tuNam', 'daoTao_DH_denNam',
  'daoTao_DH_noiHoc', 'daoTao_DH_chuyenNganh',
  'daoTao_ThS_tuNam', 'daoTao_ThS_tenLV', 'daoTao_ThS_nguoiHD',
  'daoTao_TS_tenLA', 'daoTao_TS_nguoiHD_1', 'daoTao_TS_nguoiHD_2',
  'ngoaiNgu', 'khenThuong', 'kyLuat',
  'ngayVaoDang', 'ngayChinhThuc', 'thoiGianKy',
  'congTac_list', 'giaoTrinh_list', 'deTai_list', 'baiBao_list',
];

const STUDENT_KEYS = [
  'hoTen', 'mssv', 'ngaySinh', 'gioiTinh', 'lop', 'ketQua_list',
];

const PARTY_MEMBER_KEYS = [
  'hoTen', 'capBac', 'chucVu', 'donVi',
  'ngayVaoDang', 'ngayChinhThuc', 'chiBoHienTai', 'xepLoai',
];

// Flat deduplicated list of all known keys
const ALL_KNOWN_KEYS: string[] = [
  ...new Set([...PERSONNEL_KEYS, ...STUDENT_KEYS, ...PARTY_MEMBER_KEYS]),
];

// ─── Extra alias table: legacy / alternative names → canonical key ────────────
//
// Dùng cho các file Word/Excel cũ thường đặt tên theo kiểu khác.
//
const ALIAS_MAP: Record<string, string> = {
  // Cơ bản
  hoten: 'hoTen',
  hovaten: 'hoTen',
  fullname: 'hoTen',
  ten: 'hoTen',
  gioitinh: 'gioiTinh',
  gender: 'gioiTinh',
  ngaysinh: 'ngaySinh',
  birthday: 'ngaySinh',
  dob: 'ngaySinh',
  noisinh: 'noiSinh',
  birthplace: 'noiSinh',
  quequan: 'queQuan',
  hometown: 'queQuan',
  dantoc: 'danToc',
  ethnicity: 'danToc',
  dienthoai: 'dienThoai',
  phone: 'dienThoai',
  sodienthoai: 'dienThoai',
  diachi: 'diaChiLienLac',
  address: 'diaChiLienLac',
  // Quân sự
  capbac: 'capBac',
  rank: 'capBac',
  chucvu: 'chucVu',
  position: 'chucVu',
  donvi: 'donViCongTac',
  unit: 'donViCongTac',
  donvicongTac: 'donViCongTac',
  militaryid: 'militaryId',
  soqn: 'militaryId',
  // Đảng
  ngayvaodang: 'ngayVaoDang',
  ngaychinhthuc: 'ngayChinhThuc',
  chibo: 'chiBoHienTai',
  // Thời gian
  thoigianky: 'thoiGianKy',
  ngayky: 'thoiGianKy',
  date: 'thoiGianKy',
  // Học viên
  masinhvien: 'mssv',
  mahocvien: 'mssv',
  studentid: 'mssv',
  lop: 'lop',
  class: 'lop',
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Gợi ý field mapping cho danh sách placeholder.
 * Trả về mảng cùng thứ tự với input.
 */
export function suggestMappings(placeholders: string[]): SuggestedMapping[] {
  return placeholders.map((placeholder) => matchPlaceholder(placeholder));
}

// ─── Matching logic ───────────────────────────────────────────────────────────

function matchPlaceholder(placeholder: string): SuggestedMapping {
  // 1. Exact match
  if (ALL_KNOWN_KEYS.includes(placeholder)) {
    return { placeholder, suggestedKey: placeholder, confidence: 100 };
  }

  // 2. Alias table (normalized lookup)
  const normalized = normalizeName(placeholder);
  const aliasKey = ALIAS_MAP[normalized];
  if (aliasKey) {
    return { placeholder, suggestedKey: aliasKey, confidence: 90 };
  }

  // 3. Normalized exact match against known keys
  for (const key of ALL_KNOWN_KEYS) {
    if (normalizeName(key) === normalized) {
      return { placeholder, suggestedKey: key, confidence: 90 };
    }
  }

  // 4. Substring match — normalized placeholder starts with or contains normalized key
  let bestKey: string | null = null;
  let bestScore = 0;

  for (const key of ALL_KNOWN_KEYS) {
    const normKey = normalizeName(key);
    const score = substringScore(normalized, normKey);
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  if (bestScore >= 60) {
    return { placeholder, suggestedKey: bestKey, confidence: bestScore };
  }

  return { placeholder, suggestedKey: null, confidence: 0 };
}

/**
 * Lowercase + remove underscores/dashes/dots + strip common Vietnamese diacritics.
 * Giữ alphanumeric để so sánh.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_\-. ]/g, '')
    .replace(/[àáâãăạảấầẩẫậắằẳẵặ]/g, 'a')
    .replace(/[èéêẹẻẽếềểễệ]/g, 'e')
    .replace(/[ìíîïịỉĩ]/g, 'i')
    .replace(/[òóôõơọỏốồổỗộớờởỡợ]/g, 'o')
    .replace(/[ùúûüưụủũứừửữự]/g, 'u')
    .replace(/[ýỳỷỹỵ]/g, 'y')
    .replace(/[đ]/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Tính điểm substring match (0–75).
 * Không bao giờ trả >= 80 để phân biệt với normalized exact match.
 */
function substringScore(normalized: string, normKey: string): number {
  if (normalized === normKey) return 75;
  if (normalized.startsWith(normKey) || normKey.startsWith(normalized)) return 70;
  if (normalized.includes(normKey) || normKey.includes(normalized)) return 60;
  return 0;
}
