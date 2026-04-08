/**
 * Bridge migration: auto-create NckhScientistProfile for all users who have legacy
 * ScientificPublication or ScientificResearch records but no M09 profile yet.
 *
 * This links the legacy management page data to the M09 scientists page.
 * - Pulls academicTitle/specialization from User
 * - Pulls degree from FacultyProfile if exists
 * - Computes totalPublications from ScientificPublication count
 * - Maps research fields from ScientificResearch.type and titles
 * - H-index/i10Index default to 0 (no citation data in legacy models)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m09_scientist_bridge.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Map legacy ScientificResearch fields to NckhResearchField enum values
function inferResearchField(type: string | null, title: string): string {
  const t = (type ?? '').toLowerCase()
  const ti = title.toLowerCase()
  if (t.includes('quân sự') || ti.includes('quân sự') || ti.includes('chiến thuật') || ti.includes('tác chiến')) return 'HOC_THUAT_QUAN_SU'
  if (t.includes('hậu cần') || ti.includes('hậu cần') || ti.includes('kỹ thuật') || ti.includes('vũ khí')) return 'HAU_CAN_KY_THUAT'
  if (t.includes('cntt') || ti.includes('cntt') || ti.includes('phần mềm') || ti.includes('công nghệ thông tin') || ti.includes('ai') || ti.includes('dữ liệu')) return 'CNTT'
  if (ti.includes('y') || ti.includes('sức khoẻ') || ti.includes('dược') || ti.includes('bệnh')) return 'Y_DUOC'
  if (ti.includes('xã hội') || ti.includes('chính trị') || ti.includes('lịch sử') || ti.includes('đảng')) return 'KHOA_HOC_XA_HOI'
  if (ti.includes('toán') || ti.includes('vật lý') || ti.includes('hóa') || ti.includes('sinh')) return 'KHOA_HOC_TU_NHIEN'
  return 'HAU_CAN_KY_THUAT' // Default for military academy
}

// Map User.academicTitle to academicRank label
function mapAcademicRank(title: string | null): string | null {
  if (!title) return null
  if (title.includes('Giáo sư')) return 'Giáo sư'
  if (title.includes('Phó Giáo sư') || title.includes('PGS')) return 'Phó Giáo sư'
  return title
}

async function main() {
  console.log('=== Bridge: Create NckhScientistProfile from legacy ScientificPublication ===\n')

  // 1. Find all users with legacy publications but no M09 profile
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { scientificPublications: { some: {} } },
        { scientificResearch:     { some: {} } },
      ],
      nckhScientistProfile: null,
    },
    select: {
      id: true,
      name: true,
      academicTitle: true,
      specialization: true,
      scientificPublications: { select: { id: true, title: true, type: true } },
      scientificResearch:     { select: { id: true, title: true, type: true } },
      facultyProfile: { select: { academicDegree: true, orcidId: true, researchInterests: true } },
    },
  })

  console.log(`Found ${users.length} users to bridge.\n`)

  let created = 0
  let skipped = 0

  for (const user of users) {
    // Determine research fields from legacy data
    const fieldSet = new Set<string>()
    for (const r of user.scientificResearch) {
      fieldSet.add(inferResearchField(r.type, r.title))
    }
    for (const p of user.scientificPublications) {
      fieldSet.add(inferResearchField(p.type ?? null, p.title))
    }
    if (fieldSet.size === 0) fieldSet.add('HAU_CAN_KY_THUAT')

    const researchFields = Array.from(fieldSet)
    const primaryField = researchFields[0]

    // Extract keywords from specialization and research interests
    const keywords: string[] = []
    if (user.specialization) keywords.push(...user.specialization.split(/[,;]/g).map((s) => s.trim()).filter(Boolean).slice(0, 3))
    if (user.facultyProfile?.researchInterests) {
      keywords.push(
        ...user.facultyProfile.researchInterests.split(/[,;.]/g).map((s) => s.trim()).filter((s) => s.length > 3 && s.length < 40).slice(0, 3)
      )
    }

    try {
      await prisma.nckhScientistProfile.create({
        data: {
          userId:           user.id,
          academicRank:     mapAcademicRank(user.academicTitle),
          degree:           user.facultyProfile?.academicDegree ?? null,
          specialization:   user.specialization ?? null,
          researchFields,
          primaryField,
          researchKeywords: keywords.slice(0, 5),
          hIndex:           0,
          i10Index:         0,
          totalCitations:   0,
          totalPublications: user.scientificPublications.length,
          projectLeadCount:  user.scientificResearch.filter((r) => r.type?.includes('CHU_NHIEM') || !r.type).length,
          projectMemberCount: 0,
          orcidId:          user.facultyProfile?.orcidId ?? null,
          bio:              user.facultyProfile?.researchInterests?.slice(0, 300) ?? null,
        },
      })
      created++
      if (created % 50 === 0) process.stdout.write(`  Created ${created}...\n`)
    } catch (e: any) {
      if (e?.code === 'P2002') { skipped++; continue } // unique constraint → already exists
      throw e
    }
  }

  console.log(`\n✅ Done: ${created} NckhScientistProfile records created, ${skipped} skipped.`)

  // 2. Report total
  const total = await prisma.nckhScientistProfile.count()
  console.log(`   Total NckhScientistProfile in DB: ${total}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
