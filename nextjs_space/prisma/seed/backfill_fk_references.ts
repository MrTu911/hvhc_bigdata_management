import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Map tên dân tộc về normalized form để matching
function normalizeEthnicity(text: string): string {
  if (!text) return '';
  const normalized = text.toLowerCase().trim();
  
  // Mapping phổ biến
  const mappings: Record<string, string> = {
    'kinh': 'Kinh',
    'tày': 'Tày',
    'tay': 'Tày',
    'thái': 'Thái',
    'thai': 'Thái',
    'mường': 'Mường',
    'muong': 'Mường',
    'khmer': 'Khmer',
    'nùng': 'Nùng',
    'nung': 'Nùng',
    'hoa': 'Hoa',
    "h'mông": "H'Mông",
    'hmong': "H'Mông",
    'mông': "H'Mông",
    'dao': 'Dao',
    'gia rai': 'Gia Rai',
    'gia-rai': 'Gia Rai',
    'ê đê': 'Ê Đê',
    'ede': 'Ê Đê',
    'ba na': 'Ba Na',
    'bana': 'Ba Na',
    'xơ đăng': 'Xơ Đăng',
    'xodang': 'Xơ Đăng',
    'sán chay': 'Sán Chay',
    'cơ tu': 'Cơ Tu',
    'cotu': 'Cơ Tu',
    'chăm': 'Chăm',
    'cham': 'Chăm',
    'sán dìu': 'Sán Dìu',
    'hrê': 'Hrê',
    'ra glai': 'Ra Glai',
    'raglai': 'Ra Glai',
    'mnông': 'Mnông',
    'thổ': 'Thổ',
    'xtiêng': 'Xtiêng',
    'stieng': 'Xtiêng',
    'khơ mú': 'Khơ Mú',
    'khomu': 'Khơ Mú',
  };
  
  return mappings[normalized] || text;
}

// Map tên tôn giáo về normalized form
function normalizeReligion(text: string): string {
  if (!text) return '';
  const normalized = text.toLowerCase().trim();
  
  const mappings: Record<string, string> = {
    'không': 'Không',
    'khong': 'Không',
    'none': 'Không',
    'không có': 'Không',
    'phật giáo': 'Phật giáo',
    'phat giao': 'Phật giáo',
    'phật': 'Phật giáo',
    'phật tử': 'Phật giáo',
    'công giáo': 'Công giáo',
    'cong giao': 'Công giáo',
    'thiên chúa giáo': 'Công giáo',
    'tin lành': 'Tin lành',
    'tin lanh': 'Tin lành',
    'hồi giáo': 'Hồi giáo',
    'islam': 'Hồi giáo',
    'cao đài': 'Cao Đài',
    'cao dai': 'Cao Đài',
    'hòa hảo': 'Hòa Hảo',
    'hoa hao': 'Hòa Hảo',
    'phật giáo hòa hảo': 'Hòa Hảo',
    'ấn độ giáo': 'Ấn Độ giáo',
    'hindu': 'Ấn Độ giáo',
  };
  
  return mappings[normalized] || text;
}

// Map địa danh về tỉnh/thành phố
function extractProvince(text: string): string | null {
  if (!text) return null;
  
  // Danh sách tỉnh thành để match
  const provinces = [
    'Hà Nội', 'Hồ Chí Minh', 'TP. Hồ Chí Minh', 'TP.HCM', 'Sài Gòn',
    'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
    'Bắc Giang', 'Bắc Kạn', 'Bắc Ninh', 'Bến Tre', 'Bình Dương', 'Bình Định',
    'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
    'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam',
    'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình', 'Hưng Yên', 'Khánh Hòa',
    'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai',
    'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ',
    'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
    'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hóa',
    'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long',
    'Vĩnh Phúc', 'Yên Bái', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bạc Liêu'
  ];
  
  // Tìm tỉnh trong text
  for (const province of provinces) {
    if (text.toLowerCase().includes(province.toLowerCase())) {
      return province;
    }
  }
  
  // Thử match đơn giản hơn
  const simpleMappings: Record<string, string> = {
    'hà nội': 'Hà Nội',
    'hanoi': 'Hà Nội',
    'hn': 'Hà Nội',
    'tp.hcm': 'Hồ Chí Minh',
    'hcm': 'Hồ Chí Minh',
    'sài gòn': 'Hồ Chí Minh',
    'saigon': 'Hồ Chí Minh',
    'đà nẵng': 'Đà Nẵng',
    'da nang': 'Đà Nẵng',
    'hải phòng': 'Hải Phòng',
    'hai phong': 'Hải Phòng',
    'nghệ an': 'Nghệ An',
    'thanh hóa': 'Thanh Hóa',
    'thanh hoá': 'Thanh Hóa',
  };
  
  const lowerText = text.toLowerCase().trim();
  for (const [key, value] of Object.entries(simpleMappings)) {
    if (lowerText.includes(key)) {
      return value;
    }
  }
  
  return null;
}

async function backfillUserReferences() {
  console.log('\n=== BACKFILL USER FK REFERENCES ===\n');
  
  // Load master data
  const ethnicities = await prisma.ethnicity.findMany({ where: { isActive: true } });
  const religions = await prisma.religion.findMany({ where: { isActive: true } });
  const provinces = await prisma.administrativeUnit.findMany({ 
    where: { isActive: true, level: 'PROVINCE' }
  });
  const positions = await prisma.position.findMany({ where: { isActive: true } });
  
  console.log(`Loaded: ${ethnicities.length} ethnicities, ${religions.length} religions, ${provinces.length} provinces, ${positions.length} positions`);
  
  // Get users without FK references but with text values
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { ethnicity: { not: null }, ethnicityId: null },
        { religion: { not: null }, religionId: null },
        { birthPlace: { not: null }, birthPlaceId: null },
        { placeOfOrigin: { not: null }, placeOfOriginId: null },
        { position: { not: null }, positionId: null },
      ]
    },
    select: {
      id: true,
      name: true,
      ethnicity: true,
      religion: true,
      birthPlace: true,
      placeOfOrigin: true,
      position: true,
      ethnicityId: true,
      religionId: true,
      birthPlaceId: true,
      placeOfOriginId: true,
      positionId: true,
    }
  });
  
  console.log(`Found ${users.length} users to backfill`);
  
  let ethnicityMatched = 0, religionMatched = 0, birthPlaceMatched = 0, 
      placeOfOriginMatched = 0, positionMatched = 0;
  let ethnicityUnmatched: string[] = [];
  let religionUnmatched: string[] = [];
  
  for (const user of users) {
    const updates: Record<string, string> = {};
    
    // Match ethnicity
    if (user.ethnicity && !user.ethnicityId) {
      const normalized = normalizeEthnicity(user.ethnicity);
      const found = ethnicities.find(e => 
        e.name.toLowerCase() === normalized.toLowerCase() ||
        e.name.toLowerCase() === user.ethnicity!.toLowerCase().trim()
      );
      if (found) {
        updates.ethnicityId = found.id;
        ethnicityMatched++;
      } else if (!ethnicityUnmatched.includes(user.ethnicity)) {
        ethnicityUnmatched.push(user.ethnicity);
      }
    }
    
    // Match religion
    if (user.religion && !user.religionId) {
      const normalized = normalizeReligion(user.religion);
      const found = religions.find(r => 
        r.name.toLowerCase() === normalized.toLowerCase() ||
        r.name.toLowerCase() === user.religion!.toLowerCase().trim()
      );
      if (found) {
        updates.religionId = found.id;
        religionMatched++;
      } else if (!religionUnmatched.includes(user.religion)) {
        religionUnmatched.push(user.religion);
      }
    }
    
    // Match birthPlace to province
    if (user.birthPlace && !user.birthPlaceId) {
      const provinceName = extractProvince(user.birthPlace);
      if (provinceName) {
        const found = provinces.find(p => 
          p.name.toLowerCase() === provinceName.toLowerCase()
        );
        if (found) {
          updates.birthPlaceId = found.id;
          birthPlaceMatched++;
        }
      }
    }
    
    // Match placeOfOrigin to province
    if (user.placeOfOrigin && !user.placeOfOriginId) {
      const provinceName = extractProvince(user.placeOfOrigin);
      if (provinceName) {
        const found = provinces.find(p => 
          p.name.toLowerCase() === provinceName.toLowerCase()
        );
        if (found) {
          updates.placeOfOriginId = found.id;
          placeOfOriginMatched++;
        }
      }
    }
    
    // Match position
    if (user.position && !user.positionId) {
      const found = positions.find(p => 
        p.name.toLowerCase() === user.position!.toLowerCase().trim() ||
        (p.code && p.code.toLowerCase() === user.position!.toLowerCase().trim())
      );
      if (found) {
        updates.positionId = found.id;
        positionMatched++;
      }
    }
    
    // Update user if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updates
      });
    }
  }
  
  console.log(`\n=== USER BACKFILL RESULTS ===`);
  console.log(`Ethnicity matched: ${ethnicityMatched}`);
  console.log(`Religion matched: ${religionMatched}`);
  console.log(`BirthPlace matched: ${birthPlaceMatched}`);
  console.log(`PlaceOfOrigin matched: ${placeOfOriginMatched}`);
  console.log(`Position matched: ${positionMatched}`);
  
  if (ethnicityUnmatched.length > 0) {
    console.log(`\nUnmatched ethnicities: ${ethnicityUnmatched.join(', ')}`);
  }
  if (religionUnmatched.length > 0) {
    console.log(`Unmatched religions: ${religionUnmatched.join(', ')}`);
  }
}

async function backfillPersonnelReferences() {
  console.log('\n=== BACKFILL PERSONNEL FK REFERENCES ===\n');
  
  // Load master data
  const ethnicities = await prisma.ethnicity.findMany({ where: { isActive: true } });
  const religions = await prisma.religion.findMany({ where: { isActive: true } });
  const provinces = await prisma.administrativeUnit.findMany({ 
    where: { isActive: true, level: 'PROVINCE' }
  });
  const positions = await prisma.position.findMany({ where: { isActive: true } });
  
  // Get personnel without FK references
  const personnels = await prisma.personnel.findMany({
    where: {
      OR: [
        { ethnicity: { not: null }, ethnicityId: null },
        { religion: { not: null }, religionId: null },
        { birthPlace: { not: null }, birthPlaceAdminId: null },
        { placeOfOrigin: { not: null }, placeOfOriginAdminId: null },
        { position: { not: null }, positionId: null },
      ]
    },
    select: {
      id: true,
      fullName: true,
      ethnicity: true,
      religion: true,
      birthPlace: true,
      placeOfOrigin: true,
      position: true,
      ethnicityId: true,
      religionId: true,
      birthPlaceAdminId: true,
      placeOfOriginAdminId: true,
      positionId: true,
    }
  });
  
  console.log(`Found ${personnels.length} personnel to backfill`);
  
  let ethnicityMatched = 0, religionMatched = 0, birthPlaceMatched = 0,
      placeOfOriginMatched = 0, positionMatched = 0;
  
  for (const personnel of personnels) {
    const updates: Record<string, string> = {};
    
    // Match ethnicity
    if (personnel.ethnicity && !personnel.ethnicityId) {
      const normalized = normalizeEthnicity(personnel.ethnicity);
      const found = ethnicities.find(e => 
        e.name.toLowerCase() === normalized.toLowerCase() ||
        e.name.toLowerCase() === personnel.ethnicity!.toLowerCase().trim()
      );
      if (found) {
        updates.ethnicityId = found.id;
        ethnicityMatched++;
      }
    }
    
    // Match religion
    if (personnel.religion && !personnel.religionId) {
      const normalized = normalizeReligion(personnel.religion);
      const found = religions.find(r => 
        r.name.toLowerCase() === normalized.toLowerCase() ||
        r.name.toLowerCase() === personnel.religion!.toLowerCase().trim()
      );
      if (found) {
        updates.religionId = found.id;
        religionMatched++;
      }
    }
    
    // Match birthPlace
    if (personnel.birthPlace && !personnel.birthPlaceAdminId) {
      const provinceName = extractProvince(personnel.birthPlace);
      if (provinceName) {
        const found = provinces.find(p => 
          p.name.toLowerCase() === provinceName.toLowerCase()
        );
        if (found) {
          updates.birthPlaceAdminId = found.id;
          birthPlaceMatched++;
        }
      }
    }
    
    // Match placeOfOrigin
    if (personnel.placeOfOrigin && !personnel.placeOfOriginAdminId) {
      const provinceName = extractProvince(personnel.placeOfOrigin);
      if (provinceName) {
        const found = provinces.find(p => 
          p.name.toLowerCase() === provinceName.toLowerCase()
        );
        if (found) {
          updates.placeOfOriginAdminId = found.id;
          placeOfOriginMatched++;
        }
      }
    }
    
    // Match position
    if (personnel.position && !personnel.positionId) {
      const found = positions.find(p => 
        p.name.toLowerCase() === personnel.position!.toLowerCase().trim() ||
        (p.code && p.code.toLowerCase() === personnel.position!.toLowerCase().trim())
      );
      if (found) {
        updates.positionId = found.id;
        positionMatched++;
      }
    }
    
    // Update personnel if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.personnel.update({
        where: { id: personnel.id },
        data: updates
      });
    }
  }
  
  console.log(`\n=== PERSONNEL BACKFILL RESULTS ===`);
  console.log(`Ethnicity matched: ${ethnicityMatched}`);
  console.log(`Religion matched: ${religionMatched}`);
  console.log(`BirthPlace matched: ${birthPlaceMatched}`);
  console.log(`PlaceOfOrigin matched: ${placeOfOriginMatched}`);
  console.log(`Position matched: ${positionMatched}`);
}

async function backfillStudentReferences() {
  console.log('\n=== BACKFILL STUDENT (HocVien) FK REFERENCES ===\n');
  
  // Load master data
  const cohorts = await prisma.cohort.findMany({ where: { isActive: true } });
  const studentClasses = await prisma.studentClass.findMany({ where: { isActive: true } });
  const specializations = await prisma.specializationCatalog.findMany({ 
    where: { isActive: true }
  });
  
  console.log(`Loaded: ${cohorts.length} cohorts, ${studentClasses.length} classes, ${specializations.length} majors`);
  
  // Get students without FK references
  const students = await prisma.hocVien.findMany({
    where: {
      OR: [
        { khoaHoc: { not: null }, cohortId: null },
        { lop: { not: null }, classId: null },
        { nganh: { not: null }, majorId: null },
      ]
    },
    select: {
      id: true,
      hoTen: true,
      khoaHoc: true,
      lop: true,
      nganh: true,
      cohortId: true,
      classId: true,
      majorId: true,
    }
  });
  
  console.log(`Found ${students.length} students to backfill`);
  
  let cohortMatched = 0, classMatched = 0, majorMatched = 0;
  
  for (const student of students) {
    const updates: Record<string, string> = {};
    
    // Match cohort (khoaHoc: K60, K61, etc.)
    if (student.khoaHoc && !student.cohortId) {
      const found = cohorts.find(c => 
        c.code.toLowerCase() === student.khoaHoc!.toLowerCase().trim() ||
        c.name.toLowerCase() === student.khoaHoc!.toLowerCase().trim()
      );
      if (found) {
        updates.cohortId = found.id;
        cohortMatched++;
      }
    }
    
    // Match class (lop: K60A, K61B, etc.)
    if (student.lop && !student.classId) {
      const found = studentClasses.find(c => 
        c.code.toLowerCase() === student.lop!.toLowerCase().trim() ||
        c.name.toLowerCase() === student.lop!.toLowerCase().trim()
      );
      if (found) {
        updates.classId = found.id;
        classMatched++;
      }
    }
    
    // Match major (nganh)
    if (student.nganh && !student.majorId) {
      const found = specializations.find(s => 
        s.name.toLowerCase().includes(student.nganh!.toLowerCase().trim()) ||
        student.nganh!.toLowerCase().includes(s.name.toLowerCase())
      );
      if (found) {
        updates.majorId = found.id;
        majorMatched++;
      }
    }
    
    // Update student if there are changes
    if (Object.keys(updates).length > 0) {
      await prisma.hocVien.update({
        where: { id: student.id },
        data: updates
      });
    }
  }
  
  console.log(`\n=== STUDENT BACKFILL RESULTS ===`);
  console.log(`Cohort matched: ${cohortMatched}`);
  console.log(`Class matched: ${classMatched}`);
  console.log(`Major matched: ${majorMatched}`);
}

async function main() {
  console.log('========================================');
  console.log('  BACKFILL FK REFERENCES SCRIPT');
  console.log('========================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  try {
    await backfillUserReferences();
    await backfillPersonnelReferences();
    await backfillStudentReferences();
    
    console.log('\n========================================');
    console.log('  BACKFILL COMPLETED SUCCESSFULLY!');
    console.log('========================================');
  } catch (error) {
    console.error('Backfill error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
