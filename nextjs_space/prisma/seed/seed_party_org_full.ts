/**
 * Seed: Cơ cấu tổ chức Đảng đầy đủ theo đơn vị Học viện Hậu cần
 *
 * Chiến lược:
 *  1. Upsert toàn bộ tổ chức Đảng theo cây đơn vị
 *  2. Sửa orgLevel đúng: DANG_UY_HOC_VIEN | DANG_BO | CHI_BO_CO_SO | CHI_BO_GHEP
 *  3. Link đúng unitId tương ứng
 *  4. Assign đảng viên vào chi bộ dựa trên user.unitId → party org
 *
 * Cấu trúc:
 *  L1: Đảng ủy Học viện (DANG_UY_HOC_VIEN)
 *  L2: Đảng bộ bộ phận (DANG_BO) cho các Khoa lớn
 *  L2: Chi bộ cơ sở (CHI_BO_CO_SO) cho Phòng/Ban/Văn phòng
 *  L3: Chi bộ cơ sở (CHI_BO_CO_SO) cho Bộ môn dưới Đảng bộ Khoa
 *
 * Run:
 *   cd nextjs_space
 *   npx tsx --require dotenv/config prisma/seed/seed_party_org_full.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────────────────────

interface OrgSeed {
  code: string;
  name: string;
  shortName?: string;
  orgLevel: 'DANG_UY_HOC_VIEN' | 'DANG_BO' | 'CHI_BO_CO_SO' | 'CHI_BO_GHEP';
  level: number;
  parentCode?: string;
  unitCode: string;        // code trong bảng Unit
  description?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ORG TREE DEFINITION
// ──────────────────────────────────────────────────────────────────────────────

const ORG_SEEDS: OrgSeed[] = [

  // ── LEVEL 1: Đảng ủy Học viện ──────────────────────────────────────────────
  {
    code: 'DANG_UY_HVHC',
    name: 'Đảng ủy Học viện Hậu cần',
    shortName: 'Đảng ủy HV',
    orgLevel: 'DANG_UY_HOC_VIEN',
    level: 1,
    unitCode: 'HVHC',
    description: 'Đảng ủy cấp học viện — cơ quan lãnh đạo toàn bộ công tác Đảng của Học viện Hậu cần',
  },

  // ── LEVEL 2: Ban Giám đốc (Chi bộ trực thuộc Đảng ủy) ─────────────────────
  {
    code: 'CHI_BO_BGD',
    name: 'Chi bộ Ban Giám đốc',
    shortName: 'CB BGĐ',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'BGD',
    description: 'Chi bộ trực thuộc Đảng ủy, bao gồm Ban Giám đốc Học viện',
  },

  // ── LEVEL 2: Đảng bộ các Khoa (DANG_BO) ───────────────────────────────────
  {
    code: 'DANG_BO_K1',
    name: 'Đảng bộ bộ phận Khoa Chỉ huy Hậu cần',
    shortName: 'ĐB K1',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K1',
    description: 'Đảng bộ bộ phận Khoa Chỉ huy hậu cần',
  },
  {
    code: 'DANG_BO_K2',
    name: 'Đảng bộ bộ phận Khoa Quân nhu',
    shortName: 'ĐB K2',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K2',
    description: 'Đảng bộ bộ phận Khoa Quân nhu',
  },
  {
    code: 'DANG_BO_K3',
    name: 'Đảng bộ bộ phận Khoa Vận tải',
    shortName: 'ĐB K3',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K3',
    description: 'Đảng bộ bộ phận Khoa Vận tải',
  },
  {
    code: 'DANG_BO_K4',
    name: 'Đảng bộ bộ phận Khoa Xăng dầu',
    shortName: 'ĐB K4',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K4',
    description: 'Đảng bộ bộ phận Khoa Xăng dầu',
  },
  {
    code: 'DANG_BO_K5',
    name: 'Đảng bộ bộ phận Khoa Doanh trại',
    shortName: 'ĐB K5',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K5',
    description: 'Đảng bộ bộ phận Khoa Doanh trại',
  },
  {
    code: 'DANG_BO_K6',
    name: 'Đảng bộ bộ phận Khoa Tài chính',
    shortName: 'ĐB K6',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K6',
    description: 'Đảng bộ bộ phận Khoa Tài chính',
  },
  {
    code: 'DANG_BO_K7',
    name: 'Đảng bộ bộ phận Khoa Quân sự',
    shortName: 'ĐB K7',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K7',
    description: 'Đảng bộ bộ phận Khoa Quân sự',
  },
  {
    code: 'DANG_BO_K8',
    name: 'Đảng bộ bộ phận Khoa Lý luận Mác-Lênin',
    shortName: 'ĐB K8',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K8',
    description: 'Đảng bộ bộ phận Khoa Lý luận Mác-Lênin và Tư tưởng Hồ Chí Minh',
  },
  {
    code: 'DANG_BO_K9',
    name: 'Đảng bộ bộ phận Khoa CTĐ-CTCT',
    shortName: 'ĐB K9',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K9',
    description: 'Đảng bộ bộ phận Khoa Công tác Đảng - Công tác Chính trị',
  },
  {
    code: 'DANG_BO_K10',
    name: 'Đảng bộ bộ phận Khoa Khoa học cơ bản',
    shortName: 'ĐB K10',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K10',
    description: 'Đảng bộ bộ phận Khoa Khoa học cơ bản',
  },
  {
    code: 'DANG_BO_K11',
    name: 'Đảng bộ bộ phận Khoa Ngoại ngữ',
    shortName: 'ĐB K11',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K11',
    description: 'Đảng bộ bộ phận Khoa Ngoại ngữ',
  },
  {
    code: 'DANG_BO_K14',
    name: 'Đảng bộ bộ phận Khoa Hậu cần chiến dịch',
    shortName: 'ĐB K14',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'K14',
    description: 'Đảng bộ bộ phận Khoa Hậu cần chiến dịch',
  },

  // ── LEVEL 2: Đảng bộ Khoa DEPARTMENT ──────────────────────────────────────
  {
    code: 'DANG_BO_KCNTT',
    name: 'Đảng bộ bộ phận Khoa Công nghệ thông tin',
    shortName: 'ĐB KCNTT',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'KCNTT',
    description: 'Đảng bộ bộ phận Khoa CNTT',
  },
  {
    code: 'DANG_BO_KHCQS',
    name: 'Đảng bộ bộ phận Khoa Hậu cần Quân sự',
    shortName: 'ĐB KHCQS',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'KHCQS',
    description: 'Đảng bộ bộ phận Khoa Hậu cần Quân sự',
  },
  {
    code: 'DANG_BO_KVTHC',
    name: 'Đảng bộ bộ phận Khoa Vận tải - Hóa chất',
    shortName: 'ĐB KVTHC',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'KVTHC',
    description: 'Đảng bộ bộ phận Khoa Vận tải - Hóa chất',
  },
  {
    code: 'DANG_BO_KTCQS',
    name: 'Đảng bộ bộ phận Khoa Tài chính Quân sự',
    shortName: 'ĐB KTCQS',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'KTCQS',
    description: 'Đảng bộ bộ phận Khoa Tài chính Quân sự',
  },
  {
    code: 'DANG_BO_KKTXD',
    name: 'Đảng bộ bộ phận Khoa Kỹ thuật Xây dựng',
    shortName: 'ĐB KKTXD',
    orgLevel: 'DANG_BO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'KKTXD',
    description: 'Đảng bộ bộ phận Khoa Kỹ thuật Xây dựng',
  },

  // ── LEVEL 2: Chi bộ Phòng/Ban/Văn phòng (CHI_BO_CO_SO) ───────────────────
  {
    code: 'CHI_BO_VIEN1',
    name: 'Chi bộ Viện Nghiên cứu KHHCQS',
    shortName: 'CB Viện NC',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'VIEN1',
    description: 'Chi bộ Viện Nghiên cứu Khoa học Hậu cần Quân sự',
  },
  {
    code: 'CHI_BO_VP',
    name: 'Chi bộ Văn phòng Học viện',
    shortName: 'CB VP',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'VP',
    description: 'Chi bộ Văn phòng, phục vụ công tác hành chính tổng hợp',
  },
  {
    code: 'CHI_BO_B1',
    name: 'Chi bộ Phòng Đào tạo',
    shortName: 'CB B1',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B1',
    description: 'Chi bộ Phòng Đào tạo',
  },
  {
    code: 'CHI_BO_B2',
    name: 'Chi bộ Phòng Khoa học Quân sự',
    shortName: 'CB B2',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B2',
    description: 'Chi bộ Phòng Khoa học Quân sự',
  },
  {
    code: 'CHI_BO_B3',
    name: 'Chi bộ Phòng Chính trị',
    shortName: 'CB B3',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B3',
    description: 'Chi bộ Phòng Chính trị',
  },
  {
    code: 'CHI_BO_B4',
    name: 'Chi bộ Phòng Hậu cần - Kỹ thuật',
    shortName: 'CB B4',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B4',
    description: 'Chi bộ Phòng Hậu cần - Kỹ thuật',
  },
  {
    code: 'CHI_BO_B5',
    name: 'Chi bộ Văn phòng (B5)',
    shortName: 'CB B5',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B5',
    description: 'Chi bộ Văn phòng - Tổng hợp',
  },
  {
    code: 'CHI_BO_B7',
    name: 'Chi bộ Phòng Sau đại học',
    shortName: 'CB B7',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B7',
    description: 'Chi bộ Phòng Sau đại học',
  },
  {
    code: 'CHI_BO_B9',
    name: 'Chi bộ Ban Tài chính',
    shortName: 'CB B9',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B9',
    description: 'Chi bộ Ban Tài chính',
  },
  {
    code: 'CHI_BO_B12',
    name: 'Chi bộ Viện Nghiên cứu Khoa học HCQS',
    shortName: 'CB B12',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B12',
    description: 'Chi bộ Viện Nghiên cứu Khoa học HCQS',
  },
  {
    code: 'CHI_BO_B13',
    name: 'Chi bộ Tạp chí NCKH HCQS',
    shortName: 'CB B13',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B13',
    description: 'Chi bộ Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
  },
  {
    code: 'CHI_BO_B14',
    name: 'Chi bộ Ban Khảo thí & BĐCLGD',
    shortName: 'CB B14',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'B14',
    description: 'Chi bộ Ban Khảo thí và Bảo đảm chất lượng Giáo dục - Đào tạo',
  },
  {
    code: 'CHI_BO_PDT',
    name: 'Chi bộ Phòng Đào tạo (PDT)',
    shortName: 'CB PDT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'PDT',
    description: 'Chi bộ Phòng Đào tạo',
  },
  {
    code: 'CHI_BO_PQLKH',
    name: 'Chi bộ Phòng Quản lý Khoa học',
    shortName: 'CB PQLKH',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'PQLKH',
    description: 'Chi bộ Phòng Quản lý Khoa học',
  },
  {
    code: 'CHI_BO_PCTCT',
    name: 'Chi bộ Phòng Công tác Chính trị',
    shortName: 'CB PCTCT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'PCTCT',
    description: 'Chi bộ Phòng Công tác Chính trị',
  },
  {
    code: 'CHI_BO_PTCHC',
    name: 'Chi bộ Phòng Tổ chức Cán bộ',
    shortName: 'CB PTCHC',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'PTCHC',
    description: 'Chi bộ Phòng Tổ chức Cán bộ',
  },

  // ── LEVEL 2: Chi bộ Tiểu đoàn (CHI_BO_GHEP cho Hệ, CHI_BO_CO_SO cho TD) ──
  {
    code: 'CHI_BO_TD3',
    name: 'Chi bộ Tiểu đoàn 3',
    shortName: 'CB TD3',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'TD3',
    description: 'Chi bộ Tiểu đoàn 3 học viên',
  },
  {
    code: 'CHI_BO_TD4',
    name: 'Chi bộ Tiểu đoàn 4',
    shortName: 'CB TD4',
    orgLevel: 'CHI_BO_CO_SO',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'TD4',
    description: 'Chi bộ Tiểu đoàn 4 học viên',
  },

  // ── LEVEL 2: Chi bộ Hệ (CHI_BO_GHEP) ────────────────────────────────────
  {
    code: 'CHI_BO_HE1',
    name: 'Chi bộ Hệ 1 - Quân sự',
    shortName: 'CB Hệ 1',
    orgLevel: 'CHI_BO_GHEP',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'HE1',
    description: 'Chi bộ ghép Hệ 1 - Quân sự',
  },
  {
    code: 'CHI_BO_HE2',
    name: 'Chi bộ Hệ 2 - Hậu cần',
    shortName: 'CB Hệ 2',
    orgLevel: 'CHI_BO_GHEP',
    level: 2,
    parentCode: 'DANG_UY_HVHC',
    unitCode: 'HE2',
    description: 'Chi bộ ghép Hệ 2 - Hậu cần',
  },

  // ── LEVEL 3: Chi bộ Bộ môn dưới Đảng bộ Khoa ─────────────────────────────
  // Dưới DANG_BO_K1
  {
    code: 'CHI_BO_BM_K1_1',
    name: 'Chi bộ Bộ môn Hậu cần chiến đấu',
    shortName: 'CB BM HC-CĐ',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K1',
    unitCode: 'BM_K1_1',
    description: 'Chi bộ Bộ môn Hậu cần chiến đấu - Khoa K1',
  },
  {
    code: 'CHI_BO_BM_K1_2',
    name: 'Chi bộ Bộ môn Chỉ huy tham mưu',
    shortName: 'CB BM CHT-M',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K1',
    unitCode: 'BM_K1_2',
    description: 'Chi bộ Bộ môn Chỉ huy tham mưu - Khoa K1',
  },
  // Dưới DANG_BO_K2
  {
    code: 'CHI_BO_BM_K2_1',
    name: 'Chi bộ Bộ môn Kỹ thuật (K2)',
    shortName: 'CB BM KT K2',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K2',
    unitCode: 'BM_K2_1',
  },
  {
    code: 'CHI_BO_BM_K2_2',
    name: 'Chi bộ Bộ môn Bảo đảm (K2)',
    shortName: 'CB BM BĐ K2',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K2',
    unitCode: 'BM_K2_2',
  },
  {
    code: 'CHI_BO_BM_K2_3',
    name: 'Chi bộ Bộ môn Thương phẩm',
    shortName: 'CB BM TP',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K2',
    unitCode: 'BM_K2_3',
  },
  // Dưới DANG_BO_K3
  {
    code: 'CHI_BO_BM_K3_1',
    name: 'Chi bộ Bộ môn Chỉ huy vận tải',
    shortName: 'CB BM VT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K3',
    unitCode: 'BM_K3_1',
  },
  // Dưới DANG_BO_K4
  {
    code: 'CHI_BO_BM_K4_1',
    name: 'Chi bộ Bộ môn Bảo đảm (K4)',
    shortName: 'CB BM BĐ K4',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K4',
    unitCode: 'BM_K4_1',
  },
  // Dưới DANG_BO_K5
  {
    code: 'CHI_BO_BM_K5_1',
    name: 'Chi bộ Bộ môn Kinh tế',
    shortName: 'CB BM KT K5',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K5',
    unitCode: 'BM_K5_1',
  },
  // Dưới DANG_BO_K6
  {
    code: 'CHI_BO_BM_K6_1',
    name: 'Chi bộ Bộ môn Huấn luyện thể lực',
    shortName: 'CB BM HLTL',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K6',
    unitCode: 'BM_K6_1',
  },
  // Dưới DANG_BO_K7
  {
    code: 'CHI_BO_BM_K7_1',
    name: 'Chi bộ Bộ môn Toán',
    shortName: 'CB BM Toán',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K7',
    unitCode: 'BM_K7_1',
  },
  {
    code: 'CHI_BO_BM_K7_2',
    name: 'Chi bộ Bộ môn Tin học',
    shortName: 'CB BM TH',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K7',
    unitCode: 'BM_K7_2',
  },
  // Dưới DANG_BO_K8
  {
    code: 'CHI_BO_BM_K8_1',
    name: 'Chi bộ Bộ môn Anh văn',
    shortName: 'CB BM AV',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_K8',
    unitCode: 'BM_K8_1',
  },
  // Dưới DANG_BO_KCNTT
  {
    code: 'CHI_BO_BMHTTT',
    name: 'Chi bộ Bộ môn Hệ thống thông tin',
    shortName: 'CB BM HTTT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_KCNTT',
    unitCode: 'BMHTTT',
  },
  {
    code: 'CHI_BO_BMKHMT',
    name: 'Chi bộ Bộ môn Khoa học Máy tính',
    shortName: 'CB BM KHMT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_KCNTT',
    unitCode: 'BMKHMT',
  },
  {
    code: 'CHI_BO_BMMMT',
    name: 'Chi bộ Bộ môn Mạng Máy tính',
    shortName: 'CB BM MMT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'DANG_BO_KCNTT',
    unitCode: 'BMMMT',
  },

  // ── LEVEL 3: Chi bộ Tiểu đoàn con (Đại đội) ──────────────────────────────
  {
    code: 'CHI_BO_TD1',
    name: 'Chi bộ Tiểu đoàn 1',
    shortName: 'CB TD1',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'CHI_BO_HE1',
    unitCode: 'TD1',
    description: 'Chi bộ Tiểu đoàn 1 - thuộc Hệ 1',
  },
  {
    code: 'CHI_BO_TD2',
    name: 'Chi bộ Tiểu đoàn 2',
    shortName: 'CB TD2',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'CHI_BO_HE2',
    unitCode: 'TD2',
    description: 'Chi bộ Tiểu đoàn 2 - thuộc Hệ 2',
  },
  {
    code: 'CHI_BO_BAN1',
    name: 'Chi bộ Ban Hành chính',
    shortName: 'CB BAN HC',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'CHI_BO_VIEN1',
    unitCode: 'BAN1',
    description: 'Chi bộ Ban Hành chính - thuộc Viện NC',
  },
  {
    code: 'CHI_BO_BAN2',
    name: 'Chi bộ Ban CNTT',
    shortName: 'CB BAN CNTT',
    orgLevel: 'CHI_BO_CO_SO',
    level: 3,
    parentCode: 'CHI_BO_VIEN1',
    unitCode: 'BAN2',
    description: 'Chi bộ Ban CNTT - thuộc Viện NC',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// HELPER: Load unit map {code → id}
// ──────────────────────────────────────────────────────────────────────────────

async function loadUnitMap(): Promise<Map<string, string>> {
  const units = await prisma.unit.findMany({ select: { id: true, code: true } });
  return new Map(units.filter(u => u.code).map(u => [u.code!, u.id]));
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 1: Upsert tất cả tổ chức
// ──────────────────────────────────────────────────────────────────────────────

async function seedOrgs(unitMap: Map<string, string>): Promise<Map<string, string>> {
  console.log('\n📌 BƯỚC 1: Seed tổ chức Đảng...');
  const orgCodeToId = new Map<string, string>();

  for (const seed of ORG_SEEDS) {
    const unitId = unitMap.get(seed.unitCode);
    if (!unitId) {
      console.warn(`  ⚠️  Unit không tồn tại: ${seed.unitCode} → skip ${seed.code}`);
      continue;
    }

    const parentId = seed.parentCode ? orgCodeToId.get(seed.parentCode) : undefined;
    if (seed.parentCode && !parentId) {
      console.warn(`  ⚠️  Parent chưa có ID: ${seed.parentCode} → skip ${seed.code}`);
      continue;
    }

    const org = await prisma.partyOrganization.upsert({
      where: { code: seed.code },
      update: {
        name: seed.name,
        shortName: seed.shortName,
        orgLevel: seed.orgLevel as any,
        level: seed.level,
        parentId: parentId ?? null,
        unitId,
        description: seed.description ?? null,
        isActive: true,
      },
      create: {
        code: seed.code,
        name: seed.name,
        shortName: seed.shortName,
        orgLevel: seed.orgLevel as any,
        level: seed.level,
        parentId: parentId ?? null,
        unitId,
        description: seed.description ?? null,
        isActive: true,
        organizationType: seed.orgLevel === 'DANG_UY_HOC_VIEN' ? 'DANG_UY'
          : seed.orgLevel === 'DANG_BO' ? 'DANG_BO_BO_PHAN'
          : 'CHI_BO',
      },
      select: { id: true, code: true },
    });

    orgCodeToId.set(org.code, org.id);
    console.log(`  ✅ [L${seed.level}] ${seed.orgLevel.padEnd(20)} ${seed.code.padEnd(25)} ${seed.name}`);
  }

  console.log(`\n  → Tổng org đã upsert: ${orgCodeToId.size}`);
  return orgCodeToId;
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 2: Deactivate các org cũ không còn dùng
// ──────────────────────────────────────────────────────────────────────────────

async function deactivateLegacyOrgs(validCodes: Set<string>): Promise<void> {
  console.log('\n📌 BƯỚC 2: Deactivate legacy orgs...');
  const allOrgs = await prisma.partyOrganization.findMany({ select: { id: true, code: true, isActive: true } });

  for (const org of allOrgs) {
    if (!validCodes.has(org.code) && org.isActive) {
      await prisma.partyOrganization.update({
        where: { id: org.id },
        data: { isActive: false },
        select: { id: true },
      });
      console.log(`  🗑  Deactivated: ${org.code}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// STEP 3: Assign đảng viên vào chi bộ theo unit
// ──────────────────────────────────────────────────────────────────────────────

async function assignMembersToOrgs(unitMap: Map<string, string>, orgCodeToId: Map<string, string>): Promise<void> {
  console.log('\n📌 BƯỚC 3: Assign đảng viên vào chi bộ theo đơn vị...');

  // Build unitId → orgId mapping (direct match)
  const unitIdToOrgId = new Map<string, string>();
  for (const seed of ORG_SEEDS) {
    const unitId = unitMap.get(seed.unitCode);
    const orgId = orgCodeToId.get(seed.code);
    if (unitId && orgId) {
      unitIdToOrgId.set(unitId, orgId);
    }
  }

  // Get all active party members with user unit info
  const members = await prisma.partyMember.findMany({
    where: { status: { in: ['CHINH_THUC', 'DU_BI', 'ACTIVE'] as any[] } },
    select: {
      id: true,
      organizationId: true,
      userId: true,
    },
  });

  // Get users and their unitIds
  const userIds = members.map(m => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, unitId: true },
  });
  const userUnitMap = new Map(users.map(u => [u.id, u.unitId]));

  // Get all units for parent lookup
  const units = await prisma.unit.findMany({ select: { id: true, code: true, parentId: true } });
  const unitIdToCode = new Map(units.map(u => [u.id, u.code]));
  const unitIdToParentId = new Map(units.map(u => [u.id, u.parentId]));

  // Function to find best org for a unit (walk up tree)
  function findOrgForUnit(unitId: string | null | undefined, depth = 0): string | null {
    if (!unitId || depth > 4) return null;
    if (unitIdToOrgId.has(unitId)) return unitIdToOrgId.get(unitId)!;
    const parentId = unitIdToParentId.get(unitId);
    return findOrgForUnit(parentId, depth + 1);
  }

  // Get root org as fallback
  const rootOrg = await prisma.partyOrganization.findUnique({ where: { code: 'DANG_UY_HVHC' }, select: { id: true } });
  const rootOrgId = rootOrg?.id;

  let assigned = 0;
  let fallback = 0;
  let unchanged = 0;

  for (const member of members) {
    const userUnitId = userUnitMap.get(member.userId);
    const targetOrgId = findOrgForUnit(userUnitId) ?? rootOrgId ?? null;

    if (!targetOrgId || member.organizationId === targetOrgId) {
      unchanged++;
      continue;
    }

    await prisma.partyMember.update({
      where: { id: member.id },
      data: { organizationId: targetOrgId },
      select: { id: true },
    });

    if (targetOrgId === rootOrgId) {
      fallback++;
    } else {
      assigned++;
    }
  }

  console.log(`  → Assigned to specific chi bộ : ${assigned}`);
  console.log(`  → Fallback to root (Đảng ủy)  : ${fallback}`);
  console.log(`  → Unchanged (already correct)  : ${unchanged}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Bắt đầu seed cơ cấu tổ chức Đảng đầy đủ...\n');

  const unitMap = await loadUnitMap();
  console.log(`📊 Tổng đơn vị: ${unitMap.size}`);

  // Step 1
  const orgCodeToId = await seedOrgs(unitMap);

  // Step 2: deactivate legacy orgs
  const validCodes = new Set(ORG_SEEDS.map(s => s.code));
  await deactivateLegacyOrgs(validCodes);

  // Step 3: assign members
  await assignMembersToOrgs(unitMap, orgCodeToId);

  // ── Final stats ────────────────────────────────────────────────────────────
  const orgCount = await prisma.partyOrganization.count({ where: { isActive: true } });
  const memberWithOrg = await prisma.partyMember.count({
    where: { organizationId: { not: null }, status: { in: ['CHINH_THUC', 'DU_BI', 'ACTIVE'] as any[] } },
  });
  const memberTotal = await prisma.partyMember.count({
    where: { status: { in: ['CHINH_THUC', 'DU_BI', 'ACTIVE'] as any[] } },
  });

  // By orgLevel
  const byLevel = await prisma.partyOrganization.groupBy({
    by: ['orgLevel'],
    _count: { id: true },
    where: { isActive: true },
  });

  console.log('\n==================================================');
  console.log('✅ Hoàn tất seed cơ cấu tổ chức Đảng');
  console.log(`Tổ chức Đảng active  : ${orgCount}`);
  byLevel.forEach(r => console.log(`  ${r.orgLevel?.padEnd(20)}: ${r._count.id}`));
  console.log(`Đảng viên có chi bộ  : ${memberWithOrg} / ${memberTotal}`);
  console.log('==================================================\n');
}

main()
  .catch(err => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
