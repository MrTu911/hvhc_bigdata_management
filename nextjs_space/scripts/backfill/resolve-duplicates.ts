/**
 * Duplicate Resolution Script
 * 
 * Run BEFORE adding UNIQUE constraints to identify and resolve duplicates
 * 
 * Usage:
 * 1. Set the FIELD and MODEL to check
 * 2. Run in DRY_RUN mode first to see duplicates
 * 3. Set DRY_RUN = false to apply fixes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  MODEL: 'User',
  FIELD: 'militaryIdNumber', // Field to check for duplicates
  TABLE: 'users', // Raw table name
  DRY_RUN: true, // Set to false to apply fixes
};

interface Duplicate {
  value: string;
  count: number;
  ids: string[];
}

async function findDuplicates(): Promise<Duplicate[]> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT "${CONFIG.FIELD}", COUNT(*) as count, array_agg(id) as ids
    FROM "${CONFIG.TABLE}"
    WHERE "${CONFIG.FIELD}" IS NOT NULL
      AND "${CONFIG.FIELD}" != ''
    GROUP BY "${CONFIG.FIELD}"
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  `);
  
  return result.map(r => ({
    value: r[CONFIG.FIELD],
    count: Number(r.count),
    ids: r.ids,
  }));
}

async function resolveStrategy(duplicate: Duplicate): Promise<void> {
  const { value, ids } = duplicate;
  
  // Sort IDs to keep the newest (assuming cuid or similar)
  const sortedIds = [...ids].sort().reverse();
  const [keepId, ...duplicateIds] = sortedIds;
  
  console.log(`\n  Value: ${value}`);
  console.log(`  Keeping: ${keepId}`);
  console.log(`  Marking duplicates: ${duplicateIds.join(', ')}`);
  
  if (CONFIG.DRY_RUN) {
    console.log('  [DRY RUN] No changes made');
    return;
  }
  
  // Strategy: Append _DUP_{id} to duplicate values
  for (const id of duplicateIds) {
    const newValue = `${value}_DUP_${id.slice(-6)}`;
    
    await prisma.$executeRawUnsafe(`
      UPDATE "${CONFIG.TABLE}"
      SET "${CONFIG.FIELD}" = $1
      WHERE id = $2
    `, newValue, id);
    
    console.log(`  Updated ${id} -> ${newValue}`);
  }
}

async function main(): Promise<void> {
  console.log('=== Duplicate Resolution Script ===');
  console.log(`Model: ${CONFIG.MODEL}`);
  console.log(`Field: ${CONFIG.FIELD}`);
  console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  const duplicates = await findDuplicates();
  
  if (duplicates.length === 0) {
    console.log('\n✅ No duplicates found! Safe to add UNIQUE constraint.');
    return;
  }
  
  console.log(`\n⚠️ Found ${duplicates.length} duplicate values:`);
  
  for (const dup of duplicates) {
    await resolveStrategy(dup);
  }
  
  if (CONFIG.DRY_RUN) {
    console.log('\n💡 Set DRY_RUN = false and run again to apply fixes');
  } else {
    console.log('\n✅ Duplicates resolved! Now safe to add UNIQUE constraint.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());