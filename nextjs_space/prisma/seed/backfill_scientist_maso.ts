/**
 * Backfill: nckh_scientist_profiles.maso
 *
 * Điền maso từ User.militaryId ?? User.employeeId cho tất cả
 * NckhScientistProfile chưa có maso.
 *
 * Chạy 1 lần sau migration 20260411000001_add_scientist_maso_council_fk:
 *   npx tsx --require dotenv/config prisma/seed/backfill_scientist_maso.ts
 *
 * An toàn: chỉ UPDATE những row có maso IS NULL, không đụng đến row đã có giá trị.
 */

import 'server-only'
import prisma from '@/lib/db'

async function main() {
  console.log('[backfill_scientist_maso] Starting...')

  // Lấy tất cả profile chưa có maso
  const profiles = await prisma.nckhScientistProfile.findMany({
    where: { maso: null },
    select: {
      id: true,
      userId: true,
      user: { select: { militaryId: true, employeeId: true } },
    },
  })

  console.log(`[backfill_scientist_maso] ${profiles.length} profiles need backfill`)

  let updated = 0
  let skipped = 0

  for (const profile of profiles) {
    const maso = profile.user.militaryId ?? profile.user.employeeId ?? null

    if (!maso) {
      skipped++
      continue
    }

    await prisma.nckhScientistProfile.update({
      where: { id: profile.id },
      data: { maso },
    })
    updated++
  }

  console.log(`[backfill_scientist_maso] Done — updated: ${updated}, skipped (no ID): ${skipped}`)
}

main()
  .catch((e) => { console.error('[backfill_scientist_maso] Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
