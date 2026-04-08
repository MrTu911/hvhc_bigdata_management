import { PrismaClient, FunctionScope, UserStatus, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@demo.hvhc.edu.vn';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Demo@2025';
const POSITION_CODE = 'SYSTEM_ADMIN';
const POSITION_NAME = 'Quản trị hệ thống';

async function findOrCreateAdminUser(email: string) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    console.log(`✅ Found admin user by email: ${user.email} (${user.id})`);
    return user;
  }

  const fallbackAdmin = await prisma.user.findFirst({
    where: {
      role: {
        in: [UserRole.QUAN_TRI_HE_THONG, UserRole.ADMIN],
      },
      status: UserStatus.ACTIVE,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (fallbackAdmin) {
    console.log(`✅ Found fallback admin: ${fallbackAdmin.email} (${fallbackAdmin.id})`);
    return fallbackAdmin;
  }

  console.log(`⚠️ Không tìm thấy admin với email ${email}. Tiến hành tạo mới...`);

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  user = await prisma.user.create({
    data: {
      email,
      name: 'Demo Quản trị Hệ thống',
      password: hashedPassword,
      role: UserRole.QUAN_TRI_HE_THONG,
      status: UserStatus.ACTIVE,
      militaryId: `ADMIN_${Date.now()}`,
      rank: 'Đại tá',
      department: 'HVHC',
      unit: 'HVHC',
      position: 'Quản trị hệ thống',
    },
  });

  console.log(`✅ Created new admin user: ${user.email} (${user.id})`);
  console.log(`ℹ️ Admin password: ${ADMIN_PASSWORD}`);

  return user;
}

async function ensureSystemAdminPosition() {
  let position = await prisma.position.findFirst({
    where: { code: POSITION_CODE },
  });

  if (!position) {
    position = await prisma.position.create({
      data: {
        code: POSITION_CODE,
        name: POSITION_NAME,
        description: 'Toàn quyền quản trị hệ thống',
        isActive: true,
        level: 100,
      } as any,
    });
    console.log(`✅ Created position: ${POSITION_CODE}`);
  } else {
    console.log(`✅ Position exists: ${POSITION_CODE}`);
  }

  return position;
}

async function ensureAllFunctionsAssigned(positionId: string) {
  const allFunctions = await prisma.function.findMany({
    where: { isActive: true },
    orderBy: { code: 'asc' },
  });

  if (allFunctions.length === 0) {
    throw new Error('Không có function nào trong DB. Hãy chạy seed_rbac.ts trước.');
  }

  let created = 0;
  let updated = 0;

  for (const fn of allFunctions) {
    const existing = await prisma.positionFunction.findFirst({
      where: {
        positionId,
        functionId: fn.id,
      },
    });

    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId,
          functionId: fn.id,
          scope: 'ACADEMY' as FunctionScope,
          isActive: true,
        } as any,
      });
      created++;
    } else {
      await prisma.positionFunction.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          scope: 'ACADEMY' as FunctionScope,
        } as any,
      });
      updated++;
    }
  }

  console.log(`✅ Assigned functions to SYSTEM_ADMIN`);
  console.log(`   - created: ${created}`);
  console.log(`   - updated: ${updated}`);
  console.log(`   - total active functions in DB: ${allFunctions.length}`);

  return allFunctions.length;
}

async function ensureUserPosition(userId: string, positionId: string) {
  const existing = await prisma.userPosition.findFirst({
    where: {
      userId,
      positionId,
    },
    orderBy: [{ isPrimary: 'desc' }, { isActive: 'desc' }],
  });

  if (!existing) {
    await prisma.userPosition.create({
      data: {
        userId,
        positionId,
        isPrimary: true,
        isActive: true,
        startDate: new Date(),
      } as any,
    });
    console.log('✅ Created userPosition SYSTEM_ADMIN');
    return;
  }

  await prisma.userPosition.update({
    where: { id: existing.id },
    data: {
      isPrimary: true,
      isActive: true,
      endDate: null,
    } as any,
  });

  console.log('✅ Updated existing userPosition to active primary SYSTEM_ADMIN');
}

async function verify(userId: string, positionId: string) {
  const totalFunctions = await prisma.function.count({
    where: { isActive: true },
  });

  const totalAdminAssignments = await prisma.positionFunction.count({
    where: {
      positionId,
      isActive: true,
    },
  });

  const userPositions = await prisma.userPosition.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
    include: {
      position: {
        include: {
          functions: {
            where: { isActive: true },
            include: {
              function: true,
            },
          },
        },
      },
    },
  });

  const functionCodes = Array.from(
    new Set(
      userPositions.flatMap((up) =>
        up.position.functions.map((pf) => pf.function.code),
      ),
    ),
  ).sort();

  console.log('\n================ VERIFY ================');
  console.log(`Total active functions in DB : ${totalFunctions}`);
  console.log(`SYSTEM_ADMIN grants          : ${totalAdminAssignments}`);
  console.log(`User active positions        : ${userPositions.length}`);
  console.log(`User effective permissions   : ${functionCodes.length}`);
  console.log('Sample function codes:');
  console.log(functionCodes.slice(0, 50));
  console.log('========================================\n');

  if (totalAdminAssignments < totalFunctions) {
    console.warn('⚠️ SYSTEM_ADMIN chưa có đủ grant so với tổng functions active.');
  }
}

async function main() {
  console.log('🚀 Seed admin full access...');

  const user = await findOrCreateAdminUser(ADMIN_EMAIL);
  const position = await ensureSystemAdminPosition();

  await ensureAllFunctionsAssigned(position.id);
  await ensureUserPosition(user.id, position.id);
  await verify(user.id, position.id);

  console.log(`✅ Hoàn tất cấp full quyền cho admin: ${user.email}`);
  console.log(`ℹ️ Mật khẩu mặc định nếu tài khoản vừa được tạo: ${ADMIN_PASSWORD}`);
  console.log('⚠️ Hãy đăng xuất và đăng nhập lại để refresh JWT/session.');
}

main()
  .catch((error) => {
    console.error('❌ Seed admin full access failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });