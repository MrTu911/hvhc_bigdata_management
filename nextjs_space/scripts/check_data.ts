import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check scientific publications by type
  const pubCounts = await prisma.scientificPublication.groupBy({
    by: ['type'],
    _count: { id: true }
  });
  console.log('=== Scientific Publications by Type ===');
  console.log(pubCounts);
  
  const totalPubs = await prisma.scientificPublication.count();
  console.log('Total publications:', totalPubs);

  // Check insurance data
  const insuranceInfoCount = await prisma.insuranceInfo.count();
  const insuranceHistoryCount = await prisma.insuranceHistory.count();
  const insuranceDependentCount = await prisma.insuranceDependent.count();
  const insuranceClaimCount = await prisma.insuranceClaim.count();
  
  console.log('\n=== Insurance Data ===');
  console.log('InsuranceInfo:', insuranceInfoCount);
  console.log('InsuranceHistory:', insuranceHistoryCount);
  console.log('InsuranceDependent:', insuranceDependentCount);
  console.log('InsuranceClaim:', insuranceClaimCount);
  
  // Check some users for seeding
  const users = await prisma.user.findMany({ 
    take: 10, 
    select: { id: true, name: true, email: true }
  });
  console.log('\n=== Sample Users (10) ===');
  console.log(users);
  
  const totalUsers = await prisma.user.count();
  console.log('Total users:', totalUsers);
}

main().finally(() => prisma.$disconnect());
