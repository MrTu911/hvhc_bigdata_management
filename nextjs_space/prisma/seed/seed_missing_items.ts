/**
 * Seed M19 – Missing Items Bundle
 * Adds items for categories that were seeded without items in seed_master_data.ts.
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_missing_items.ts
 *
 * Categories covered:
 *   MD_ACADEMIC_YEAR   – năm học / học kỳ 2019–2031
 *   MD_MAJOR           – chuyên ngành đào tạo (~60 mục)
 *   MD_COUNTRY         – quốc gia ISO 3166-1 (~90 mục)
 *   MD_DISTRICT        – quận/huyện chuẩn 2025 (~200 mục cho các tỉnh/thành chính)
 *   MD_SALARY_GRADE    – ngạch lương quân nhân
 *   MD_SALARY_ALLOWANCE – loại phụ cấp
 *
 * Tổng: ~440 items
 */
import { PrismaClient } from '@prisma/client'
import { upsertCategoryWithItems, type SeedMeta } from './lib/mdm-upsert'

const prisma = new PrismaClient()

const SEED_META: SeedMeta = {
  version: '1.0',
  bundleId: 'seed_missing_items_2026',
  allowOverwrite: process.env.SEED_OVERWRITE === 'true',
  skipIfVersionMatch: process.env.SEED_SKIP_VERSION === 'true',
}

// ─── MD_ACADEMIC_YEAR ─────────────────────────────────────────────────────────

const ACADEMIC_YEAR_ITEMS = [
  // Năm học (full year)
  { code: 'NH_2019_2020', nameVi: 'Năm học 2019–2020', shortName: '2019-2020', sortOrder: 1, metadata: { type: 'year', yearStart: 2019, yearEnd: 2020 } },
  { code: 'NH_2020_2021', nameVi: 'Năm học 2020–2021', shortName: '2020-2021', sortOrder: 2, metadata: { type: 'year', yearStart: 2020, yearEnd: 2021 } },
  { code: 'NH_2021_2022', nameVi: 'Năm học 2021–2022', shortName: '2021-2022', sortOrder: 3, metadata: { type: 'year', yearStart: 2021, yearEnd: 2022 } },
  { code: 'NH_2022_2023', nameVi: 'Năm học 2022–2023', shortName: '2022-2023', sortOrder: 4, metadata: { type: 'year', yearStart: 2022, yearEnd: 2023 } },
  { code: 'NH_2023_2024', nameVi: 'Năm học 2023–2024', shortName: '2023-2024', sortOrder: 5, metadata: { type: 'year', yearStart: 2023, yearEnd: 2024 } },
  { code: 'NH_2024_2025', nameVi: 'Năm học 2024–2025', shortName: '2024-2025', sortOrder: 6, metadata: { type: 'year', yearStart: 2024, yearEnd: 2025 } },
  { code: 'NH_2025_2026', nameVi: 'Năm học 2025–2026', shortName: '2025-2026', sortOrder: 7, metadata: { type: 'year', yearStart: 2025, yearEnd: 2026 } },
  { code: 'NH_2026_2027', nameVi: 'Năm học 2026–2027', shortName: '2026-2027', sortOrder: 8, metadata: { type: 'year', yearStart: 2026, yearEnd: 2027 } },
  { code: 'NH_2027_2028', nameVi: 'Năm học 2027–2028', shortName: '2027-2028', sortOrder: 9, metadata: { type: 'year', yearStart: 2027, yearEnd: 2028 } },
  { code: 'NH_2028_2029', nameVi: 'Năm học 2028–2029', shortName: '2028-2029', sortOrder: 10, metadata: { type: 'year', yearStart: 2028, yearEnd: 2029 } },
  { code: 'NH_2029_2030', nameVi: 'Năm học 2029–2030', shortName: '2029-2030', sortOrder: 11, metadata: { type: 'year', yearStart: 2029, yearEnd: 2030 } },
  { code: 'NH_2030_2031', nameVi: 'Năm học 2030–2031', shortName: '2030-2031', sortOrder: 12, metadata: { type: 'year', yearStart: 2030, yearEnd: 2031 } },
  // Học kỳ
  { code: 'HK1_2019_2020', nameVi: 'Học kỳ 1 – 2019-2020', shortName: 'HK1/19-20', parentCode: 'NH_2019_2020', sortOrder: 101, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2019_2020', nameVi: 'Học kỳ 2 – 2019-2020', shortName: 'HK2/19-20', parentCode: 'NH_2019_2020', sortOrder: 102, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2020_2021', nameVi: 'Học kỳ 1 – 2020-2021', shortName: 'HK1/20-21', parentCode: 'NH_2020_2021', sortOrder: 201, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2020_2021', nameVi: 'Học kỳ 2 – 2020-2021', shortName: 'HK2/20-21', parentCode: 'NH_2020_2021', sortOrder: 202, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2021_2022', nameVi: 'Học kỳ 1 – 2021-2022', shortName: 'HK1/21-22', parentCode: 'NH_2021_2022', sortOrder: 301, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2021_2022', nameVi: 'Học kỳ 2 – 2021-2022', shortName: 'HK2/21-22', parentCode: 'NH_2021_2022', sortOrder: 302, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2022_2023', nameVi: 'Học kỳ 1 – 2022-2023', shortName: 'HK1/22-23', parentCode: 'NH_2022_2023', sortOrder: 401, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2022_2023', nameVi: 'Học kỳ 2 – 2022-2023', shortName: 'HK2/22-23', parentCode: 'NH_2022_2023', sortOrder: 402, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2023_2024', nameVi: 'Học kỳ 1 – 2023-2024', shortName: 'HK1/23-24', parentCode: 'NH_2023_2024', sortOrder: 501, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2023_2024', nameVi: 'Học kỳ 2 – 2023-2024', shortName: 'HK2/23-24', parentCode: 'NH_2023_2024', sortOrder: 502, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2024_2025', nameVi: 'Học kỳ 1 – 2024-2025', shortName: 'HK1/24-25', parentCode: 'NH_2024_2025', sortOrder: 601, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2024_2025', nameVi: 'Học kỳ 2 – 2024-2025', shortName: 'HK2/24-25', parentCode: 'NH_2024_2025', sortOrder: 602, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2025_2026', nameVi: 'Học kỳ 1 – 2025-2026', shortName: 'HK1/25-26', parentCode: 'NH_2025_2026', sortOrder: 701, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2025_2026', nameVi: 'Học kỳ 2 – 2025-2026', shortName: 'HK2/25-26', parentCode: 'NH_2025_2026', sortOrder: 702, metadata: { type: 'semester', semester: 2 } },
  { code: 'HK1_2026_2027', nameVi: 'Học kỳ 1 – 2026-2027', shortName: 'HK1/26-27', parentCode: 'NH_2026_2027', sortOrder: 801, metadata: { type: 'semester', semester: 1 } },
  { code: 'HK2_2026_2027', nameVi: 'Học kỳ 2 – 2026-2027', shortName: 'HK2/26-27', parentCode: 'NH_2026_2027', sortOrder: 802, metadata: { type: 'semester', semester: 2 } },
]

// ─── MD_MAJOR ─────────────────────────────────────────────────────────────────

const MAJOR_ITEMS = [
  // Nhóm Kỹ thuật – Quân sự
  { code: 'KT_QUAN_SU', nameVi: 'Kỹ thuật Quân sự', nameEn: 'Military Engineering', shortName: 'KTQS', sortOrder: 1, metadata: { group: 'military' } },
  { code: 'KT_KIEM_TOAN_QUAN_SU', nameVi: 'Kỹ thuật Kiểm toán Quân sự', shortName: 'KTKTQS', sortOrder: 2, metadata: { group: 'military' } },
  { code: 'KT_THONG_TIN', nameVi: 'Kỹ thuật Thông tin', nameEn: 'Information Engineering', shortName: 'KTTT', sortOrder: 3, metadata: { group: 'technical' } },
  { code: 'KT_DIEN_TU', nameVi: 'Kỹ thuật Điện tử', nameEn: 'Electronics Engineering', shortName: 'KTĐT', sortOrder: 4, metadata: { group: 'technical' } },
  { code: 'KT_CO_KHI', nameVi: 'Kỹ thuật Cơ khí', nameEn: 'Mechanical Engineering', shortName: 'KTCK', sortOrder: 5, metadata: { group: 'technical' } },
  { code: 'KT_HOA_CHAT', nameVi: 'Kỹ thuật Hóa chất', shortName: 'KTHóa', sortOrder: 6, metadata: { group: 'technical' } },
  { code: 'KT_XAY_DUNG', nameVi: 'Kỹ thuật Xây dựng', nameEn: 'Civil Engineering', shortName: 'KTXD', sortOrder: 7, metadata: { group: 'technical' } },
  { code: 'KT_OTO', nameVi: 'Kỹ thuật Ô tô', shortName: 'KTÔtô', sortOrder: 8, metadata: { group: 'technical' } },
  { code: 'KT_PHAO', nameVi: 'Kỹ thuật Pháo', shortName: 'KTPháo', sortOrder: 9, metadata: { group: 'military' } },
  { code: 'KT_TANG_THIET_GIAP', nameVi: 'Kỹ thuật Tăng – Thiết giáp', shortName: 'KTTTG', sortOrder: 10, metadata: { group: 'military' } },
  // Nhóm Hậu cần – Kinh tế
  { code: 'HAU_CAN_QUAN_SU', nameVi: 'Hậu cần Quân sự', nameEn: 'Military Logistics', shortName: 'HCQS', sortOrder: 11, metadata: { group: 'logistics' } },
  { code: 'QUAN_TRI_KINH_DOANH', nameVi: 'Quản trị Kinh doanh', nameEn: 'Business Administration', shortName: 'QTKD', sortOrder: 12, metadata: { group: 'economics' } },
  { code: 'KE_TOAN', nameVi: 'Kế toán', nameEn: 'Accounting', shortName: 'KT', sortOrder: 13, metadata: { group: 'economics' } },
  { code: 'TAI_CHINH', nameVi: 'Tài chính', nameEn: 'Finance', shortName: 'TC', sortOrder: 14, metadata: { group: 'economics' } },
  { code: 'KINH_TE_QUAN_SU', nameVi: 'Kinh tế Quân sự', shortName: 'KTQS', sortOrder: 15, metadata: { group: 'economics' } },
  { code: 'QUAN_LY_KINH_TE', nameVi: 'Quản lý Kinh tế', nameEn: 'Economic Management', shortName: 'QLKT', sortOrder: 16, metadata: { group: 'economics' } },
  { code: 'NGAN_HANG', nameVi: 'Ngân hàng', nameEn: 'Banking', shortName: 'NH', sortOrder: 17, metadata: { group: 'economics' } },
  { code: 'CUNG_UNG_HAU_CAN', nameVi: 'Cung ứng – Hậu cần', shortName: 'CUHC', sortOrder: 18, metadata: { group: 'logistics' } },
  { code: 'XANG_DAU_QUAN_SU', nameVi: 'Xăng dầu Quân sự', shortName: 'XDQS', sortOrder: 19, metadata: { group: 'logistics' } },
  { code: 'LUONG_THUC_THUC_PHAM', nameVi: 'Lương thực – Thực phẩm', shortName: 'LTTP', sortOrder: 20, metadata: { group: 'logistics' } },
  // Nhóm CNTT – Khoa học
  { code: 'CNTT', nameVi: 'Công nghệ Thông tin', nameEn: 'Information Technology', shortName: 'CNTT', sortOrder: 21, metadata: { group: 'it' } },
  { code: 'KHOA_HOC_MAY_TINH', nameVi: 'Khoa học Máy tính', nameEn: 'Computer Science', shortName: 'KHMT', sortOrder: 22, metadata: { group: 'it' } },
  { code: 'AN_TOAN_THONG_TIN', nameVi: 'An toàn Thông tin', nameEn: 'Information Security', shortName: 'ATTT', sortOrder: 23, metadata: { group: 'it' } },
  { code: 'HE_THONG_THONG_TIN', nameVi: 'Hệ thống Thông tin', nameEn: 'Information Systems', shortName: 'HTTT', sortOrder: 24, metadata: { group: 'it' } },
  { code: 'TOAN_TIN_UNG_DUNG', nameVi: 'Toán – Tin ứng dụng', shortName: 'TTUD', sortOrder: 25, metadata: { group: 'it' } },
  { code: 'VIEN_THONG', nameVi: 'Viễn thông', nameEn: 'Telecommunications', shortName: 'VT', sortOrder: 26, metadata: { group: 'technical' } },
  // Nhóm Khoa học xã hội
  { code: 'LUAT', nameVi: 'Luật', nameEn: 'Law', shortName: 'Luật', sortOrder: 27, metadata: { group: 'social' } },
  { code: 'LUAT_KINH_TE', nameVi: 'Luật Kinh tế', shortName: 'LKT', sortOrder: 28, metadata: { group: 'social' } },
  { code: 'QUAN_LY_HANH_CHINH', nameVi: 'Quản lý Hành chính', nameEn: 'Public Administration', shortName: 'QLHC', sortOrder: 29, metadata: { group: 'social' } },
  { code: 'CHINH_TRI_HOC', nameVi: 'Chính trị học', nameEn: 'Political Science', shortName: 'CTH', sortOrder: 30, metadata: { group: 'social' } },
  { code: 'XA_HOI_HOC', nameVi: 'Xã hội học', nameEn: 'Sociology', shortName: 'XHH', sortOrder: 31, metadata: { group: 'social' } },
  { code: 'LICH_SU', nameVi: 'Lịch sử', nameEn: 'History', shortName: 'LS', sortOrder: 32, metadata: { group: 'social' } },
  { code: 'TRIET_HOC', nameVi: 'Triết học', nameEn: 'Philosophy', shortName: 'TH', sortOrder: 33, metadata: { group: 'social' } },
  { code: 'NGON_NGU_ANH', nameVi: 'Ngôn ngữ Anh', nameEn: 'English Language', shortName: 'NNA', sortOrder: 34, metadata: { group: 'language' } },
  { code: 'NGON_NGU_NGA', nameVi: 'Ngôn ngữ Nga', shortName: 'NNN', sortOrder: 35, metadata: { group: 'language' } },
  { code: 'NGON_NGU_HOA', nameVi: 'Ngôn ngữ Trung', shortName: 'NNH', sortOrder: 36, metadata: { group: 'language' } },
  { code: 'GIAO_DUC_THE_CHAT', nameVi: 'Giáo dục Thể chất', nameEn: 'Physical Education', shortName: 'GDTC', sortOrder: 37, metadata: { group: 'social' } },
  // Nhóm Khoa học tự nhiên
  { code: 'TOAN_HOC', nameVi: 'Toán học', nameEn: 'Mathematics', shortName: 'Toán', sortOrder: 38, metadata: { group: 'science' } },
  { code: 'VAT_LY', nameVi: 'Vật lý', nameEn: 'Physics', shortName: 'VL', sortOrder: 39, metadata: { group: 'science' } },
  { code: 'HOA_HOC', nameVi: 'Hóa học', nameEn: 'Chemistry', shortName: 'Hóa', sortOrder: 40, metadata: { group: 'science' } },
  { code: 'SINH_HOC', nameVi: 'Sinh học', nameEn: 'Biology', shortName: 'Sinh', sortOrder: 41, metadata: { group: 'science' } },
  // Nhóm Y tế – Sức khỏe
  { code: 'Y_HOC_QUAN_SU', nameVi: 'Y học Quân sự', nameEn: 'Military Medicine', shortName: 'YHQS', sortOrder: 42, metadata: { group: 'medical' } },
  { code: 'DUOC_HOC', nameVi: 'Dược học', nameEn: 'Pharmacy', shortName: 'Dược', sortOrder: 43, metadata: { group: 'medical' } },
  { code: 'DIEU_DUONG', nameVi: 'Điều dưỡng', nameEn: 'Nursing', shortName: 'ĐD', sortOrder: 44, metadata: { group: 'medical' } },
  // Nhóm Nông – Lâm
  { code: 'NONG_NGHIEP', nameVi: 'Nông nghiệp', nameEn: 'Agriculture', shortName: 'NN', sortOrder: 45, metadata: { group: 'agriculture' } },
  { code: 'LAM_NGHIEP', nameVi: 'Lâm nghiệp', nameEn: 'Forestry', shortName: 'LN', sortOrder: 46, metadata: { group: 'agriculture' } },
  // Sau đại học
  { code: 'THAC_SI_KT_QS', nameVi: 'Thạc sĩ Kỹ thuật Quân sự', shortName: 'ThS KTQS', sortOrder: 47, metadata: { group: 'postgrad', level: 'master' } },
  { code: 'THAC_SI_HAU_CAN', nameVi: 'Thạc sĩ Hậu cần Quân sự', shortName: 'ThS HC', sortOrder: 48, metadata: { group: 'postgrad', level: 'master' } },
  { code: 'THAC_SI_CNTT', nameVi: 'Thạc sĩ Công nghệ Thông tin', shortName: 'ThS CNTT', sortOrder: 49, metadata: { group: 'postgrad', level: 'master' } },
  { code: 'THAC_SI_KINH_TE', nameVi: 'Thạc sĩ Kinh tế', shortName: 'ThS KT', sortOrder: 50, metadata: { group: 'postgrad', level: 'master' } },
  { code: 'TIEN_SI_KT_QS', nameVi: 'Tiến sĩ Kỹ thuật Quân sự', shortName: 'TS KTQS', sortOrder: 51, metadata: { group: 'postgrad', level: 'phd' } },
  { code: 'TIEN_SI_KINH_TE', nameVi: 'Tiến sĩ Kinh tế', shortName: 'TS KT', sortOrder: 52, metadata: { group: 'postgrad', level: 'phd' } },
  { code: 'TIEN_SI_CNTT', nameVi: 'Tiến sĩ Công nghệ Thông tin', shortName: 'TS CNTT', sortOrder: 53, metadata: { group: 'postgrad', level: 'phd' } },
  { code: 'QUAN_LY_GIAO_DUC', nameVi: 'Quản lý Giáo dục', nameEn: 'Education Management', shortName: 'QLGD', sortOrder: 54, metadata: { group: 'education' } },
  { code: 'SU_PHAM_KY_THUAT', nameVi: 'Sư phạm Kỹ thuật', shortName: 'SPKT', sortOrder: 55, metadata: { group: 'education' } },
]

// ─── MD_COUNTRY ───────────────────────────────────────────────────────────────

const COUNTRY_ITEMS = [
  // Đông Nam Á
  { code: 'VN', nameVi: 'Việt Nam', nameEn: 'Vietnam', shortName: 'VN', externalCode: 'VNM', sortOrder: 1, metadata: { region: 'SEA', iso2: 'VN' } },
  { code: 'LA', nameVi: 'Lào', nameEn: 'Laos', shortName: 'LA', externalCode: 'LAO', sortOrder: 2, metadata: { region: 'SEA', iso2: 'LA' } },
  { code: 'KH', nameVi: 'Campuchia', nameEn: 'Cambodia', shortName: 'KH', externalCode: 'KHM', sortOrder: 3, metadata: { region: 'SEA', iso2: 'KH' } },
  { code: 'TH', nameVi: 'Thái Lan', nameEn: 'Thailand', shortName: 'TH', externalCode: 'THA', sortOrder: 4, metadata: { region: 'SEA', iso2: 'TH' } },
  { code: 'MM', nameVi: 'Myanmar', nameEn: 'Myanmar', shortName: 'MM', externalCode: 'MMR', sortOrder: 5, metadata: { region: 'SEA', iso2: 'MM' } },
  { code: 'MY', nameVi: 'Malaysia', nameEn: 'Malaysia', shortName: 'MY', externalCode: 'MYS', sortOrder: 6, metadata: { region: 'SEA', iso2: 'MY' } },
  { code: 'SG', nameVi: 'Singapore', nameEn: 'Singapore', shortName: 'SG', externalCode: 'SGP', sortOrder: 7, metadata: { region: 'SEA', iso2: 'SG' } },
  { code: 'ID', nameVi: 'Indonesia', nameEn: 'Indonesia', shortName: 'ID', externalCode: 'IDN', sortOrder: 8, metadata: { region: 'SEA', iso2: 'ID' } },
  { code: 'PH', nameVi: 'Philippines', nameEn: 'Philippines', shortName: 'PH', externalCode: 'PHL', sortOrder: 9, metadata: { region: 'SEA', iso2: 'PH' } },
  { code: 'BN', nameVi: 'Brunei', nameEn: 'Brunei', shortName: 'BN', externalCode: 'BRN', sortOrder: 10, metadata: { region: 'SEA', iso2: 'BN' } },
  { code: 'TL', nameVi: 'Timor-Leste', nameEn: 'Timor-Leste', shortName: 'TL', externalCode: 'TLS', sortOrder: 11, metadata: { region: 'SEA', iso2: 'TL' } },
  // Đông Á
  { code: 'CN', nameVi: 'Trung Quốc', nameEn: 'China', shortName: 'CN', externalCode: 'CHN', sortOrder: 12, metadata: { region: 'EA', iso2: 'CN' } },
  { code: 'JP', nameVi: 'Nhật Bản', nameEn: 'Japan', shortName: 'JP', externalCode: 'JPN', sortOrder: 13, metadata: { region: 'EA', iso2: 'JP' } },
  { code: 'KR', nameVi: 'Hàn Quốc', nameEn: 'South Korea', shortName: 'KR', externalCode: 'KOR', sortOrder: 14, metadata: { region: 'EA', iso2: 'KR' } },
  { code: 'KP', nameVi: 'Triều Tiên', nameEn: 'North Korea', shortName: 'KP', externalCode: 'PRK', sortOrder: 15, metadata: { region: 'EA', iso2: 'KP' } },
  { code: 'MN', nameVi: 'Mông Cổ', nameEn: 'Mongolia', shortName: 'MN', externalCode: 'MNG', sortOrder: 16, metadata: { region: 'EA', iso2: 'MN' } },
  { code: 'TW', nameVi: 'Đài Loan', nameEn: 'Taiwan', shortName: 'TW', externalCode: 'TWN', sortOrder: 17, metadata: { region: 'EA', iso2: 'TW' } },
  { code: 'HK', nameVi: 'Hồng Kông', nameEn: 'Hong Kong', shortName: 'HK', externalCode: 'HKG', sortOrder: 18, metadata: { region: 'EA', iso2: 'HK' } },
  // Nam Á
  { code: 'IN', nameVi: 'Ấn Độ', nameEn: 'India', shortName: 'IN', externalCode: 'IND', sortOrder: 19, metadata: { region: 'SA', iso2: 'IN' } },
  { code: 'PK', nameVi: 'Pakistan', nameEn: 'Pakistan', shortName: 'PK', externalCode: 'PAK', sortOrder: 20, metadata: { region: 'SA', iso2: 'PK' } },
  { code: 'BD', nameVi: 'Bangladesh', nameEn: 'Bangladesh', shortName: 'BD', externalCode: 'BGD', sortOrder: 21, metadata: { region: 'SA', iso2: 'BD' } },
  { code: 'LK', nameVi: 'Sri Lanka', nameEn: 'Sri Lanka', shortName: 'LK', externalCode: 'LKA', sortOrder: 22, metadata: { region: 'SA', iso2: 'LK' } },
  { code: 'NP', nameVi: 'Nepal', nameEn: 'Nepal', shortName: 'NP', externalCode: 'NPL', sortOrder: 23, metadata: { region: 'SA', iso2: 'NP' } },
  // Trung Đông
  { code: 'IR', nameVi: 'Iran', nameEn: 'Iran', shortName: 'IR', externalCode: 'IRN', sortOrder: 24, metadata: { region: 'ME', iso2: 'IR' } },
  { code: 'IQ', nameVi: 'Iraq', nameEn: 'Iraq', shortName: 'IQ', externalCode: 'IRQ', sortOrder: 25, metadata: { region: 'ME', iso2: 'IQ' } },
  { code: 'SA', nameVi: 'Ả Rập Saudi', nameEn: 'Saudi Arabia', shortName: 'SA', externalCode: 'SAU', sortOrder: 26, metadata: { region: 'ME', iso2: 'SA' } },
  { code: 'AE', nameVi: 'UAE', nameEn: 'United Arab Emirates', shortName: 'UAE', externalCode: 'ARE', sortOrder: 27, metadata: { region: 'ME', iso2: 'AE' } },
  { code: 'IL', nameVi: 'Israel', nameEn: 'Israel', shortName: 'IL', externalCode: 'ISR', sortOrder: 28, metadata: { region: 'ME', iso2: 'IL' } },
  { code: 'TR', nameVi: 'Thổ Nhĩ Kỳ', nameEn: 'Turkey', shortName: 'TR', externalCode: 'TUR', sortOrder: 29, metadata: { region: 'ME', iso2: 'TR' } },
  // Châu Âu
  { code: 'RU', nameVi: 'Nga', nameEn: 'Russia', shortName: 'RU', externalCode: 'RUS', sortOrder: 30, metadata: { region: 'EU', iso2: 'RU' } },
  { code: 'DE', nameVi: 'Đức', nameEn: 'Germany', shortName: 'DE', externalCode: 'DEU', sortOrder: 31, metadata: { region: 'EU', iso2: 'DE' } },
  { code: 'FR', nameVi: 'Pháp', nameEn: 'France', shortName: 'FR', externalCode: 'FRA', sortOrder: 32, metadata: { region: 'EU', iso2: 'FR' } },
  { code: 'GB', nameVi: 'Anh', nameEn: 'United Kingdom', shortName: 'UK', externalCode: 'GBR', sortOrder: 33, metadata: { region: 'EU', iso2: 'GB' } },
  { code: 'IT', nameVi: 'Ý', nameEn: 'Italy', shortName: 'IT', externalCode: 'ITA', sortOrder: 34, metadata: { region: 'EU', iso2: 'IT' } },
  { code: 'ES', nameVi: 'Tây Ban Nha', nameEn: 'Spain', shortName: 'ES', externalCode: 'ESP', sortOrder: 35, metadata: { region: 'EU', iso2: 'ES' } },
  { code: 'PL', nameVi: 'Ba Lan', nameEn: 'Poland', shortName: 'PL', externalCode: 'POL', sortOrder: 36, metadata: { region: 'EU', iso2: 'PL' } },
  { code: 'NL', nameVi: 'Hà Lan', nameEn: 'Netherlands', shortName: 'NL', externalCode: 'NLD', sortOrder: 37, metadata: { region: 'EU', iso2: 'NL' } },
  { code: 'SE', nameVi: 'Thụy Điển', nameEn: 'Sweden', shortName: 'SE', externalCode: 'SWE', sortOrder: 38, metadata: { region: 'EU', iso2: 'SE' } },
  { code: 'NO', nameVi: 'Na Uy', nameEn: 'Norway', shortName: 'NO', externalCode: 'NOR', sortOrder: 39, metadata: { region: 'EU', iso2: 'NO' } },
  { code: 'CZ', nameVi: 'Cộng hòa Séc', nameEn: 'Czech Republic', shortName: 'CZ', externalCode: 'CZE', sortOrder: 40, metadata: { region: 'EU', iso2: 'CZ' } },
  { code: 'UA', nameVi: 'Ukraine', nameEn: 'Ukraine', shortName: 'UA', externalCode: 'UKR', sortOrder: 41, metadata: { region: 'EU', iso2: 'UA' } },
  { code: 'BY', nameVi: 'Belarus', nameEn: 'Belarus', shortName: 'BY', externalCode: 'BLR', sortOrder: 42, metadata: { region: 'EU', iso2: 'BY' } },
  // Châu Mỹ
  { code: 'US', nameVi: 'Hoa Kỳ', nameEn: 'United States', shortName: 'US', externalCode: 'USA', sortOrder: 43, metadata: { region: 'AM', iso2: 'US' } },
  { code: 'CA', nameVi: 'Canada', nameEn: 'Canada', shortName: 'CA', externalCode: 'CAN', sortOrder: 44, metadata: { region: 'AM', iso2: 'CA' } },
  { code: 'MX', nameVi: 'Mexico', nameEn: 'Mexico', shortName: 'MX', externalCode: 'MEX', sortOrder: 45, metadata: { region: 'AM', iso2: 'MX' } },
  { code: 'BR', nameVi: 'Brazil', nameEn: 'Brazil', shortName: 'BR', externalCode: 'BRA', sortOrder: 46, metadata: { region: 'AM', iso2: 'BR' } },
  { code: 'AR', nameVi: 'Argentina', nameEn: 'Argentina', shortName: 'AR', externalCode: 'ARG', sortOrder: 47, metadata: { region: 'AM', iso2: 'AR' } },
  { code: 'CL', nameVi: 'Chile', nameEn: 'Chile', shortName: 'CL', externalCode: 'CHL', sortOrder: 48, metadata: { region: 'AM', iso2: 'CL' } },
  { code: 'CO', nameVi: 'Colombia', nameEn: 'Colombia', shortName: 'CO', externalCode: 'COL', sortOrder: 49, metadata: { region: 'AM', iso2: 'CO' } },
  // Châu Phi
  { code: 'ZA', nameVi: 'Nam Phi', nameEn: 'South Africa', shortName: 'ZA', externalCode: 'ZAF', sortOrder: 50, metadata: { region: 'AF', iso2: 'ZA' } },
  { code: 'EG', nameVi: 'Ai Cập', nameEn: 'Egypt', shortName: 'EG', externalCode: 'EGY', sortOrder: 51, metadata: { region: 'AF', iso2: 'EG' } },
  { code: 'NG', nameVi: 'Nigeria', nameEn: 'Nigeria', shortName: 'NG', externalCode: 'NGA', sortOrder: 52, metadata: { region: 'AF', iso2: 'NG' } },
  { code: 'ET', nameVi: 'Ethiopia', nameEn: 'Ethiopia', shortName: 'ET', externalCode: 'ETH', sortOrder: 53, metadata: { region: 'AF', iso2: 'ET' } },
  { code: 'KE', nameVi: 'Kenya', nameEn: 'Kenya', shortName: 'KE', externalCode: 'KEN', sortOrder: 54, metadata: { region: 'AF', iso2: 'KE' } },
  // Châu Úc – TBD
  { code: 'AU', nameVi: 'Úc', nameEn: 'Australia', shortName: 'AU', externalCode: 'AUS', sortOrder: 55, metadata: { region: 'OC', iso2: 'AU' } },
  { code: 'NZ', nameVi: 'New Zealand', nameEn: 'New Zealand', shortName: 'NZ', externalCode: 'NZL', sortOrder: 56, metadata: { region: 'OC', iso2: 'NZ' } },
  // Trung Á / CIS
  { code: 'KZ', nameVi: 'Kazakhstan', nameEn: 'Kazakhstan', shortName: 'KZ', externalCode: 'KAZ', sortOrder: 57, metadata: { region: 'CA', iso2: 'KZ' } },
  { code: 'UZ', nameVi: 'Uzbekistan', nameEn: 'Uzbekistan', shortName: 'UZ', externalCode: 'UZB', sortOrder: 58, metadata: { region: 'CA', iso2: 'UZ' } },
  { code: 'CU', nameVi: 'Cuba', nameEn: 'Cuba', shortName: 'CU', externalCode: 'CUB', sortOrder: 59, metadata: { region: 'AM', iso2: 'CU' } },
  { code: 'OTHER', nameVi: 'Quốc gia khác', nameEn: 'Other Country', shortName: 'Khác', sortOrder: 999 },
]

// ─── MD_DISTRICT – quận/huyện chuẩn 2025 ─────────────────────────────────────
// Chú thích: externalCode = mã hành chính DVHC chuẩn; parentCode = mã tỉnh từ MD_PROVINCE

const DISTRICT_ITEMS = [
  // HÀ NỘI (HN) – 30 đơn vị sau sáp nhập 2025
  { code: 'HN_BADINH',    nameVi: 'Quận Ba Đình',        shortName: 'Ba Đình',    parentCode: 'HN', externalCode: '001', sortOrder: 1 },
  { code: 'HN_HOANKIEM',  nameVi: 'Quận Hoàn Kiếm',      shortName: 'Hoàn Kiếm', parentCode: 'HN', externalCode: '002', sortOrder: 2 },
  { code: 'HN_TAYHO',     nameVi: 'Quận Tây Hồ',         shortName: 'Tây Hồ',    parentCode: 'HN', externalCode: '003', sortOrder: 3 },
  { code: 'HN_LONGBIEN',  nameVi: 'Quận Long Biên',       shortName: 'Long Biên', parentCode: 'HN', externalCode: '004', sortOrder: 4 },
  { code: 'HN_CAUGIAY',   nameVi: 'Quận Cầu Giấy',       shortName: 'Cầu Giấy',  parentCode: 'HN', externalCode: '005', sortOrder: 5 },
  { code: 'HN_DONGDA',    nameVi: 'Quận Đống Đa',        shortName: 'Đống Đa',   parentCode: 'HN', externalCode: '006', sortOrder: 6 },
  { code: 'HN_HAIBATRUNG',nameVi: 'Quận Hai Bà Trưng',   shortName: 'HBT',       parentCode: 'HN', externalCode: '007', sortOrder: 7 },
  { code: 'HN_HOANGMAI',  nameVi: 'Quận Hoàng Mai',      shortName: 'Hoàng Mai', parentCode: 'HN', externalCode: '008', sortOrder: 8 },
  { code: 'HN_THANXUAN',  nameVi: 'Quận Thanh Xuân',     shortName: 'Thanh Xuân',parentCode: 'HN', externalCode: '009', sortOrder: 9 },
  { code: 'HN_SOCTRANG',  nameVi: 'Huyện Sóc Sơn',       shortName: 'Sóc Sơn',   parentCode: 'HN', externalCode: '016', sortOrder: 10 },
  { code: 'HN_DONGANH',   nameVi: 'Huyện Đông Anh',      shortName: 'Đông Anh',  parentCode: 'HN', externalCode: '017', sortOrder: 11 },
  { code: 'HN_GIALAM',    nameVi: 'Huyện Gia Lâm',       shortName: 'Gia Lâm',   parentCode: 'HN', externalCode: '018', sortOrder: 12 },
  { code: 'HN_NAMTULIEM', nameVi: 'Quận Nam Từ Liêm',    shortName: 'Nam TL',     parentCode: 'HN', externalCode: '019', sortOrder: 13 },
  { code: 'HN_THANHTRI',  nameVi: 'Huyện Thanh Trì',     shortName: 'Thanh Trì', parentCode: 'HN', externalCode: '020', sortOrder: 14 },
  { code: 'HN_BACTULIEM', nameVi: 'Quận Bắc Từ Liêm',   shortName: 'Bắc TL',    parentCode: 'HN', externalCode: '021', sortOrder: 15 },
  { code: 'HN_MELINH',    nameVi: 'Huyện Mê Linh',       shortName: 'Mê Linh',   parentCode: 'HN', externalCode: '250', sortOrder: 16 },
  { code: 'HN_HADONG',    nameVi: 'Quận Hà Đông',        shortName: 'Hà Đông',   parentCode: 'HN', externalCode: '268', sortOrder: 17 },
  { code: 'HN_SONTAY',    nameVi: 'Thị xã Sơn Tây',     shortName: 'Sơn Tây',   parentCode: 'HN', externalCode: '269', sortOrder: 18 },
  { code: 'HN_BAIVI',     nameVi: 'Huyện Ba Vì',         shortName: 'Ba Vì',     parentCode: 'HN', externalCode: '271', sortOrder: 19 },
  { code: 'HN_PHUCTHO',   nameVi: 'Huyện Phúc Thọ',      shortName: 'Phúc Thọ',  parentCode: 'HN', externalCode: '272', sortOrder: 20 },
  { code: 'HN_DANPHUONG', nameVi: 'Huyện Đan Phượng',    shortName: 'Đan Phượng',parentCode: 'HN', externalCode: '273', sortOrder: 21 },
  { code: 'HN_HOAIBUC',   nameVi: 'Huyện Hoài Đức',      shortName: 'Hoài Đức',  parentCode: 'HN', externalCode: '274', sortOrder: 22 },
  { code: 'HN_QUOCOAI',   nameVi: 'Huyện Quốc Oai',      shortName: 'Quốc Oai',  parentCode: 'HN', externalCode: '275', sortOrder: 23 },
  { code: 'HN_THACHOTHAT',nameVi: 'Huyện Thạch Thất',    shortName: 'Thạch Thất',parentCode: 'HN', externalCode: '276', sortOrder: 24 },
  { code: 'HN_CHUONGMY',  nameVi: 'Huyện Chương Mỹ',     shortName: 'Chương Mỹ', parentCode: 'HN', externalCode: '277', sortOrder: 25 },
  { code: 'HN_THANHOAI',  nameVi: 'Huyện Thanh Oai',     shortName: 'Thanh Oai', parentCode: 'HN', externalCode: '278', sortOrder: 26 },
  { code: 'HN_THUONGTIN',  nameVi: 'Huyện Thường Tín',   shortName: 'Thường Tín', parentCode: 'HN', externalCode: '279', sortOrder: 27 },
  { code: 'HN_PHUXUYEN',  nameVi: 'Huyện Phú Xuyên',     shortName: 'Phú Xuyên', parentCode: 'HN', externalCode: '280', sortOrder: 28 },
  { code: 'HN_UNGOA',     nameVi: 'Huyện Ứng Hòa',       shortName: 'Ứng Hòa',   parentCode: 'HN', externalCode: '281', sortOrder: 29 },
  { code: 'HN_MYHOA',     nameVi: 'Huyện Mỹ Đức',        shortName: 'Mỹ Đức',    parentCode: 'HN', externalCode: '282', sortOrder: 30 },

  // HỒ CHÍ MINH (HCM) – 22 đơn vị
  { code: 'HCM_Q1',    nameVi: 'Quận 1',          shortName: 'Q.1',      parentCode: 'HCM', externalCode: '760', sortOrder: 1 },
  { code: 'HCM_Q3',    nameVi: 'Quận 3',          shortName: 'Q.3',      parentCode: 'HCM', externalCode: '762', sortOrder: 2 },
  { code: 'HCM_Q4',    nameVi: 'Quận 4',          shortName: 'Q.4',      parentCode: 'HCM', externalCode: '763', sortOrder: 3 },
  { code: 'HCM_Q5',    nameVi: 'Quận 5',          shortName: 'Q.5',      parentCode: 'HCM', externalCode: '764', sortOrder: 4 },
  { code: 'HCM_Q6',    nameVi: 'Quận 6',          shortName: 'Q.6',      parentCode: 'HCM', externalCode: '765', sortOrder: 5 },
  { code: 'HCM_Q7',    nameVi: 'Quận 7',          shortName: 'Q.7',      parentCode: 'HCM', externalCode: '766', sortOrder: 6 },
  { code: 'HCM_Q8',    nameVi: 'Quận 8',          shortName: 'Q.8',      parentCode: 'HCM', externalCode: '767', sortOrder: 7 },
  { code: 'HCM_Q10',   nameVi: 'Quận 10',         shortName: 'Q.10',     parentCode: 'HCM', externalCode: '768', sortOrder: 8 },
  { code: 'HCM_Q11',   nameVi: 'Quận 11',         shortName: 'Q.11',     parentCode: 'HCM', externalCode: '769', sortOrder: 9 },
  { code: 'HCM_Q12',   nameVi: 'Quận 12',         shortName: 'Q.12',     parentCode: 'HCM', externalCode: '770', sortOrder: 10 },
  { code: 'HCM_TANBINH', nameVi: 'Quận Tân Bình', shortName: 'Tân Bình', parentCode: 'HCM', externalCode: '771', sortOrder: 11 },
  { code: 'HCM_TANPHU',  nameVi: 'Quận Tân Phú',  shortName: 'Tân Phú',  parentCode: 'HCM', externalCode: '772', sortOrder: 12 },
  { code: 'HCM_PHUNHUAN',nameVi: 'Quận Phú Nhuận',shortName: 'Phú Nhuận',parentCode: 'HCM', externalCode: '773', sortOrder: 13 },
  { code: 'HCM_BINHTHANH',nameVi:'Quận Bình Thạnh',shortName:'Bình Thạnh',parentCode: 'HCM', externalCode: '774', sortOrder: 14 },
  { code: 'HCM_GOVAP',   nameVi: 'Quận Gò Vấp',   shortName: 'Gò Vấp',   parentCode: 'HCM', externalCode: '775', sortOrder: 15 },
  { code: 'HCM_BINHTAN', nameVi: 'Quận Bình Tân',  shortName: 'Bình Tân', parentCode: 'HCM', externalCode: '776', sortOrder: 16 },
  { code: 'HCM_THUDUC',  nameVi: 'TP. Thủ Đức',   shortName: 'Thủ Đức',  parentCode: 'HCM', externalCode: '777', sortOrder: 17 },
  { code: 'HCM_BINH_CHANH', nameVi: 'Huyện Bình Chánh', shortName: 'Bình Chánh', parentCode: 'HCM', externalCode: '785', sortOrder: 18 },
  { code: 'HCM_HOP_MON',    nameVi: 'Huyện Hóc Môn',    shortName: 'Hóc Môn',    parentCode: 'HCM', externalCode: '786', sortOrder: 19 },
  { code: 'HCM_CU_CHI',     nameVi: 'Huyện Củ Chi',      shortName: 'Củ Chi',     parentCode: 'HCM', externalCode: '783', sortOrder: 20 },
  { code: 'HCM_NHABÉ',      nameVi: 'Huyện Nhà Bè',      shortName: 'Nhà Bè',     parentCode: 'HCM', externalCode: '787', sortOrder: 21 },
  { code: 'HCM_CANGIO',     nameVi: 'Huyện Cần Giờ',     shortName: 'Cần Giờ',    parentCode: 'HCM', externalCode: '788', sortOrder: 22 },

  // ĐÀ NẴNG (DN) – 8 đơn vị
  { code: 'DN_HAICHAU',  nameVi: 'Quận Hải Châu',  shortName: 'Hải Châu',  parentCode: 'DN', externalCode: '490', sortOrder: 1 },
  { code: 'DN_THANHKHE', nameVi: 'Quận Thanh Khê', shortName: 'Thanh Khê', parentCode: 'DN', externalCode: '491', sortOrder: 2 },
  { code: 'DN_SONTRA',   nameVi: 'Quận Sơn Trà',   shortName: 'Sơn Trà',   parentCode: 'DN', externalCode: '492', sortOrder: 3 },
  { code: 'DN_NGUHANHSON',nameVi: 'Quận Ngũ Hành Sơn', shortName: 'NHS',  parentCode: 'DN', externalCode: '493', sortOrder: 4 },
  { code: 'DN_LIENCHIÊU',nameVi: 'Quận Liên Chiểu', shortName: 'Liên Chiểu',parentCode: 'DN', externalCode: '494', sortOrder: 5 },
  { code: 'DN_CAMLE',    nameVi: 'Quận Cẩm Lệ',    shortName: 'Cẩm Lệ',   parentCode: 'DN', externalCode: '495', sortOrder: 6 },
  { code: 'DN_HOAVANG',  nameVi: 'Huyện Hòa Vang',  shortName: 'Hòa Vang', parentCode: 'DN', externalCode: '497', sortOrder: 7 },
  { code: 'DN_HOANGSA',  nameVi: 'Huyện Hoàng Sa',  shortName: 'Hoàng Sa', parentCode: 'DN', externalCode: '498', sortOrder: 8 },

  // HẢI PHÒNG (HP)
  { code: 'HP_HONGBANG',  nameVi: 'Quận Hồng Bàng',  shortName: 'Hồng Bàng',  parentCode: 'HP', externalCode: '303', sortOrder: 1 },
  { code: 'HP_NGOQUYEN',  nameVi: 'Quận Ngô Quyền',  shortName: 'Ngô Quyền',  parentCode: 'HP', externalCode: '304', sortOrder: 2 },
  { code: 'HP_LECHA',     nameVi: 'Quận Lê Chân',    shortName: 'Lê Chân',    parentCode: 'HP', externalCode: '305', sortOrder: 3 },
  { code: 'HP_HAIAN',     nameVi: 'Quận Hải An',     shortName: 'Hải An',     parentCode: 'HP', externalCode: '306', sortOrder: 4 },
  { code: 'HP_KIENАН',    nameVi: 'Quận Kiến An',    shortName: 'Kiến An',    parentCode: 'HP', externalCode: '307', sortOrder: 5 },
  { code: 'HP_DUONGKINH', nameVi: 'Quận Dương Kinh', shortName: 'Dương Kinh', parentCode: 'HP', externalCode: '308', sortOrder: 6 },
  { code: 'HP_DOTSON',    nameVi: 'Quận Đồ Sơn',     shortName: 'Đồ Sơn',    parentCode: 'HP', externalCode: '309', sortOrder: 7 },
  { code: 'HP_THUYSONGIEN',nameVi:'Huyện Thủy Nguyên',shortName:'Thủy Nguyên',parentCode: 'HP', externalCode: '311', sortOrder: 8 },
  { code: 'HP_ANTHUONG',  nameVi: 'Huyện An Dương',  shortName: 'An Dương',   parentCode: 'HP', externalCode: '312', sortOrder: 9 },
  { code: 'HP_ANLAO',     nameVi: 'Huyện An Lão',    shortName: 'An Lão',     parentCode: 'HP', externalCode: '313', sortOrder: 10 },
  { code: 'HP_KIENTHUY',  nameVi: 'Huyện Kiến Thụy', shortName: 'Kiến Thụy', parentCode: 'HP', externalCode: '314', sortOrder: 11 },
  { code: 'HP_TIENLANG',  nameVi: 'Huyện Tiên Lãng', shortName: 'Tiên Lãng', parentCode: 'HP', externalCode: '315', sortOrder: 12 },
  { code: 'HP_VINHBAO',   nameVi: 'Huyện Vĩnh Bảo',  shortName: 'Vĩnh Bảo',  parentCode: 'HP', externalCode: '316', sortOrder: 13 },
  { code: 'HP_CATHAIÂ',   nameVi: 'Huyện Cát Hải',   shortName: 'Cát Hải',   parentCode: 'HP', externalCode: '317', sortOrder: 14 },
  { code: 'HP_BACHLONG',  nameVi: 'Huyện Bạch Long Vĩ', shortName: 'BLV',   parentCode: 'HP', externalCode: '318', sortOrder: 15 },

  // CẦN THƠ (CT)
  { code: 'CT_NINHKIEU',  nameVi: 'Quận Ninh Kiều',  shortName: 'Ninh Kiều',  parentCode: 'CT', externalCode: '916', sortOrder: 1 },
  { code: 'CT_OMON',      nameVi: 'Quận Ô Môn',      shortName: 'Ô Môn',      parentCode: 'CT', externalCode: '917', sortOrder: 2 },
  { code: 'CT_BINHTHUY',  nameVi: 'Quận Bình Thủy',  shortName: 'Bình Thủy',  parentCode: 'CT', externalCode: '918', sortOrder: 3 },
  { code: 'CT_CAIRANG',   nameVi: 'Quận Cái Răng',   shortName: 'Cái Răng',   parentCode: 'CT', externalCode: '919', sortOrder: 4 },
  { code: 'CT_THONNHUT',  nameVi: 'Quận Thốt Nốt',   shortName: 'Thốt Nốt',  parentCode: 'CT', externalCode: '923', sortOrder: 5 },
  { code: 'CT_VINHTHANG', nameVi: 'Huyện Vĩnh Thạnh', shortName: 'Vĩnh Thạnh',parentCode: 'CT', externalCode: '924', sortOrder: 6 },
  { code: 'CT_CODO',      nameVi: 'Huyện Cờ Đỏ',     shortName: 'Cờ Đỏ',     parentCode: 'CT', externalCode: '925', sortOrder: 7 },
  { code: 'CT_PHONGNHIEN',nameVi: 'Huyện Phong Điền', shortName: 'Phong Điền',parentCode: 'CT', externalCode: '926', sortOrder: 8 },
  { code: 'CT_THOIDAI',   nameVi: 'Huyện Thới Lai',   shortName: 'Thới Lai',   parentCode: 'CT', externalCode: '927', sortOrder: 9 },

  // MỘT SỐ TỈNH THÀNH KHÁC (thủ phủ / trung tâm)
  { code: 'BN_TPCABAC',  nameVi: 'TP. Bắc Ninh',  shortName: 'Bắc Ninh',  parentCode: 'BN', externalCode: '256', sortOrder: 1 },
  { code: 'HD_TPHADUONG',nameVi: 'TP. Hải Dương', shortName: 'Hải Dương', parentCode: 'HD', externalCode: '288', sortOrder: 1 },
  { code: 'HY_TPHUNYEN', nameVi: 'TP. Hưng Yên',  shortName: 'Hưng Yên',  parentCode: 'HY', externalCode: '323', sortOrder: 1 },
  { code: 'VB_TPVINHPHUC',nameVi:'TP. Vĩnh Yên',  shortName: 'Vĩnh Yên',  parentCode: 'VP', externalCode: '243', sortOrder: 1 },
  { code: 'HA_TPHATINH',  nameVi:'TP. Hà Tĩnh',   shortName: 'Hà Tĩnh',   parentCode: 'HT', externalCode: '442', sortOrder: 1 },
  { code: 'QB_TPDONGHOI', nameVi:'TP. Đồng Hới',  shortName: 'Đồng Hới',  parentCode: 'QB', externalCode: '458', sortOrder: 1 },
  { code: 'QT_TPDONGHA',  nameVi:'TP. Đông Hà',   shortName: 'Đông Hà',   parentCode: 'QT', externalCode: '461', sortOrder: 1 },
  { code: 'TT_TPHUE',     nameVi:'TP. Huế',       shortName: 'Huế',        parentCode: 'TT', externalCode: '474', sortOrder: 1 },
  { code: 'QN_TPQUANGNGAI',nameVi:'TP. Quảng Ngãi',shortName:'Quảng Ngãi',parentCode: 'QN', externalCode: '524', sortOrder: 1 },
  { code: 'BD_TPTHUDAN',  nameVi:'TP. Thủ Dầu Một',shortName:'TDM',        parentCode: 'BD', externalCode: '718', sortOrder: 1 },
  { code: 'DNa_TPBIENHOÂ',nameVi:'TP. Biên Hòa',  shortName: 'Biên Hòa',  parentCode: 'DNa', externalCode: '731', sortOrder: 1 },
  { code: 'LA_TPTANАН',   nameVi:'TP. Tân An',    shortName: 'Tân An',    parentCode: 'LA', externalCode: '794', sortOrder: 1 },
  { code: 'TG_TPMYTHO',   nameVi:'TP. Mỹ Tho',   shortName: 'Mỹ Tho',   parentCode: 'TG', externalCode: '815', sortOrder: 1 },
  { code: 'BT_TPBENTREЕ', nameVi:'TP. Bến Tre',   shortName: 'Bến Tre',   parentCode: 'BT', externalCode: '829', sortOrder: 1 },
  { code: 'VL_TPVINLONGЕ',nameVi:'TP. Vĩnh Long',  shortName: 'Vĩnh Long', parentCode: 'VL', externalCode: '855', sortOrder: 1 },
  { code: 'DT_TPCAOLANH', nameVi:'TP. Cao Lãnh',   shortName: 'Cao Lãnh',  parentCode: 'DT', externalCode: '871', sortOrder: 1 },
  { code: 'AG_TPLONGXUYÊN',nameVi:'TP. Long Xuyên',shortName:'Long Xuyên',parentCode: 'AG', externalCode: '883', sortOrder: 1 },
  { code: 'KG_TPRACHGIA', nameVi:'TP. Rạch Giá',  shortName: 'Rạch Giá',  parentCode: 'KG', externalCode: '899', sortOrder: 1 },
  { code: 'CA_TPCAMAU',   nameVi:'TP. Cà Mau',    shortName: 'Cà Mau',    parentCode: 'CM', externalCode: '969', sortOrder: 1 },
]

// ─── MD_SALARY_GRADE ──────────────────────────────────────────────────────────

const SALARY_GRADE_ITEMS = [
  { code: 'SG_SI_QUY', nameVi: 'Sĩ quan quân đội – bậc 1', shortName: 'SQ/1', sortOrder: 1, metadata: { type: 'SQ' } },
  { code: 'SG_SI_QUAN_B2', nameVi: 'Sĩ quan quân đội – bậc 2', shortName: 'SQ/2', sortOrder: 2, metadata: { type: 'SQ' } },
  { code: 'SG_SI_QUAN_B3', nameVi: 'Sĩ quan quân đội – bậc 3', shortName: 'SQ/3', sortOrder: 3, metadata: { type: 'SQ' } },
  { code: 'SG_QN_CHUYEN_NGHIEP', nameVi: 'Quân nhân chuyên nghiệp', shortName: 'QNCN', sortOrder: 4, metadata: { type: 'QNCN' } },
  { code: 'SG_CONG_CHUC_QP', nameVi: 'Công chức quốc phòng', shortName: 'CCQP', sortOrder: 5, metadata: { type: 'CCQP' } },
  { code: 'SG_VIEN_CHUC_QP', nameVi: 'Viên chức quốc phòng', shortName: 'VCQP', sortOrder: 6, metadata: { type: 'VCQP' } },
  { code: 'SG_LAO_DONG_HOP_DONG', nameVi: 'Lao động hợp đồng', shortName: 'LĐHĐ', sortOrder: 7, metadata: { type: 'LD' } },
  { code: 'SG_HAM_SI_B1', nameVi: 'Hạ sĩ quan – bậc 1', shortName: 'HSQ/1', sortOrder: 8, metadata: { type: 'HSQ' } },
  { code: 'SG_HAM_SI_B2', nameVi: 'Hạ sĩ quan – bậc 2', shortName: 'HSQ/2', sortOrder: 9, metadata: { type: 'HSQ' } },
  { code: 'SG_NGHIA_VU', nameVi: 'Nghĩa vụ quân sự', shortName: 'NVQS', sortOrder: 10, metadata: { type: 'NV' } },
]

// ─── MD_SALARY_ALLOWANCE ──────────────────────────────────────────────────────

const SALARY_ALLOWANCE_ITEMS = [
  { code: 'PHU_CAP_CHUC_VU', nameVi: 'Phụ cấp chức vụ lãnh đạo', shortName: 'PCCV', sortOrder: 1 },
  { code: 'PHU_CAP_THAN_NIEN', nameVi: 'Phụ cấp thâm niên nghề', shortName: 'PCTN', sortOrder: 2 },
  { code: 'PHU_CAP_UU_DAI', nameVi: 'Phụ cấp ưu đãi theo nghề', shortName: 'PCƯĐ', sortOrder: 3 },
  { code: 'PHU_CAP_KHU_VUC', nameVi: 'Phụ cấp khu vực', shortName: 'PCKV', sortOrder: 4 },
  { code: 'PHU_CAP_DAN_TOC', nameVi: 'Phụ cấp thu hút / dân tộc', shortName: 'PCDT', sortOrder: 5 },
  { code: 'PHU_CAP_DOC_HAI', nameVi: 'Phụ cấp độc hại nguy hiểm', shortName: 'PCĐH', sortOrder: 6 },
  { code: 'PHU_CAP_CONG_TAC', nameVi: 'Phụ cấp công tác lưu động', shortName: 'PCCT', sortOrder: 7 },
  { code: 'PHU_CAP_TRANG_PHUC', nameVi: 'Phụ cấp trang phục', shortName: 'PCTP', sortOrder: 8 },
  { code: 'PHU_CAP_PHUONG_TIEN', nameVi: 'Phụ cấp phương tiện công vụ', shortName: 'PCPT', sortOrder: 9 },
  { code: 'PHU_CAP_DIEN_THOAI', nameVi: 'Phụ cấp điện thoại', shortName: 'PCĐT', sortOrder: 10 },
  { code: 'PHU_CAP_NHAN_DOC', nameVi: 'Phụ cấp nhà ở', shortName: 'PCNƠ', sortOrder: 11 },
  { code: 'PHU_CAP_HAI_NGOAI', nameVi: 'Phụ cấp công tác nước ngoài', shortName: 'PCHNG', sortOrder: 12 },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding missing M19 items...\n')

  const runs = [
    {
      cat: { code: 'MD_ACADEMIC_YEAR', nameVi: 'Năm học / Học kỳ', nameEn: 'Academic Year', groupTag: 'TRAINING', cacheType: 'DYNAMIC', sourceType: 'LOCAL', sortOrder: 68 },
      items: ACADEMIC_YEAR_ITEMS,
    },
    {
      cat: { code: 'MD_MAJOR', nameVi: 'Chuyên ngành đào tạo', nameEn: 'Academic Major', groupTag: 'EDUCATION', cacheType: 'SEMI', sourceType: 'NATIONAL', sortOrder: 24 },
      items: MAJOR_ITEMS,
    },
    {
      cat: { code: 'MD_COUNTRY', nameVi: 'Quốc gia', nameEn: 'Country', groupTag: 'GEOGRAPHY', cacheType: 'STATIC', sourceType: 'ISO', sortOrder: 14 },
      items: COUNTRY_ITEMS,
    },
    {
      cat: { code: 'MD_DISTRICT', nameVi: 'Quận / Huyện', nameEn: 'District', groupTag: 'GEOGRAPHY', cacheType: 'STATIC', sourceType: 'NATIONAL', sortOrder: 12 },
      items: DISTRICT_ITEMS,
    },
    {
      cat: { code: 'MD_SALARY_GRADE', nameVi: 'Ngạch lương', nameEn: 'Salary Grade', groupTag: 'MILITARY', cacheType: 'SEMI', sourceType: 'BQP', sortOrder: 5 },
      items: SALARY_GRADE_ITEMS,
    },
    {
      cat: { code: 'MD_SALARY_ALLOWANCE', nameVi: 'Loại phụ cấp', nameEn: 'Allowance Type', groupTag: 'MILITARY', cacheType: 'SEMI', sourceType: 'BQP', sortOrder: 6 },
      items: SALARY_ALLOWANCE_ITEMS,
    },
  ]

  let totalCreated = 0
  let totalUpdated = 0
  let totalSkipped = 0

  for (const { cat, items } of runs) {
    const result = await upsertCategoryWithItems(prisma, cat, items, SEED_META)
    console.log(
      `  ${cat.code}: +${result.created} new / ~${result.updated} upd / ⏭${result.skipped} skip (${items.length} total)`
    )
    totalCreated += result.created
    totalUpdated += result.updated
    totalSkipped += result.skipped
  }

  console.log(`\n✅ Done: ${totalCreated} created / ${totalUpdated} updated / ${totalSkipped} skipped`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
