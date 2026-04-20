/**
 * Seed: Test data cho trang /dashboard/science/councils/new
 *
 * Tạo:
 *   - NckhScientistProfile (6 profiles) cho User hiện có
 *   - NckhProject (3 đề tài) ở trạng thái UNDER_REVIEW / APPROVED / IN_PROGRESS
 *
 * Idempotent: dùng upsert/createIfNotExists, không xóa dữ liệu cũ.
 *
 * Prerequisites:
 *   - Cần ít nhất 7 User trong DB (1 PI + 6 council member candidates)
 *   - Nếu chưa có User, chạy: npm run seed:users
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_councils_test.ts
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('🔬 Seed councils test data...')

  // ── 1. Lấy users để làm PI và council members ─────────────────────────────
  const allUsers = await db.user.findMany({
    select: { id: true, name: true, unitId: true },
    take: 20,
    orderBy: { createdAt: 'asc' },
  })

  if (allUsers.length < 7) {
    throw new Error(
      `Cần ít nhất 7 User trong DB (hiện có ${allUsers.length}). Chạy npm run seed:users trước.`
    )
  }

  const [piUser, ...memberUsers] = allUsers
  const memberCandidates = memberUsers.slice(0, 6)

  // ── 2. Upsert NckhScientistProfile cho 6 candidate members ───────────────
  console.log(`  → Upsert ${memberCandidates.length} NckhScientistProfile...`)
  const scientistDegrees = ['TS', 'ThS', 'TS', 'GS.TS', 'ThS', 'TS']
  const scientistRanks   = ['Giảng viên chính', 'Giảng viên', 'Nghiên cứu viên', 'Giáo sư', 'Giảng viên', 'Phó Giáo sư']
  const scientistFields  = ['CNTT', 'QUOC_PHONG', 'HAU_CAN_KY_THUAT', 'KHOA_HOC_TU_NHIEN', 'CNTT', 'KHOA_HOC_XA_HOI']

  for (let i = 0; i < memberCandidates.length; i++) {
    const u = memberCandidates[i]
    await db.nckhScientistProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId:            u.id,
        degree:            scientistDegrees[i],
        academicRank:      scientistRanks[i],
        primaryField:      scientistFields[i],
        secondaryFields:   [],
        researchKeywords:  ['nghiên cứu', 'khoa học'],
        researchFields:    [scientistFields[i]],
        hIndex:            i + 1,
        totalPublications: (i + 1) * 2,
      },
    })
  }
  console.log('  ✓ NckhScientistProfile done')

  // ── 3. Upsert 3 NckhProject test ─────────────────────────────────────────
  console.log('  → Upsert 3 NckhProject test...')

  const projects = [
    {
      projectCode:  'TEST-2026-001',
      title:        '[TEST] Nghiên cứu ứng dụng AI trong quản lý học viện',
      category:     'CAP_HOC_VIEN' as const,
      field:        'CNTT' as const,
      researchType: 'UNG_DUNG' as const,
      status:       'UNDER_REVIEW' as const,
      phase:        'PROPOSAL' as const,
    },
    {
      projectCode:  'TEST-2026-002',
      title:        '[TEST] Phát triển hệ thống mô phỏng chiến thuật số hóa',
      category:     'CAP_HOC_VIEN' as const,
      field:        'HOC_THUAT_QUAN_SU' as const,
      researchType: 'CO_BAN' as const,
      status:       'APPROVED' as const,
      phase:        'CONTRACT' as const,
    },
    {
      projectCode:  'TEST-2026-003',
      title:        '[TEST] Tối ưu hóa hậu cần kỹ thuật trong huấn luyện',
      category:     'CAP_TONG_CUC' as const,
      field:        'HAU_CAN_KY_THUAT' as const,
      researchType: 'TRIEN_KHAI' as const,
      status:       'IN_PROGRESS' as const,
      phase:        'EXECUTION' as const,
    },
  ]

  for (const p of projects) {
    const existing = await db.nckhProject.findUnique({ where: { projectCode: p.projectCode } })
    if (!existing) {
      await db.nckhProject.create({
        data: {
          ...p,
          principalInvestigatorId: piUser.id,
          unitId:          piUser.unitId ?? undefined,
          budgetRequested: 500_000_000,
          budgetYear:      2026,
          sensitivity:     'NORMAL',
          keywords:        ['test', 'demo'],
          abstract:        `Đề tài thử nghiệm — ${p.title}`,
        },
      })
      console.log(`  ✓ Created ${p.projectCode}`)
    } else {
      console.log(`  ↳ ${p.projectCode} đã tồn tại, bỏ qua`)
    }
  }

  // ── 4. Summary ────────────────────────────────────────────────────────────
  const projectCount  = await db.nckhProject.count()
  const scientistCount = await db.nckhScientistProfile.count()
  console.log(`\n✅ Seed hoàn thành:`)
  console.log(`   NckhProject:        ${projectCount} (trong đó 3 TEST-2026-*)`)
  console.log(`   NckhScientistProfile: ${scientistCount}`)
  console.log(`\n📋 Bước tiếp theo:`)
  console.log(`   1. Đảm bảo user đăng nhập có quyền SCIENCE.COUNCIL_MANAGE`)
  console.log(`      → npx tsx --require dotenv/config prisma/seed/seed_science_rbac.ts`)
  console.log(`   2. Mở: http://localhost:3000/dashboard/science/councils/new`)
}

main()
  .catch((e) => { console.error('❌ Seed thất bại:', e); process.exit(1) })
  .finally(() => db.$disconnect())
