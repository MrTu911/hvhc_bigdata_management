/**
 * Seed: Gán nhân sự vào đơn vị dựa trên department & role
 * Run: npx tsx --require dotenv/config prisma/seed/seed_unit_assignments.ts
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ─── Bản đồ: department string (lowercase pattern) → unit code ───
const DEPT_TO_UNIT: Array<[RegExp, string]> = [
  // Phòng ban
  [/phòng đào tạo|phong dao tao|pdt/i,          'PDT'],
  [/phòng khqs|khoa học quân sự|pqlkh/i,        'PQLKH'],
  [/phòng chính trị|pctct/i,                     'PCTCT'],
  [/phòng tổ chức|cán bộ|ptchc/i,               'PTCHC'],
  [/phòng kế hoạch|tài chính|b5/i,              'B5'],
  [/phòng hc.kt|hành chính|ban hành chính/i,    'BAN1'],
  [/ban cntt|ban cong nghe/i,                    'BAN2'],
  [/văn phòng|vp\b/i,                           'VP'],
  [/ban giám đốc|bgd/i,                          'BGD'],
  [/phòng sau đh|hệ đt sau đh/i,                'B1'],
  [/ban khảo thí|khao thi/i,                     'B1'],
  [/ban tài chính|ban tc/i,                      'B5'],

  // Viện nghiên cứu
  [/viện.*(khhcqs|nghiên cứu)|tạp chí/i,        'VIEN1'],

  // Khoa
  [/khoa ngoại ngữ|k8|ngoai ngu/i,              'K8'],
  [/khoa khoa học cơ bản|khcb|k7/i,             'K7'],
  [/khoa (chỉ huy|hậu cần chiến dịch)|k1\b/i,   'K1'],
  [/khoa quân nhu|k2\b/i,                        'K2'],
  [/khoa vận tải|k3\b/i,                         'K3'],
  [/khoa xăng dầu|k4\b/i,                        'K4'],
  [/khoa tài chính|k5\b/i,                       'K5'],
  [/khoa quân sự|ctđ.ctct|chinh tri/i,           'K6'],
  [/khoa cntt|kcntt/i,                           'KCNTT'],
  [/hậu cần quân sự|khcqs/i,                     'KHCQS'],
  [/kỹ thuật xây dựng|kktxd/i,                  'KKTXD'],
  [/tài chính quân sự|ktcqs/i,                   'KTCQS'],
  [/vận tải.*hóa chất|kvthc/i,                   'KVTHC'],

  // Bộ môn → map về khoa cha
  [/bm.*anh văn|bm.*english/i,                   'BM_K8_1'],
  [/bm.*trung văn|bm.*chinese/i,                 'BM_K8_1'],
  [/bm.*nn.*pháp luật|bm.*ngoại ngữ/i,          'BM_K8_1'],
  [/bm.*toán|bm.*mathematics/i,                  'BM_K7_1'],
  [/bm.*tin học|bm.*cntt|bm.*it\b/i,             'BM_K7_2'],
  [/bm.*lý|bm.*vật lý/i,                         'BM_K7_1'],
  [/bm.*hóa|bm.*chemistry/i,                     'BM_K7_1'],
  [/bm.*kt cơ sở|bm.*kỹ thuật cơ sở/i,          'BM_K5_1'],
  [/bm.*kinh tế/i,                               'BM_K5_1'],
  [/bm.*hậu cần chiến dịch|bm.*hc ch/i,         'BM_K1_1'],
  [/bm.*hậu cần chung|bm.*hc bc/i,              'BM_K1_2'],
  [/bm.*chỉ huy|bm.*tham mưu/i,                 'BM_K1_2'],
  [/bm.*ls đcsvn|bm.*lịch sử|bm.*chính trị/i,   'K6'],
  [/bm.*tâm lý|bm.*giáo dục/i,                   'K6'],
  [/bm.*kỹ thuật|bm.*vật tư|bm.*bảo đảm/i,      'BM_K2_1'],
  [/bm.*thương phẩm/i,                           'BM_K2_3'],
  [/bm.*vận tải/i,                               'BM_K3_1'],
  [/bm.*xăng dầu|bm.*bảo đảm.*xăng/i,           'BM_K4_1'],
  [/bm.*huấn luyện|bm.*thể lực/i,               'BM_K6_1'],

  // Hệ học
  [/hệ ch tham mưu|hệ 1/i,                       'HE1'],
  [/hệ quản lý|hệ 2|hệ đt chuyên/i,              'HE2'],
  [/hệ quốc tế/i,                                'K8'],
  [/hệ đt sau đh/i,                              'B1'],

  // Tiểu đoàn / Đại đội (học viên)
  [/tiểu đoàn 1\b|td1\b/i,                       'TD1'],
  [/tiểu đoàn 2\b|td2\b/i,                       'TD2'],
  [/tiểu đoàn 3\b|td3\b/i,                       'TD3'],
  [/tiểu đoàn 4\b|td4\b/i,                       'TD4'],
];

// Fallback theo role
const ROLE_FALLBACK: Record<string, string[]> = {
  HOC_VIEN:           ['TD3', 'TD4', 'TD1', 'TD2'],
  NGHIEN_CUU_VIEN:    ['VIEN1', 'K1', 'K2', 'K5', 'PQLKH', 'KCNTT', 'K7'],
  CHI_HUY_KHOA_PHONG: ['BGD', 'B1', 'B2', 'B3', 'B4', 'B5', 'VP'],
  CHU_NHIEM_BO_MON:   ['BM_K1_1', 'BM_K2_1', 'BM_K7_1', 'BM_K8_1', 'K6'],
  GIANG_VIEN:         ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'KCNTT'],
  QUAN_TRI_HE_THONG:  ['BAN2', 'HVHC'],
};

function findUnitCode(department: string | null, role: string): string | null {
  if (department) {
    for (const [pattern, code] of DEPT_TO_UNIT) {
      if (pattern.test(department)) return code;
    }
  }
  const fallbacks = ROLE_FALLBACK[role];
  return fallbacks ? fallbacks[0] : 'HVHC';
}

async function main() {
  // Load all units by code
  const units = await prisma.unit.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true },
  });
  const unitByCode = new Map(units.map(u => [u.code, u]));

  // Load all users without a unit
  const users = await prisma.user.findMany({
    where: { unitId: null },
    select: { id: true, name: true, email: true, role: true, department: true },
    orderBy: { role: 'asc' },
  });

  console.log(`\n📋 Tổng users chưa có đơn vị: ${users.length}\n`);

  // Build assignment map: unitId → userIds[]
  const assignments = new Map<string, string[]>();
  const skipped: string[] = [];

  // For HOC_VIEN: round-robin across TD1..TD4
  const hocVienUnits = ['TD3', 'TD4', 'TD1', 'TD2'];
  let hocVienIdx = 0;

  // For NGHIEN_CUU_VIEN: distribute across research units
  const nghienCuuUnits = ['VIEN1', 'K1', 'K2', 'K5', 'PQLKH', 'KCNTT', 'K7', 'VIEN1', 'K3', 'K4'];
  let nghienCuuIdx = 0;

  // For GIANG_VIEN: distribute across Khoa
  const giangVienUnits = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6', 'K7', 'K8', 'KCNTT', 'KHCQS', 'KTCQS', 'KVTHC'];
  let giangVienIdx = 0;

  for (const user of users) {
    let targetCode: string | null = null;

    if (user.role === 'HOC_VIEN') {
      targetCode = hocVienUnits[hocVienIdx % hocVienUnits.length];
      hocVienIdx++;
    } else if (user.role === 'NGHIEN_CUU_VIEN') {
      // Try dept first, else round-robin
      const fromDept = findUnitCode(user.department, user.role);
      if (fromDept && fromDept !== 'HVHC') {
        targetCode = fromDept;
      } else {
        targetCode = nghienCuuUnits[nghienCuuIdx % nghienCuuUnits.length];
        nghienCuuIdx++;
      }
    } else if (user.role === 'GIANG_VIEN') {
      const fromDept = findUnitCode(user.department, user.role);
      if (fromDept && fromDept !== 'HVHC') {
        targetCode = fromDept;
      } else {
        targetCode = giangVienUnits[giangVienIdx % giangVienUnits.length];
        giangVienIdx++;
      }
    } else {
      targetCode = findUnitCode(user.department, user.role);
    }

    if (!targetCode) {
      targetCode = 'HVHC'; // final fallback
    }

    const unit = unitByCode.get(targetCode);
    if (!unit) {
      skipped.push(`${user.name} (${user.role}) → code "${targetCode}" not found`);
      continue;
    }

    if (!assignments.has(unit.id)) assignments.set(unit.id, []);
    assignments.get(unit.id)!.push(user.id);
  }

  // Execute bulk updates
  console.log('🔗 Gán nhân sự vào đơn vị...\n');
  let totalAssigned = 0;

  for (const [unitId, userIds] of assignments) {
    const unit = units.find(u => u.id === unitId)!;
    const result = await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { unitId },
    });
    console.log(`  ✅ ${unit.code.padEnd(12)} ${unit.name.padEnd(35)} → ${result.count} nhân sự`);
    totalAssigned += result.count;
  }

  console.log(`\n📊 Kết quả:`);
  console.log(`  Đã gán: ${totalAssigned} nhân sự vào ${assignments.size} đơn vị`);
  if (skipped.length > 0) {
    console.log(`  Bỏ qua: ${skipped.length}`);
    skipped.forEach(s => console.log(`    - ${s}`));
  }

  // Final stats
  const finalStats = await prisma.unit.findMany({
    where: { active: true },
    select: { code: true, name: true, _count: { select: { users: true } } },
    orderBy: [{ level: 'asc' }, { code: 'asc' }],
  });

  console.log('\n🏢 Thống kê nhân sự theo đơn vị:');
  finalStats.filter(u => u._count.users > 0).forEach(u => {
    console.log(`  ${u.code.padEnd(12)} ${u._count.users.toString().padStart(3)} nhân sự  -  ${u.name}`);
  });

  const totalLinked = await prisma.user.count({ where: { unitId: { not: null } } });
  const totalUnlinked = await prisma.user.count({ where: { unitId: null } });
  console.log(`\n  Tổng đã liên kết: ${totalLinked} | Chưa liên kết: ${totalUnlinked}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
