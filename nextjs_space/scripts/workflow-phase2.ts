/**
 * PHASE 2: HOAN THIEN WORKFLOW
 */

import { PrismaClient, ResearchWorkflowStatus, AwardWorkflowStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function setupResearchWorkflow() {
  console.log('\n=== P2.1: WORKFLOW RESEARCH ===');
  
  const total = await prisma.researchProject.count();
  console.log(`  Total research projects: ${total}`);
  
  if (total === 0) {
    console.log('  No research projects to update');
    return;
  }
  
  // Get distribution
  const dist = await prisma.researchProject.groupBy({ by: ['workflowStatus'], _count: true });
  dist.forEach(d => console.log(`     ${d.workflowStatus}: ${d._count}`));
}

async function setupPolicyWorkflow() {
  console.log('\n=== P2.2: WORKFLOW POLICY ===');
  
  const total = await prisma.policyRecord.count();
  console.log(`  Total policy records: ${total}`);
  
  if (total === 0) {
    console.log('  No policy records to update');
    return;
  }
  
  // Distribute to different statuses for demo
  const policies = await prisma.policyRecord.findMany({ select: { id: true, workflowStatus: true } });
  let proposed = 0, review = 0, approved = 0, rejected = 0;
  
  for (let i = 0; i < policies.length; i++) {
    const p = policies[i];
    const rand = Math.random();
    let status: AwardWorkflowStatus;
    
    if (rand < 0.60) {
      status = 'PROPOSED';
      proposed++;
    } else if (rand < 0.80) {
      status = 'UNDER_REVIEW';
      review++;
    } else if (rand < 0.95) {
      status = 'APPROVED';
      approved++;
    } else {
      status = 'REJECTED';
      rejected++;
    }
    
    await prisma.policyRecord.update({
      where: { id: p.id },
      data: { workflowStatus: status }
    });
  }
  
  console.log(`  Distribution: PROPOSED=${proposed}, UNDER_REVIEW=${review}, APPROVED=${approved}, REJECTED=${rejected}`);
}

async function seedAwardsRecords() {
  console.log('\n=== P2.4: SEED AWARDS RECORDS ===');
  
  const existing = await prisma.awardsRecord.count();
  if (existing > 0) {
    console.log(`  Already have ${existing} awards records, skipping seed`);
    return;
  }
  
  const users = await prisma.user.findMany({
    take: 50,
    select: { id: true, name: true, unitId: true }
  });
  
  const awardTypes = [
    { type: 'KHEN_THUONG', category: 'Giay khen', desc: 'Chien si thi dua cap co so', awardedBy: 'Don vi' },
    { type: 'KHEN_THUONG', category: 'Bang khen', desc: 'Bang khen Hoc vien Hau can', awardedBy: 'Hoc vien Hau can' },
    { type: 'KHEN_THUONG', category: 'Bang khen', desc: 'Bang khen Bo Quoc phong', awardedBy: 'Bo Quoc phong' },
    { type: 'KHEN_THUONG', category: 'CSTT', desc: 'Chien si thi dua toan quan', awardedBy: 'Bo Quoc phong' },
    { type: 'KHEN_THUONG', category: 'Huy chuong', desc: 'Huy chuong Chien si ve vang hang Ba', awardedBy: 'Nha nuoc' },
    { type: 'KY_LUAT', category: 'Khien trach', desc: 'Vi pham ky luat quan doi', awardedBy: 'Don vi' },
    { type: 'KY_LUAT', category: 'Canh cao', desc: 'Vi pham nghiem trong quy dinh', awardedBy: 'Hoc vien' },
  ];
  
  let created = 0;
  
  for (const user of users) {
    const numAwards = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numAwards; i++) {
      const award = awardTypes[Math.floor(Math.random() * awardTypes.length)];
      const year = 2020 + Math.floor(Math.random() * 6);
      
      await prisma.awardsRecord.create({
        data: {
          userId: user.id,
          type: award.type as any,
          category: award.category,
          description: `${award.desc} nam ${year}`,
          year: year,
          awardedBy: award.awardedBy,
          notes: `QD so ${Math.floor(Math.random() * 1000) + 100}/${year}/QD-HVHC`,
        }
      });
      created++;
    }
  }
  
  console.log(`  Created ${created} awards records`);
  
  const dist = await prisma.awardsRecord.groupBy({ by: ['type'], _count: true });
  dist.forEach(d => console.log(`     ${d.type}: ${d._count}`));
}

async function addFunctionsToChinhUy() {
  console.log('\n=== BO SUNG FUNCTIONS CHO CHINH UY ===');
  
  const chinhUy = await prisma.position.findFirst({ where: { code: 'CHINH_UY' } });
  if (!chinhUy) {
    console.log('  CHINH_UY position not found');
    return;
  }
  
  const functionCodes = [
    'VIEW_PERSONNEL',
    'VIEW_PERSONNEL_SENSITIVE',
    'APPROVE_PERSONNEL',
    'VIEW_TRAINING',
    'VIEW_RESEARCH',
    'VIEW_PARTY_MEMBER',
    'APPROVE_PARTY_MEMBER',
    'CREATE_PARTY_MEMBER',
    'UPDATE_PARTY_MEMBER',
    'APPROVE_POLICY',
    'VIEW_POLICY',
    'VIEW_AWARD',
    'APPROVE_AWARD',
    'VIEW_DASHBOARD',
  ];
  
  let added = 0;
  for (const code of functionCodes) {
    const func = await prisma.function.findFirst({ where: { code } });
    if (!func) continue;
    
    const existing = await prisma.positionFunction.findFirst({
      where: { positionId: chinhUy.id, functionId: func.id }
    });
    
    if (!existing) {
      await prisma.positionFunction.create({
        data: {
          positionId: chinhUy.id,
          functionId: func.id,
          scope: 'ACADEMY'
        }
      });
      added++;
    }
  }
  
  console.log(`  Added ${added} functions to CHINH_UY`);
}

async function main() {
  console.log('='.repeat(60));
  console.log('       PHASE 2: HOAN THIEN WORKFLOW HVHC');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  await addFunctionsToChinhUy();
  await setupResearchWorkflow();
  await setupPolicyWorkflow();
  await seedAwardsRecords();
  
  console.log('\n=== TONG KET PHASE 2 ===');
  const researchDist = await prisma.researchProject.groupBy({ by: ['workflowStatus'], _count: true });
  console.log('  Research workflow:');
  researchDist.forEach(d => console.log(`    ${d.workflowStatus || 'NULL'}: ${d._count}`));
  
  const policyDist = await prisma.policyRecord.groupBy({ by: ['workflowStatus'], _count: true });
  console.log('  Policy workflow:');
  policyDist.forEach(d => console.log(`    ${d.workflowStatus || 'NULL'}: ${d._count}`));
  
  const awardsDist = await prisma.awardsRecord.groupBy({ by: ['type'], _count: true });
  console.log('  Awards by type:');
  awardsDist.forEach(d => console.log(`    ${d.type}: ${d._count}`));
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nHoan thanh trong ${elapsed}s`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
