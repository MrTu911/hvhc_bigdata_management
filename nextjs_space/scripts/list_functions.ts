import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const funcs = await prisma.function.findMany({ 
    select: { code: true, name: true, module: true, actionType: true },
    orderBy: { module: 'asc' }
  });
  console.log(JSON.stringify(funcs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
