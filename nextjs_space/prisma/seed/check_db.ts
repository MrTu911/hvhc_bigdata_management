import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const userId = 'cmn3upe18071q8iunwkhu11lw'

  const unit = await db.unit.findFirst({ select: { id: true, name: true } })
  console.log('Unit:', JSON.stringify(unit))

  const funds = await db.scienceCatalog.findMany({
    where: { type: 'FUND_SOURCE' }, select: { id: true, name: true }, take: 3
  })
  console.log('Funds:', JSON.stringify(funds))

  const scientistProfile = await db.nckhScientistProfile.findFirst({
    where: { userId }, select: { id: true }
  })
  console.log('ScientistProfile:', JSON.stringify(scientistProfile))

  const projects = await db.nckhProject.findMany({
    where: { principalInvestigatorId: userId },
    select: { id: true, title: true, status: true }, take: 5
  })
  console.log('Projects by giangvien:', JSON.stringify(projects))
}

main().catch(console.error).finally(() => db.$disconnect())
