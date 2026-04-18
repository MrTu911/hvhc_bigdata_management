/**
 * seed_military_salary_grades.ts
 *
 * Seed bảng lương quân nhân (military_salary_grades) theo Nghị định 204/2004/NĐ-CP
 * và các mức cập nhật hiện hành.
 *
 * Seeds:
 *  - 23 cấp bậc quân hàm → mức lương cơ sở + phụ cấp
 *
 * Idempotent — truncate và insert lại.
 * Run: npx tsx --require dotenv/config prisma/seed/seed_military_salary_grades.ts
 */

import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// Mức lương cơ sở 2024: 2.340.000 đ
// Hệ số lương × mức cơ sở
const BASE_SALARY = 2_340_000

interface SalaryGrade {
  rankCode: string   // khớp với military_ranks.shortCode
  rank: string
  heSo: number       // hệ số lương
  rankAllowancePct: number // phụ cấp chức vụ (%)
}

// Dữ liệu theo Nghị định 204/2004 + điều chỉnh 2024
const SALARY_GRADES: SalaryGrade[] = [
  // Biên chế
  { rankCode: 'BN',   rank: 'Binh nhì',          heSo: 2.10, rankAllowancePct: 0 },
  { rankCode: 'BNH',  rank: 'Binh nhất',         heSo: 2.30, rankAllowancePct: 0 },
  { rankCode: 'HS',   rank: 'Hạ sĩ',             heSo: 2.50, rankAllowancePct: 0 },
  { rankCode: 'TS',   rank: 'Trung sĩ',           heSo: 2.70, rankAllowancePct: 0 },
  { rankCode: 'ThS',  rank: 'Thượng sĩ',          heSo: 2.90, rankAllowancePct: 0 },
  // Sĩ quan
  { rankCode: '4/',   rank: 'Thiếu úy',           heSo: 3.50, rankAllowancePct: 0.10 },
  { rankCode: '3/',   rank: 'Trung úy',           heSo: 3.80, rankAllowancePct: 0.10 },
  { rankCode: '2/',   rank: 'Thượng úy',          heSo: 4.20, rankAllowancePct: 0.15 },
  { rankCode: '1/',   rank: 'Đại úy',             heSo: 4.80, rankAllowancePct: 0.15 },
  { rankCode: '4//',  rank: 'Thiếu tá',           heSo: 5.40, rankAllowancePct: 0.20 },
  { rankCode: '3//',  rank: 'Trung tá',           heSo: 6.20, rankAllowancePct: 0.25 },
  { rankCode: '2//',  rank: 'Thượng tá',          heSo: 7.00, rankAllowancePct: 0.30 },
  { rankCode: '1//',  rank: 'Đại tá',             heSo: 7.80, rankAllowancePct: 0.35 },
  { rankCode: 'TG4',  rank: 'Thiếu tướng',        heSo: 8.60, rankAllowancePct: 0.40 },
  { rankCode: 'TG3',  rank: 'Trung tướng',        heSo: 9.40, rankAllowancePct: 0.45 },
  { rankCode: 'TG2',  rank: 'Thượng tướng',       heSo: 10.40, rankAllowancePct: 0.50 },
  { rankCode: 'TG1',  rank: 'Đại tướng',          heSo: 11.00, rankAllowancePct: 0.55 },
  // Học viên
  { rankCode: 'H1',   rank: 'Học viên năm 1',     heSo: 1.80, rankAllowancePct: 0 },
  { rankCode: 'H2',   rank: 'Học viên năm 2',     heSo: 1.90, rankAllowancePct: 0 },
  { rankCode: 'H3',   rank: 'Học viên năm 3',     heSo: 2.00, rankAllowancePct: 0 },
  { rankCode: 'H4',   rank: 'Học viên năm 4',     heSo: 2.10, rankAllowancePct: 0 },
  { rankCode: 'H5',   rank: 'Học viên năm 5',     heSo: 2.20, rankAllowancePct: 0 },
  // CNVQP
  { rankCode: 'VCQP', rank: 'Viên chức quốc phòng', heSo: 3.00, rankAllowancePct: 0.10 },
]

async function main() {
  console.log('💰 seed_military_salary_grades.ts — Seed bảng lương quân nhân')

  // Truncate để idempotent
  await db.$executeRaw`TRUNCATE TABLE military_salary_grades RESTART IDENTITY CASCADE`
  console.log('  → Đã xóa dữ liệu cũ')

  const effectiveDate = new Date('2024-01-01')

  let created = 0
  for (const g of SALARY_GRADES) {
    const baseSalary = Math.round(BASE_SALARY * g.heSo)
    const rankAllowance = g.rankAllowancePct > 0
      ? Math.round(baseSalary * g.rankAllowancePct)
      : null

    await db.militarySalaryGrade.create({
      data: {
        id: `MSG-${g.rankCode.replace(/\//g, 'S')}`,
        rankCode: g.rankCode,
        rank: g.rank,
        baseSalary,
        rankAllowance,
        positionAllowance: null,     // Tuỳ chức vụ cụ thể
        seniorityRate: 0.05,         // Phụ cấp thâm niên 5%/năm
        insuranceRate: 0.105,        // BHXH 10.5%
        healthInsRate: 0.045,        // BHYT 4.5%
        unemploymentRate: 0.01,      // BHTN 1%
        effectiveDate,
        expiryDate: null,
        isActive: true,
        notes: `Hệ số ${g.heSo} × lương cơ sở 2.340.000đ`,
      },
    })
    created++
  }

  console.log(`  ✅ Đã tạo ${created} mức lương quân hàm`)
  console.log('  Mức lương cơ sở: 2.340.000 đ (2024)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
