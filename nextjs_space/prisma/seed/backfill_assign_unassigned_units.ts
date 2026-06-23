/**
 * Backfill: gán đơn vị cho MỌI hồ sơ còn trống `unitId`, THEO VAI TRÒ.
 *
 * Mục tiêu (theo yêu cầu nghiệp vụ):
 *   - Giảng viên        → các Khoa (type KHOA)
 *   - Trợ lý/cán bộ phòng → các Phòng (type PHONG)
 *   - Nghiên cứu viên   → Viện Nghiên cứu (type VIEN)
 *   - Biên tập viên     → Tạp chí (đơn vị code B13)
 *   - Trưởng/phó ban    → các Ban (type BAN)
 *   - Học viên còn trống → Đại đội (type DAI_DOI)
 *   - Còn lại           → suy từ tên đơn vị (User.unit/department) rồi round-robin nhóm tổ chức
 *
 * Chiến lược: DERIVE trước (khớp tên đơn vị từ chuỗi legacy) → round-robin trong đúng
 * nhóm sau. Ghi qua service chuẩn `projectUnitMembership` (đồng bộ Personnel/User/Faculty).
 *
 * An toàn dữ liệu thật:
 *   - Mặc định DRY-RUN (chỉ in thống kê). Chạy thật: thêm cờ `--apply`.
 *   - Khi `--apply`: ghi snapshot JSON (id + đơn vị mới) ra prisma/seed/.snapshots/
 *     để rollback (mọi bản ghi đều đang null → rollback = set lại null).
 *
 * Run:
 *   npx tsx --require dotenv/config prisma/seed/backfill_assign_unassigned_units.ts            # dry-run
 *   npx tsx --require dotenv/config prisma/seed/backfill_assign_unassigned_units.ts --apply    # ghi thật
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import * as fs from 'fs'
import * as path from 'path'
import { projectUnitMembership } from '../../lib/services/org/unit-membership.service'

const prisma = new PrismaClient()
const APPLY = process.argv.includes('--apply')

interface UnitRef {
  id: string
  code: string
  name: string
  type: string
}

function normalizeName(s: string | null | undefined): string {
  if (!s) return ''
  let str = s.trim().toLowerCase()
  const from = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
  const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'
  for (let i = 0; i < from.length; i++) str = str.replace(new RegExp(from[i], 'g'), to[i])
  return str.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

type Bucket = 'faculty' | 'research' | 'editor' | 'assistant' | 'ban' | 'student' | 'fallback'

const RE = {
  editor: /bien tap/,
  research: /nghien cuu vien|vien truong/,
  faculty: /giang vien|bo mon|cn khoa|chu nhiem khoa/,
  assistant: /tro ly|truong phong|chanh vp|hanh chinh|van phong/,
  ban: /\bban\b|truong ban/,
  student: /hoc vien|sinh vien/,
}

/** Round-robin có trạng thái theo từng pool. */
class RoundRobin {
  private idx = new Map<string, number>()
  next(key: string, pool: UnitRef[]): UnitRef | null {
    if (pool.length === 0) return null
    const i = this.idx.get(key) ?? 0
    this.idx.set(key, i + 1)
    return pool[i % pool.length]
  }
}

async function main() {
  console.log(`🧭 Backfill gán đơn vị theo vai trò — mode: ${APPLY ? 'APPLY (ghi thật)' : 'DRY-RUN'}\n`)

  // ── Pools đơn vị đích ───────────────────────────────────────────────────────────
  const allUnits: UnitRef[] = await prisma.unit.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true, type: true },
    orderBy: { code: 'asc' },
  })
  const byType = (t: string) => allUnits.filter((u) => u.type === t)
  const khoaPool = byType('KHOA')
  const phongPool = byType('PHONG')
  const banPool = byType('BAN')
  const vienUnit = allUnits.find((u) => u.type === 'VIEN') ?? null
  const tapchiUnit =
    allUnits.find((u) => u.code === 'B13') ?? allUnits.find((u) => normalizeName(u.name).includes('tap chi')) ?? null
  const daiDoiPool = byType('DAI_DOI')
  const fallbackPool = allUnits.filter((u) => ['PHONG', 'BAN', 'KHOA', 'VIEN', 'TRUNG_TAM'].includes(u.type))

  if (khoaPool.length === 0 || phongPool.length === 0 || banPool.length === 0 || daiDoiPool.length === 0) {
    throw new Error('❌ Thiếu pool đơn vị (KHOA/PHONG/BAN/DAI_DOI). Hãy seed units trước.')
  }

  // Index tên đơn vị để DERIVE (khớp chuỗi legacy User.unit/department).
  const nameIndex = new Map<string, UnitRef>()
  for (const u of allUnits) {
    nameIndex.set(normalizeName(u.name), u)
    nameIndex.set(normalizeName(u.code), u)
  }
  const deriveByName = (...candidates: (string | null | undefined)[]): UnitRef | null => {
    for (const c of candidates) {
      const key = normalizeName(c)
      if (key && nameIndex.has(key)) return nameIndex.get(key)!
    }
    return null
  }

  const rr = new RoundRobin()
  const classifyBucket = (personnelType: string | null, position: string | null, isFaculty: boolean): Bucket => {
    const pos = normalizeName(position)
    if (RE.editor.test(pos)) return 'editor'
    if (personnelType === 'NGHIEN_CUU_VIEN' || RE.research.test(pos)) return 'research'
    if (isFaculty || personnelType === 'GIANG_VIEN' || RE.faculty.test(pos)) return 'faculty'
    if (RE.assistant.test(pos)) return 'assistant'
    if (RE.ban.test(pos)) return 'ban'
    if (personnelType === 'HOC_VIEN_QUAN_SU' || personnelType === 'SINH_VIEN_DAN_SU' || RE.student.test(pos))
      return 'student'
    return 'fallback'
  }
  const targetForBucket = (b: Bucket): UnitRef | null => {
    switch (b) {
      case 'faculty':
        return rr.next('khoa', khoaPool)
      case 'research':
        return vienUnit ?? rr.next('fallback', fallbackPool)
      case 'editor':
        return tapchiUnit ?? rr.next('phong', phongPool)
      case 'assistant':
        return rr.next('phong', phongPool)
      case 'ban':
        return rr.next('ban', banPool)
      case 'student':
        return rr.next('daidoi', daiDoiPool)
      case 'fallback':
        return rr.next('fallback', fallbackPool)
    }
  }

  // ── Thu thập User chưa gán đơn vị ────────────────────────────────────────────────
  const hvUserRows = await prisma.hocVien.findMany({ where: { userId: { not: null } }, select: { userId: true } })
  const hvUserIds = new Set(hvUserRows.map((r) => r.userId as string))
  // FacultyProfile.userId là trường bắt buộc (không null) → lấy hết, lọc null phòng thủ.
  const facultyRows = await prisma.facultyProfile.findMany({ select: { userId: true } })
  const facultyUserIds = new Set(facultyRows.map((r) => r.userId).filter((id): id is string => !!id))

  const nullUsers = await prisma.user.findMany({
    where: { unitId: null },
    select: { id: true, name: true, personnelType: true, position: true, unit: true, department: true, personnelId: true },
  })

  // assignment plan: unitId -> userIds[]
  const userGroups = new Map<string, string[]>()
  const stat = {
    derive: 0,
    rr: 0,
    byBucket: {} as Record<string, number>,
    byTargetType: {} as Record<string, number>,
  }
  const samples: string[] = []
  const coveredPersonnelIds = new Set<string>()

  for (const u of nullUsers) {
    const isFaculty = facultyUserIds.has(u.id)
    const bucket = classifyBucket(u.personnelType as string | null, u.position, isFaculty)

    // Học viên: ưu tiên đại đội (không derive theo tên hệ để tránh gán vào Hệ thay vì đại đội).
    let target: UnitRef | null = null
    let via: 'derive' | 'rr' = 'rr'
    if (bucket !== 'student') {
      target = deriveByName(u.unit, u.department)
      if (target) via = 'derive'
    }
    if (!target) target = targetForBucket(bucket)
    if (!target) continue

    if (via === 'derive') stat.derive++
    else stat.rr++
    stat.byBucket[bucket] = (stat.byBucket[bucket] ?? 0) + 1
    stat.byTargetType[target.type] = (stat.byTargetType[target.type] ?? 0) + 1

    const arr = userGroups.get(target.id) ?? []
    arr.push(u.id)
    userGroups.set(target.id, arr)
    if (u.personnelId) coveredPersonnelIds.add(u.personnelId)

    if (samples.length < 12) {
      samples.push(`  ${u.name} [${u.position ?? '-'}] → ${target.name} (${target.type}, ${via})`)
    }
  }

  // ── Personnel chưa gán đơn vị & KHÔNG có tài khoản (không được User phủ) ──────────
  const nullPersonnel = await prisma.personnel.findMany({
    where: { unitId: null, deletedAt: null },
    select: { id: true, fullName: true, category: true, position: true, account: { select: { id: true } } },
  })
  const personnelGroups = new Map<string, string[]>()
  let personnelPlanned = 0
  for (const p of nullPersonnel) {
    if (p.account || coveredPersonnelIds.has(p.id)) continue // sẽ được đồng bộ qua User
    const bucket = classifyBucket(p.category as string | null, p.position, false)
    if (bucket === 'student') continue // học viên xử lý qua hồ sơ HocVien/User
    const target = targetForBucket(bucket)
    if (!target) continue
    const arr = personnelGroups.get(target.id) ?? []
    arr.push(p.id)
    personnelGroups.set(target.id, arr)
    stat.byBucket[`personnel:${bucket}`] = (stat.byBucket[`personnel:${bucket}`] ?? 0) + 1
    personnelPlanned++
  }

  // ── Báo cáo ──────────────────────────────────────────────────────────────────────
  const totalUsersPlanned = [...userGroups.values()].reduce((a, b) => a + b.length, 0)
  console.log(`User chưa gán:        ${nullUsers.length}`)
  console.log(`→ Lập kế hoạch gán:   ${totalUsersPlanned} (derive ${stat.derive}, round-robin ${stat.rr})`)
  console.log(`Personnel (không account) lập kế hoạch: ${personnelPlanned}`)
  console.log(`\nTheo nhóm vai trò:`, stat.byBucket)
  console.log(`Theo loại đơn vị đích:`, stat.byTargetType)
  console.log(`Viện đích: ${vienUnit?.name ?? '(không có)'} | Tạp chí đích: ${tapchiUnit?.name ?? '(không có)'}`)
  console.log(`\nVí dụ gán:\n${samples.join('\n')}`)

  if (!APPLY) {
    console.log('\nℹ️  DRY-RUN: chưa ghi gì. Chạy lại với --apply để ghi thật.\n')
    return
  }

  // ── Snapshot trước khi ghi ───────────────────────────────────────────────────────
  const snapshotDir = path.join(__dirname, '.snapshots')
  fs.mkdirSync(snapshotDir, { recursive: true })
  const snapshotPath = path.join(snapshotDir, `backfill-units-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  const snapshot = {
    createdAt: new Date().toISOString(),
    note: 'Mọi bản ghi trước backfill đều có unitId=null → rollback = set unitId về null cho các id dưới đây.',
    userAssignments: [...userGroups.entries()].map(([unitId, ids]) => ({ unitId, userIds: ids })),
    personnelAssignments: [...personnelGroups.entries()].map(([unitId, ids]) => ({ unitId, personnelIds: ids })),
  }
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8')
  console.log(`\n💾 Snapshot rollback: ${snapshotPath}`)

  // ── Ghi (1 transaction, batch theo đơn vị đích) ──────────────────────────────────
  let usersUpdated = 0
  let personnelUpdated = 0
  let facultyUpdated = 0
  await prisma.$transaction(
    async (tx) => {
      for (const [unitId, userIds] of userGroups) {
        const r = await projectUnitMembership(tx, { userIds, unitId })
        usersUpdated += r.usersUpdated
        personnelUpdated += r.personnelUpdated
        facultyUpdated += r.facultyUpdated
      }
      for (const [unitId, personnelIds] of personnelGroups) {
        const r = await projectUnitMembership(tx, { personnelIds, unitId })
        usersUpdated += r.usersUpdated
        personnelUpdated += r.personnelUpdated
        facultyUpdated += r.facultyUpdated
      }
    },
    { timeout: 180000 }
  )

  // ── Reconcile drift: Personnel/FacultyProfile còn null nhưng User liên kết đã có đơn
  //    vị (lệch projection có sẵn từ trước) → chiếu đơn vị theo User. ────────────────
  let reconciled = 0
  const driftPersonnel = await prisma.personnel.findMany({
    where: { unitId: null, deletedAt: null, account: { unitId: { not: null } } },
    select: { id: true, account: { select: { unitId: true } } },
  })
  const driftFaculty = await prisma.facultyProfile.findMany({
    where: { unitId: null, user: { unitId: { not: null } } },
    select: { id: true, user: { select: { unitId: true } } },
  })
  if (driftPersonnel.length > 0 || driftFaculty.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const dp of driftPersonnel) {
        await tx.personnel.update({ where: { id: dp.id }, data: { unitId: dp.account!.unitId } })
        reconciled++
      }
      for (const df of driftFaculty) {
        await tx.facultyProfile.update({ where: { id: df.id }, data: { unitId: df.user!.unitId } })
        reconciled++
      }
    })
    console.log(`↻ Reconcile drift (chiếu đơn vị từ User liên kết): ${reconciled}`)
  }

  // ── Kiểm tra còn sót ─────────────────────────────────────────────────────────────
  const [uLeft, pLeft, fLeft] = await Promise.all([
    prisma.user.count({ where: { unitId: null } }),
    prisma.personnel.count({ where: { unitId: null, deletedAt: null } }),
    prisma.facultyProfile.count({ where: { unitId: null } }),
  ])

  console.log('\n===== BACKFILL ĐƠN VỊ (APPLIED) =====')
  console.log(`User cập nhật:        ${usersUpdated}`)
  console.log(`Personnel cập nhật:   ${personnelUpdated}`)
  console.log(`FacultyProfile c.nhật:${facultyUpdated}`)
  console.log('--- Còn trống sau backfill ---')
  console.log(`User null:            ${uLeft}`)
  console.log(`Personnel null:       ${pLeft}`)
  console.log(`FacultyProfile null:  ${fLeft}`)
  console.log('======================================\n')
}

main()
  .catch((e) => {
    console.error('❌ Backfill error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
