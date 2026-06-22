/**
 * Seed: Học viên quân sự (KHÔNG phải sĩ quan) — gán vào đại đội thuộc tiểu đoàn
 * ---------------------------------------------------------------------------
 * SEED ONLY — chỉ dùng cho dev/demo data, KHÔNG dùng cho production import.
 *
 * Bản chất nghiệp vụ:
 *   - "Học viên quân sự không phải sĩ quan" = học viên đào tạo đang mang cấp bậc
 *     hạ sĩ quan / chiến sĩ (Binh nhì → Thượng sĩ), CHƯA phong sĩ quan.
 *     → đặc trưng bằng:  User.role = HOC_VIEN,
 *                        User.personnelType = HOC_VIEN_QUAN_SU,
 *                        User.rank ∈ {Binh nhì, Binh nhất, Hạ sĩ, Trung sĩ, Thượng sĩ}
 *                        (KHÔNG dùng cấp bậc sĩ quan Thiếu úy trở lên).
 *   - Học viên (model HocVien) là source of truth của miền đào tạo (M10),
 *     liên kết 1-1 với tài khoản User qua HocVien.userId.
 *
 * Auto-gán đơn vị:
 *   - Chỉ lấy các ĐẠI ĐỘI (Unit.type = 'DAI_DOI') có cha là TIỂU ĐOÀN
 *     (parent.type = 'TIEU_DOAN') — query động, KHÔNG hard-code unit id.
 *   - Mỗi học viên:  User.unitId          = đại đội,
 *                    HocVien.battalionUnitId = tiểu đoàn (cha của đại đội),
 *                    HocVien.daiDoi          = tên đại đội (trường cấu trúc quân sự).
 *   - Phân bổ học viên đều (round-robin) qua các đại đội, ổn định khi chạy lại.
 *
 * RBAC:
 *   - Tạo UserPosition (HOC_VIEN_QUAN_SU, scope SELF) để tài khoản lấy được quyền
 *     từ ma trận RBAC (giống các tài khoản học viên hiện có).
 *
 * Idempotent:
 *   - Mã sinh theo sequence cố định (HVQS / QS / email theo mã) → chạy lại bỏ qua
 *     bản ghi đã tồn tại, không tạo trùng.
 *
 * Cấu hình:
 *   - CADETS_PER_COMPANY (env, mặc định 10): số học viên mỗi đại đội.
 *
 * Mật khẩu mặc định: Hv@2025
 *
 * Chạy độc lập:
 *   npx tsx --require dotenv/config prisma/seed/seed_military_cadets.ts
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

const PASSWORD_DEFAULT = 'Hv@2025'
const POSITION_CODE_CADET = 'HOC_VIEN_QUAN_SU'
const DEFAULT_CADETS_PER_COMPANY = 10

// ─── Master data (deterministic theo sequence để idempotent) ────────────────────

const HO_LIST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']

// Học viên các đại đội chủ yếu là nam → dùng tên nam
const TEN_NAM_LIST = [
  'Văn Minh', 'Văn Hùng', 'Văn Dũng', 'Văn Nam', 'Văn Tùng', 'Văn Phúc',
  'Văn Trọng', 'Văn Sơn', 'Văn Đức', 'Văn Khánh', 'Văn Bảo', 'Văn Tuấn',
  'Văn Khoa', 'Văn Long', 'Văn Quân', 'Quang Huy', 'Hữu Thắng', 'Đình Phong',
  'Bá Cường', 'Mạnh Hà', 'Tiến Đạt', 'Công Vinh', 'Thành Trung', 'Xuân Trường',
]

// Ngành đào tạo quân sự (hệ chỉ huy hậu cần)
const NGANH_QUAN_SU = [
  'Chỉ huy hậu cần',
  'Hậu cần chiến đấu',
  'Quân nhu',
  'Vận tải Quân sự',
  'Xăng dầu',
  'Tài chính Quân sự',
]

// Cấp bậc hạ sĩ quan / chiến sĩ theo năm đào tạo (KHÔNG phải sĩ quan).
// index 0 = năm 1 ... index 4 = năm 5.
const CADET_RANK_BY_YEAR = ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ']

// ─── Helpers ────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function vietnameseToSlug(str: string): string {
  str = str.trim().toLowerCase()
  const from = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
  const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from[i], 'g'), to[i])
  }
  return str
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.')
    .replace(/\.+/g, '.')
}

interface CompanyTarget {
  companyId: string
  companyName: string
  companyCode: string
  battalionId: string
  battalionName: string
}

/**
 * Lấy danh sách đại đội (DAI_DOI) có cha là tiểu đoàn (TIEU_DOAN), đang active.
 * Sắp xếp ổn định theo code để phân bổ học viên lặp lại được khi chạy lại.
 */
async function listCompaniesUnderBattalions(): Promise<CompanyTarget[]> {
  const battalions = await prisma.unit.findMany({
    where: { type: 'TIEU_DOAN', active: true },
    select: { id: true, name: true },
  })
  if (battalions.length === 0) return []

  const battalionById = new Map(battalions.map((b) => [b.id, b.name]))

  const companies = await prisma.unit.findMany({
    where: {
      type: 'DAI_DOI',
      active: true,
      parentId: { in: battalions.map((b) => b.id) },
    },
    select: { id: true, name: true, code: true, parentId: true },
    orderBy: { code: 'asc' },
  })

  return companies.map((c) => ({
    companyId: c.id,
    companyName: c.name,
    companyCode: c.code,
    battalionId: c.parentId as string,
    battalionName: battalionById.get(c.parentId as string) ?? 'Tiểu đoàn',
  }))
}

/**
 * Tạo 1 học viên quân sự (không sĩ quan): User + UserPosition + HocVien trong 1 transaction.
 * Trả về 'created' | 'skipped'.
 */
async function createCadet(params: {
  seq: number
  company: CompanyTarget
  positionId: string
  passwordHash: string
}): Promise<'created' | 'skipped'> {
  const { seq, company, positionId, passwordHash } = params

  const seqPad = String(seq).padStart(5, '0')
  const maHocVien = `HVQS${seqPad}`
  const militaryId = `QS${seqPad}`
  const employeeId = `HVQS${seqPad}`
  const email = `hvqs${seqPad}@student.hvhc.edu.vn`

  // Idempotent: bỏ qua nếu học viên (hoặc tài khoản) đã tồn tại
  const [existingHV, existingUser] = await Promise.all([
    prisma.hocVien.findUnique({ where: { maHocVien }, select: { id: true } }),
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
  ])
  if (existingHV || existingUser) return 'skipped'

  const ho = pick(HO_LIST, seq)
  const ten = pick(TEN_NAM_LIST, seq * 3 + 1)
  const hoTen = `${ho} ${ten}`
  const nganh = pick(NGANH_QUAN_SU, seq * 2)

  // Năm đào tạo 1..5 → khóa + cấp bậc tương ứng
  const yearIndex = seq % CADET_RANK_BY_YEAR.length // 0..4
  const rank = CADET_RANK_BY_YEAR[yearIndex]
  const khoaYear = 2025 - yearIndex // năm 1 = khóa 2025, ... năm 5 = khóa 2021
  const lop = `${company.companyCode}-K${khoaYear}`
  const trungDoi = `Trung đội ${1 + (seq % 3)}`

  const namSinh = 2000 + (seq % 6)
  const ngaySinh = new Date(namSinh, (seq * 3) % 12, 1 + (seq % 28))
  const ngayNhapHoc = new Date(`${khoaYear}-09-05`)

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: hoTen,
        email,
        password: passwordHash,
        role: 'HOC_VIEN',
        personnelType: 'HOC_VIEN_QUAN_SU',
        // Cấp bậc hạ sĩ quan/chiến sĩ → đánh dấu "không phải sĩ quan"
        rank,
        position: 'Học viên',
        militaryId,
        employeeId,
        unitId: company.companyId,
        // Trường legacy hiển thị (giữ cho tương thích các trang đọc User.unit/department)
        unit: company.companyName,
        department: company.battalionName,
        gender: 'Nam',
        dateOfBirth: ngaySinh,
        phone: `09${String(30000000 + seq).padStart(8, '0')}`,
        address: `Đại đội ${company.companyName}, Học viện Hậu cần`,
        status: 'ACTIVE',
        workStatus: 'ACTIVE',
        startDate: ngayNhapHoc,
        joinDate: ngayNhapHoc,
        mustChangePassword: true,
      },
    })

    await tx.userPosition.create({
      data: {
        userId: user.id,
        positionId,
        unitId: company.companyId,
        isPrimary: true,
        isActive: true,
        startDate: ngayNhapHoc,
      },
    })

    await tx.hocVien.create({
      data: {
        maHocVien,
        hoTen,
        ngaySinh,
        gioiTinh: 'Nam',
        lop,
        khoaHoc: `Khóa ${khoaYear}`,
        nganh,
        email,
        dienThoai: user.phone,
        diaChi: `Đại đội ${company.companyName}, Học viện Hậu cần`,
        trangThai: 'Đang học',
        currentStatus: 'ACTIVE',
        ngayNhapHoc,
        userId: user.id,
        // Cơ cấu đơn vị quân sự
        battalionUnitId: company.battalionId,
        daiDoi: company.companyName,
        trungDoi,
        khoaQuanLy: company.battalionName,
      },
    })
  })

  return 'created'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎖️  Seeding học viên quân sự (không sĩ quan) → đại đội thuộc tiểu đoàn...\n')

  const cadetsPerCompany = Number(process.env.CADETS_PER_COMPANY ?? DEFAULT_CADETS_PER_COMPANY)
  if (!Number.isInteger(cadetsPerCompany) || cadetsPerCompany <= 0) {
    throw new Error(`CADETS_PER_COMPANY không hợp lệ: ${process.env.CADETS_PER_COMPANY}`)
  }

  // Vị trí RBAC bắt buộc có để tài khoản lấy được quyền
  const position = await prisma.position.findFirst({
    where: { code: POSITION_CODE_CADET },
    select: { id: true, name: true },
  })
  if (!position) {
    throw new Error(`❌ Không tìm thấy Position '${POSITION_CODE_CADET}'. Hãy seed RBAC positions trước.`)
  }

  const companies = await listCompaniesUnderBattalions()
  if (companies.length === 0) {
    throw new Error('❌ Không tìm thấy đại đội nào thuộc tiểu đoàn (DAI_DOI có parent TIEU_DOAN). Hãy seed units trước.')
  }

  console.log(`🏢 Đại đội thuộc tiểu đoàn: ${companies.length}`)
  companies.forEach((c) => console.log(`   - ${c.companyName} (${c.companyCode}) ⟵ ${c.battalionName}`))

  const totalTarget = companies.length * cadetsPerCompany
  console.log(`\n👥 Mục tiêu: ${cadetsPerCompany} học viên/đại đội × ${companies.length} = ${totalTarget}\n`)

  const passwordHash = await bcrypt.hash(PASSWORD_DEFAULT, 10)

  let created = 0
  let skipped = 0
  let errors = 0

  // Phân bổ round-robin: học viên seq i → đại đội (i-1) % companies.length
  for (let seq = 1; seq <= totalTarget; seq++) {
    const company = companies[(seq - 1) % companies.length]
    try {
      const result = await createCadet({ seq, company, positionId: position.id, passwordHash })
      if (result === 'created') {
        created++
        if (created % 20 === 0) console.log(`   ✓ Đã tạo ${created}/${totalTarget}...`)
      } else {
        skipped++
      }
    } catch (err) {
      errors++
      console.error(`   ❌ Lỗi học viên seq=${seq} (${company.companyCode}): ${(err as Error).message}`)
    }
  }

  // ─── Thống kê ────────────────────────────────────────────────────────────────
  const totalCadetUsers = await prisma.user.count({
    where: { role: 'HOC_VIEN', personnelType: 'HOC_VIEN_QUAN_SU', employeeId: { startsWith: 'HVQS' } },
  })
  const totalCadetHV = await prisma.hocVien.count({ where: { maHocVien: { startsWith: 'HVQS' } } })
  const assignedToCompany = await prisma.user.count({
    where: {
      employeeId: { startsWith: 'HVQS' },
      unitRelation: { type: 'DAI_DOI' },
    },
  })

  console.log('\n===== SEED HỌC VIÊN QUÂN SỰ (KHÔNG SĨ QUAN) =====')
  console.log(`Tạo mới:                 ${created}`)
  console.log(`Bỏ qua (đã tồn tại):     ${skipped}`)
  console.log(`Lỗi:                     ${errors}`)
  console.log('---')
  console.log(`Tài khoản học viên QS:   ${totalCadetUsers}`)
  console.log(`Bản ghi HocVien:         ${totalCadetHV}`)
  console.log(`Đã gán vào đại đội:      ${assignedToCompany}`)
  console.log('---')
  console.log(`Mật khẩu mặc định:       ${PASSWORD_DEFAULT}`)
  console.log(`Email mẫu:               hvqs00001@student.hvhc.edu.vn`)
  console.log('=================================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
