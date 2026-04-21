import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
const GIANGVIEN_ID = 'cmn3upe18071q8iunwkhu11lw'

async function main() {
  // Check positions of giangvien
  const positions = await db.userPosition.findMany({
    where: { userId: GIANGVIEN_ID, isActive: true },
    include: {
      position: {
        include: {
          functions: {
            where: { isActive: true },
            include: { function: true }
          }
        }
      }
    }
  })

  const fnCodes = positions.flatMap(p => p.position.functions.map(f => f.function.code))
  console.log('Positions:', positions.map(p => p.position.code))
  console.log('Has VIEW_MY_RESEARCH:', fnCodes.includes('VIEW_MY_RESEARCH') ? '✓ YES' : '✗ NO')
  console.log('Science-related codes:', fnCodes.filter(c => c.includes('RESEARCH') || c.includes('SCIENCE')))

  // Check Function model has VIEW_MY_RESEARCH
  const fn = await db.function.findUnique({ where: { code: 'VIEW_MY_RESEARCH' } })
  console.log('Function row VIEW_MY_RESEARCH:', fn ? `id=${fn.id}` : 'NOT FOUND in Function table')

  await db.$disconnect()
}
main().catch(console.error)
