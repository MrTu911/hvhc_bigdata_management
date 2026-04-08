/**
 * Audit Log Cleanup Script
 * 
 * Removes audit logs older than the retention period (default: 3 years)
 * Should be run periodically (e.g., monthly cron job)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIG = {
  RETENTION_YEARS: 3,
  DRY_RUN: true, // Set to false to actually delete
  BATCH_SIZE: 1000,
};

async function main(): Promise<void> {
  console.log('=== Audit Log Cleanup ===');
  
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - CONFIG.RETENTION_YEARS);
  
  console.log(`Retention period: ${CONFIG.RETENTION_YEARS} years`);
  console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
  console.log(`Mode: ${CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  
  // Count records to delete
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM "audit_logs"
    WHERE "createdAt" < ${cutoffDate}
  `;
  
  const totalToDelete = Number(countResult[0].count);
  console.log(`\nRecords to delete: ${totalToDelete}`);
  
  if (totalToDelete === 0) {
    console.log('No old records to clean up.');
    return;
  }
  
  if (CONFIG.DRY_RUN) {
    console.log('\n[DRY RUN] Would delete these records');
    
    // Show sample of records to be deleted
    const samples = await prisma.$queryRaw<any[]>`
      SELECT id, "actorUserId", action, "resourceType", "createdAt"
      FROM "audit_logs"
      WHERE "createdAt" < ${cutoffDate}
      ORDER BY "createdAt" ASC
      LIMIT 5
    `;
    
    console.log('\nSample records:');
    samples.forEach(s => {
      console.log(`  - ${s.id}: ${s.action} on ${s.resourceType} at ${s.createdAt}`);
    });
    
    console.log('\n💡 Set DRY_RUN = false and run again to delete');
    return;
  }
  
  // Delete in batches
  let totalDeleted = 0;
  
  while (totalDeleted < totalToDelete) {
    const result = await prisma.$executeRaw`
      DELETE FROM "audit_logs"
      WHERE id IN (
        SELECT id FROM "audit_logs"
        WHERE "createdAt" < ${cutoffDate}
        LIMIT ${CONFIG.BATCH_SIZE}
      )
    `;
    
    const deleted = Number(result);
    totalDeleted += deleted;
    
    console.log(`Deleted: ${totalDeleted}/${totalToDelete}`);
    
    if (deleted === 0) break;
  }
  
  console.log(`\n✅ Cleanup complete. Deleted ${totalDeleted} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
