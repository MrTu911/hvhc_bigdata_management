/**
 * Seed: Add PARTY and INSURANCE permissions to key positions
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Function codes to add
const PARTY_FUNCTIONS = [
  'VIEW_PARTY',
  'CREATE_PARTY',
  'UPDATE_PARTY',
  'DELETE_PARTY',
  'APPROVE_PARTY',
  'MANAGE_PARTY_MEETING',
];

const INSURANCE_FUNCTIONS = [
  'VIEW_INSURANCE',
  'CREATE_INSURANCE',
  'UPDATE_INSURANCE',
  'DELETE_INSURANCE',
  'APPROVE_INSURANCE',
  'MANAGE_INSURANCE',
];

// Positions that should have these permissions
const TARGET_POSITIONS = [
  'SYSTEM_ADMIN',
  'CHI_HUY_HOC_VIEN',
  'CHI_HUY_KHOA',
  'CHI_HUY_PHONG',
  'CHI_HUY_BO_MON',
  'CHI_HUY_HE',
  'CHI_HUY_TIEU_DOAN',
  'GIANG_VIEN',
  'TRO_LY',
  'NHAN_VIEN',
];

async function main() {
  console.log('\n🛠️  Seeding PARTY and INSURANCE permissions...\n');

  // Get all target positions
  const positions = await prisma.position.findMany({
    where: { code: { in: TARGET_POSITIONS } },
  });
  console.log(`Found ${positions.length} target positions`);

  // Get all relevant functions
  const allFunctionCodes = [...PARTY_FUNCTIONS, ...INSURANCE_FUNCTIONS];
  let functions = await prisma.function.findMany({
    where: { code: { in: allFunctionCodes } },
  });
  console.log(`Found ${functions.length} existing functions`);

  // Missing functions - create them if needed
  const existingCodes = functions.map(f => f.code);
  const missingCodes = allFunctionCodes.filter(c => !existingCodes.includes(c));
  
  if (missingCodes.length > 0) {
    console.log(`Creating ${missingCodes.length} missing functions:`, missingCodes);
    
    for (const code of missingCodes) {
      const isParty = code.includes('PARTY');
      const moduleName = isParty ? 'PARTY' : 'INSURANCE';
      let actionType: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' = 'VIEW';
      if (code.includes('CREATE')) actionType = 'CREATE';
      else if (code.includes('UPDATE')) actionType = 'UPDATE';
      else if (code.includes('DELETE')) actionType = 'DELETE';
      else if (code.includes('MANAGE') || code.includes('APPROVE')) actionType = 'APPROVE';
      
      await prisma.function.create({
        data: {
          code,
          name: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: `Permission: ${code}`,
          module: moduleName,
          actionType,
          isActive: true,
        },
      });
      console.log(`  Created function: ${code}`);
    }
    
    // Refetch functions
    functions = await prisma.function.findMany({
      where: { code: { in: allFunctionCodes } },
    });
  }

  console.log(`Total functions to assign: ${functions.length}`);

  // Assign functions to positions
  let created = 0;
  let skipped = 0;

  for (const position of positions) {
    for (const func of functions) {
      try {
        await prisma.positionFunction.create({
          data: {
            positionId: position.id,
            functionId: func.id,
            scope: 'ACADEMY',
            isActive: true,
          },
        });
        created++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          skipped++;
        } else {
          console.error(`Error assigning ${func.code} to ${position.code}:`, e.message);
        }
      }
    }
  }

  console.log(`\n✅ Completed!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped (existing): ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
