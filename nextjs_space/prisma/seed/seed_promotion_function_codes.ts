/**
 * Seed: Function Codes cho module Khai báo & Duyệt Thăng Quân hàm (PROMOTION)
 *
 * Bước 1: Upsert tất cả PROMOTION.* function codes vào bảng Function.
 * Bước 2: Cấp quyền đầy đủ cho SYSTEM_ADMIN (tất cả codes, scope ACADEMY).
 * Bước 3: Cấp quyền theo chức vụ:
 *   - TRUONG_BAN_CAN_BO / TRUONG_BAN_QUAN_LUC → xem cơ quan, duyệt bản khai, duyệt chỉnh sửa
 *   - Commanders (CHI_HUY_DON_VI) → xem đơn vị, tạo đề nghị, xem đề nghị
 *   - Cán bộ (NHAN_VIEN) → tự khai, submit, đề nghị chỉnh sửa
 *   - HR staff (NHAN_SU) → khai hộ, submit hộ
 *
 * Idempotent: chạy nhiều lần an toàn.
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/seed_promotion_function_codes.ts
 */

import { PrismaClient, FunctionScope } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ── Function definitions ─────────────────────────────────────────────────────

interface FunctionDef {
  code: string;
  name: string;
  description: string;
  actionType: 'VIEW' | 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'SUBMIT';
  isCritical: boolean;
}

const PROMOTION_FUNCTIONS: FunctionDef[] = [
  {
    code: 'VIEW_OWN_RANK_DECLARATION',
    name: 'Xem bản khai quân hàm của cá nhân',
    description: 'Xem bản khai thăng quân hàm do bản thân tạo hoặc được khai hộ',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_UNIT_RANK_DECLARATIONS',
    name: 'Xem bản khai quân hàm của đơn vị',
    description: 'Xem toàn bộ bản khai thăng quân hàm trong đơn vị',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'VIEW_ORGAN_RANK_DECLARATIONS',
    name: 'Xem bản khai quân hàm toàn cơ quan',
    description: 'Xem toàn bộ bản khai của Ban Cán bộ / Ban Quân lực phụ trách',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'CREATE_SELF_RANK_DECLARATION',
    name: 'Tự khai báo quân hàm',
    description: 'Cán bộ tự tạo bản khai thăng quân hàm cho bản thân',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'CREATE_RANK_DECLARATION_BEHALF',
    name: 'Khai báo quân hàm hộ cán bộ',
    description: 'HR / phòng cán bộ tạo bản khai thay mặt cán bộ',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'SUBMIT_RANK_DECLARATION',
    name: 'Nộp bản khai quân hàm lên duyệt',
    description: 'Chuyển bản khai từ DRAFT sang PENDING_REVIEW (vào workflow)',
    actionType: 'SUBMIT',
    isCritical: true,
  },
  {
    code: 'APPROVE_RANK_DECLARATION',
    name: 'Phê duyệt bản khai quân hàm',
    description: 'Cơ quan chức năng chấp thuận bản khai → cam kết vào OfficerPromotion/SoldierServiceRecord',
    actionType: 'APPROVE',
    isCritical: true,
  },
  {
    code: 'REJECT_RANK_DECLARATION',
    name: 'Từ chối / Trả lại bản khai quân hàm',
    description: 'Cơ quan chức năng từ chối hoặc trả lại bản khai yêu cầu chỉnh sửa',
    actionType: 'REJECT',
    isCritical: true,
  },
  {
    code: 'REQUEST_RANK_AMENDMENT',
    name: 'Đề nghị chỉnh sửa bản khai đã duyệt',
    description: 'Cán bộ gửi đề nghị chỉnh sửa bản khai đã được phê duyệt',
    actionType: 'SUBMIT',
    isCritical: true,
  },
  {
    code: 'APPROVE_RANK_AMENDMENT',
    name: 'Duyệt đề nghị chỉnh sửa bản khai',
    description: 'Cơ quan chức năng phê duyệt và áp dụng thay đổi vào hồ sơ thăng quân hàm',
    actionType: 'APPROVE',
    isCritical: true,
  },
  {
    code: 'ADMIN_CREATE_PROMOTION',
    name: 'Ghi trực tiếp thăng quân hàm (admin)',
    description: 'Tạo OfficerPromotion/SoldierServiceRecord trực tiếp không qua workflow (chỉ admin)',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'VIEW_PROMOTION_PROPOSALS',
    name: 'Xem đề nghị thăng quân hàm',
    description: 'Xem danh sách đề nghị thăng quân hàm từ đơn vị',
    actionType: 'VIEW',
    isCritical: false,
  },
  {
    code: 'CREATE_PROMOTION_PROPOSAL',
    name: 'Tạo đề nghị thăng quân hàm',
    description: 'Chỉ huy / HR đơn vị tạo đề nghị thăng quân hàm cho cán bộ đến hạn',
    actionType: 'CREATE',
    isCritical: true,
  },
  {
    code: 'APPROVE_PROMOTION_PROPOSAL',
    name: 'Phản hồi đề nghị thăng quân hàm',
    description: 'Cơ quan chức năng chấp thuận/từ chối đề nghị thăng quân hàm từ đơn vị',
    actionType: 'APPROVE',
    isCritical: true,
  },
];

// ── Position assignments ─────────────────────────────────────────────────────

type PositionFunctionAssignment = {
  positionCode: string;
  functionCodes: string[];
  scope: FunctionScope;
};

const POSITION_ASSIGNMENTS: PositionFunctionAssignment[] = [
  {
    // Trưởng phòng Nhân sự — phụ trách duyệt bản khai (thay Ban Cán bộ)
    positionCode: 'TRUONG_PHONG_NHAN_SU',
    functionCodes: [
      'VIEW_ORGAN_RANK_DECLARATIONS',
      'APPROVE_RANK_DECLARATION',
      'REJECT_RANK_DECLARATION',
      'APPROVE_RANK_AMENDMENT',
      'VIEW_PROMOTION_PROPOSALS',
      'APPROVE_PROMOTION_PROPOSAL',
    ],
    scope: 'ACADEMY',
  },
  {
    // Chỉ huy Ban — xem và tạo đề nghị cho cán bộ trong ban
    positionCode: 'CHI_HUY_BAN',
    functionCodes: [
      'VIEW_UNIT_RANK_DECLARATIONS',
      'VIEW_PROMOTION_PROPOSALS',
      'CREATE_PROMOTION_PROPOSAL',
    ],
    scope: 'UNIT',
  },
  {
    // Chỉ huy Phòng — xem và tạo đề nghị
    positionCode: 'CHI_HUY_PHONG',
    functionCodes: [
      'VIEW_UNIT_RANK_DECLARATIONS',
      'VIEW_PROMOTION_PROPOSALS',
      'CREATE_PROMOTION_PROPOSAL',
    ],
    scope: 'UNIT',
  },
  {
    // Chỉ huy Tiểu đoàn — xem và tạo đề nghị
    positionCode: 'CHI_HUY_TIEU_DOAN',
    functionCodes: [
      'VIEW_UNIT_RANK_DECLARATIONS',
      'VIEW_PROMOTION_PROPOSALS',
      'CREATE_PROMOTION_PROPOSAL',
    ],
    scope: 'UNIT',
  },
  {
    // Nhân viên thông thường — tự khai, submit, đề nghị chỉnh sửa
    positionCode: 'NHAN_VIEN',
    functionCodes: [
      'VIEW_OWN_RANK_DECLARATION',
      'CREATE_SELF_RANK_DECLARATION',
      'SUBMIT_RANK_DECLARATION',
      'REQUEST_RANK_AMENDMENT',
    ],
    scope: 'SELF',
  },
  {
    // Cán bộ tổ chức — khai hộ cán bộ
    positionCode: 'CAN_BO_TO_CHUC',
    functionCodes: [
      'VIEW_UNIT_RANK_DECLARATIONS',
      'CREATE_RANK_DECLARATION_BEHALF',
      'SUBMIT_RANK_DECLARATION',
    ],
    scope: 'UNIT',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsertFunctions(): Promise<Map<string, string>> {
  console.log('\n📌 Bước 1: Upsert PROMOTION function codes');
  const codeToId = new Map<string, string>();

  for (const fn of PROMOTION_FUNCTIONS) {
    const result = await prisma.function.upsert({
      where: { code: fn.code },
      update: {
        name: fn.name,
        description: fn.description,
        module: 'PROMOTION',
        actionType: fn.actionType,
        isCritical: fn.isCritical,
        isActive: true,
      },
      create: {
        code: fn.code,
        name: fn.name,
        description: fn.description,
        module: 'PROMOTION',
        actionType: fn.actionType,
        isCritical: fn.isCritical,
        isActive: true,
      },
    });
    codeToId.set(fn.code, result.id);
    console.log(`  ✅ ${fn.code}`);
  }

  return codeToId;
}

async function grantToAdmin(codeToId: Map<string, string>) {
  console.log('\n🔑 Bước 2: Cấp toàn bộ quyền PROMOTION cho SYSTEM_ADMIN');

  let adminPosition = await prisma.position.findFirst({
    where: { code: 'SYSTEM_ADMIN' },
  });

  if (!adminPosition) {
    console.log('  ⚠️  Không tìm thấy position SYSTEM_ADMIN — bỏ qua bước này');
    return;
  }

  let granted = 0;
  for (const [, fnId] of codeToId) {
    const existing = await prisma.positionFunction.findFirst({
      where: { positionId: adminPosition.id, functionId: fnId },
    });

    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId: adminPosition.id,
          functionId: fnId,
          scope: 'ACADEMY' as FunctionScope,
          isActive: true,
        } as any,
      });
      granted++;
    } else {
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: { isActive: true, scope: 'ACADEMY' as FunctionScope } as any,
      });
    }
  }

  console.log(`  ✅ SYSTEM_ADMIN — ${granted} quyền mới, ${codeToId.size - granted} đã tồn tại`);
}

async function grantToPositions(codeToId: Map<string, string>) {
  console.log('\n🔑 Bước 3: Cấp quyền theo chức vụ');

  for (const assignment of POSITION_ASSIGNMENTS) {
    const position = await prisma.position.findFirst({
      where: { code: assignment.positionCode },
    });

    if (!position) {
      console.log(`  ⚠️  Không tìm thấy position ${assignment.positionCode} — bỏ qua`);
      continue;
    }

    let granted = 0;
    for (const fnCode of assignment.functionCodes) {
      const fnId = codeToId.get(fnCode);
      if (!fnId) continue;

      const existing = await prisma.positionFunction.findFirst({
        where: { positionId: position.id, functionId: fnId },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: fnId,
            scope: assignment.scope as FunctionScope,
            isActive: true,
          } as any,
        });
        granted++;
      } else {
        await prisma.positionFunction.update({
          where: { id: existing.id },
          data: { isActive: true, scope: assignment.scope as FunctionScope } as any,
        });
      }
    }

    console.log(`  ✅ ${assignment.positionCode} — ${granted} quyền mới, ${assignment.functionCodes.length - granted} đã tồn tại`);
  }
}

async function main() {
  console.log('\n🚀 Seed: Promotion Function Codes');
  console.log('━'.repeat(60));

  const codeToId = await upsertFunctions();
  await grantToAdmin(codeToId);
  await grantToPositions(codeToId);

  console.log('\n✅ Hoàn thành seed function codes thăng quân hàm.');
  console.log(`   Tổng số function codes PROMOTION: ${PROMOTION_FUNCTIONS.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
