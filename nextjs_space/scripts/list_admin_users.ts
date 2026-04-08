import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ 
    where: { role: 'QUAN_TRI_HE_THONG' },
    select: { id: true, email: true, name: true, role: true }
  });
  console.log('Admin users:', JSON.stringify(users, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
