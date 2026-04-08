import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Ma trận phân quyền theo vị trí
const positionFunctionMapping: Record<string, string[]> = {
  // Phó trưởng khoa - quyền xem và cập nhật trong phạm vi khoa
  PHO_TRUONG_KHOA: [
    'VIEW_PERSONNEL', 'UPDATE_PERSONNEL', 'VIEW_CAREER_HISTORY',
    'VIEW_COURSE', 'VIEW_GRADE', 'UPDATE_GRADE',
    'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH',
    'VIEW_STUDENT', 'UPDATE_STUDENT',
    'VIEW_PARTY_MEMBER', 'VIEW_POLICY',
    'VIEW_AWARD', 'VIEW_DISCIPLINE'
  ],
  // Phó trưởng phòng - tương tự phó trưởng khoa
  PHO_TRUONG_PHONG: [
    'VIEW_PERSONNEL', 'UPDATE_PERSONNEL', 'VIEW_CAREER_HISTORY',
    'VIEW_COURSE', 'VIEW_GRADE',
    'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH',
    'VIEW_POLICY', 'CREATE_POLICY_REQUEST', 'UPDATE_POLICY_REQUEST',
    'VIEW_INSURANCE', 'VIEW_AWARD'
  ],
  // Phó chủ nhiệm bộ môn
  PHO_CHU_NHIEM_BM: [
    'VIEW_PERSONNEL', 'VIEW_CAREER_HISTORY',
    'VIEW_COURSE', 'CREATE_COURSE', 'UPDATE_COURSE',
    'VIEW_GRADE', 'UPDATE_GRADE',
    'VIEW_STUDENT', 'UPDATE_STUDENT',
    'VIEW_RESEARCH', 'CREATE_RESEARCH'
  ],
  // Giảng viên chính - quyền xem và tạo
  GIANG_VIEN_CHINH: [
    'VIEW_PERSONNEL',
    'VIEW_COURSE', 'CREATE_COURSE', 'UPDATE_COURSE',
    'VIEW_GRADE', 'UPDATE_GRADE', 'SUBMIT_GRADE',
    'VIEW_STUDENT', 'UPDATE_STUDENT',
    'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH', 'SUBMIT_RESEARCH',
    'VIEW_PUBLICATION', 'UPDATE_PUBLICATION'
  ],
  // Trợ giảng - quyền hạn chế
  TRO_GIANG: [
    'VIEW_PERSONNEL',
    'VIEW_COURSE',
    'VIEW_GRADE',
    'VIEW_STUDENT',
    'VIEW_RESEARCH'
  ],
  // Nghiên cứu viên - chuyên về NCKH
  NGHIEN_CUU_VIEN: [
    'VIEW_PERSONNEL',
    'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH', 'SUBMIT_RESEARCH',
    'VIEW_PUBLICATION', 'UPDATE_PUBLICATION'
  ],
  // Chuyên viên - hỗ trợ hành chính
  CHUYEN_VIEN: [
    'VIEW_PERSONNEL', 'VIEW_CAREER_HISTORY',
    'VIEW_COURSE', 'VIEW_GRADE',
    'VIEW_STUDENT',
    'VIEW_POLICY', 'CREATE_POLICY_REQUEST',
    'VIEW_INSURANCE',
    'VIEW_AWARD'
  ],
  // Cán bộ thư viện
  CAN_BO_THU_VIEN: [
    'VIEW_PERSONNEL',
    'VIEW_COURSE',
    'VIEW_STUDENT',
    'VIEW_RESEARCH', 'VIEW_PUBLICATION'
  ],
  // Cán bộ tài chính
  CAN_BO_TAI_CHINH: [
    'VIEW_PERSONNEL', 'VIEW_CAREER_HISTORY',
    'VIEW_POLICY', 'CREATE_POLICY_REQUEST', 'UPDATE_POLICY_REQUEST',
    'VIEW_INSURANCE', 'UPDATE_INSURANCE',
    'VIEW_AWARD'
  ],
  // Cán bộ tổ chức
  CAN_BO_TO_CHUC: [
    'VIEW_PERSONNEL', 'CREATE_PERSONNEL', 'UPDATE_PERSONNEL', 'VIEW_CAREER_HISTORY', 'UPDATE_CAREER_HISTORY',
    'VIEW_PARTY_MEMBER', 'CREATE_PARTY_MEMBER', 'UPDATE_PARTY_MEMBER',
    'VIEW_POLICY', 'CREATE_POLICY_REQUEST', 'UPDATE_POLICY_REQUEST', 'SUBMIT_POLICY_REQUEST',
    'VIEW_AWARD', 'CREATE_AWARD', 'UPDATE_AWARD',
    'VIEW_DISCIPLINE', 'CREATE_DISCIPLINE'
  ],
  // Kỹ thuật viên
  KY_THUAT_VIEN: [
    'VIEW_PERSONNEL',
    'VIEW_COURSE',
    'VIEW_STUDENT'
  ],
  // Sinh viên dân sự - chỉ xem thông tin cá nhân
  SINH_VIEN_DAN_SU: [
    'VIEW_GRADE',
    'VIEW_COURSE',
    'VIEW_RESEARCH'
  ],
  // Học viên cao học
  HOC_VIEN_CAO_HOC: [
    'VIEW_GRADE',
    'VIEW_COURSE',
    'VIEW_RESEARCH', 'CREATE_RESEARCH', 'UPDATE_RESEARCH'
  ]
};

async function completeRBACMatrix() {
  console.log('=== HOÀN THIỆN MA TRẬN RBAC ===\n');

  // Get all functions
  const allFunctions = await prisma.function.findMany();
  const functionMap = new Map(allFunctions.map(f => [f.code, f.id]));

  // Get all positions  
  const allPositions = await prisma.position.findMany();
  const positionMap = new Map(allPositions.map(p => [p.code, p.id]));

  let totalCreated = 0;

  for (const [positionCode, functionCodes] of Object.entries(positionFunctionMapping)) {
    const positionId = positionMap.get(positionCode);
    if (!positionId) {
      console.log('⚠️ Không tìm thấy position: ' + positionCode);
      continue;
    }

    console.log('📌 ' + positionCode + ':');
    let created = 0;

    for (const funcCode of functionCodes) {
      const functionId = functionMap.get(funcCode);
      if (!functionId) {
        console.log('   ⚠️ Không tìm thấy function: ' + funcCode);
        continue;
      }

      // Check if already exists
      const existing = await prisma.positionFunction.findFirst({
        where: { positionId, functionId }
      });

      if (!existing) {
        await prisma.positionFunction.create({
          data: {
            positionId,
            functionId,
            scope: 'UNIT' // Default scope
          }
        });
        created++;
        totalCreated++;
      }
    }

    console.log('   ✅ Đã gán ' + created + ' functions');
  }

  console.log('\n=== KẾT QUẢ ===');
  console.log('Tổng cộng đã tạo: ' + totalCreated + ' liên kết Position-Function');

  // Verify
  const updatedPositions = await prisma.position.findMany({
    include: { functions: true }
  });
  const stillEmpty = updatedPositions.filter(p => p.functions.length === 0);
  console.log('Positions còn thiếu functions: ' + stillEmpty.length);
  if (stillEmpty.length > 0) {
    stillEmpty.forEach(p => console.log('  - ' + p.code));
  }

  await prisma.$disconnect();
}

completeRBACMatrix();
