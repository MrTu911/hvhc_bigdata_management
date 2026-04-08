import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const fn = await prisma.function.findFirst({ where: { code: 'VIEW_PARTY' } });
  if (!fn) { console.log('VIEW_PARTY function not found'); return; }
  console.log('VIEW_PARTY fn:', fn.id);

  const pfCount = await prisma.positionFunction.count({ where: { functionId: fn.id } });
  console.log('Positions with VIEW_PARTY:', pfCount);

  const ups = await prisma.userPosition.findMany({
    take: 10,
    where: { isPrimary: true, position: { functions: { some: { functionId: fn.id } } } },
    include: {
      user: { select: { name: true, email: true } },
      position: { include: { functions: { where: { functionId: fn.id } } } },
    },
  });
  console.log('Users with VIEW_PARTY (primary):', JSON.stringify(ups.map((u) => ({
    name: u.user.name,
    email: u.user.email,
    scope: u.position.functions[0]?.scope,
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
