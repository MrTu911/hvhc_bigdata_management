/**
 * Seed 31 cán bộ THẬT của Viện Nghiên cứu Khoa học Hậu cần Quân sự (mã B12)
 * từ prisma/seed/data/vien_b212_personnel.json (sinh bởi scripts/build_vien_b212_data.py).
 *
 * Nguồn sự thật: model User (model đang được /api/personnel + UI tiêu thụ trực tiếp).
 * Idempotent: upsert theo email ổn định suy từ STT (8 bản ghi không có mã quân nhân
 * nên không dùng militaryId làm khóa). Chạy lại nhiều lần không nhân đôi.
 *
 * Tiền đề: đã chạy seed_vien_b212_units.ts (tạo 4 Ban con) + cột mới đã có trong DB
 * (bloodGroupRaw, citizenIdIssueDate/IssuePlace/ExpiryDate).
 *
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_vien_b212_personnel.ts
 */
import {
  PrismaClient,
  PersonnelCategory,
  ManagementCategory,
  UserRole,
  UserStatus,
  WorkStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.DEMO_PERSONNEL_PASSWORD || 'Demo@2025';
const DEMO_EMAIL_SUFFIX = '@demo.hvhc.edu.vn';
const VIEN_TREE_CODES = ['B12', 'B12-CH', 'B12-KHTH', 'B12-KHHC', 'B12-KHKT'];

type RawPersonnel = {
  stt: number;
  militaryId: string | null;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  birthPlace: string | null;
  placeOfOrigin: string | null;
  ethnicity: string | null;
  religion: string | null;
  bloodGroupRaw: string | null;
  citizenId: string | null;
  citizenIdIssueDate: string | null;
  citizenIdExpiryDate: string | null;
  citizenIdIssuePlace: string | null;
  officerIdCard: string | null;
  rank: string | null;
  managementCategoryRaw: string | null;
  unitName: string | null;
  unitCode: string | null;
  enlistmentDate: string | null;
  dischargeDate: string | null;
};

function loadRecords(): RawPersonnel[] {
  const path = join(__dirname, 'data', 'vien_b212_personnel.json');
  return JSON.parse(readFileSync(path, 'utf-8')) as RawPersonnel[];
}

// JSON đã chuẩn hóa ISO 'yyyy-mm-dd' từ Python -> Date | null
function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function buildEmail(stt: number): string {
  return `vienb12.qn${stt}@hvhc.qs`;
}

function mapManagementCategory(raw: string | null): ManagementCategory | null {
  if (!raw) return null;
  if (raw.includes('Cán bộ')) return ManagementCategory.CAN_BO;
  if (raw.includes('Quân lực')) return ManagementCategory.QUAN_LUC;
  return null;
}

// Phân loại cán bộ theo đơn vị + cấp bậc (heuristic, không có cột nghề nghiệp trong nguồn)
function derivePersonnelType(unitCode: string | null, rank: string | null): PersonnelCategory {
  if (unitCode === 'B12-CH') return PersonnelCategory.CAN_BO_CHI_HUY;
  const r = (rank || '').toLowerCase();
  const isProfessional = r.includes('cn'); // QNCN: "Thiếu tá CN", "Trung tá CN"...
  const isSoldier = r.includes('sĩ') || r.includes('binh'); // Hạ sĩ, binh nhất...
  if (isProfessional || isSoldier) return PersonnelCategory.CONG_NHAN_VIEN;
  return PersonnelCategory.NGHIEN_CUU_VIEN;
}

function deriveRole(personnelType: PersonnelCategory): UserRole {
  switch (personnelType) {
    case PersonnelCategory.CAN_BO_CHI_HUY:
      return UserRole.CHI_HUY_BAN;
    case PersonnelCategory.CONG_NHAN_VIEN:
      return UserRole.NHAN_VIEN;
    default:
      return UserRole.NGHIEN_CUU_VIEN;
  }
}

async function resolveUnitIds(): Promise<Map<string, string>> {
  const units = await prisma.unit.findMany({
    where: { code: { in: VIEN_TREE_CODES } },
    select: { id: true, code: true },
  });
  const map = new Map<string, string>();
  for (const u of units) map.set(u.code, u.id);
  return map;
}

// Gỡ mềm các bản ghi demo đang nằm trong cây Viện (tránh trộn thật + giả)
async function softRemoveDemoOccupants(unitIds: string[]): Promise<number> {
  const result = await prisma.user.updateMany({
    where: {
      unitId: { in: unitIds },
      email: { endsWith: DEMO_EMAIL_SUFFIX },
      status: { not: UserStatus.INACTIVE },
    },
    data: { status: UserStatus.INACTIVE, workStatus: WorkStatus.TRANSFERRED },
  });
  return result.count;
}

async function upsertPersonnel(
  record: RawPersonnel,
  unitIdByCode: Map<string, string>,
  passwordHash: string,
): Promise<'created' | 'updated' | 'skipped'> {
  const unitId = record.unitCode ? unitIdByCode.get(record.unitCode) ?? null : null;
  if (!unitId) {
    console.warn(`  ⚠️  STT ${record.stt} (${record.name}): không map được đơn vị '${record.unitCode}' — bỏ qua`);
    return 'skipped';
  }

  const personnelType = derivePersonnelType(record.unitCode, record.rank);
  const enlistmentDate = toDate(record.enlistmentDate);

  // Trường nghiệp vụ chung cho cả create lẫn update (KHÔNG đụng email/password khi update)
  const commonData = {
    name: record.name,
    militaryId: record.militaryId ?? undefined,
    rank: record.rank ?? undefined,
    gender: record.gender ?? undefined,
    dateOfBirth: toDate(record.dateOfBirth) ?? undefined,
    birthPlace: record.birthPlace ?? undefined,
    placeOfOrigin: record.placeOfOrigin ?? undefined,
    ethnicity: record.ethnicity ?? undefined,
    religion: record.religion ?? undefined,
    bloodGroupRaw: record.bloodGroupRaw ?? undefined,
    citizenId: record.citizenId ?? undefined,
    citizenIdIssueDate: toDate(record.citizenIdIssueDate) ?? undefined,
    citizenIdIssuePlace: record.citizenIdIssuePlace ?? undefined,
    citizenIdExpiryDate: toDate(record.citizenIdExpiryDate) ?? undefined,
    officerIdCard: record.officerIdCard ?? undefined,
    managementCategory: mapManagementCategory(record.managementCategoryRaw) ?? undefined,
    personnelType,
    role: deriveRole(personnelType),
    department: record.unitCode ?? undefined,
    unitId,
    enlistmentDate: enlistmentDate ?? undefined,
    joinDate: enlistmentDate ?? undefined, // "Ngày vào ngành" = ngày nhập ngũ (nguồn duy nhất có)
    dischargeDate: toDate(record.dischargeDate) ?? undefined,
    workStatus: record.dischargeDate ? WorkStatus.RETIRED : WorkStatus.ACTIVE,
    status: UserStatus.ACTIVE,
  };

  const email = buildEmail(record.stt);
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing) {
    await prisma.user.update({ where: { email }, data: commonData as any });
    return 'updated';
  }

  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      // Buộc đổi mật khẩu lần đăng nhập đầu (chỉ set khi tạo mới — update không reset
      // để không ép đổi lại sau khi cán bộ đã tự đổi).
      mustChangePassword: true,
      ...commonData,
    } as any,
  });
  return 'created';
}

async function main() {
  console.log('='.repeat(60));
  console.log('  SEED CÁN BỘ THẬT – Viện NCKH Hậu cần Quân sự (B12)');
  console.log('='.repeat(60));

  const records = loadRecords();
  const unitIdByCode = await resolveUnitIds();
  const treeUnitIds = VIEN_TREE_CODES.map((c) => unitIdByCode.get(c)).filter(Boolean) as string[];

  if (treeUnitIds.length === 0) {
    throw new Error('Không tìm thấy đơn vị Viện B12. Hãy chạy seed_vien_b212_units.ts trước.');
  }

  const removed = await softRemoveDemoOccupants(treeUnitIds);
  console.log(`\n🧹 Gỡ mềm demo trong Viện: ${removed} bản ghi -> INACTIVE`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const record of records) {
    const outcome = await upsertPersonnel(record, unitIdByCode, passwordHash);
    if (outcome === 'created') created++;
    else if (outcome === 'updated') updated++;
    else skipped++;
  }

  console.log(`\n📋 Cán bộ thật: created=${created}, updated=${updated}, skipped=${skipped}, total=${records.length}`);

  // Buộc đổi mật khẩu cho cohort thật CHƯA từng đăng nhập (xử lý cả bản ghi tạo từ
  // lần seed trước). Idempotent: ai đã đăng nhập/đổi MK (lastLoginAt != null) thì bỏ qua.
  const forced = await prisma.user.updateMany({
    where: { email: { startsWith: 'vienb12.qn' }, lastLoginAt: null },
    data: { mustChangePassword: true },
  });
  console.log(`🔐 Buộc đổi mật khẩu lần đầu: ${forced.count} tài khoản`);
  console.log('   (Tài khoản đăng nhập được; RBAC position gán ở seed_vien_b212_rbac.ts.)');
  console.log('\n  ✅ HOÀN THÀNH');
}

main()
  .catch((e) => {
    console.error('\n❌ FAILED:', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
