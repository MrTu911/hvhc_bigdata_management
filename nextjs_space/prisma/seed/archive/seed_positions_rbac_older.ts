/**
 * Seed Positions & Functions cho RBAC động
 * 
 * Bảng Positions mới theo yêu cầu:
 * - Chỉ huy Học viện, Chỉ huy Khoa, Chỉ huy Phòng
 * - Chỉ huy Hệ, Chỉ huy Tiểu đoàn, Chỉ huy Ban, Chỉ huy Bộ môn
 * - Giảng viên, Nghiên cứu viên, Trợ lý, Nhân viên, Kỹ thuật viên
 * - Học viên
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Danh sách Positions theo cấp bậc
const POSITIONS = [
  // Quản trị hệ thống
  {
    code: 'SYSTEM_ADMIN',
    name: 'Quản trị hệ thống',
    description: 'Quyền cao nhất trong hệ thống, quản lý toàn bộ RBAC, users, cấu hình',
    positionScope: 'ACADEMY',
    level: 100,
  },
  // Chỉ huy Học viện
  {
    code: 'CHI_HUY_HOC_VIEN',
    name: 'Chỉ huy Học viện',
    description: 'Lãnh đạo cao nhất của Học viện, xem toàn bộ dữ liệu, phê duyệt cấp cao',
    positionScope: 'ACADEMY',
    level: 90,
  },
  // Chỉ huy Khoa
  {
    code: 'CHI_HUY_KHOA',
    name: 'Chỉ huy Khoa',
    description: 'Chỉ huy cấp Khoa, quản lý nhân sự, đào tạo, NCKH trong Khoa',
    positionScope: 'UNIT',
    level: 80,
  },
  // Chỉ huy Phòng
  {
    code: 'CHI_HUY_PHONG',
    name: 'Chỉ huy Phòng',
    description: 'Chỉ huy cấp Phòng, quản lý nghiệp vụ trong phòng ban',
    positionScope: 'UNIT',
    level: 80,
  },
  // Chỉ huy Hệ
  {
    code: 'CHI_HUY_HE',
    name: 'Chỉ huy Hệ',
    description: 'Chỉ huy cấp Hệ, quản lý học viên theo hệ',
    positionScope: 'UNIT',
    level: 75,
  },
  // Chỉ huy Tiểu đoàn
  {
    code: 'CHI_HUY_TIEU_DOAN',
    name: 'Chỉ huy Tiểu đoàn',
    description: 'Chỉ huy cấp Tiểu đoàn, quản lý quân số và huấn luyện',
    positionScope: 'UNIT',
    level: 75,
  },
  // Chỉ huy Ban
  {
    code: 'CHI_HUY_BAN',
    name: 'Chỉ huy Ban',
    description: 'Chỉ huy cấp Ban, quản lý nghiệp vụ trong ban',
    positionScope: 'UNIT',
    level: 70,
  },
  // Chỉ huy Bộ môn (thay Chủ nhiệm Bộ môn)
  {
    code: 'CHI_HUY_BO_MON',
    name: 'Chỉ huy Bộ môn',
    description: 'Chỉ huy Bộ môn, quản lý giảng viên và chương trình đào tạo của bộ môn',
    positionScope: 'UNIT',
    level: 70,
  },
  // Giảng viên
  {
    code: 'GIANG_VIEN',
    name: 'Giảng viên',
    description: 'Giảng dạy, hướng dẫn học viên, chấm điểm',
    positionScope: 'SELF',
    level: 50,
  },
  // Nghiên cứu viên
  {
    code: 'NGHIEN_CUU_VIEN',
    name: 'Nghiên cứu viên',
    description: 'Thực hiện nghiên cứu khoa học, tham gia đề tài',
    positionScope: 'SELF',
    level: 50,
  },
  // Trợ lý
  {
    code: 'TRO_LY',
    name: 'Trợ lý',
    description: 'Hỗ trợ chỉ huy, xử lý nghiệp vụ hành chính',
    positionScope: 'UNIT',
    level: 40,
  },
  // Nhân viên
  {
    code: 'NHAN_VIEN',
    name: 'Nhân viên',
    description: 'Thực hiện công việc văn phòng, hành chính',
    positionScope: 'SELF',
    level: 30,
  },
  // Kỹ thuật viên
  {
    code: 'KY_THUAT_VIEN',
    name: 'Kỹ thuật viên',
    description: 'Hỗ trợ kỹ thuật, vận hành thiết bị',
    positionScope: 'SELF',
    level: 30,
  },
  // Học viên
  {
    code: 'HOC_VIEN',
    name: 'Học viên',
    description: 'Học viên đang học tập tại Học viện',
    positionScope: 'SELF',
    level: 10,
  },
];

// Danh sách Functions cần seed
const FUNCTIONS = [
  // SYSTEM module
  { code: 'MANAGE_USERS', name: 'Quản lý người dùng', module: 'SYSTEM', actionType: 'MANAGE' },
  { code: 'MANAGE_UNITS', name: 'Quản lý đơn vị', module: 'SYSTEM', actionType: 'MANAGE' },
  { code: 'MANAGE_RBAC', name: 'Quản lý phân quyền', module: 'SYSTEM', actionType: 'MANAGE' },
  { code: 'VIEW_AUDIT_LOG', name: 'Xem nhật ký hệ thống', module: 'SYSTEM', actionType: 'VIEW' },
  { code: 'MANAGE_AI_CONFIG', name: 'Cấu hình AI', module: 'SYSTEM', actionType: 'MANAGE' },
  { code: 'VIEW_DASHBOARD_ADMIN', name: 'Xem dashboard Admin', module: 'DASHBOARD', actionType: 'VIEW' },
  
  // PERSONNEL module
  { code: 'VIEW_PERSONNEL', name: 'Xem danh sách cán bộ', module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'VIEW_PERSONNEL_DETAIL', name: 'Xem chi tiết hồ sơ', module: 'PERSONNEL', actionType: 'VIEW' },
  { code: 'CREATE_PERSONNEL', name: 'Thêm cán bộ', module: 'PERSONNEL', actionType: 'CREATE' },
  { code: 'UPDATE_PERSONNEL', name: 'Cập nhật cán bộ', module: 'PERSONNEL', actionType: 'UPDATE' },
  { code: 'DELETE_PERSONNEL', name: 'Xóa cán bộ', module: 'PERSONNEL', actionType: 'DELETE' },
  { code: 'EXPORT_PERSONNEL', name: 'Xuất dữ liệu cán bộ', module: 'PERSONNEL', actionType: 'EXPORT' },
  
  // EDUCATION module
  { code: 'VIEW_PROGRAM', name: 'Xem chương trình đào tạo', module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'CREATE_PROGRAM', name: 'Tạo chương trình đào tạo', module: 'EDUCATION', actionType: 'CREATE' },
  { code: 'UPDATE_PROGRAM', name: 'Cập nhật chương trình', module: 'EDUCATION', actionType: 'UPDATE' },
  { code: 'VIEW_TERM', name: 'Xem năm học/học kỳ', module: 'EDUCATION', actionType: 'VIEW' },
  { code: 'MANAGE_TERM', name: 'Quản lý năm học/học kỳ', module: 'EDUCATION', actionType: 'MANAGE' },
  
  // TRAINING module
  { code: 'VIEW_TRAINING', name: 'Xem thông tin đào tạo', module: 'TRAINING', actionType: 'VIEW' },
  { code: 'VIEW_GRADE', name: 'Xem điểm', module: 'TRAINING', actionType: 'VIEW' },
  { code: 'SUBMIT_GRADE', name: 'Gửi điểm', module: 'TRAINING', actionType: 'SUBMIT' },
  { code: 'APPROVE_GRADE', name: 'Phê duyệt điểm', module: 'TRAINING', actionType: 'APPROVE' },
  
  // RESEARCH module
  { code: 'VIEW_RESEARCH', name: 'Xem NCKH', module: 'RESEARCH', actionType: 'VIEW' },
  { code: 'CREATE_RESEARCH', name: 'Tạo đề tài NCKH', module: 'RESEARCH', actionType: 'CREATE' },
  { code: 'UPDATE_RESEARCH', name: 'Cập nhật đề tài', module: 'RESEARCH', actionType: 'UPDATE' },
  { code: 'DELETE_RESEARCH', name: 'Xóa đề tài', module: 'RESEARCH', actionType: 'DELETE' },
  
  // POLICY module
  { code: 'VIEW_POLICY', name: 'Xem chế độ chính sách', module: 'POLICY', actionType: 'VIEW' },
  { code: 'CREATE_POLICY', name: 'Tạo hồ sơ chế độ', module: 'POLICY', actionType: 'CREATE' },
  { code: 'APPROVE_POLICY', name: 'Phê duyệt chế độ', module: 'POLICY', actionType: 'APPROVE' },
  
  // INSURANCE module
  { code: 'VIEW_INSURANCE', name: 'Xem bảo hiểm', module: 'INSURANCE', actionType: 'VIEW' },
  { code: 'CREATE_INSURANCE_CLAIM', name: 'Tạo yêu cầu thanh toán', module: 'INSURANCE', actionType: 'CREATE' },
  { code: 'APPROVE_INSURANCE_CLAIM', name: 'Phê duyệt thanh toán', module: 'INSURANCE', actionType: 'APPROVE' },
  
  // DASHBOARD module
  { code: 'VIEW_DASHBOARD', name: 'Xem dashboard cơ bản', module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_COMMAND', name: 'Xem dashboard chỉ huy', module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_FACULTY', name: 'Xem dashboard giảng viên', module: 'DASHBOARD', actionType: 'VIEW' },
  { code: 'VIEW_DASHBOARD_STUDENT', name: 'Xem dashboard học viên', module: 'DASHBOARD', actionType: 'VIEW' },
];

// Gán Functions cho Positions
const POSITION_FUNCTIONS: Record<string, { functionCode: string; scope: 'SELF' | 'UNIT' | 'ACADEMY' }[]> = {
  'SYSTEM_ADMIN': [
    // Full quyền SYSTEM
    { functionCode: 'MANAGE_USERS', scope: 'ACADEMY' },
    { functionCode: 'MANAGE_UNITS', scope: 'ACADEMY' },
    { functionCode: 'MANAGE_RBAC', scope: 'ACADEMY' },
    { functionCode: 'VIEW_AUDIT_LOG', scope: 'ACADEMY' },
    { functionCode: 'MANAGE_AI_CONFIG', scope: 'ACADEMY' },
    { functionCode: 'VIEW_DASHBOARD_ADMIN', scope: 'ACADEMY' },
    // Full quyền PERSONNEL
    { functionCode: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
    { functionCode: 'VIEW_PERSONNEL_DETAIL', scope: 'ACADEMY' },
    { functionCode: 'CREATE_PERSONNEL', scope: 'ACADEMY' },
    { functionCode: 'UPDATE_PERSONNEL', scope: 'ACADEMY' },
    { functionCode: 'DELETE_PERSONNEL', scope: 'ACADEMY' },
    { functionCode: 'EXPORT_PERSONNEL', scope: 'ACADEMY' },
    // Full quyền EDUCATION
    { functionCode: 'VIEW_PROGRAM', scope: 'ACADEMY' },
    { functionCode: 'CREATE_PROGRAM', scope: 'ACADEMY' },
    { functionCode: 'UPDATE_PROGRAM', scope: 'ACADEMY' },
    { functionCode: 'VIEW_TERM', scope: 'ACADEMY' },
    { functionCode: 'MANAGE_TERM', scope: 'ACADEMY' },
    // RESEARCH
    { functionCode: 'VIEW_RESEARCH', scope: 'ACADEMY' },
    { functionCode: 'CREATE_RESEARCH', scope: 'ACADEMY' },
    { functionCode: 'UPDATE_RESEARCH', scope: 'ACADEMY' },
    { functionCode: 'DELETE_RESEARCH', scope: 'ACADEMY' },
    // POLICY
    { functionCode: 'VIEW_POLICY', scope: 'ACADEMY' },
    { functionCode: 'CREATE_POLICY', scope: 'ACADEMY' },
    { functionCode: 'APPROVE_POLICY', scope: 'ACADEMY' },
    // INSURANCE
    { functionCode: 'VIEW_INSURANCE', scope: 'ACADEMY' },
    { functionCode: 'CREATE_INSURANCE_CLAIM', scope: 'ACADEMY' },
    { functionCode: 'APPROVE_INSURANCE_CLAIM', scope: 'ACADEMY' },
    // DASHBOARD
    { functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
    { functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },
  ],
  'CHI_HUY_HOC_VIEN': [
    // Xem toàn bộ
    { functionCode: 'VIEW_PERSONNEL', scope: 'ACADEMY' },
    { functionCode: 'VIEW_PERSONNEL_DETAIL', scope: 'ACADEMY' },
    { functionCode: 'VIEW_PROGRAM', scope: 'ACADEMY' },
    { functionCode: 'VIEW_TERM', scope: 'ACADEMY' },
    { functionCode: 'VIEW_RESEARCH', scope: 'ACADEMY' },
    { functionCode: 'VIEW_POLICY', scope: 'ACADEMY' },
    { functionCode: 'VIEW_INSURANCE', scope: 'ACADEMY' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'ACADEMY' },
    { functionCode: 'VIEW_DASHBOARD_COMMAND', scope: 'ACADEMY' },
    // Phê duyệt cấp cao
    { functionCode: 'APPROVE_GRADE', scope: 'ACADEMY' },
    { functionCode: 'APPROVE_POLICY', scope: 'ACADEMY' },
    { functionCode: 'APPROVE_INSURANCE_CLAIM', scope: 'ACADEMY' },
    { functionCode: 'EXPORT_PERSONNEL', scope: 'ACADEMY' },
  ],
  'CHI_HUY_KHOA': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_PERSONNEL_DETAIL', scope: 'UNIT' },
    { functionCode: 'CREATE_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'UPDATE_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_PROGRAM', scope: 'UNIT' },
    { functionCode: 'VIEW_TERM', scope: 'ACADEMY' },
    { functionCode: 'VIEW_RESEARCH', scope: 'UNIT' },
    { functionCode: 'CREATE_RESEARCH', scope: 'UNIT' },
    { functionCode: 'UPDATE_RESEARCH', scope: 'UNIT' },
    { functionCode: 'VIEW_POLICY', scope: 'UNIT' },
    { functionCode: 'VIEW_INSURANCE', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
    { functionCode: 'APPROVE_GRADE', scope: 'UNIT' },
    { functionCode: 'EXPORT_PERSONNEL', scope: 'UNIT' },
  ],
  'CHI_HUY_PHONG': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_PERSONNEL_DETAIL', scope: 'UNIT' },
    { functionCode: 'VIEW_POLICY', scope: 'UNIT' },
    { functionCode: 'VIEW_INSURANCE', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
    { functionCode: 'EXPORT_PERSONNEL', scope: 'UNIT' },
  ],
  'CHI_HUY_HE': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_TRAINING', scope: 'UNIT' },
    { functionCode: 'VIEW_GRADE', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
  ],
  'CHI_HUY_TIEU_DOAN': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_TRAINING', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
  ],
  'CHI_HUY_BAN': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_POLICY', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
  ],
  'CHI_HUY_BO_MON': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_PROGRAM', scope: 'UNIT' },
    { functionCode: 'VIEW_TRAINING', scope: 'UNIT' },
    { functionCode: 'VIEW_GRADE', scope: 'UNIT' },
    { functionCode: 'APPROVE_GRADE', scope: 'UNIT' },
    { functionCode: 'VIEW_RESEARCH', scope: 'UNIT' },
    { functionCode: 'CREATE_RESEARCH', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
  ],
  'GIANG_VIEN': [
    { functionCode: 'VIEW_TRAINING', scope: 'SELF' },
    { functionCode: 'VIEW_GRADE', scope: 'SELF' },
    { functionCode: 'SUBMIT_GRADE', scope: 'SELF' },
    { functionCode: 'VIEW_RESEARCH', scope: 'SELF' },
    { functionCode: 'CREATE_RESEARCH', scope: 'SELF' },
    { functionCode: 'UPDATE_RESEARCH', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD_FACULTY', scope: 'SELF' },
  ],
  'NGHIEN_CUU_VIEN': [
    { functionCode: 'VIEW_RESEARCH', scope: 'SELF' },
    { functionCode: 'CREATE_RESEARCH', scope: 'SELF' },
    { functionCode: 'UPDATE_RESEARCH', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'SELF' },
  ],
  'TRO_LY': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'UNIT' },
    { functionCode: 'VIEW_POLICY', scope: 'UNIT' },
    { functionCode: 'CREATE_POLICY', scope: 'UNIT' },
    { functionCode: 'VIEW_INSURANCE', scope: 'UNIT' },
    { functionCode: 'CREATE_INSURANCE_CLAIM', scope: 'UNIT' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'UNIT' },
  ],
  'NHAN_VIEN': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'SELF' },
  ],
  'KY_THUAT_VIEN': [
    { functionCode: 'VIEW_PERSONNEL', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'SELF' },
  ],
  'HOC_VIEN': [
    { functionCode: 'VIEW_TRAINING', scope: 'SELF' },
    { functionCode: 'VIEW_GRADE', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD', scope: 'SELF' },
    { functionCode: 'VIEW_DASHBOARD_STUDENT', scope: 'SELF' },
  ],
};

async function seedPositionsAndFunctions() {
  console.log('🚀 Bắt đầu seed Positions & Functions RBAC...');

  // 1. Seed Functions
  console.log('\n📌 Seed Functions...');
  for (const fn of FUNCTIONS) {
    const existing = await prisma.function.findUnique({ where: { code: fn.code } });
    if (!existing) {
      await prisma.function.create({
        data: {
          code: fn.code,
          name: fn.name,
          module: fn.module,
          actionType: fn.actionType as any,
          isActive: true,
        },
      });
      console.log(`  ✅ Tạo function: ${fn.code}`);
    } else {
      console.log(`  ⏩ Function đã tồn tại: ${fn.code}`);
    }
  }

  // 2. Seed Positions
  console.log('\n📌 Seed Positions...');
  for (const pos of POSITIONS) {
    const existing = await prisma.position.findUnique({ where: { code: pos.code } });
    if (!existing) {
      await prisma.position.create({
        data: {
          code: pos.code,
          name: pos.name,
          description: pos.description,
          positionScope: pos.positionScope as any,
          level: pos.level,
          isActive: true,
        },
      });
      console.log(`  ✅ Tạo position: ${pos.name} (${pos.code})`);
    } else {
      // Cập nhật tên nếu cần
      await prisma.position.update({
        where: { code: pos.code },
        data: { name: pos.name, description: pos.description, level: pos.level },
      });
      console.log(`  ⏩ Position đã tồn tại, cập nhật: ${pos.name}`);
    }
  }

  // 3. Gán PositionFunctions
  console.log('\n📌 Seed PositionFunctions...');
  for (const [positionCode, functions] of Object.entries(POSITION_FUNCTIONS)) {
    const position = await prisma.position.findUnique({ where: { code: positionCode } });
    if (!position) {
      console.log(`  ⚠️ Position không tồn tại: ${positionCode}`);
      continue;
    }

    for (const fn of functions) {
      const func = await prisma.function.findUnique({ where: { code: fn.functionCode } });
      if (!func) {
        console.log(`    ⚠️ Function không tồn tại: ${fn.functionCode}`);
        continue;
      }

      const existing = await prisma.positionFunction.findUnique({
        where: {
          positionId_functionId: {
            positionId: position.id,
            functionId: func.id,
          },
        },
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: func.id,
            scope: fn.scope as any,
            isActive: true,
          },
        });
        console.log(`    ✅ Gán ${fn.functionCode} cho ${positionCode} (scope: ${fn.scope})`);
      }
    }
  }

  // 4. Gán SYSTEM_ADMIN position cho admin user
  console.log('\n📌 Gán SYSTEM_ADMIN cho các admin users...');
  const adminPosition = await prisma.position.findUnique({ where: { code: 'SYSTEM_ADMIN' } });
  if (adminPosition) {
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'QUAN_TRI_HE_THONG' },
        ],
      },
    });

    for (const user of adminUsers) {
      const existingUserPosition = await prisma.userPosition.findFirst({
        where: { userId: user.id, positionId: adminPosition.id },
      });

      if (!existingUserPosition) {
        await prisma.userPosition.create({
          data: {
            userId: user.id,
            positionId: adminPosition.id,
            isPrimary: true,
            isActive: true,
          },
        });
        console.log(`  ✅ Gán SYSTEM_ADMIN cho: ${user.email}`);
      } else {
        console.log(`  ⏩ Đã có SYSTEM_ADMIN: ${user.email}`);
      }
    }
  }

  console.log('\n✅ Hoàn thành seed Positions & Functions RBAC!');
}

// Run
seedPositionsAndFunctions()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Lỗi:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
