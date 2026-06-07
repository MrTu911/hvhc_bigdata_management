import { PrismaClient, Prisma } from '@prisma/client';
import 'dotenv/config';

// Logic cấp quyền (catalog + chức vụ + predicate) là nguồn sự thật chung,
// dùng lại bởi test/script. Seed chỉ còn phần ghi DB.
import {
  POSITIONS,
  buildAllGrants,
  type SeedFunction,
  type SeedGrant,
} from '../../lib/rbac/position-grants';

const prisma = new PrismaClient();

async function seedFunctions(functions: SeedFunction[]) {
  console.log('\n📌 Seed Functions...');

  for (const fn of functions) {
    const existing = await prisma.function.findUnique({
      where: { code: fn.code },
    });

    if (!existing) {
      await prisma.function.create({
        data: {
          code: fn.code,
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isActive: true,
          isCritical: fn.isCritical,
        },
      });
      console.log(`  ✅ Tạo function: ${fn.code}`);
    } else {
      await prisma.function.update({
        where: { code: fn.code },
        data: {
          name: fn.name,
          description: fn.description,
          module: fn.module,
          actionType: fn.actionType,
          isActive: true,
          isCritical: fn.isCritical,
        },
      });
      console.log(`  ⏩ Function đã tồn tại: ${fn.code}`);
    }
  }
}

async function seedPositions() {
  console.log('\n📌 Seed Positions...');

  for (const pos of POSITIONS) {
    const existing = await prisma.position.findUnique({
      where: { code: pos.code },
    });

    if (!existing) {
      await prisma.position.create({
        data: {
          code: pos.code,
          name: pos.name,
          description: pos.description,
          level: pos.level,
          isActive: true,
        },
      });
      console.log(`  ✅ Tạo position: ${pos.code}`);
    } else {
      await prisma.position.update({
        where: { code: pos.code },
        data: {
          name: pos.name,
          description: pos.description,
          level: pos.level,
          isActive: true,
        },
      });
      console.log(`  ⏩ Position đã tồn tại: ${pos.code}`);
    }
  }
}

async function seedPositionGrants(grants: SeedGrant[]) {
  console.log('\n📌 Seed Position Grants...');

  for (const grant of grants) {
    const position = await prisma.position.findUnique({
      where: { code: grant.positionCode },
    });

    const fn = await prisma.function.findUnique({
      where: { code: grant.functionCode },
    });

    if (!position) {
      throw new Error(`Position không tồn tại: ${grant.positionCode}`);
    }

    if (!fn) {
      throw new Error(`Function không tồn tại: ${grant.functionCode}`);
    }

    await prisma.positionFunction.upsert({
      where: {
        positionId_functionId: {
          positionId: position.id,
          functionId: fn.id,
        },
      },
      update: {
        scope: grant.scope,
        conditions: grant.conditions !== null ? grant.conditions as unknown as Prisma.InputJsonValue : undefined,
        isActive: true,
      },
      create: {
        positionId: position.id,
        functionId: fn.id,
        scope: grant.scope,
        conditions: grant.conditions !== null ? grant.conditions as unknown as Prisma.InputJsonValue : undefined,
        isActive: true,
      },
    });

    console.log(`  ✅ Grant: ${grant.positionCode} -> ${grant.functionCode} [${grant.scope}]`);
  }
}

async function main() {
  console.log('🚀 Bắt đầu seed Positions & Functions RBAC...');

  const { functions, grants } = buildAllGrants();

  await seedFunctions(functions);
  await seedPositions();
  await seedPositionGrants(grants);

  const totalFunctions = await prisma.function.count({
    where: { isActive: true },
  });

  const totalPositions = await prisma.position.count({
    where: { isActive: true },
  });

  const totalGrants = await prisma.positionFunction.count({
    where: { isActive: true },
  });

  console.log('\n==================================================');
  console.log('✅ Hoàn tất seed Positions & Functions RBAC');
  console.log(`Functions active : ${totalFunctions}`);
  console.log(`Positions active : ${totalPositions}`);
  console.log(`Grants active    : ${totalGrants}`);
  console.log('==================================================');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
