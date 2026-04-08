/**
 * Bridge migration: auto-create NckhProject for all ScientificResearch records
 * that have role = CHU_NHIEM (principal investigator) but no M09 project yet.
 *
 * Strategy:
 * - One NckhProject per CHU_NHIEM ScientificResearch record (PI-owned projects)
 * - THAM_GIA / THANH_VIEN records of the same title → added as NckhMember
 * - status = COMPLETED, phase = ARCHIVED (historical data)
 * - projectCode = LEGACY-{year}-{shortId}
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m09_project_bridge.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Field mapping ────────────────────────────────────────────────────────────

function inferField(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('quân sự') || t.includes('chiến thuật') || t.includes('tác chiến')) return 'HOC_THUAT_QUAN_SU'
  if (t.includes('hậu cần') || t.includes('kỹ thuật') || t.includes('vũ khí') || t.includes('trang bị')) return 'HAU_CAN_KY_THUAT'
  if (t.includes('cntt') || t.includes('phần mềm') || t.includes('công nghệ thông tin') || t.includes('ai') || t.includes('dữ liệu')) return 'CNTT'
  if (t.includes('y') || t.includes('sức khỏe') || t.includes('dược') || t.includes('bệnh')) return 'Y_DUOC'
  if (t.includes('xã hội') || t.includes('chính trị') || t.includes('lịch sử') || t.includes('đảng')) return 'KHOA_HOC_XA_HOI'
  if (t.includes('toán') || t.includes('vật lý') || t.includes('hóa') || t.includes('sinh')) return 'KHOA_HOC_TU_NHIEN'
  return 'HAU_CAN_KY_THUAT' // Default for military academy
}

function inferCategory(level: string): string {
  const l = level.toLowerCase()
  if (l.includes('nhà nước') || l.includes('quốc gia')) return 'CAP_NHA_NUOC'
  if (l.includes('bộ') || l.includes('quốc phòng')) return 'CAP_BO_QUOC_PHONG'
  if (l.includes('tổng cục')) return 'CAP_TONG_CUC'
  if (l.includes('học viện') || l.includes('trường') || l.includes('cơ sở')) return 'CAP_HOC_VIEN'
  if (l.includes('sáng kiến')) return 'SANG_KIEN_CO_SO'
  return 'CAP_HOC_VIEN' // Default
}

function inferResearchType(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('sáng kiến') || t.includes('kinh nghiệm')) return 'SANG_KIEN_KINH_NGHIEM'
  if (t.includes('ứng dụng') || t.includes('triển khai')) return 'UNG_DUNG'
  if (t.includes('cơ bản')) return 'CO_BAN'
  return 'UNG_DUNG' // Default for military applied research
}

// Short ID from cuid (first 8 chars after c)
function shortId(id: string): string {
  return id.replace(/^c/, '').slice(0, 8).toUpperCase()
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Bridge: Create NckhProject from legacy ScientificResearch ===\n')

  // 1. Load all CHU_NHIEM records with no matching M09 project
  const legacyRecords = await prisma.scientificResearch.findMany({
    where: { role: 'CHU_NHIEM' },
    select: {
      id: true,
      userId: true,
      title: true,
      year: true,
      level: true,
      type: true,
      institution: true,
      result: true,
      notes: true,
      user: { select: { id: true, name: true, unitId: true } },
    },
  })

  console.log(`Found ${legacyRecords.length} CHU_NHIEM ScientificResearch records.\n`)

  // 2. Load all existing NckhProject titles to avoid duplicates
  const existingTitles = new Set(
    (await prisma.nckhProject.findMany({ select: { title: true } })).map((p) => p.title.trim())
  )
  console.log(`Existing NckhProject titles in DB: ${existingTitles.size}\n`)

  let created = 0
  let skipped = 0
  let memberLinked = 0

  // 3. Create NckhProject for each CHU_NHIEM record
  const titleToProjectId = new Map<string, string>()

  for (const rec of legacyRecords) {
    const titleKey = rec.title.trim()

    if (existingTitles.has(titleKey)) {
      skipped++
      // Remember ID for member linking below
      const existing = await prisma.nckhProject.findFirst({ where: { title: rec.title }, select: { id: true } })
      if (existing) titleToProjectId.set(titleKey, existing.id)
      continue
    }

    const projectCode = `LEGACY-${rec.year}-${shortId(rec.id)}`
    const category = inferCategory(rec.level)
    const field = inferField(rec.type)
    const researchType = inferResearchType(rec.type)

    try {
      const project = await prisma.nckhProject.create({
        data: {
          projectCode,
          title:                  rec.title,
          category:               category as any,
          field:                  field as any,
          researchType:           researchType as any,
          status:                 'COMPLETED',
          phase:                  'ARCHIVED',
          budgetYear:             rec.year,
          principalInvestigatorId: rec.userId,
          unitId:                 rec.user.unitId ?? undefined,
          abstract:               rec.notes ?? undefined,
        },
      })

      // Link PI as CHU_NHIEM member too
      await prisma.nckhMember.create({
        data: {
          projectId: project.id,
          userId:    rec.userId,
          role:      'CHU_NHIEM',
          joinDate:  new Date(rec.year, 0, 1),
        },
      })

      existingTitles.add(titleKey)
      titleToProjectId.set(titleKey, project.id)
      created++

      if (created % 50 === 0) process.stdout.write(`  Created ${created}...\n`)
    } catch (e: any) {
      if (e?.code === 'P2002') { skipped++; continue }
      console.error(`  Error for "${rec.title}":`, e?.message ?? e)
    }
  }

  console.log(`\nProjects: ${created} created, ${skipped} skipped.\n`)

  // 4. Link THAM_GIA / THANH_VIEN records as NckhMember where project exists
  const memberRecords = await prisma.scientificResearch.findMany({
    where: { role: { in: ['THAM_GIA', 'THANH_VIEN'] } },
    select: { id: true, userId: true, title: true, year: true, role: true },
  })

  console.log(`Found ${memberRecords.length} THAM_GIA/THANH_VIEN records to link...\n`)

  for (const rec of memberRecords) {
    const projectId = titleToProjectId.get(rec.title.trim())
    if (!projectId) continue // No M09 project for this title → skip

    // Avoid duplicate member entries
    const existing = await prisma.nckhMember.findFirst({
      where: { projectId, userId: rec.userId },
    })
    if (existing) continue

    try {
      await prisma.nckhMember.create({
        data: {
          projectId,
          userId:   rec.userId,
          role:     'THANH_VIEN_CHINH',
          joinDate: new Date(rec.year, 0, 1),
        },
      })
      memberLinked++
    } catch {
      // Skip on unique constraint
    }
  }

  console.log(`Members linked: ${memberLinked}`)

  // 5. Summary
  const totalProjects = await prisma.nckhProject.count()
  const totalMembers  = await prisma.nckhMember.count()
  console.log(`\n✅ Done.`)
  console.log(`   Total NckhProject in DB: ${totalProjects}`)
  console.log(`   Total NckhMember  in DB: ${totalMembers}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
