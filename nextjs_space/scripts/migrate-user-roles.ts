
/**
 * Script migration để cập nhật UserRole enum
 * Từ: ADMIN, GIANG_VIEN, HOC_VIEN, NGHIEN_CUU_VIEN
 * Sang: Schema mới với đầy đủ vai trò quân đội
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Bắt đầu migration UserRole enum...\n');

  try {
    // Step 1: Add new enum values first
    console.log('Step 1: Thêm các giá trị enum mới...');
    
    const newRoles = [
      'QUAN_TRI_HE_THONG',
      'CHI_HUY_HOC_VIEN',
      'CHI_HUY_KHOA_PHONG',
      'CHU_NHIEM_BO_MON',
      'HOC_VIEN_SINH_VIEN',
      'KY_THUAT_VIEN'
    ];

    for (const role of newRoles) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = '${role}'
              AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
            ) THEN
              ALTER TYPE "UserRole" ADD VALUE '${role}';
            END IF;
          END $$;
        `);
        console.log(`  ✅ Đã thêm: ${role}`);
      } catch (error) {
        console.log(`  ⚠️ ${role} đã tồn tại hoặc lỗi:`, (error as Error).message);
      }
    }
    
    console.log('\n✅ Đã thêm enum values!');

    // Step 2: Update existing users to use new role names
    console.log('\nStep 2: Cập nhật role cho users hiện tại...');
    
    await prisma.$executeRaw`
      UPDATE users 
      SET role = CASE 
        WHEN role = 'ADMIN' THEN 'QUAN_TRI_HE_THONG'
        WHEN role = 'HOC_VIEN' THEN 'HOC_VIEN_SINH_VIEN'
        ELSE role
      END::text::"UserRole"
      WHERE role IN ('ADMIN', 'HOC_VIEN')
    `;
    
    console.log('✅ Đã cập nhật users\n');
    console.log('\n✅ Migration hoàn tất!');
    
    // Show current roles
    const roles = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
      ORDER BY enumlabel
    `;
    
    console.log('\n📋 Danh sách UserRole hiện tại:');
    roles.forEach(r => console.log(`  - ${r.enumlabel}`));
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
