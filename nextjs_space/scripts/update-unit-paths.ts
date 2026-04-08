/**
 * Seed script: Cập nhật Unit.path cho cây đơn vị
 * Path format: "/ROOT/KHOA_CNTT/BM_HTTT"
 * Chạy: yarn tsx scripts/update-unit-paths.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function buildPath(unitId: string, visited: Set<string> = new Set()): Promise<string> {
  // Prevent infinite loop
  if (visited.has(unitId)) {
    return '';
  }
  visited.add(unitId);

  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: { code: true, parentId: true },
  });

  if (!unit) {
    return '';
  }

  if (!unit.parentId) {
    // Root unit
    return `/${unit.code}`;
  }

  // Recursive: get parent path
  const parentPath = await buildPath(unit.parentId, visited);
  return `${parentPath}/${unit.code}`;
}

async function main() {
  console.log('🌳 Updating Unit paths...');

  // Lấy tất cả units
  const units = await prisma.unit.findMany({
    orderBy: { level: 'asc' },
  });

  console.log(`Found ${units.length} units`);

  let updated = 0;
  let errors = 0;

  for (const unit of units) {
    try {
      const path = await buildPath(unit.id);
      
      if (path !== unit.path) {
        await prisma.unit.update({
          where: { id: unit.id },
          data: { path },
        });
        console.log(`  ✅ ${unit.code}: ${path}`);
        updated++;
      } else {
        console.log(`  ⏭️  ${unit.code}: path unchanged`);
      }
    } catch (error) {
      console.error(`  ❌ ${unit.code}: Error -`, error);
      errors++;
    }
  }

  console.log(`\n🏁 Done! Updated: ${updated}, Errors: ${errors}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
