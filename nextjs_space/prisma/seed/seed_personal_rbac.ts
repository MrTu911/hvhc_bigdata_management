/**
 * SEED: Quyền cá nhân mặc định cho mọi tài khoản người dùng
 *
 * 18 function codes phân 3 tầng:
 *   Tầng 0 (10 codes) — Mọi người dùng: profile, thông báo, dashboard, công việc, bảo mật,
 *                         quá trình công tác, cập nhật thông tin, chính sách, bảo hiểm, khen thưởng
 *   Tầng 1 (4 codes)  — Giảng viên/NCV: NCKH cá nhân, công bố, lý lịch KH, lịch sử điểm
 *   Tầng 2 (4 codes)  — Học viên/SV: điểm, rèn luyện, thời khóa biểu, xét tốt nghiệp
 *
 * Idempotent: chạy nhiều lần không tạo duplicate.
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_personal_rbac.ts
 */

import { PrismaClient, FunctionScope, ActionType } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ─── 18 Function Codes Cá Nhân ────────────────────────────────────────────────

const PERSONAL_FUNCTIONS: {
  code: string;
  name: string;
  description: string;
  module: string;
  actionType: ActionType;
  isCritical: boolean;
}[] = [
  // ── Tầng 0: Mọi người dùng (module ACCOUNT) ──
  {
    code: 'MANAGE_MY_PROFILE',
    name: 'Xem và cập nhật hồ sơ cá nhân',
    description: 'Người dùng xem và cập nhật thông tin cơ bản hồ sơ cá nhân của mình',
    module: 'account',
    actionType: 'UPDATE',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_NOTIFICATIONS',
    name: 'Xem thông báo cá nhân',
    description: 'Xem danh sách thông báo và cảnh báo của tài khoản',
    module: 'account',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_DASHBOARD',
    name: 'Xem trang tổng quan cá nhân',
    description: 'Xem dashboard được cá nhân hóa theo chức vụ và nhiệm vụ',
    module: 'account',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_TASKS',
    name: 'Xem danh sách công việc của tôi',
    description: 'Xem inbox công việc, phê duyệt đang chờ và lịch sử workflow',
    module: 'account',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'MANAGE_MY_SECURITY',
    name: 'Quản lý bảo mật tài khoản',
    description: 'Đổi mật khẩu, cài MFA, xem lịch sử đăng nhập của tài khoản',
    module: 'account',
    actionType: 'UPDATE',
    isCritical: false,
  },
  // ── Tầng 0: Mọi người dùng (module PERSONNEL) ──
  {
    code: 'VIEW_MY_CAREER_HISTORY',
    name: 'Xem quá trình công tác của tôi',
    description: 'Xem lịch sử vị trí, đơn vị và quá trình công tác của bản thân',
    module: 'personnel',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'REQUEST_MY_INFO_UPDATE',
    name: 'Gửi yêu cầu cập nhật thông tin cá nhân',
    description: 'Gửi yêu cầu thay đổi thông tin nhạy cảm (quân hàm, CCCD...) để admin duyệt',
    module: 'personnel',
    actionType: 'SUBMIT',
    isCritical: false,
  },
  // ── Tầng 0: Mọi người dùng (module POLICY) ──
  {
    code: 'VIEW_MY_POLICY',
    name: 'Xem chính sách và chế độ của tôi',
    description: 'Xem các chính sách, chế độ phúc lợi áp dụng cho bản thân',
    module: 'policy',
    actionType: 'VIEW',
    isCritical: false,
  },
  // ── Tầng 0: Mọi người dùng (module INSURANCE) ──
  {
    code: 'VIEW_MY_INSURANCE',
    name: 'Xem thông tin bảo hiểm của tôi',
    description: 'Xem thông tin BHXH, BHYT của bản thân (không gồm số sổ nhạy cảm)',
    module: 'insurance',
    actionType: 'VIEW',
    isCritical: false,
  },
  // ── Tầng 0: Mọi người dùng (module AWARDS) ──
  {
    code: 'VIEW_MY_AWARD',
    name: 'Xem khen thưởng và kỷ luật của tôi',
    description: 'Xem lịch sử khen thưởng, hình thức kỷ luật của bản thân',
    module: 'awards',
    actionType: 'VIEW',
    isCritical: false,
  },

  // ── Tầng 1: Giảng viên / Nghiên cứu viên (module RESEARCH) ──
  {
    code: 'VIEW_MY_RESEARCH',
    name: 'Xem đề tài NCKH của tôi',
    description: 'Xem danh sách đề tài NCKH mà mình là chủ nhiệm hoặc thành viên',
    module: 'research',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_PUBLICATIONS',
    name: 'Xem công bố khoa học của tôi',
    description: 'Xem danh sách bài báo, sách, kỷ yếu của bản thân',
    module: 'research',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'MANAGE_MY_SCIENTIFIC_CV',
    name: 'Quản lý lý lịch khoa học cá nhân',
    description: 'Cập nhật và xuất lý lịch khoa học cá nhân (h-index, ORCID, chuyên ngành...)',
    module: 'research',
    actionType: 'UPDATE',
    isCritical: false,
  },
  // ── Tầng 1: cũng dùng cho manager (xem điểm đã trình duyệt) ──
  {
    code: 'VIEW_MY_GRADE_SUBMISSIONS',
    name: 'Xem lịch sử điểm đã trình duyệt',
    description: 'Xem các bảng điểm đã nhập/trình duyệt và trạng thái phê duyệt',
    module: 'training',
    actionType: 'VIEW',
    isCritical: false,
  },

  // ── Tầng 2: Học viên / Sinh viên (module TRAINING) ──
  {
    code: 'VIEW_MY_GRADE',
    name: 'Xem điểm học tập của tôi',
    description: 'Xem điểm từng học phần, điểm trung bình và bảng điểm toàn khóa của bản thân',
    module: 'training',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_CONDUCT',
    name: 'Xem điểm rèn luyện của tôi',
    description: 'Xem điểm rèn luyện, đánh giá tác phong và kết quả sinh hoạt của bản thân',
    module: 'training',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_SCHEDULE',
    name: 'Xem thời khóa biểu của tôi',
    description: 'Xem thời khóa biểu học tập, lịch thi của học kỳ hiện tại',
    module: 'training',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_MY_GRADUATION',
    name: 'Xem trạng thái xét tốt nghiệp',
    description: 'Xem tiến độ hoàn thành chương trình, điều kiện và kết quả xét tốt nghiệp',
    module: 'training',
    actionType: 'VIEW',
    isCritical: false,
  },
];

// ─── Tầng quyền theo nhóm ─────────────────────────────────────────────────────

const TIER0: { code: string; scope: FunctionScope }[] = [
  { code: 'MANAGE_MY_PROFILE',      scope: 'SELF' },
  { code: 'VIEW_MY_NOTIFICATIONS',  scope: 'SELF' },
  { code: 'VIEW_MY_DASHBOARD',      scope: 'SELF' },
  { code: 'VIEW_MY_TASKS',          scope: 'SELF' },
  { code: 'MANAGE_MY_SECURITY',     scope: 'SELF' },
  { code: 'VIEW_MY_CAREER_HISTORY', scope: 'SELF' },
  { code: 'REQUEST_MY_INFO_UPDATE', scope: 'SELF' },
  { code: 'VIEW_MY_POLICY',         scope: 'SELF' },
  { code: 'VIEW_MY_INSURANCE',      scope: 'SELF' },
  { code: 'VIEW_MY_AWARD',          scope: 'SELF' },
];

const TIER1_FACULTY: { code: string; scope: FunctionScope }[] = [
  { code: 'VIEW_MY_RESEARCH',          scope: 'SELF' },
  { code: 'VIEW_MY_PUBLICATIONS',      scope: 'SELF' },
  { code: 'MANAGE_MY_SCIENTIFIC_CV',   scope: 'SELF' },
  { code: 'VIEW_MY_GRADE_SUBMISSIONS', scope: 'SELF' },
];

const TIER2_STUDENT: { code: string; scope: FunctionScope }[] = [
  { code: 'VIEW_MY_GRADE',      scope: 'SELF' },
  { code: 'VIEW_MY_CONDUCT',    scope: 'SELF' },
  { code: 'VIEW_MY_SCHEDULE',   scope: 'SELF' },
  { code: 'VIEW_MY_GRADUATION', scope: 'SELF' },
];

// Quản lý cấp trên: xem điểm đã ký duyệt của chính họ
const TIER3_MANAGER: { code: string; scope: FunctionScope }[] = [
  { code: 'VIEW_MY_GRADE_SUBMISSIONS', scope: 'SELF' },
];

// ─── Mapping 23 chức vụ → tầng quyền ─────────────────────────────────────────

const PERSONAL_POSITION_MAPPINGS: {
  positionCode: string;
  functionCodes: { code: string; scope: FunctionScope }[];
}[] = [
  // ── Cấp học viện ──
  { positionCode: 'GIAM_DOC',         functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'PHO_GIAM_DOC',     functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'CHINH_UY',         functionCodes: [...TIER0, ...TIER3_MANAGER] },

  // ── Cấp khoa/phòng ──
  { positionCode: 'TRUONG_KHOA',      functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'PHO_TRUONG_KHOA',  functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'TRUONG_PHONG',     functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'PHO_TRUONG_PHONG', functionCodes: [...TIER0, ...TIER3_MANAGER] },

  // ── Cấp bộ môn ──
  { positionCode: 'CHU_NHIEM_BO_MON', functionCodes: [...TIER0, ...TIER3_MANAGER] },
  { positionCode: 'PHO_CHU_NHIEM_BM', functionCodes: [...TIER0, ...TIER3_MANAGER] },

  // ── Giảng viên & Nghiên cứu viên: Tầng 0 + Tầng 1 ──
  { positionCode: 'GIANG_VIEN_CHINH', functionCodes: [...TIER0, ...TIER1_FACULTY] },
  { positionCode: 'GIANG_VIEN',       functionCodes: [...TIER0, ...TIER1_FACULTY] },
  { positionCode: 'TRO_GIANG',        functionCodes: [...TIER0, ...TIER1_FACULTY] },
  { positionCode: 'NGHIEN_CUU_VIEN',  functionCodes: [...TIER0, ...TIER1_FACULTY] },

  // ── Hành chính: Tầng 0 only ──
  { positionCode: 'CHUYEN_VIEN',        functionCodes: [...TIER0] },
  { positionCode: 'CAN_BO_THU_VIEN',    functionCodes: [...TIER0] },
  { positionCode: 'CAN_BO_TAI_CHINH',   functionCodes: [...TIER0] },
  { positionCode: 'CAN_BO_TO_CHUC',     functionCodes: [...TIER0] },
  { positionCode: 'CAN_BO_DANG',        functionCodes: [...TIER0] },

  // ── IT: Tầng 0 only ──
  { positionCode: 'QUAN_TRI_HE_THONG',  functionCodes: [...TIER0] },
  { positionCode: 'KY_THUAT_VIEN',      functionCodes: [...TIER0] },

  // ── Học viên quân sự và sinh viên dân sự: Tầng 0 + Tầng 2 ──
  { positionCode: 'HOC_VIEN_QUAN_SU',  functionCodes: [...TIER0, ...TIER2_STUDENT] },
  { positionCode: 'SINH_VIEN_DAN_SU',  functionCodes: [...TIER0, ...TIER2_STUDENT] },

  // ── Cao học: Tầng 0 + Tầng 2 + VIEW_MY_RESEARCH + VIEW_MY_PUBLICATIONS ──
  {
    positionCode: 'HOC_VIEN_CAO_HOC',
    functionCodes: [
      ...TIER0,
      ...TIER2_STUDENT,
      { code: 'VIEW_MY_RESEARCH',     scope: 'SELF' },
      { code: 'VIEW_MY_PUBLICATIONS', scope: 'SELF' },
    ],
  },
];

// ─── Main seed function ────────────────────────────────────────────────────────

async function seedPersonalRBAC() {
  console.log('🚀 Bắt đầu seed Quyền Cá Nhân (Personal RBAC)...');
  console.log('='.repeat(55));

  // 1. Upsert 18 personal function codes
  console.log('\n🔑 Bước 1: Upsert Personal Function Codes...');
  let fnCreated = 0;
  let fnUpdated = 0;
  for (const fn of PERSONAL_FUNCTIONS) {
    const existing = await prisma.function.findUnique({ where: { code: fn.code } });
    if (!existing) {
      await prisma.function.create({ data: { ...fn, isActive: true } });
      fnCreated++;
      console.log(`  ✓ Tạo mới: ${fn.code}`);
    } else {
      await prisma.function.update({
        where: { code: fn.code },
        data: { name: fn.name, description: fn.description, module: fn.module, isActive: true },
      });
      fnUpdated++;
    }
  }
  console.log(`  → Tạo mới: ${fnCreated} | Cập nhật: ${fnUpdated} | Tổng: ${PERSONAL_FUNCTIONS.length}`);

  // 2. Seed PositionFunction mappings (skip nếu đã tồn tại)
  console.log('\n🔗 Bước 2: Gán quyền cá nhân cho từng chức vụ...');
  let mappingCreated = 0;
  let mappingSkipped = 0;

  for (const mapping of PERSONAL_POSITION_MAPPINGS) {
    const position = await prisma.position.findUnique({ where: { code: mapping.positionCode } });
    if (!position) {
      console.log(`  ⚠ Không tìm thấy chức vụ: ${mapping.positionCode} — bỏ qua`);
      continue;
    }

    let createdForPos = 0;
    for (const funcMapping of mapping.functionCodes) {
      const func = await prisma.function.findUnique({ where: { code: funcMapping.code } });
      if (!func) {
        console.log(`  ⚠ Không tìm thấy function: ${funcMapping.code} — bỏ qua`);
        continue;
      }

      const existing = await prisma.positionFunction.findUnique({
        where: { positionId_functionId: { positionId: position.id, functionId: func.id } },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: { positionId: position.id, functionId: func.id, scope: funcMapping.scope },
        });
        createdForPos++;
        mappingCreated++;
      } else {
        mappingSkipped++;
      }
    }

    const tier =
      mapping.positionCode.startsWith('HOC_VIEN') || mapping.positionCode.startsWith('SINH_VIEN')
        ? 'Tầng 0+2'
        : ['GIANG_VIEN_CHINH', 'GIANG_VIEN', 'TRO_GIANG', 'NGHIEN_CUU_VIEN'].includes(mapping.positionCode)
        ? 'Tầng 0+1'
        : ['GIAM_DOC', 'PHO_GIAM_DOC', 'CHINH_UY', 'TRUONG_KHOA', 'PHO_TRUONG_KHOA',
           'TRUONG_PHONG', 'PHO_TRUONG_PHONG', 'CHU_NHIEM_BO_MON', 'PHO_CHU_NHIEM_BM'].includes(mapping.positionCode)
        ? 'Tầng 0+3'
        : mapping.positionCode === 'HOC_VIEN_CAO_HOC'
        ? 'Tầng 0+1(một phần)+2'
        : 'Tầng 0';

    console.log(
      `  ✓ ${mapping.positionCode} [${tier}]: +${createdForPos} mới (${mapping.functionCodes.length} tổng)`
    );
  }

  // Summary
  console.log('\n' + '='.repeat(55));
  console.log('✅ HOÀN THÀNH SEED QUYỀN CÁ NHÂN');
  console.log(`  • Function codes: ${PERSONAL_FUNCTIONS.length} (${fnCreated} tạo mới, ${fnUpdated} cập nhật)`);
  console.log(`  • Position mappings: ${mappingCreated} tạo mới, ${mappingSkipped} đã có sẵn`);
  console.log(`  • Chức vụ được xử lý: ${PERSONAL_POSITION_MAPPINGS.length}/23`);
  console.log('='.repeat(55));
  console.log('\nPattern kết nối personal ↔ quản lý tập trung:');
  console.log('  SELF scope → API filter WHERE userId = session.userId');
  console.log('  REQUEST_MY_INFO_UPDATE → ghi vào PersonalUpdateRequest (chờ admin duyệt)');
  console.log('  MANAGE_MY_PROFILE → ghi thẳng trường không nhạy cảm vào User');
}

seedPersonalRBAC()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
