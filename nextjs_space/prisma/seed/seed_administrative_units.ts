import { PrismaClient, AdministrativeLevel } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Seed Quận/Huyện và Phường/Xã cho các tỉnh/thành phố chính
 * Theo địa danh hành chính Việt Nam (mã theo Tổng cục Thống kê)
 */

// Hà Nội - Quận/Huyện
const hanoiDistricts = [
  // Quận nội thành
  { code: '001', name: 'Ba Đình', fullName: 'Quận Ba Đình' },
  { code: '002', name: 'Hoàn Kiếm', fullName: 'Quận Hoàn Kiếm' },
  { code: '003', name: 'Tây Hồ', fullName: 'Quận Tây Hồ' },
  { code: '004', name: 'Long Biên', fullName: 'Quận Long Biên' },
  { code: '005', name: 'Cầu Giấy', fullName: 'Quận Cầu Giấy' },
  { code: '006', name: 'Đống Đa', fullName: 'Quận Đống Đa' },
  { code: '007', name: 'Hai Bà Trưng', fullName: 'Quận Hai Bà Trưng' },
  { code: '008', name: 'Hoàng Mai', fullName: 'Quận Hoàng Mai' },
  { code: '009', name: 'Thanh Xuân', fullName: 'Quận Thanh Xuân' },
  { code: '016', name: 'Hà Đông', fullName: 'Quận Hà Đông' },
  { code: '017', name: 'Nam Từ Liêm', fullName: 'Quận Nam Từ Liêm' },
  { code: '018', name: 'Bắc Từ Liêm', fullName: 'Quận Bắc Từ Liêm' },
  // Huyện ngoại thành
  { code: '250', name: 'Sóc Sơn', fullName: 'Huyện Sóc Sơn' },
  { code: '268', name: 'Đông Anh', fullName: 'Huyện Đông Anh' },
  { code: '269', name: 'Gia Lâm', fullName: 'Huyện Gia Lâm' },
  { code: '271', name: 'Thanh Trì', fullName: 'Huyện Thanh Trì' },
  { code: '272', name: 'Thường Tín', fullName: 'Huyện Thường Tín' },
  { code: '273', name: 'Phú Xuyên', fullName: 'Huyện Phú Xuyên' },
  { code: '274', name: 'Ứng Hòa', fullName: 'Huyện Ứng Hòa' },
  { code: '275', name: 'Mỹ Đức', fullName: 'Huyện Mỹ Đức' },
  { code: '276', name: 'Chương Mỹ', fullName: 'Huyện Chương Mỹ' },
  { code: '277', name: 'Thanh Oai', fullName: 'Huyện Thanh Oai' },
  { code: '278', name: 'Hoài Đức', fullName: 'Huyện Hoài Đức' },
  { code: '279', name: 'Quốc Oai', fullName: 'Huyện Quốc Oai' },
  { code: '280', name: 'Thạch Thất', fullName: 'Huyện Thạch Thất' },
  { code: '281', name: 'Dan Phượng', fullName: 'Huyện Dan Phượng' },
  { code: '282', name: 'Mê Linh', fullName: 'Huyện Mê Linh' },
  { code: '288', name: 'Ba Vì', fullName: 'Huyện Ba Vì' },
  { code: '019', name: 'Sơn Tây', fullName: 'Thị xã Sơn Tây' },
];

// Phường của Quận Ba Đình (mẫu)
const baDinhWards = [
  { code: '00001', name: 'Phúc Xá', fullName: 'Phường Phúc Xá' },
  { code: '00004', name: 'Trúc Bạch', fullName: 'Phường Trúc Bạch' },
  { code: '00006', name: 'Vĩnh Phúc', fullName: 'Phường Vĩnh Phúc' },
  { code: '00007', name: 'Cống Vị', fullName: 'Phường Cống Vị' },
  { code: '00008', name: 'Liễu Giai', fullName: 'Phường Liễu Giai' },
  { code: '00010', name: 'Nguyễn Trung Trực', fullName: 'Phường Nguyễn Trung Trực' },
  { code: '00013', name: 'Quán Thánh', fullName: 'Phường Quán Thánh' },
  { code: '00016', name: 'Ngọc Hà', fullName: 'Phường Ngọc Hà' },
  { code: '00019', name: 'Điện Biên', fullName: 'Phường Điện Biên' },
  { code: '00022', name: 'Đội Cấn', fullName: 'Phường Đội Cấn' },
  { code: '00025', name: 'Ngọc Khánh', fullName: 'Phường Ngọc Khánh' },
  { code: '00028', name: 'Kim Mã', fullName: 'Phường Kim Mã' },
  { code: '00031', name: 'Giảng Võ', fullName: 'Phường Giảng Võ' },
  { code: '00034', name: 'Thành Công', fullName: 'Phường Thành Công' },
];

// Hoàn Kiếm wards
const hoanKiemWards = [
  { code: '00037', name: 'Phúc Tân', fullName: 'Phường Phúc Tân' },
  { code: '00040', name: 'Đồng Xuân', fullName: 'Phường Đồng Xuân' },
  { code: '00043', name: 'Hàng Mã', fullName: 'Phường Hàng Mã' },
  { code: '00046', name: 'Hàng Buồm', fullName: 'Phường Hàng Buồm' },
  { code: '00049', name: 'Hàng Đào', fullName: 'Phường Hàng Đào' },
  { code: '00052', name: 'Hàng Bồ', fullName: 'Phường Hàng Bồ' },
  { code: '00055', name: 'Cửa Đông', fullName: 'Phường Cửa Đông' },
  { code: '00058', name: 'Lý Thái Tổ', fullName: 'Phường Lý Thái Tổ' },
  { code: '00061', name: 'Hàng Bạc', fullName: 'Phường Hàng Bạc' },
  { code: '00064', name: 'Hàng Gai', fullName: 'Phường Hàng Gai' },
  { code: '00067', name: 'Chương Dương Độ', fullName: 'Phường Chương Dương Độ' },
  { code: '00070', name: 'Hàng Trống', fullName: 'Phường Hàng Trống' },
  { code: '00073', name: 'Cửa Nam', fullName: 'Phường Cửa Nam' },
  { code: '00076', name: 'Hàng Bông', fullName: 'Phường Hàng Bông' },
  { code: '00079', name: 'Tràng Tiền', fullName: 'Phường Tràng Tiền' },
  { code: '00082', name: 'Tràng Tiền', fullName: 'Phường Tràng Tiền' },
  { code: '00085', name: 'Phan Chu Trinh', fullName: 'Phường Phan Chu Trinh' },
];

// TP. Hồ Chí Minh - Quận/Huyện
const hcmDistricts = [
  // Quận nội thành
  { code: '760', name: 'Quận 1', fullName: 'Quận 1' },
  { code: '769', name: 'Quận 3', fullName: 'Quận 3' },
  { code: '770', name: 'Quận 4', fullName: 'Quận 4' },
  { code: '771', name: 'Quận 5', fullName: 'Quận 5' },
  { code: '772', name: 'Quận 6', fullName: 'Quận 6' },
  { code: '773', name: 'Quận 7', fullName: 'Quận 7' },
  { code: '774', name: 'Quận 8', fullName: 'Quận 8' },
  { code: '775', name: 'Quận 10', fullName: 'Quận 10' },
  { code: '776', name: 'Quận 11', fullName: 'Quận 11' },
  { code: '777', name: 'Quận 12', fullName: 'Quận 12' },
  { code: '778', name: 'Gò Vấp', fullName: 'Quận Gò Vấp' },
  { code: '761', name: 'Bình Thạnh', fullName: 'Quận Bình Thạnh' },
  { code: '762', name: 'Tân Bình', fullName: 'Quận Tân Bình' },
  { code: '763', name: 'Tân Phú', fullName: 'Quận Tân Phú' },
  { code: '764', name: 'Phú Nhuận', fullName: 'Quận Phú Nhuận' },
  { code: '765', name: 'Bình Tân', fullName: 'Quận Bình Tân' },
  { code: '766', name: 'Thủ Đức', fullName: 'Thành phố Thủ Đức' },
  // Huyện ngoại thành
  { code: '783', name: 'Củ Chi', fullName: 'Huyện Củ Chi' },
  { code: '784', name: 'Hóc Môn', fullName: 'Huyện Hóc Môn' },
  { code: '785', name: 'Bình Chánh', fullName: 'Huyện Bình Chánh' },
  { code: '786', name: 'Nhà Bè', fullName: 'Huyện Nhà Bè' },
  { code: '787', name: 'Cần Giờ', fullName: 'Huyện Cần Giờ' },
];

// Đà Nẵng - Quận/Huyện
const danangDistricts = [
  { code: '490', name: 'Liên Chiểu', fullName: 'Quận Liên Chiểu' },
  { code: '491', name: 'Thanh Khê', fullName: 'Quận Thanh Khê' },
  { code: '492', name: 'Hải Châu', fullName: 'Quận Hải Châu' },
  { code: '493', name: 'Sơn Trà', fullName: 'Quận Sơn Trà' },
  { code: '494', name: 'Ngũ Hành Sơn', fullName: 'Quận Ngũ Hành Sơn' },
  { code: '495', name: 'Cẩm Lệ', fullName: 'Quận Cẩm Lệ' },
  { code: '497', name: 'Hòa Vang', fullName: 'Huyện Hòa Vang' },
  { code: '498', name: 'Hoàng Sa', fullName: 'Huyện Hoàng Sa' },
];

// Hải Phòng - Quận/Huyện
const haiphongDistricts = [
  { code: '303', name: 'Hồng Bàng', fullName: 'Quận Hồng Bàng' },
  { code: '304', name: 'Ngô Quyền', fullName: 'Quận Ngô Quyền' },
  { code: '305', name: 'Lê Chân', fullName: 'Quận Lê Chân' },
  { code: '306', name: 'Hải An', fullName: 'Quận Hải An' },
  { code: '307', name: 'Kiến An', fullName: 'Quận Kiến An' },
  { code: '308', name: 'Đồ Sơn', fullName: 'Quận Đồ Sơn' },
  { code: '309', name: 'Dương Kinh', fullName: 'Quận Dương Kinh' },
  { code: '311', name: 'Thủy Nguyên', fullName: 'Huyện Thủy Nguyên' },
  { code: '312', name: 'An Dương', fullName: 'Huyện An Dương' },
  { code: '313', name: 'An Lão', fullName: 'Huyện An Lão' },
  { code: '314', name: 'Kiến Thụy', fullName: 'Huyện Kiến Thụy' },
  { code: '315', name: 'Tiên Lãng', fullName: 'Huyện Tiên Lãng' },
  { code: '316', name: 'Vĩnh Bảo', fullName: 'Huyện Vĩnh Bảo' },
  { code: '317', name: 'Cát Hải', fullName: 'Huyện Cát Hải' },
  { code: '318', name: 'Bạch Long Vĩ', fullName: 'Huyện Bạch Long Vĩ' },
];

// Cần Thơ - Quận/Huyện
const canthoDistricts = [
  { code: '916', name: 'Ninh Kiều', fullName: 'Quận Ninh Kiều' },
  { code: '917', name: 'Ô Môn', fullName: 'Quận Ô Môn' },
  { code: '918', name: 'Bình Thủy', fullName: 'Quận Bình Thủy' },
  { code: '919', name: 'Cái Răng', fullName: 'Quận Cái Răng' },
  { code: '923', name: 'Thốt Nốt', fullName: 'Quận Thốt Nốt' },
  { code: '924', name: 'Vĩnh Thạnh', fullName: 'Huyện Vĩnh Thạnh' },
  { code: '925', name: 'Cờ Đỏ', fullName: 'Huyện Cờ Đỏ' },
  { code: '926', name: 'Phong Điền', fullName: 'Huyện Phong Điền' },
  { code: '927', name: 'Thới Lai', fullName: 'Huyện Thới Lai' },
];

async function seedDistricts() {
  console.log('=== Seeding Districts (Quận/Huyện) ===');
  
  // Get province IDs (codes match the seed_master_data.ts file)
  const hanoi = await prisma.administrativeUnit.findFirst({ 
    where: { code: '01', level: 'PROVINCE' } 
  });
  const hcm = await prisma.administrativeUnit.findFirst({ 
    where: { code: '79', level: 'PROVINCE' } 
  });
  const danang = await prisma.administrativeUnit.findFirst({ 
    where: { code: '48', level: 'PROVINCE' } 
  });
  const haiphong = await prisma.administrativeUnit.findFirst({ 
    where: { code: '31', level: 'PROVINCE' } 
  });
  const cantho = await prisma.administrativeUnit.findFirst({ 
    where: { code: '92', level: 'PROVINCE' } 
  });

  // Create districts
  if (hanoi) {
    console.log('Adding districts for Hà Nội...');
    for (let i = 0; i < hanoiDistricts.length; i++) {
      const d = hanoiDistricts[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `01-${d.code}` },
        update: { name: d.name, fullName: d.fullName, sortOrder: i + 1 },
        create: {
          code: `01-${d.code}`,
          name: d.name,
          fullName: d.fullName,
          level: AdministrativeLevel.DISTRICT,
          parentId: hanoi.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${hanoiDistricts.length} districts`);
  }

  if (hcm) {
    console.log('Adding districts for TP.HCM...');
    for (let i = 0; i < hcmDistricts.length; i++) {
      const d = hcmDistricts[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `79-${d.code}` },
        update: { name: d.name, fullName: d.fullName, sortOrder: i + 1 },
        create: {
          code: `79-${d.code}`,
          name: d.name,
          fullName: d.fullName,
          level: AdministrativeLevel.DISTRICT,
          parentId: hcm.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${hcmDistricts.length} districts`);
  }

  if (danang) {
    console.log('Adding districts for Đà Nẵng...');
    for (let i = 0; i < danangDistricts.length; i++) {
      const d = danangDistricts[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `48-${d.code}` },
        update: { name: d.name, fullName: d.fullName, sortOrder: i + 1 },
        create: {
          code: `48-${d.code}`,
          name: d.name,
          fullName: d.fullName,
          level: AdministrativeLevel.DISTRICT,
          parentId: danang.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${danangDistricts.length} districts`);
  }

  if (haiphong) {
    console.log('Adding districts for Hải Phòng...');
    for (let i = 0; i < haiphongDistricts.length; i++) {
      const d = haiphongDistricts[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `31-${d.code}` },
        update: { name: d.name, fullName: d.fullName, sortOrder: i + 1 },
        create: {
          code: `31-${d.code}`,
          name: d.name,
          fullName: d.fullName,
          level: AdministrativeLevel.DISTRICT,
          parentId: haiphong.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${haiphongDistricts.length} districts`);
  }

  if (cantho) {
    console.log('Adding districts for Cần Thơ...');
    for (let i = 0; i < canthoDistricts.length; i++) {
      const d = canthoDistricts[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `92-${d.code}` },
        update: { name: d.name, fullName: d.fullName, sortOrder: i + 1 },
        create: {
          code: `92-${d.code}`,
          name: d.name,
          fullName: d.fullName,
          level: AdministrativeLevel.DISTRICT,
          parentId: cantho.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${canthoDistricts.length} districts`);
  }
}

async function seedWards() {
  console.log('\n=== Seeding Wards (Phường/Xã) for key districts ===');
  
  // Get Ba Đình district
  const baDinh = await prisma.administrativeUnit.findFirst({ 
    where: { code: '01-001', level: 'DISTRICT' } 
  });
  
  // Get Hoàn Kiếm district
  const hoanKiem = await prisma.administrativeUnit.findFirst({ 
    where: { code: '01-002', level: 'DISTRICT' } 
  });

  if (baDinh) {
    console.log('Adding wards for Ba Đình...');
    for (let i = 0; i < baDinhWards.length; i++) {
      const w = baDinhWards[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `01-001-${w.code}` },
        update: { name: w.name, fullName: w.fullName, sortOrder: i + 1 },
        create: {
          code: `01-001-${w.code}`,
          name: w.name,
          fullName: w.fullName,
          level: AdministrativeLevel.WARD,
          parentId: baDinh.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${baDinhWards.length} wards`);
  }

  if (hoanKiem) {
    console.log('Adding wards for Hoàn Kiếm...');
    for (let i = 0; i < hoanKiemWards.length; i++) {
      const w = hoanKiemWards[i];
      await prisma.administrativeUnit.upsert({
        where: { code: `01-002-${w.code}` },
        update: { name: w.name, fullName: w.fullName, sortOrder: i + 1 },
        create: {
          code: `01-002-${w.code}`,
          name: w.name,
          fullName: w.fullName,
          level: AdministrativeLevel.WARD,
          parentId: hoanKiem.id,
          sortOrder: i + 1,
          isActive: true,
        }
      });
    }
    console.log(`  ✓ Added ${hoanKiemWards.length} wards`);
  }
}

async function main() {
  console.log('========================================');
  console.log('  ADMINISTRATIVE UNITS SEED SCRIPT');
  console.log('========================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    await seedDistricts();
    await seedWards();
    
    // Count results
    const districtCount = await prisma.administrativeUnit.count({
      where: { level: 'DISTRICT', isActive: true }
    });
    const wardCount = await prisma.administrativeUnit.count({
      where: { level: 'WARD', isActive: true }
    });
    
    console.log('\n========================================');
    console.log('  SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Total districts: ${districtCount}`);
    console.log(`Total wards: ${wardCount}`);
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
