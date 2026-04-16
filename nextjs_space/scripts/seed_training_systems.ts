/**
 * seed_training_systems.ts
 * Tạo dữ liệu mẫu cho 4 Hệ đào tạo + 6 Tiểu đoàn + chỉ huy + học viên phân bổ
 *
 * Cấu trúc tổ chức:
 *   HVHC
 *   ├── Hệ 1 – Sau đại học           (HE-SDH)
 *   ├── Hệ 2 – Chỉ huy Tham mưu     (HE-CHTS)
 *   │   ├── Tiểu đoàn Chỉ huy       (TDB-CHH)
 *   │   └── Tiểu đoàn Tài chính      (TDB-TC)
 *   ├── Hệ 3 – Chuyên ngành          (HE-CN)
 *   │   ├── Tiểu đoàn Quân nhu       (TDB-QN)
 *   │   ├── Tiểu đoàn Vận tải        (TDB-VT)
 *   │   ├── Tiểu đoàn Xăng dầu      (TDB-XD)
 *   │   └── Tiểu đoàn Doanh trại     (TDB-DT)
 *   └── Hệ 4 – Quốc tế               (HE-QT)
 *
 * Run: npx tsx --require dotenv/config scripts/seed_training_systems.ts
 */

import { PrismaClient, UserRole, UserStatus, WorkStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HVHC_ID = "cmmuk87n100018i5tcde3ln6w";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertUnit(data: {
  code: string;
  name: string;
  type: string;
  level: number;
  parentId?: string;
  description?: string;
}) {
  return prisma.unit.upsert({
    where: { code: data.code },
    update: { name: data.name, description: data.description },
    create: {
      code: data.code,
      name: data.name,
      type: data.type,
      level: data.level,
      parentId: data.parentId ?? HVHC_ID,
      description: data.description,
      active: true,
    },
  });
}

async function createCommander(opts: {
  email: string;
  name: string;
  role: UserRole;
  unitId: string;
  militaryId: string;
  rank: string;
  position: string;
}) {
  const hashed = await bcrypt.hash("Hvhc@2026", 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: { unitId: opts.unitId, role: opts.role },
    create: {
      email: opts.email,
      name: opts.name,
      password: hashed,
      role: opts.role,
      status: UserStatus.ACTIVE,
      workStatus: WorkStatus.ACTIVE,
      militaryId: opts.militaryId,
      rank: opts.rank,
      position: opts.position,
      unitId: opts.unitId,
    },
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🏫 Seeding training systems...");

  // ── 1. Tạo 4 Hệ đào tạo ─────────────────────────────────────────────────
  const he1 = await upsertUnit({
    code: "HE-SDH",
    name: "Hệ Sau đại học",
    type: "HE",
    level: 2,
    description: "Đào tạo Thạc sĩ và Tiến sĩ trong lĩnh vực hậu cần quân sự",
  });
  console.log(`  ✓ Hệ 1 – Sau đại học (${he1.id})`);

  const he2 = await upsertUnit({
    code: "HE-CHTS",
    name: "Hệ Chỉ huy Tham mưu",
    type: "HE",
    level: 2,
    description:
      "Đào tạo sĩ quan chỉ huy tham mưu cấp tiểu đoàn, lữ đoàn về hậu cần kỹ thuật",
  });
  console.log(`  ✓ Hệ 2 – Chỉ huy Tham mưu (${he2.id})`);

  const he3 = await upsertUnit({
    code: "HE-CN",
    name: "Hệ Chuyên ngành",
    type: "HE",
    level: 2,
    description:
      "Đào tạo đại học chuyên ngành: Quân nhu, Xăng dầu, Vận tải, Doanh trại",
  });
  console.log(`  ✓ Hệ 3 – Chuyên ngành (${he3.id})`);

  const he4 = await upsertUnit({
    code: "HE-QT",
    name: "Hệ Quốc tế",
    type: "HE",
    level: 2,
    description:
      "Đào tạo học viên nước ngoài (Lào, Campuchia) theo chương trình hợp tác quốc tế",
  });
  console.log(`  ✓ Hệ 4 – Quốc tế (${he4.id})`);

  // ── 2. Tạo 6 Tiểu đoàn ──────────────────────────────────────────────────
  const tdbChiHuy = await upsertUnit({
    code: "TDB-CHH",
    name: "Tiểu đoàn Chỉ huy",
    type: "TIEUDOAN",
    level: 3,
    parentId: he2.id,
    description: "Quản lý học viên đại học ngành Chỉ huy tham mưu hậu cần",
  });

  const tdbTaiChinh = await upsertUnit({
    code: "TDB-TC",
    name: "Tiểu đoàn Tài chính",
    type: "TIEUDOAN",
    level: 3,
    parentId: he2.id,
    description: "Quản lý học viên đại học ngành Tài chính quân sự",
  });

  const tdbQuanNhu = await upsertUnit({
    code: "TDB-QN",
    name: "Tiểu đoàn Quân nhu",
    type: "TIEUDOAN",
    level: 3,
    parentId: he3.id,
    description: "Quản lý học viên đại học ngành Quân nhu",
  });

  const tdbVanTai = await upsertUnit({
    code: "TDB-VT",
    name: "Tiểu đoàn Vận tải",
    type: "TIEUDOAN",
    level: 3,
    parentId: he3.id,
    description: "Quản lý học viên đại học ngành Vận tải quân sự",
  });

  const tdbXangDau = await upsertUnit({
    code: "TDB-XD",
    name: "Tiểu đoàn Xăng dầu",
    type: "TIEUDOAN",
    level: 3,
    parentId: he3.id,
    description: "Quản lý học viên đại học ngành Xăng dầu quân sự",
  });

  const tdbDoanhTrai = await upsertUnit({
    code: "TDB-DT",
    name: "Tiểu đoàn Doanh trại",
    type: "TIEUDOAN",
    level: 3,
    parentId: he3.id,
    description: "Quản lý học viên đại học ngành Kỹ thuật doanh trại",
  });

  console.log("  ✓ 6 Tiểu đoàn đã tạo");

  // ── 3. Tạo chỉ huy Hệ (CHI_HUY_HE) ─────────────────────────────────────
  const cmdHe1 = await createCommander({
    email: "chihuy.he1@hvhc.edu.vn",
    name: "Đại tá Nguyễn Quang Hùng",
    role: UserRole.CHI_HUY_HE,
    unitId: he1.id,
    militaryId: "CH-HE1-001",
    rank: "Đại tá",
    position: "Chỉ huy trưởng Hệ Sau đại học",
  });

  const cmdHe2 = await createCommander({
    email: "chihuy.he2@hvhc.edu.vn",
    name: "Thượng tá Trần Minh Đức",
    role: UserRole.CHI_HUY_HE,
    unitId: he2.id,
    militaryId: "CH-HE2-001",
    rank: "Thượng tá",
    position: "Chỉ huy trưởng Hệ Chỉ huy Tham mưu",
  });

  const cmdHe3 = await createCommander({
    email: "chihuy.he3@hvhc.edu.vn",
    name: "Thượng tá Lê Văn Thắng",
    role: UserRole.CHI_HUY_HE,
    unitId: he3.id,
    militaryId: "CH-HE3-001",
    rank: "Thượng tá",
    position: "Chỉ huy trưởng Hệ Chuyên ngành",
  });

  const cmdHe4 = await createCommander({
    email: "chihuy.he4@hvhc.edu.vn",
    name: "Thượng tá Phạm Văn Bình",
    role: UserRole.CHI_HUY_HE,
    unitId: he4.id,
    militaryId: "CH-HE4-001",
    rank: "Thượng tá",
    position: "Chỉ huy trưởng Hệ Quốc tế",
  });

  // Gán commanderId vào Unit
  await prisma.unit.update({
    where: { id: he1.id },
    data: { commanderId: cmdHe1.id },
  });
  await prisma.unit.update({
    where: { id: he2.id },
    data: { commanderId: cmdHe2.id },
  });
  await prisma.unit.update({
    where: { id: he3.id },
    data: { commanderId: cmdHe3.id },
  });
  await prisma.unit.update({
    where: { id: he4.id },
    data: { commanderId: cmdHe4.id },
  });

  console.log("  ✓ 4 Chỉ huy Hệ đã tạo");

  // ── 4. Tạo chỉ huy Tiểu đoàn (CHI_HUY_TIEU_DOAN) ───────────────────────
  const battalions = [
    { unit: tdbChiHuy, email: "chihuy.tdb.chh@hvhc.edu.vn", name: "Thiếu tá Hoàng Văn An", mid: "CH-TDB-CHH" },
    { unit: tdbTaiChinh, email: "chihuy.tdb.tc@hvhc.edu.vn", name: "Thiếu tá Đỗ Thị Hoa", mid: "CH-TDB-TC" },
    { unit: tdbQuanNhu, email: "chihuy.tdb.qn@hvhc.edu.vn", name: "Thiếu tá Nguyễn Văn Đại", mid: "CH-TDB-QN" },
    { unit: tdbVanTai, email: "chihuy.tdb.vt@hvhc.edu.vn", name: "Thiếu tá Trần Văn Long", mid: "CH-TDB-VT" },
    { unit: tdbXangDau, email: "chihuy.tdb.xd@hvhc.edu.vn", name: "Thiếu tá Lê Thị Lan", mid: "CH-TDB-XD" },
    { unit: tdbDoanhTrai, email: "chihuy.tdb.dt@hvhc.edu.vn", name: "Thiếu tá Phạm Văn Cường", mid: "CH-TDB-DT" },
  ];

  for (const b of battalions) {
    const cmd = await createCommander({
      email: b.email,
      name: b.name,
      role: UserRole.CHI_HUY_TIEU_DOAN,
      unitId: b.unit.id,
      militaryId: b.mid,
      rank: "Thiếu tá",
      position: `Tiểu đoàn trưởng ${b.unit.name}`,
    });
    await prisma.unit.update({
      where: { id: b.unit.id },
      data: { commanderId: cmd.id },
    });
  }

  console.log("  ✓ 6 Chỉ huy Tiểu đoàn đã tạo");

  // ── 5. Phân bổ học viên hiện có vào Hệ / Tiểu đoàn ─────────────────────
  const allStudents = await prisma.hocVien.findMany({
    select: { id: true, maHocVien: true, nganh: true, heDaoTao: true },
    where: { deletedAt: null },
    orderBy: { maHocVien: "asc" },
  });

  console.log(`  Phân bổ ${allStudents.length} học viên...`);

  // Map ngành → tiểu đoàn
  const nganhToDB: Record<string, { tsId: string; batId: string | null }> = {
    "Tài chính": { tsId: he2.id, batId: tdbTaiChinh.id },
    "Tài chính - Kế toán": { tsId: he2.id, batId: tdbTaiChinh.id },
    "Chỉ huy tham mưu": { tsId: he2.id, batId: tdbChiHuy.id },
    "Chỉ huy": { tsId: he2.id, batId: tdbChiHuy.id },
    "Quân nhu": { tsId: he3.id, batId: tdbQuanNhu.id },
    "Vận tải": { tsId: he3.id, batId: tdbVanTai.id },
    "Xăng dầu": { tsId: he3.id, batId: tdbXangDau.id },
    "Doanh trại": { tsId: he3.id, batId: tdbDoanhTrai.id },
    "Kỹ thuật doanh trại": { tsId: he3.id, batId: tdbDoanhTrai.id },
    "Thạc sĩ": { tsId: he1.id, batId: null },
    "Tiến sĩ": { tsId: he1.id, batId: null },
    "Sau đại học": { tsId: he1.id, batId: null },
    "Quốc tế": { tsId: he4.id, batId: null },
  };

  // Phân bổ lần lượt theo vòng nếu không map được ngành
  const systemCycle = [he1.id, he2.id, he3.id, he4.id];
  const batCycle: Record<string, string[]> = {
    [he2.id]: [tdbChiHuy.id, tdbTaiChinh.id],
    [he3.id]: [tdbQuanNhu.id, tdbVanTai.id, tdbXangDau.id, tdbDoanhTrai.id],
  };
  let cycleIdx = 0;
  const batIdx: Record<string, number> = {};

  let assigned = 0;
  for (const sv of allStudents) {
    const nganhKey = Object.keys(nganhToDB).find((k) =>
      (sv.nganh ?? "").toLowerCase().includes(k.toLowerCase())
    );

    let tsId: string;
    let batId: string | null;

    if (nganhKey) {
      tsId = nganhToDB[nganhKey].tsId;
      batId = nganhToDB[nganhKey].batId;
    } else {
      // Round-robin allocation
      tsId = systemCycle[cycleIdx % systemCycle.length];
      cycleIdx++;
      const availBat = batCycle[tsId];
      if (availBat && availBat.length > 0) {
        if (!batIdx[tsId]) batIdx[tsId] = 0;
        batId = availBat[batIdx[tsId] % availBat.length];
        batIdx[tsId]++;
      } else {
        batId = null;
      }
    }

    await prisma.hocVien.update({
      where: { id: sv.id },
      data: {
        trainingSystemUnitId: tsId,
        battalionUnitId: batId ?? undefined,
      },
    });
    assigned++;
  }

  console.log(`  ✓ Đã phân bổ ${assigned} học viên vào Hệ/Tiểu đoàn`);

  // ── 6. Tạo thêm học viên mẫu để đủ dữ liệu cho từng Tiểu đoàn ──────────
  const newStudents: {
    code: string;
    name: string;
    lop: string;
    nganh: string;
    tsId: string;
    batId: string;
    heDaoTao: string;
  }[] = [
    // Hệ 2 – Tiểu đoàn Chỉ huy
    { code: "HV-CHH-001", name: "Nguyễn Văn Anh", lop: "CHH-K50A", nganh: "Chỉ huy tham mưu", tsId: he2.id, batId: tdbChiHuy.id, heDaoTao: "Hệ 2" },
    { code: "HV-CHH-002", name: "Trần Thị Bích", lop: "CHH-K50A", nganh: "Chỉ huy tham mưu", tsId: he2.id, batId: tdbChiHuy.id, heDaoTao: "Hệ 2" },
    { code: "HV-CHH-003", name: "Lê Hoàng Cường", lop: "CHH-K50B", nganh: "Chỉ huy tham mưu", tsId: he2.id, batId: tdbChiHuy.id, heDaoTao: "Hệ 2" },
    { code: "HV-CHH-004", name: "Phạm Thị Dung", lop: "CHH-K50B", nganh: "Chỉ huy tham mưu", tsId: he2.id, batId: tdbChiHuy.id, heDaoTao: "Hệ 2" },
    { code: "HV-CHH-005", name: "Vũ Minh Đức", lop: "CHH-K51A", nganh: "Chỉ huy tham mưu", tsId: he2.id, batId: tdbChiHuy.id, heDaoTao: "Hệ 2" },
    // Hệ 2 – Tiểu đoàn Tài chính
    { code: "HV-TC-001", name: "Hoàng Văn Hải", lop: "TC-K50A", nganh: "Tài chính", tsId: he2.id, batId: tdbTaiChinh.id, heDaoTao: "Hệ 2" },
    { code: "HV-TC-002", name: "Đỗ Thị Hương", lop: "TC-K50A", nganh: "Tài chính", tsId: he2.id, batId: tdbTaiChinh.id, heDaoTao: "Hệ 2" },
    { code: "HV-TC-003", name: "Bùi Văn Khánh", lop: "TC-K50B", nganh: "Tài chính", tsId: he2.id, batId: tdbTaiChinh.id, heDaoTao: "Hệ 2" },
    { code: "HV-TC-004", name: "Đinh Thị Lan", lop: "TC-K51A", nganh: "Tài chính", tsId: he2.id, batId: tdbTaiChinh.id, heDaoTao: "Hệ 2" },
    { code: "HV-TC-005", name: "Ngô Văn Minh", lop: "TC-K51A", nganh: "Tài chính", tsId: he2.id, batId: tdbTaiChinh.id, heDaoTao: "Hệ 2" },
    // Hệ 3 – Tiểu đoàn Quân nhu
    { code: "HV-QN-001", name: "Phan Văn Nam", lop: "QN-K50A", nganh: "Quân nhu", tsId: he3.id, batId: tdbQuanNhu.id, heDaoTao: "Hệ 3" },
    { code: "HV-QN-002", name: "Trương Thị Oanh", lop: "QN-K50A", nganh: "Quân nhu", tsId: he3.id, batId: tdbQuanNhu.id, heDaoTao: "Hệ 3" },
    { code: "HV-QN-003", name: "Lý Văn Phúc", lop: "QN-K50B", nganh: "Quân nhu", tsId: he3.id, batId: tdbQuanNhu.id, heDaoTao: "Hệ 3" },
    { code: "HV-QN-004", name: "Mai Thị Quỳnh", lop: "QN-K51A", nganh: "Quân nhu", tsId: he3.id, batId: tdbQuanNhu.id, heDaoTao: "Hệ 3" },
    // Hệ 3 – Tiểu đoàn Vận tải
    { code: "HV-VT-001", name: "Cao Văn Sơn", lop: "VT-K50A", nganh: "Vận tải", tsId: he3.id, batId: tdbVanTai.id, heDaoTao: "Hệ 3" },
    { code: "HV-VT-002", name: "Hà Thị Thanh", lop: "VT-K50A", nganh: "Vận tải", tsId: he3.id, batId: tdbVanTai.id, heDaoTao: "Hệ 3" },
    { code: "HV-VT-003", name: "Tô Văn Uy", lop: "VT-K50B", nganh: "Vận tải", tsId: he3.id, batId: tdbVanTai.id, heDaoTao: "Hệ 3" },
    { code: "HV-VT-004", name: "Kiều Thị Vân", lop: "VT-K51A", nganh: "Vận tải", tsId: he3.id, batId: tdbVanTai.id, heDaoTao: "Hệ 3" },
    // Hệ 3 – Tiểu đoàn Xăng dầu
    { code: "HV-XD-001", name: "Lương Văn Xuân", lop: "XD-K50A", nganh: "Xăng dầu", tsId: he3.id, batId: tdbXangDau.id, heDaoTao: "Hệ 3" },
    { code: "HV-XD-002", name: "Dương Thị Yến", lop: "XD-K50A", nganh: "Xăng dầu", tsId: he3.id, batId: tdbXangDau.id, heDaoTao: "Hệ 3" },
    { code: "HV-XD-003", name: "Thái Văn Zung", lop: "XD-K50B", nganh: "Xăng dầu", tsId: he3.id, batId: tdbXangDau.id, heDaoTao: "Hệ 3" },
    { code: "HV-XD-004", name: "Châu Thị Ái", lop: "XD-K51A", nganh: "Xăng dầu", tsId: he3.id, batId: tdbXangDau.id, heDaoTao: "Hệ 3" },
    // Hệ 3 – Tiểu đoàn Doanh trại
    { code: "HV-DT-001", name: "Đặng Văn Bắc", lop: "DT-K50A", nganh: "Doanh trại", tsId: he3.id, batId: tdbDoanhTrai.id, heDaoTao: "Hệ 3" },
    { code: "HV-DT-002", name: "Nghiêm Thị Cẩm", lop: "DT-K50A", nganh: "Doanh trại", tsId: he3.id, batId: tdbDoanhTrai.id, heDaoTao: "Hệ 3" },
    { code: "HV-DT-003", name: "Quách Văn Điệp", lop: "DT-K50B", nganh: "Doanh trại", tsId: he3.id, batId: tdbDoanhTrai.id, heDaoTao: "Hệ 3" },
    // Hệ 1 – Sau đại học
    { code: "HV-SDH-001", name: "GS Nguyễn Minh Khoa", lop: "ThS-K20A", nganh: "Thạc sĩ", tsId: he1.id, batId: "", heDaoTao: "Hệ 1" },
    { code: "HV-SDH-002", name: "TS Trần Thị Linh", lop: "ThS-K20A", nganh: "Thạc sĩ", tsId: he1.id, batId: "", heDaoTao: "Hệ 1" },
    { code: "HV-SDH-003", name: "Thượng tá Lê Quang Minh", lop: "TS-K5A", nganh: "Tiến sĩ", tsId: he1.id, batId: "", heDaoTao: "Hệ 1" },
    // Hệ 4 – Quốc tế
    { code: "HV-QT-001", name: "Bounmee Phothivong", lop: "QT-K15A", nganh: "Quốc tế", tsId: he4.id, batId: "", heDaoTao: "Hệ 4" },
    { code: "HV-QT-002", name: "Souvanny Khamphengvong", lop: "QT-K15A", nganh: "Quốc tế", tsId: he4.id, batId: "", heDaoTao: "Hệ 4" },
    { code: "HV-QT-003", name: "Chan Sopheakdey", lop: "QT-K15B", nganh: "Quốc tế", tsId: he4.id, batId: "", heDaoTao: "Hệ 4" },
    { code: "HV-QT-004", name: "Keo Vandeth", lop: "QT-K15B", nganh: "Quốc tế", tsId: he4.id, batId: "", heDaoTao: "Hệ 4" },
  ];

  let created = 0;
  for (const sv of newStudents) {
    const existing = await prisma.hocVien.findFirst({
      where: { maHocVien: sv.code },
    });
    if (existing) continue;

    await prisma.hocVien.create({
      data: {
        maHocVien: sv.code,
        hoTen: sv.name,
        lop: sv.lop,
        nganh: sv.nganh,
        heDaoTao: sv.heDaoTao,
        trainingSystemUnitId: sv.tsId,
        battalionUnitId: sv.batId || null,
        trangThai: "Đang học",
        currentStatus: "ACTIVE",
        khoaHoc: "K50",
        diemTrungBinh: Math.round((6.5 + Math.random() * 2.5) * 10) / 10,
      },
    });
    created++;
  }

  console.log(`  ✓ Đã tạo thêm ${created} học viên mẫu mới`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const systemStats = await prisma.hocVien.groupBy({
    by: ["trainingSystemUnitId"],
    _count: { id: true },
    where: { deletedAt: null },
  });

  console.log("\n📊 Thống kê học viên theo Hệ:");
  const units = await prisma.unit.findMany({
    where: { type: "HE" },
    select: { id: true, name: true, code: true },
  });
  for (const u of units) {
    const stat = systemStats.find((s) => s.trainingSystemUnitId === u.id);
    console.log(`   ${u.name} (${u.code}): ${stat?._count?.id ?? 0} học viên`);
  }

  console.log("\n✅ Seed training systems hoàn thành!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
