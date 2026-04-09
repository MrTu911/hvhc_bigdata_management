/**
 * Seed: M10 Lab Data
 * Tạo dữ liệu mẫu phòng thí nghiệm / thực hành:
 *   - Lab (phòng TN: máy tính, điện tử, vật lý, mô phỏng, quân sự)
 *   - LabEquipment (thiết bị trong từng phòng TN)
 *   - LabSession (buổi thực hành theo lịch)
 *
 * Phụ thuộc:
 *   - Unit (từ seed_units.ts / seed_administrative_units.ts)
 *   - ClassSection (từ seed_teaching_data.ts nếu có, không bắt buộc)
 *   - FacultyProfile (từ seed_faculty_profiles.ts)
 *
 * Run: npx tsx --require dotenv/config prisma/seed/seed_m10_lab_data.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

async function main() {
  console.log('🔬 Bắt đầu seed M10 Lab Data...\n');

  // Load dependencies
  const units = await prisma.unit.findMany({
    where: { type: { in: ['FACULTY', 'DEPARTMENT', 'KHOA', 'PHONG'] } },
    select: { id: true, name: true },
    take: 10,
  });

  const faculty = await prisma.facultyProfile.findMany({
    where: { isActive: true },
    select: { id: true },
    take: 20,
  });

  const classSections = await prisma.classSection.findMany({
    select: { id: true },
    take: 20,
  });

  // ─── 1. Lab ──────────────────────────────────────────────────────────────────
  console.log('1️⃣  Tạo Lab...');

  const labDefs = [
    {
      code: 'LAB-CNTT-01',
      name: 'Phòng thực hành lập trình 01',
      labType: 'COMPUTER' as const,
      building: 'Nhà B1',
      floor: 1,
      roomNumber: 'B101',
      capacity: 40,
      area: 80.0,
      description: 'Phòng thực hành lập trình với 40 máy tính cấu hình cao, dùng cho môn CNTT101, CNTT201, CNTT401',
      regulations: 'Không mang thức ăn/nước uống vào phòng. Tắt máy sau khi sử dụng. Báo cáo sự cố ngay.',
      equipment: 'PC Dell OptiPlex 7090, Màn hình 24", Switch HP, Máy chiếu',
    },
    {
      code: 'LAB-CNTT-02',
      name: 'Phòng thực hành mạng máy tính',
      labType: 'COMPUTER' as const,
      building: 'Nhà B1',
      floor: 2,
      roomNumber: 'B201',
      capacity: 30,
      area: 60.0,
      description: 'Phòng thực hành mạng với hệ thống cabling đầy đủ, dùng cho môn CNTT302, CNTT403',
      regulations: 'Không tự ý thay đổi cấu hình switch/router. Mọi thay đổi cần có sự cho phép của giảng viên.',
      equipment: 'Cisco Switch 2960, Router 2900, PC thực hành, Rack network, Bộ công cụ cáp mạng',
    },
    {
      code: 'LAB-VLLY-01',
      name: 'Phòng thí nghiệm Vật lý',
      labType: 'PHYSICS' as const,
      building: 'Nhà B2',
      floor: 1,
      roomNumber: 'B201-TN',
      capacity: 24,
      area: 70.0,
      description: 'Phòng thí nghiệm vật lý đại cương: cơ học, điện từ, quang học',
      regulations: 'Bắt buộc đeo kính bảo hộ. Không tự ý kết nối điện. Giữ gìn dụng cụ thí nghiệm.',
      equipment: 'Máy đo điện đa năng, Nguồn điện DC/AC, Dao động ký, Bộ dụng cụ cơ học',
    },
    {
      code: 'LAB-DTTU-01',
      name: 'Phòng thí nghiệm Điện tử',
      labType: 'ELECTRONICS' as const,
      building: 'Nhà B2',
      floor: 2,
      roomNumber: 'B202-TN',
      capacity: 20,
      area: 55.0,
      description: 'Phòng thí nghiệm điện tử: mạch số, mạch tương tự, vi điều khiển',
      regulations: 'Kiểm tra nguồn điện trước khi kết nối mạch. Không để dây dẫn trần tiếp xúc. Ghi lại kết quả đo.',
      equipment: 'Oscilloscope Rigol, Máy tạo tín hiệu, Bảng mạch thực hành, Kit Arduino/STM32',
    },
    {
      code: 'LAB-MOPH-01',
      name: 'Phòng mô phỏng chiến thuật',
      labType: 'SIMULATION' as const,
      building: 'Nhà C',
      floor: 2,
      roomNumber: 'C201',
      capacity: 25,
      area: 90.0,
      description: 'Phòng mô phỏng dành cho thực hành chiến thuật, quản lý hậu cần trong môi trường ảo',
      regulations: 'Chỉ sử dụng phần mềm được cấp phép. Bảo mật dữ liệu mô phỏng. Không kết nối mạng ngoài.',
      equipment: 'Máy chủ mô phỏng, Workstation cao cấp, Màn hình đa nhiệm, Hệ thống chiếu phim',
    },
    {
      code: 'LAB-QUAN-01',
      name: 'Phòng thực hành kỹ năng quân sự',
      labType: 'MILITARY' as const,
      building: 'Nhà D',
      floor: 1,
      roomNumber: 'D101',
      capacity: 30,
      area: 120.0,
      description: 'Phòng thực hành kỹ năng quân sự cơ bản: bản đồ, la bàn, sử dụng thiết bị',
      regulations: 'Mặc đồng phục theo quy định. Giữ trật tự trong phòng. Trả lại đầy đủ trang thiết bị sau khi sử dụng.',
      equipment: 'Bộ bản đồ quân sự, La bàn, Ống nhòm, Thiết bị thông tin liên lạc cơ bản',
    },
  ];

  const labMap = new Map<string, string>(); // code → id
  let labCreated = 0;

  for (let i = 0; i < labDefs.length; i++) {
    const def = labDefs[i];
    const existing = await prisma.lab.findUnique({ where: { code: def.code } });
    if (existing) {
      labMap.set(def.code, existing.id);
      continue;
    }

    const created = await prisma.lab.create({
      data: {
        ...def,
        unitId: units.length > 0 ? pick(units, i).id : null,
        managerId: faculty.length > 0 ? pick(faculty, i).id : null,
        status: 'AVAILABLE',
        isActive: true,
      },
    });
    labMap.set(def.code, created.id);
    labCreated++;
  }
  console.log(`  ✔ Lab tạo: ${labCreated}\n`);

  // ─── 2. LabEquipment ──────────────────────────────────────────────────────────
  console.log('2️⃣  Tạo LabEquipment...');

  type EquipmentDef = {
    labCode: string;
    items: Array<{
      code: string;
      name: string;
      equipmentType: 'COMPUTER' | 'SERVER' | 'NETWORK' | 'PROJECTOR' | 'PRINTER' | 'SCANNER' | 'LAB_INSTRUMENT' | 'MEASURING' | 'MILITARY_EQUIP' | 'OTHER';
      brand: string;
      model: string;
      quantity: number;
    }>;
  };

  const equipmentDefs: EquipmentDef[] = [
    {
      labCode: 'LAB-CNTT-01',
      items: [
        { code: 'PC-CNTT01', name: 'Máy tính Dell OptiPlex', equipmentType: 'COMPUTER', brand: 'Dell', model: 'OptiPlex 7090', quantity: 40 },
        { code: 'PROJ-CNTT01', name: 'Máy chiếu giảng dạy', equipmentType: 'PROJECTOR', brand: 'Epson', model: 'EB-X51', quantity: 1 },
        { code: 'SRV-CNTT01', name: 'Máy chủ phòng lab', equipmentType: 'SERVER', brand: 'HP', model: 'ProLiant DL380', quantity: 1 },
        { code: 'PRN-CNTT01', name: 'Máy in laser', equipmentType: 'PRINTER', brand: 'HP', model: 'LaserJet Pro M404', quantity: 2 },
      ],
    },
    {
      labCode: 'LAB-CNTT-02',
      items: [
        { code: 'PC-MANG01', name: 'Máy tính thực hành mạng', equipmentType: 'COMPUTER', brand: 'Lenovo', model: 'ThinkCentre M720', quantity: 30 },
        { code: 'SW-CISCO01', name: 'Switch Cisco Catalyst', equipmentType: 'NETWORK', brand: 'Cisco', model: 'WS-C2960L-24TS', quantity: 8 },
        { code: 'RT-CISCO01', name: 'Router Cisco ISR', equipmentType: 'NETWORK', brand: 'Cisco', model: 'ISR4321/K9', quantity: 4 },
        { code: 'PROJ-MANG01', name: 'Máy chiếu phòng mạng', equipmentType: 'PROJECTOR', brand: 'BenQ', model: 'MW550', quantity: 1 },
      ],
    },
    {
      labCode: 'LAB-VLLY-01',
      items: [
        { code: 'OSC-VL01', name: 'Dao động ký số', equipmentType: 'MEASURING', brand: 'Rigol', model: 'DS1054Z', quantity: 8 },
        { code: 'PSU-VL01', name: 'Nguồn điện DC có thể điều chỉnh', equipmentType: 'LAB_INSTRUMENT', brand: 'Aim-TTi', model: 'PL330', quantity: 12 },
        { code: 'DMM-VL01', name: 'Đồng hồ đo vạn năng', equipmentType: 'MEASURING', brand: 'Fluke', model: '117', quantity: 24 },
        { code: 'OPTK-VL01', name: 'Bộ dụng cụ quang học', equipmentType: 'LAB_INSTRUMENT', brand: 'PASCO', model: 'OS-8516', quantity: 6 },
      ],
    },
    {
      labCode: 'LAB-DTTU-01',
      items: [
        { code: 'OSC-DT01', name: 'Oscilloscope 4 kênh', equipmentType: 'MEASURING', brand: 'Rigol', model: 'DS1074Z', quantity: 10 },
        { code: 'GEN-DT01', name: 'Máy tạo tín hiệu hàm', equipmentType: 'LAB_INSTRUMENT', brand: 'Rigol', model: 'DG1022Z', quantity: 10 },
        { code: 'ARDU-DT01', name: 'Kit thực hành Arduino Uno', equipmentType: 'LAB_INSTRUMENT', brand: 'Arduino', model: 'Uno R3', quantity: 20 },
        { code: 'BREAD-DT01', name: 'Bảng mạch thực hành', equipmentType: 'LAB_INSTRUMENT', brand: 'Generic', model: 'Breadboard 830', quantity: 20 },
        { code: 'SOLDR-DT01', name: 'Mỏ hàn nhiệt độ điều chỉnh', equipmentType: 'LAB_INSTRUMENT', brand: 'Hakko', model: 'FX-888D', quantity: 10 },
      ],
    },
    {
      labCode: 'LAB-MOPH-01',
      items: [
        { code: 'WS-MOPH01', name: 'Máy trạm mô phỏng cao cấp', equipmentType: 'COMPUTER', brand: 'HP', model: 'Z4 G4 Workstation', quantity: 25 },
        { code: 'PROJ-MOPH01', name: 'Máy chiếu phòng mô phỏng', equipmentType: 'PROJECTOR', brand: 'Panasonic', model: 'PT-VMZ60', quantity: 2 },
        { code: 'SRV-MOPH01', name: 'Server mô phỏng trung tâm', equipmentType: 'SERVER', brand: 'Dell', model: 'PowerEdge R750', quantity: 2 },
      ],
    },
    {
      labCode: 'LAB-QUAN-01',
      items: [
        { code: 'BANDO-QU01', name: 'Bộ bản đồ quân sự 1:50000', equipmentType: 'MILITARY_EQUIP', brand: 'Bộ Tổng Tham mưu', model: 'Series M', quantity: 30 },
        { code: 'LACOM-QU01', name: 'La bàn quân sự', equipmentType: 'MILITARY_EQUIP', brand: 'Suunto', model: 'A-30L', quantity: 30 },
        { code: 'ONGNH-QU01', name: 'Ống nhòm 8x42', equipmentType: 'MILITARY_EQUIP', brand: 'Vortex', model: 'Diamondback HD', quantity: 15 },
        { code: 'PROJ-QUAN01', name: 'Màn hình đa chức năng', equipmentType: 'PROJECTOR', brand: 'Samsung', model: 'QM65R', quantity: 1 },
      ],
    },
  ];

  let equipCreated = 0;

  for (let i = 0; i < equipmentDefs.length; i++) {
    const labDef = equipmentDefs[i];
    const labId = labMap.get(labDef.labCode);
    if (!labId) continue;

    for (let j = 0; j < labDef.items.length; j++) {
      const item = labDef.items[j];
      // Tạo equipment theo số lượng thực (tối đa 5 records mẫu / loại thiết bị)
      const sampleCount = Math.min(item.quantity, 5);

      for (let k = 0; k < sampleCount; k++) {
        const equipCode = `${item.code}-${String(k + 1).padStart(3, '0')}`;
        const existing = await prisma.labEquipment.findUnique({ where: { code: equipCode } });
        if (existing) continue;

        const purchaseYear = 2020 + (j % 4);
        await prisma.labEquipment.create({
          data: {
            code: equipCode,
            name: `${item.name} #${k + 1}`,
            labId,
            equipmentType: item.equipmentType,
            brand: item.brand,
            model: item.model,
            serialNumber: `SN-${item.code}-${String(k + 1).padStart(4, '0')}`,
            purchaseDate: new Date(`${purchaseYear}-06-01`),
            warrantyExpiry: new Date(`${purchaseYear + 3}-06-01`),
            purchasePrice: item.equipmentType === 'COMPUTER' ? 15000000
              : item.equipmentType === 'SERVER' ? 80000000
              : item.equipmentType === 'NETWORK' ? 25000000
              : item.equipmentType === 'PROJECTOR' ? 18000000
              : 5000000,
            location: `${labDef.labCode} - Dãy ${String.fromCharCode(65 + (k % 4))}`,
            status: k % 10 === 9 ? 'DEGRADED' : 'OPERATIONAL',
            condition: k % 10 === 9 ? 'FAIR' : 'GOOD',
            lastMaintenanceDate: new Date('2025-07-01'),
            nextMaintenanceDate: new Date('2026-07-01'),
            isActive: true,
          },
        });
        equipCreated++;
      }
    }
  }
  console.log(`  ✔ LabEquipment tạo: ${equipCreated}\n`);

  // ─── 3. LabSession ─────────────────────────────────────────────────────────────
  console.log('3️⃣  Tạo LabSession...');
  let sessionCreated = 0;

  // Lịch buổi thực hành: 2 ngày/tuần, 8 buổi/tháng cho mỗi lab
  const labSessionDefs = [
    { labCode: 'LAB-CNTT-01', topic: 'Thực hành lập trình Python cơ bản', subjectRef: 'CNTT201' },
    { labCode: 'LAB-CNTT-01', topic: 'Thực hành cấu trúc dữ liệu: danh sách liên kết', subjectRef: 'CNTT202' },
    { labCode: 'LAB-CNTT-01', topic: 'Thực hành SQL cơ bản - SELECT, JOIN, GROUP BY', subjectRef: 'CNTT301' },
    { labCode: 'LAB-CNTT-01', topic: 'Thực hành phát triển web: HTML, CSS, JavaScript', subjectRef: 'CNTT401' },
    { labCode: 'LAB-CNTT-02', topic: 'Cấu hình địa chỉ IP và routing tĩnh', subjectRef: 'CNTT302' },
    { labCode: 'LAB-CNTT-02', topic: 'Cấu hình VLAN trên Cisco Switch', subjectRef: 'CNTT302' },
    { labCode: 'LAB-CNTT-02', topic: 'Thực hành bảo mật mạng: firewall, ACL', subjectRef: 'CNTT403' },
    { labCode: 'LAB-VLLY-01', topic: 'Thí nghiệm định luật Ohm và mạch điện cơ bản', subjectRef: 'KHCB102' },
    { labCode: 'LAB-VLLY-01', topic: 'Thí nghiệm quang học: thấu kính và gương', subjectRef: 'KHCB102' },
    { labCode: 'LAB-DTTU-01', topic: 'Thực hành mạch khuếch đại op-amp', subjectRef: 'CNTT302' },
    { labCode: 'LAB-DTTU-01', topic: 'Lập trình Arduino: điều khiển LED và cảm biến', subjectRef: 'CNTT201' },
    { labCode: 'LAB-MOPH-01', topic: 'Mô phỏng kế hoạch hậu cần cấp tiểu đoàn', subjectRef: 'QTKD' },
    { labCode: 'LAB-MOPH-01', topic: 'Thực hành quản lý kho trong môi trường ảo', subjectRef: 'QTKD' },
    { labCode: 'LAB-QUAN-01', topic: 'Đọc bản đồ quân sự và xác định tọa độ', subjectRef: 'LLCT' },
    { labCode: 'LAB-QUAN-01', topic: 'Thực hành sử dụng la bàn và định hướng địa hình', subjectRef: 'LLCT' },
  ];

  // Tạo 4 buổi thực hành cho mỗi chủ đề (2 tháng, 2 buổi/tháng)
  const SESSION_DATES = [
    new Date('2025-09-10'), new Date('2025-09-24'),
    new Date('2025-10-08'), new Date('2025-10-22'),
    new Date('2025-11-05'), new Date('2025-11-19'),
    new Date('2025-12-03'), new Date('2025-12-17'),
  ];
  const SESSION_START_TIMES = ['07:30', '10:00', '13:30'];
  const SESSION_END_TIMES   = ['09:30', '12:00', '15:30'];

  for (let i = 0; i < labSessionDefs.length; i++) {
    const def = labSessionDefs[i];
    const labId = labMap.get(def.labCode);
    if (!labId) continue;

    const supervisor = faculty.length > 0 ? pick(faculty, i) : null;
    const classSection = classSections.length > 0 ? pick(classSections, i) : null;

    // Mỗi chủ đề tạo 2 buổi
    for (let d = 0; d < 2; d++) {
      const sessionDate = SESSION_DATES[(i * 2 + d) % SESSION_DATES.length];
      const slotIdx = (i + d) % SESSION_START_TIMES.length;
      const sessionCode = `LS-${def.labCode}-${i}-${d}`;

      const existing = await prisma.labSession.findUnique({ where: { code: sessionCode } });
      if (existing) continue;

      await prisma.labSession.create({
        data: {
          code: sessionCode,
          labId,
          classSectionId: classSection?.id ?? null,
          sessionDate,
          startTime: SESSION_START_TIMES[slotIdx],
          endTime: SESSION_END_TIMES[slotIdx],
          topic: def.topic,
          description: `Buổi thực hành ${d + 1}: ${def.topic}. Học viên cần chuẩn bị bài trước.`,
          supervisorId: supervisor?.id ?? null,
          maxStudents: labDefs.find(l => l.code === def.labCode)?.capacity || 30,
          registeredCount: 20 + (i * 3 + d * 7) % 15,
          status: sessionDate < new Date() ? 'COMPLETED' : 'SCHEDULED',
        },
      });
      sessionCreated++;
    }
  }
  console.log(`  ✔ LabSession tạo: ${sessionCreated}\n`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('📊 TỔNG KẾT:');
  const [labCount, equipCount, lsCount] = await Promise.all([
    prisma.lab.count(),
    prisma.labEquipment.count(),
    prisma.labSession.count(),
  ]);
  console.log(`  Lab:          ${labCount}`);
  console.log(`  LabEquipment: ${equipCount}`);
  console.log(`  LabSession:   ${lsCount}`);
  console.log('\n✅ Seed M10 Lab Data hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
