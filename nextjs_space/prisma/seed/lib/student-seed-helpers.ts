/**
 * Helper dùng chung cho các seed học viên (M10) — gom logic tạo tài khoản + hồ sơ học
 * viên + điểm mẫu, tránh duplicate giữa các seed (postgrad / command-logistics / B155 /
 * civil / international).
 *
 * SEED ONLY — chỉ dùng cho dev/demo data, KHÔNG dùng cho production import.
 *
 * Bản chất:
 *   - HocVien (M10) là source of truth miền đào tạo, link 1-1 với User qua HocVien.userId.
 *   - Đơn vị/lớp là Unit (type 'HE'/'LOP'/'DAI_DOI'...). Gán đơn vị qua User.unitId +
 *     HocVien.trainingSystemUnitId/battalionUnitId, đồng thời giữ trường legacy
 *     User.unit/department + HocVien.lop/daiDoi để tương thích trang đọc cũ.
 *   - Quân hàm lưu chuỗi tiếng Việt trên User.rank (pattern hiện có ở seed_military_cadets).
 *
 * Idempotent: tạo theo maHocVien/email cố định → chạy lại bỏ qua bản đã tồn tại.
 */
import type { PersonnelCategory, PrismaClient } from '@prisma/client'

export const DEFAULT_STUDENT_PASSWORD = 'Hv@2025'

// ─── Rank pools theo nghiệp vụ (quân hàm sĩ quan, chuỗi tiếng Việt) ──────────────

/** Cao học Hậu cần quân sự: sĩ quan Đại úy → Trung tá. */
export const CAO_HOC_HCQS_RANKS = ['Đại úy', 'Thiếu tá', 'Trung tá']
/** Cao học Tài chính: sĩ quan Thượng úy trở lên. */
export const CAO_HOC_TC_RANKS = ['Thượng úy', 'Đại úy', 'Thiếu tá', 'Trung tá']
/** Nghiên cứu sinh: sĩ quan Trung tá trở lên. */
export const NCS_RANKS = ['Trung tá', 'Thượng tá', 'Đại tá']
/** Hệ 2 — Chủ nhiệm hậu cần trung/lữ đoàn (dài hạn): sĩ quan Đại úy trở lên. */
export const CNHC_DAIHAN_RANKS = ['Đại úy', 'Thiếu tá', 'Trung tá', 'Thượng tá']
/** B155 — Chủ nhiệm hậu cần trung/lữ đoàn (ngắn hạn): sĩ quan Đại úy trở lên. */
export const B155_RANKS = ['Đại úy', 'Thiếu tá', 'Trung tá']
/**
 * Quân hàm học viên quốc tế: quân đội Lào/Campuchia KHÔNG có cấp "Thượng úy"/"Thượng tá"
 * (khác cơ cấu quân hàm Việt Nam). Áp chung cho cả Lào và Campuchia — giả định demo.
 */
export const FOREIGN_RANKS = ['Trung úy', 'Đại úy', 'Thiếu tá', 'Trung tá', 'Đại tá']

// ─── Name pools ─────────────────────────────────────────────────────────────────

export const HO_LIST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']

export const TEN_NAM_LIST = [
  'Văn Minh', 'Văn Hùng', 'Văn Dũng', 'Văn Nam', 'Văn Tùng', 'Văn Phúc',
  'Văn Trọng', 'Văn Sơn', 'Văn Đức', 'Văn Khánh', 'Văn Bảo', 'Văn Tuấn',
  'Văn Khoa', 'Văn Long', 'Văn Quân', 'Quang Huy', 'Hữu Thắng', 'Đình Phong',
  'Bá Cường', 'Mạnh Hà', 'Tiến Đạt', 'Công Vinh', 'Thành Trung', 'Xuân Trường',
]

export const TEN_NU_LIST = [
  'Thị Lan', 'Thị Hoa', 'Thị Mai', 'Thị Yến', 'Thị Thu', 'Thị Linh',
  'Thị Nga', 'Thị Ngọc', 'Thị Nhung', 'Thị Thảo', 'Thị Hồng', 'Thị Trang',
]

/** Họ tên Lào (chuyển tự tiếng Việt). */
export const LAO_FULLNAMES = [
  'Somchanh Vilaysane', 'Bounmy Keoviset', 'Khamla Phommavong', 'Vilayphone Sisomphone',
  'Sengphet Inthavong', 'Phongsavanh Douangchak', 'Thongchanh Soulivong', 'Khamphout Sayasith',
  'Bounthanh Chanthavong', 'Vongphachanh Keomany', 'Souksavanh Phimmasone', 'Khamphone Vorachit',
  'Somsanith Latsavong', 'Bounpheng Sengdara', 'Khamtanh Vongkham', 'Phetsamone Bouasy',
]

/** Họ tên Campuchia (chuyển tự tiếng Việt). */
export const CAMBODIA_FULLNAMES = [
  'Sok Pisey', 'Chan Dara', 'Heng Sophal', 'Vibol Chanthou',
  'Rithy Samnang', 'Sovann Makara', 'Kosal Phearun', 'Veasna Bunroeun',
  'Sambath Vichea', 'Channary Pheakdey', 'Sokha Ratanak', 'Visal Chamroeun',
  'Bopha Sopheap', 'Davuth Sereyvuth', 'Mealea Sothea', 'Piseth Kunthea',
]

// ─── Helpers thuần ──────────────────────────────────────────────────────────────

export function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

export function randFloat(min: number, max: number, seed: number): number {
  const r = Math.abs(Math.sin(seed * 7919.1 + 293.7) * 43758.5) % 1
  return parseFloat((min + r * (max - min)).toFixed(2))
}

export function vietnameseToSlug(str: string): string {
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

export function genKetQua(diem: number): string {
  if (diem >= 9.0) return 'Xuất sắc'
  if (diem >= 8.0) return 'Giỏi'
  if (diem >= 7.0) return 'Khá'
  if (diem >= 5.0) return 'Trung bình'
  return 'Yếu'
}

export function genXepLoai(diem: number): string {
  if (diem >= 9.0) return 'A+'
  if (diem >= 8.5) return 'A'
  if (diem >= 8.0) return 'B+'
  if (diem >= 7.0) return 'B'
  if (diem >= 6.5) return 'C+'
  if (diem >= 5.5) return 'C'
  if (diem >= 5.0) return 'D'
  return 'F'
}

// ─── Lookup tiện ích (query động, không hard-code id) ────────────────────────────

export interface UnitRef {
  id: string
  code: string
  name: string
}

export async function getRequiredUnitByCode(prisma: PrismaClient, code: string): Promise<UnitRef> {
  const unit = await prisma.unit.findUnique({ where: { code }, select: { id: true, code: true, name: true } })
  if (!unit) throw new Error(`❌ Không tìm thấy Unit code='${code}'. Hãy seed đơn vị trước.`)
  return unit
}

export async function getRequiredPositionId(prisma: PrismaClient, code: string): Promise<string> {
  const position = await prisma.position.findFirst({ where: { code }, select: { id: true } })
  if (!position) throw new Error(`❌ Không tìm thấy Position code='${code}'. Hãy seed RBAC positions trước.`)
  return position.id
}

// ─── Tạo học viên (User + UserPosition + HocVien) ────────────────────────────────

export interface CreateStudentConfig {
  // Identity
  maHocVien: string
  employeeId: string
  email: string
  passwordHash: string
  hoTen: string
  gioiTinh: string
  ngaySinh: Date
  phone: string
  diaChi: string
  // Military / category
  rank: string | null
  personnelType: PersonnelCategory
  positionId: string
  positionLabel: string
  // Unit assignment
  unitId: string // User.unitId + UserPosition.unitId — lớp/đại đội học viên thuộc về
  unitLabel: string // legacy User.unit string
  departmentLabel: string // legacy User.department string (vd tên Hệ)
  trainingSystemUnitId: string | null
  battalionUnitId: string | null
  daiDoi: string | null
  trungDoi: string | null
  // Academic
  lop: string
  khoaHoc: string
  nganh: string
  khoaQuanLy: string | null
  studyMode: string | null
  ngayNhapHoc: Date
  diemTrungBinh: number
}

/**
 * Tạo 1 học viên (tài khoản + hồ sơ) trong 1 transaction. Idempotent theo maHocVien/email.
 * Trả về id HocVien khi tạo mới, hoặc null khi bỏ qua (đã tồn tại).
 */
export async function createStudentWithAccount(
  prisma: PrismaClient,
  cfg: CreateStudentConfig
): Promise<string | null> {
  const [existingHV, existingUser] = await Promise.all([
    prisma.hocVien.findUnique({ where: { maHocVien: cfg.maHocVien }, select: { id: true } }),
    prisma.user.findUnique({ where: { email: cfg.email }, select: { id: true } }),
  ])
  if (existingHV || existingUser) return null

  // Sĩ quan/quân nhân mới có số hiệu quân nhân; học viên dân sự để null.
  const militaryId = cfg.rank ? cfg.maHocVien : null

  const hocVienId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: cfg.hoTen,
        email: cfg.email,
        password: cfg.passwordHash,
        role: 'HOC_VIEN',
        personnelType: cfg.personnelType,
        rank: cfg.rank,
        position: cfg.positionLabel,
        militaryId,
        employeeId: cfg.employeeId,
        unitId: cfg.unitId,
        // Trường legacy hiển thị (giữ tương thích các trang đọc User.unit/department)
        unit: cfg.unitLabel,
        department: cfg.departmentLabel,
        gender: cfg.gioiTinh,
        dateOfBirth: cfg.ngaySinh,
        phone: cfg.phone,
        address: cfg.diaChi,
        status: 'ACTIVE',
        workStatus: 'ACTIVE',
        startDate: cfg.ngayNhapHoc,
        joinDate: cfg.ngayNhapHoc,
        mustChangePassword: true,
      },
    })

    await tx.userPosition.create({
      data: {
        userId: user.id,
        positionId: cfg.positionId,
        unitId: cfg.unitId,
        isPrimary: true,
        isActive: true,
        startDate: cfg.ngayNhapHoc,
      },
    })

    const hv = await tx.hocVien.create({
      data: {
        maHocVien: cfg.maHocVien,
        hoTen: cfg.hoTen,
        ngaySinh: cfg.ngaySinh,
        gioiTinh: cfg.gioiTinh,
        lop: cfg.lop,
        khoaHoc: cfg.khoaHoc,
        nganh: cfg.nganh,
        email: cfg.email,
        dienThoai: cfg.phone,
        diaChi: cfg.diaChi,
        diemTrungBinh: cfg.diemTrungBinh,
        trangThai: 'Đang học',
        currentStatus: 'ACTIVE',
        studyMode: cfg.studyMode,
        ngayNhapHoc: cfg.ngayNhapHoc,
        userId: user.id,
        trainingSystemUnitId: cfg.trainingSystemUnitId,
        battalionUnitId: cfg.battalionUnitId,
        daiDoi: cfg.daiDoi,
        trungDoi: cfg.trungDoi,
        khoaQuanLy: cfg.khoaQuanLy,
      },
    })
    return hv.id
  })

  return hocVienId
}

// ─── Điểm mẫu (KetQuaHocTap) ─────────────────────────────────────────────────────

export interface CourseDef {
  ten: string
  ma: string
  tinChi: number
}

export const DEFAULT_SEMESTERS = [
  { hocKy: 'HK1/2024-2025', namHoc: '2024-2025' },
  { hocKy: 'HK2/2024-2025', namHoc: '2024-2025' },
  { hocKy: 'HK1/2025-2026', namHoc: '2025-2026' },
]

/**
 * Sinh điểm mẫu cho 1 học viên và cập nhật GPA trung bình thực tế.
 * Trả về số bản ghi KetQuaHocTap đã tạo.
 */
export async function seedGradesForStudent(
  prisma: PrismaClient,
  hocVienId: string,
  courses: CourseDef[],
  seed: number,
  semesters = DEFAULT_SEMESTERS
): Promise<number> {
  const numMon = Math.min(courses.length, 4 + (seed % 6))
  const diemList: number[] = []

  for (let j = 0; j < numMon; j++) {
    const mon = pick(courses, seed * 7 + j)
    const sem = semesters[j % semesters.length]
    const diemQT = randFloat(5.0, 10.0, seed * 11 + j)
    const diemThi = randFloat(5.0, 10.0, seed * 13 + j)
    const diemGK = randFloat(5.0, 10.0, seed * 17 + j)
    const diemTK = parseFloat((diemQT * 0.4 + diemThi * 0.6).toFixed(2))

    await prisma.ketQuaHocTap.create({
      data: {
        hocVienId,
        monHoc: mon.ten,
        maMon: mon.ma,
        diem: diemTK,
        diemQuaTrinh: diemQT,
        diemThi,
        diemGiuaKy: diemGK,
        diemTongKet: diemTK,
        soTinChi: mon.tinChi,
        hocKy: sem.hocKy,
        namHoc: sem.namHoc,
        ketQua: genKetQua(diemTK),
        xepLoai: genXepLoai(diemTK),
        workflowStatus: 'APPROVED',
      },
    })
    diemList.push(diemTK)
  }

  if (diemList.length > 0) {
    const avg = diemList.reduce((a, b) => a + b, 0) / diemList.length
    await prisma.hocVien.update({
      where: { id: hocVienId },
      data: { diemTrungBinh: parseFloat(avg.toFixed(2)) },
    })
  }

  return diemList.length
}

// ─── Cohort runner (gom vòng lặp tạo học viên dùng chung cho mọi nhóm) ────────────

export interface CohortResult {
  created: number
  skipped: number
  gradesCreated: number
}

export interface SeedStudentCohortConfig {
  count: number
  /** Prefix mã học viên, vd 'CHHC' → maHocVien 'CHHC00001'. */
  prefix: string
  positionId: string
  positionLabel: string
  personnelType: PersonnelCategory
  /** Đơn vị (lớp) học viên thuộc về → User.unitId. */
  unit: UnitRef
  /** Hệ đào tạo → HocVien.trainingSystemUnitId (null nếu không thuộc cơ cấu Hệ). */
  trainingSystemUnitId: string | null
  /** Nhãn legacy User.department (vd tên Hệ). */
  departmentLabel: string
  /** Quân hàm; rỗng = học viên dân sự (rank null). */
  ranks: string[]
  nganh: string
  khoaHoc: string
  studyMode: string | null
  courses: CourseDef[]
  ngayNhapHoc: Date
  khoaQuanLy: string | null
  /** Tỷ lệ nữ 0..1 (mặc định 0 = toàn nam, đúng đặc thù lớp sĩ quan hậu cần). */
  femaleRatio?: number
  /** Danh sách họ-tên đầy đủ (vd học viên quốc tế); nếu rỗng dùng pool họ + tên VN. */
  fullNamePool?: string[]
  emailDomain?: string
  diaChiLabel?: string
  /** Lệch seed để mã/biến không đụng giữa các nhóm chạy chung. */
  birthYearBase?: number
}

function padSeq(n: number): string {
  return String(n).padStart(5, '0')
}

/**
 * Tạo một "lớp" học viên: lặp `count` lần, sinh danh tính ổn định theo prefix, gán đơn
 * vị/lớp, kèm điểm mẫu. Idempotent (bỏ qua mã đã tồn tại). Dùng cho cả sĩ quan lẫn dân sự.
 */
export async function seedStudentCohort(
  prisma: PrismaClient,
  passwordHash: string,
  cfg: SeedStudentCohortConfig
): Promise<CohortResult> {
  const femaleRatio = cfg.femaleRatio ?? 0
  const emailDomain = cfg.emailDomain ?? 'student.hvhc.edu.vn'
  const birthYearBase = cfg.birthYearBase ?? 1985
  const isForeign = (cfg.fullNamePool?.length ?? 0) > 0
  let created = 0
  let skipped = 0
  let gradesCreated = 0

  for (let i = 1; i <= cfg.count; i++) {
    const seqPad = padSeq(i)
    const maHocVien = `${cfg.prefix}${seqPad}`
    const email = `${cfg.prefix.toLowerCase()}${seqPad}@${emailDomain}`

    const isFemale = femaleRatio > 0 && i % Math.max(2, Math.round(1 / femaleRatio)) === 0
    const gioiTinh = isFemale ? 'Nữ' : 'Nam'

    const hoTen = isForeign
      ? pick(cfg.fullNamePool as string[], i * 5 + 3)
      : `${pick(HO_LIST, i)} ${pick(isFemale ? TEN_NU_LIST : TEN_NAM_LIST, i * 3 + 1)}`

    // i*7+1: hệ số 7 nguyên tố cùng nhau với mọi cỡ pool (3/4/5) → phủ đều mọi quân hàm,
    // tránh kẹt chẵn-lẻ (i*2 chỉ chạm chỉ số lẻ khi pool có 4 phần tử).
    const rank = cfg.ranks.length > 0 ? pick(cfg.ranks, i * 7 + 1) : null
    const namSinh = birthYearBase + (i % 14)
    const ngaySinh = new Date(namSinh, (i * 3) % 12, 1 + (i % 28))
    const phone = `09${String(40000000 + (cfg.prefix.charCodeAt(0) * 100000) + i).slice(0, 8)}`
    const diaChi = `${cfg.diaChiLabel ?? cfg.unit.name}, Học viện Hậu cần`

    const hocVienId = await createStudentWithAccount(prisma, {
      maHocVien,
      employeeId: maHocVien,
      email,
      passwordHash,
      hoTen,
      gioiTinh,
      ngaySinh,
      phone,
      diaChi,
      rank,
      personnelType: cfg.personnelType,
      positionId: cfg.positionId,
      positionLabel: cfg.positionLabel,
      unitId: cfg.unit.id,
      unitLabel: cfg.unit.name,
      departmentLabel: cfg.departmentLabel,
      trainingSystemUnitId: cfg.trainingSystemUnitId,
      battalionUnitId: null,
      daiDoi: null,
      trungDoi: null,
      lop: cfg.unit.name,
      khoaHoc: cfg.khoaHoc,
      nganh: cfg.nganh,
      khoaQuanLy: cfg.khoaQuanLy,
      studyMode: cfg.studyMode,
      ngayNhapHoc: cfg.ngayNhapHoc,
      diemTrungBinh: 0,
    })

    if (!hocVienId) {
      skipped++
      continue
    }
    created++
    gradesCreated += await seedGradesForStudent(prisma, hocVienId, cfg.courses, i * 31 + cfg.prefix.length)
  }

  return { created, skipped, gradesCreated }
}
