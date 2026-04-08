/**
 * Script sửa lỗi RBAC toàn diện
 * - Gán UserPosition cho tất cả users chưa có
 * - Đảm bảo tất cả positions có đủ function codes
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping legacy role -> Position code
const ROLE_TO_POSITION: Record<string, string> = {
  'QUAN_TRI_HE_THONG': 'SYSTEM_ADMIN',
  'ADMIN': 'SYSTEM_ADMIN',
  'CHI_HUY_HOC_VIEN': 'PHO_GIAM_DOC',
  'CHI_HUY_KHOA_PHONG': 'TRUONG_KHOA',
  'CHU_NHIEM_BO_MON': 'CHU_NHIEM_BO_MON',
  'GIANG_VIEN': 'GIANG_VIEN',
  'NGHIEN_CUU_VIEN': 'NGHIEN_CUU_VIEN',
  'HOC_VIEN': 'HOC_VIEN_QUAN_SU',
  'HOC_VIEN_SINH_VIEN': 'HOC_VIEN_QUAN_SU',
  'KY_THUAT_VIEN': 'KY_THUAT_VIEN',
  'CAN_BO': 'CAN_BO',
};

async function main() {
  console.log('=== BẮT ĐẦU SỬA LỖI RBAC ===\n');

  // 1. Tìm users chưa có UserPosition
  const usersWithoutPosition = await prisma.user.findMany({
    where: {
      userPositions: { none: { isActive: true } }
    },
    select: { id: true, email: true, role: true, unitId: true }
  });

  console.log(`1. Tìm thấy ${usersWithoutPosition.length} users chưa có UserPosition`);

  // 2. Gán UserPosition cho từng user
  let assigned = 0;
  for (const user of usersWithoutPosition) {
    const positionCode = ROLE_TO_POSITION[user.role] || 'CAN_BO';
    
    const position = await prisma.position.findUnique({
      where: { code: positionCode }
    });

    if (!position) {
      console.log(`   ⚠️ Không tìm thấy Position ${positionCode} cho user ${user.email}`);
      continue;
    }

    // Check if already has this position (inactive)
    const existingInactive = await prisma.userPosition.findFirst({
      where: { userId: user.id, positionId: position.id }
    });

    if (existingInactive) {
      // Activate it
      await prisma.userPosition.update({
        where: { id: existingInactive.id },
        data: { isActive: true }
      });
      console.log(`   ✓ Kích hoạt lại UserPosition cho ${user.email}`);
    } else {
      // Create new
      await prisma.userPosition.create({
        data: {
          userId: user.id,
          positionId: position.id,
          unitId: user.unitId,
          isActive: true,
          isPrimary: true,
          startDate: new Date(),
        }
      });
      console.log(`   ✓ Tạo mới UserPosition cho ${user.email} -> ${positionCode}`);
    }
    assigned++;
  }

  console.log(`\n2. Đã gán ${assigned} UserPositions`);

  // 3. Kiểm tra và bổ sung function codes quan trọng cho GIANG_VIEN
  const giangVienPosition = await prisma.position.findUnique({
    where: { code: 'GIANG_VIEN' },
    include: { functions: { include: { function: true } } }
  });

  if (giangVienPosition) {
    const existingCodes = giangVienPosition.functions.map(pf => pf.function.code);
    const requiredCodes = [
      'VIEW_PERSONNEL', 'VIEW_TRAINING', 'VIEW_COURSE', 'VIEW_GRADE',
      'VIEW_RESEARCH', 'VIEW_STUDENT', 'VIEW_INSURANCE', 'VIEW_POLICY'
    ];

    const missingCodes = requiredCodes.filter(c => !existingCodes.includes(c));
    
    if (missingCodes.length > 0) {
      console.log(`\n3. Bổ sung ${missingCodes.length} function codes cho GIANG_VIEN`);
      
      for (const code of missingCodes) {
        const func = await prisma.function.findUnique({ where: { code } });
        if (func) {
          await prisma.positionFunction.create({
            data: {
              positionId: giangVienPosition.id,
              functionId: func.id,
              scope: 'UNIT',
              isActive: true,
            }
          });
          console.log(`   ✓ Thêm ${code}`);
        }
      }
    } else {
      console.log('\n3. GIANG_VIEN đã có đủ function codes cơ bản');
    }
  }

  // 4. Tương tự cho HOC_VIEN_QUAN_SU
  const hocVienPosition = await prisma.position.findUnique({
    where: { code: 'HOC_VIEN_QUAN_SU' },
    include: { functions: { include: { function: true } } }
  });

  if (hocVienPosition) {
    const existingCodes = hocVienPosition.functions.map(pf => pf.function.code);
    const requiredCodes = [
      'VIEW_TRAINING', 'VIEW_COURSE', 'VIEW_GRADE', 'REGISTER_COURSE',
      'VIEW_STUDENT', 'VIEW_INSURANCE'
    ];

    const missingCodes = requiredCodes.filter(c => !existingCodes.includes(c));
    
    if (missingCodes.length > 0) {
      console.log(`\n4. Bổ sung ${missingCodes.length} function codes cho HOC_VIEN_QUAN_SU`);
      
      for (const code of missingCodes) {
        const func = await prisma.function.findUnique({ where: { code } });
        if (func) {
          await prisma.positionFunction.create({
            data: {
              positionId: hocVienPosition.id,
              functionId: func.id,
              scope: 'SELF',
              isActive: true,
            }
          });
          console.log(`   ✓ Thêm ${code}`);
        }
      }
    } else {
      console.log('\n4. HOC_VIEN_QUAN_SU đã có đủ function codes cơ bản');
    }
  }

  console.log('\n=== HOÀN THÀNH ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
