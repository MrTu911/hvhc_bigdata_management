/**
 * Seed Missing Functions - EDUCATION, INSURANCE modules
 * Add missing functions to the database and assign to SYSTEM_ADMIN
 */
import { PrismaClient, FunctionScope, ActionType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// Functions to add
const FUNCTIONS_TO_ADD = [
  // EDUCATION module
  { code: 'VIEW_PROGRAM', name: 'Xem chương trình đào tạo', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'CREATE_PROGRAM', name: 'Tạo chương trình đào tạo', module: 'education', actionType: 'CREATE' as ActionType },
  { code: 'UPDATE_PROGRAM', name: 'Cập nhật chương trình đào tạo', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'DELETE_PROGRAM', name: 'Xóa chương trình đào tạo', module: 'education', actionType: 'DELETE' as ActionType },
  { code: 'APPROVE_PROGRAM', name: 'Phê duyệt chương trình đào tạo', module: 'education', actionType: 'APPROVE' as ActionType },
  { code: 'VIEW_CURRICULUM', name: 'Xem khung chương trình', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'CREATE_CURRICULUM', name: 'Tạo khung chương trình', module: 'education', actionType: 'CREATE' as ActionType },
  { code: 'UPDATE_CURRICULUM', name: 'Cập nhật khung chương trình', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'DELETE_CURRICULUM', name: 'Xóa khung chương trình', module: 'education', actionType: 'DELETE' as ActionType },
  { code: 'VIEW_TERM', name: 'Xem năm học/học kỳ', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'MANAGE_TERM', name: 'Quản lý năm học/học kỳ', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'VIEW_CLASS_SECTION', name: 'Xem lớp học phần', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'CREATE_CLASS_SECTION', name: 'Tạo lớp học phần', module: 'education', actionType: 'CREATE' as ActionType },
  { code: 'UPDATE_CLASS_SECTION', name: 'Cập nhật lớp học phần', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'DELETE_CLASS_SECTION', name: 'Xóa lớp học phần', module: 'education', actionType: 'DELETE' as ActionType },
  { code: 'VIEW_SCHEDULE', name: 'Xem lịch học', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'CREATE_SCHEDULE', name: 'Tạo lịch học', module: 'education', actionType: 'CREATE' as ActionType },
  { code: 'UPDATE_SCHEDULE', name: 'Cập nhật lịch học', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'DELETE_SCHEDULE', name: 'Xóa lịch học', module: 'education', actionType: 'DELETE' as ActionType },
  { code: 'VIEW_ATTENDANCE', name: 'Xem điểm danh', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'MANAGE_ATTENDANCE', name: 'Quản lý điểm danh', module: 'education', actionType: 'UPDATE' as ActionType },
  { code: 'VIEW_ENROLLMENT', name: 'Xem ghi danh', module: 'education', actionType: 'VIEW' as ActionType },
  { code: 'MANAGE_ENROLLMENT', name: 'Quản lý ghi danh', module: 'education', actionType: 'UPDATE' as ActionType },
  
  // INSURANCE module - additional if needed
  { code: 'CREATE_INSURANCE', name: 'Tạo hồ sơ bảo hiểm', module: 'insurance', actionType: 'CREATE' as ActionType },
  { code: 'DELETE_INSURANCE', name: 'Xóa hồ sơ bảo hiểm', module: 'insurance', actionType: 'DELETE' as ActionType },
  { code: 'APPROVE_INSURANCE_CLAIM', name: 'Phê duyệt yêu cầu BHXH', module: 'insurance', actionType: 'APPROVE' as ActionType },
];

async function main() {
  console.log('Starting seed missing functions...');

  try {
    // Get SYSTEM_ADMIN position
    const adminPosition = await prisma.position.findFirst({
      where: { code: 'SYSTEM_ADMIN' }
    });

    if (!adminPosition) {
      console.error('SYSTEM_ADMIN position not found!');
      return;
    }
    console.log('Found SYSTEM_ADMIN position:', adminPosition.id);

    let created = 0;
    let assigned = 0;

    for (const func of FUNCTIONS_TO_ADD) {
      // Check if function already exists
      let existingFunc = await prisma.function.findFirst({
        where: { code: func.code }
      });

      if (!existingFunc) {
        // Create function
        existingFunc = await prisma.function.create({
          data: {
            code: func.code,
            name: func.name,
            module: func.module,
            actionType: func.actionType,
            isActive: true,
            isCritical: false
          }
        });
        console.log(`Created function: ${func.code}`);
        created++;
      }

      // Check if already assigned to SYSTEM_ADMIN
      const existingAssignment = await prisma.positionFunction.findFirst({
        where: {
          positionId: adminPosition.id,
          functionId: existingFunc.id
        }
      });

      if (!existingAssignment) {
        // Assign to SYSTEM_ADMIN with ACADEMY scope
        await prisma.positionFunction.create({
          data: {
            positionId: adminPosition.id,
            functionId: existingFunc.id,
            scope: 'ACADEMY' as FunctionScope,
            isActive: true
          }
        });
        console.log(`Assigned ${func.code} to SYSTEM_ADMIN`);
        assigned++;
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Created ${created} new functions`);
    console.log(`- Assigned ${assigned} functions to SYSTEM_ADMIN`);

    // Verify total functions for SYSTEM_ADMIN
    const totalFunctions = await prisma.positionFunction.count({
      where: { positionId: adminPosition.id }
    });
    console.log(`\nTotal functions for SYSTEM_ADMIN: ${totalFunctions}`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
