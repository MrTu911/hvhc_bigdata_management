/**
 * PHASE 1: LIEN THONG DU LIEU
 * - P1.1: Link User <-> Personnel
 * - P1.2: Gan Unit cho Personnel
 * - P1.3: Gan Unit cho Users  
 * - P1.4: Gan Position (RBAC) cho Users
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Mapping position text -> RBAC Position code
const POSITION_MAP: Record<string, string> = {
  'Giám đốc': 'GIAM_DOC',
  'Chính ủy': 'CHINH_UY',
  'Phó Giám đốc': 'PHO_GIAM_DOC',
  'Phó Chính ủy': 'PHO_GIAM_DOC',
  'Trưởng khoa': 'TRUONG_KHOA',
  'Trưởng phòng': 'TRUONG_PHONG',
  'Phó Trưởng khoa': 'PHO_TRUONG_KHOA',
  'P.Trưởng khoa': 'PHO_TRUONG_KHOA',
  'Phó Trưởng phòng': 'PHO_TRUONG_PHONG',
  'P.Trưởng phòng': 'PHO_TRUONG_PHONG',
  'Chủ nhiệm bộ môn': 'CHU_NHIEM_BO_MON',
  'CN Bộ môn': 'CHU_NHIEM_BO_MON',
  'CNBM': 'CHU_NHIEM_BO_MON',
  'Giảng viên': 'GIANG_VIEN',
  'Giảng viên chính': 'GIANG_VIEN_CHINH',
  'GVC': 'GIANG_VIEN_CHINH',
  'Giảng viên cao cấp': 'GIANG_VIEN_CAO_CAP',
  'Tiểu đoàn trưởng': 'TIEU_DOAN_TRUONG',
  'Tiểu đoàn phó': 'TIEU_DOAN_PHO',
  'Đại đội trưởng': 'DAI_DOI_TRUONG',
  'Đại đội phó': 'DAI_DOI_PHO',
  'Trung đội trưởng': 'TRUNG_DOI_TRUONG',
  'Trưởng ban': 'TRUONG_BAN',
  'Phó Trưởng ban': 'PHO_TRUONG_BAN',
  'Trợ lý': 'TRO_LY',
  'Nhân viên': 'NHAN_VIEN',
  'Cán bộ': 'NHAN_VIEN',
  'Học viên': 'HOC_VIEN',
  'Sinh viên': 'SINH_VIEN',
  'Phó ban': 'PHO_TRUONG_BAN',
  'Viện trưởng': 'VIEN_TRUONG',
  'Phó Viện trưởng': 'PHO_VIEN_TRUONG',
  'Nghiên cứu viên': 'NGHIEN_CUU_VIEN',
  'Nghiên cứu viên chính': 'NGHIEN_CUU_VIEN',
};

// Mapping unit keywords to unit codes
const UNIT_KEYWORDS: Record<string, string[]> = {
  'HVHC': ['Học viện', 'Hậu cần'],
  'BGD': ['Ban Giám đốc', 'BGD'],
  'B1': ['Phòng Đào tạo', 'Đào tạo'],
  'B2': ['Phòng KHQS', 'Khoa học Quân sự'],
  'B3': ['Phòng Chính trị', 'Chính trị'],
  'B5': ['Văn phòng'],
  'K1': ['Khoa Chỉ huy hậu cần', 'Chỉ huy HC'],
  'K2': ['Khoa Quân nhu', 'Quân nhu'],
  'K3': ['Khoa Vận tải', 'Vận tải'],
  'K4': ['Khoa Xăng dầu', 'Xăng dầu'],
  'K5': ['Khoa Tài chính', 'Tài chính'],
  'K6': ['Khoa Quân sự', 'Quân sự'],
  'K7': ['Khoa Khoa học cơ bản', 'KHCB'],
  'K8': ['Khoa Ngoại ngữ', 'Ngoại ngữ'],
  'VIEN1': ['Viện Nghiên cứu', 'NCKH'],
  'TD1': ['Tiểu đoàn 1'],
  'TD2': ['Tiểu đoàn 2'],
};

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchPositionCode(positionText: string | null): string {
  if (!positionText) return 'NHAN_VIEN';
  
  const normalized = positionText.toLowerCase().trim();
  
  for (const [keyword, code] of Object.entries(POSITION_MAP)) {
    if (normalized.includes(keyword.toLowerCase())) {
      return code;
    }
  }
  
  // Default mappings based on patterns
  if (normalized.includes('giám đốc') || normalized.includes('giam doc')) return 'GIAM_DOC';
  if (normalized.includes('chính ủy') || normalized.includes('chinh uy')) return 'CHINH_UY';
  if (normalized.includes('trưởng khoa') || normalized.includes('truong khoa')) return 'TRUONG_KHOA';
  if (normalized.includes('trưởng phòng') || normalized.includes('truong phong')) return 'TRUONG_PHONG';
  if (normalized.includes('giảng viên') || normalized.includes('giang vien')) return 'GIANG_VIEN';
  if (normalized.includes('học viên') || normalized.includes('hoc vien')) return 'HOC_VIEN';
  if (normalized.includes('sinh viên') || normalized.includes('sinh vien')) return 'SINH_VIEN';
  
  return 'NHAN_VIEN';
}

async function linkUserPersonnel() {
  console.log('\n=== P1.1: LINK USER <-> PERSONNEL ===');
  
  const users = await prisma.user.findMany({
    where: { personnelId: null },
    select: { id: true, name: true, email: true, employeeId: true }
  });
  
  let linked = 0;
  for (const user of users) {
    // Try to find matching personnel
    const normalizedName = normalizeVietnamese(user.name);
    const nameParts = normalizedName.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts[0];
    
    // Try match by employeeId first
    let personnel = null;
    if (user.employeeId) {
      personnel = await prisma.personnel.findFirst({
        where: {
          OR: [
            { personnelCode: user.employeeId },
            { employeeIdNumber: user.employeeId },
            { militaryIdNumber: user.employeeId }
          ],
          account: null
        }
      });
    }
    
    // If not found, try match by name
    if (!personnel) {
      personnel = await prisma.personnel.findFirst({
        where: {
          fullName: {
            contains: nameParts.slice(-2).join(' '),
            mode: 'insensitive'
          },
          account: null
        }
      });
    }
    
    if (personnel) {
      await prisma.user.update({
        where: { id: user.id },
        data: { personnelId: personnel.id }
      });
      linked++;
    }
  }
  
  console.log(`  ✅ Linked ${linked}/${users.length} users to personnel`);
  return linked;
}

async function assignUnitsToPersonnel() {
  console.log('\n=== P1.2: GAN UNIT CHO PERSONNEL ===');
  
  const personnel = await prisma.personnel.findMany({
    where: { unitId: null },
    select: { id: true, fullName: true, position: true, managingOrgan: true }
  });
  
  const units = await prisma.unit.findMany();
  const unitMap = new Map(units.map(u => [u.code, u.id]));
  
  // Find HVHC as default
  const hvhcUnit = units.find(u => u.code === 'HVHC');
  const defaultUnitId = hvhcUnit?.id;
  
  let assigned = 0;
  for (const p of personnel) {
    let targetUnitId: string | null = null;
    
    // Try to match based on position or managingOrgan
    const searchText = `${p.position || ''} ${p.managingOrgan || ''}`.toLowerCase();
    
    for (const [code, keywords] of Object.entries(UNIT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          targetUnitId = unitMap.get(code) || null;
          break;
        }
      }
      if (targetUnitId) break;
    }
    
    // Use default if no match
    if (!targetUnitId && defaultUnitId) {
      targetUnitId = defaultUnitId;
    }
    
    if (targetUnitId) {
      await prisma.personnel.update({
        where: { id: p.id },
        data: { unitId: targetUnitId }
      });
      assigned++;
    }
  }
  
  console.log(`  ✅ Assigned unit to ${assigned}/${personnel.length} personnel`);
  return assigned;
}

async function assignUnitsToUsers() {
  console.log('\n=== P1.3: GAN UNIT CHO USERS ===');
  
  const users = await prisma.user.findMany({
    where: { unitId: null },
    include: { personnelProfile: true }
  });
  
  const units = await prisma.unit.findMany();
  const unitMap = new Map(units.map(u => [u.code, u.id]));
  const hvhcUnit = units.find(u => u.code === 'HVHC');
  
  let assigned = 0;
  for (const user of users) {
    let targetUnitId: string | null = null;
    
    // First, try to get from linked personnel
    if (user.personnelProfile?.unitId) {
      targetUnitId = user.personnelProfile.unitId;
    }
    
    // If not, try to match based on position
    if (!targetUnitId && user.position) {
      const searchText = user.position.toLowerCase();
      for (const [code, keywords] of Object.entries(UNIT_KEYWORDS)) {
        for (const keyword of keywords) {
          if (searchText.includes(keyword.toLowerCase())) {
            targetUnitId = unitMap.get(code) || null;
            break;
          }
        }
        if (targetUnitId) break;
      }
    }
    
    // Default to HVHC
    if (!targetUnitId && hvhcUnit) {
      targetUnitId = hvhcUnit.id;
    }
    
    if (targetUnitId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { unitId: targetUnitId }
      });
      assigned++;
    }
  }
  
  console.log(`  ✅ Assigned unit to ${assigned}/${users.length} users`);
  return assigned;
}

// Map UserRole to Position code
const ROLE_TO_POSITION: Record<string, string> = {
  'QUAN_TRI_HE_THONG': 'QUAN_TRI_HE_THONG',
  'CHI_HUY_HOC_VIEN': 'GIAM_DOC',
  'CHI_HUY_KHOA_PHONG': 'TRUONG_KHOA',
  'CHU_NHIEM_BO_MON': 'CHU_NHIEM_BO_MON',
  'GIANG_VIEN': 'GIANG_VIEN',
  'NGHIEN_CUU_VIEN': 'NGHIEN_CUU_VIEN',
  'KY_THUAT_VIEN': 'KY_THUAT_VIEN',
  'HOC_VIEN_SINH_VIEN': 'HOC_VIEN_QUAN_SU',
  'HOC_VIEN': 'HOC_VIEN_QUAN_SU',
  'SINH_VIEN': 'SINH_VIEN_DAN_SU',
  'CAN_BO': 'CHUYEN_VIEN',
};

async function assignPositionsToUsers() {
  console.log('\n=== P1.4: GAN POSITION (RBAC) CHO USERS ===');
  
  // Get all positions
  const positions = await prisma.position.findMany();
  const positionMap = new Map(positions.map(p => [p.code, p.id]));
  
  // Get users without UserPosition
  const usersWithPosition = await prisma.userPosition.findMany({
    select: { userId: true }
  });
  const usersWithPositionSet = new Set(usersWithPosition.map(up => up.userId));
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, position: true, rank: true, role: true, unitId: true }
  });
  
  let assigned = 0;
  for (const user of users) {
    if (usersWithPositionSet.has(user.id)) continue;
    
    // Determine position code - prioritize position text, then role
    let positionCode = 'CHUYEN_VIEN'; // default fallback
    
    // First try from position text
    if (user.position) {
      positionCode = matchPositionCode(user.position);
    } 
    // Then try from role
    else if (user.role && ROLE_TO_POSITION[user.role]) {
      positionCode = ROLE_TO_POSITION[user.role];
    }
    
    // Override for admin role
    if (user.role === 'QUAN_TRI_HE_THONG') {
      positionCode = 'QUAN_TRI_HE_THONG';
    }
    
    let positionId = positionMap.get(positionCode);
    
    // Fallback to CHUYEN_VIEN if code not found
    if (!positionId) {
      positionId = positionMap.get('CHUYEN_VIEN');
    }
    
    if (positionId) {
      await prisma.userPosition.create({
        data: {
          userId: user.id,
          positionId: positionId,
          unitId: user.unitId,
          isPrimary: true,
          startDate: new Date()
        }
      });
      assigned++;
    }
  }
  
  console.log(`  ✅ Assigned RBAC position to ${assigned} users`);
  return assigned;
}

async function main() {
  console.log('\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557');
  console.log('\u2551       PHASE 1: LIEN THONG DU LIEU HVHC              \u2551');
  console.log('\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d');
  
  const startTime = Date.now();
  
  // Run all phases
  await linkUserPersonnel();
  await assignUnitsToPersonnel();
  await assignUnitsToUsers();
  await assignPositionsToUsers();
  
  // Summary
  console.log('\n=== TONG KET ===');
  const userPersonnelLinked = await prisma.user.count({ where: { personnelId: { not: null } } });
  const totalUsers = await prisma.user.count();
  const personnelWithUnit = await prisma.personnel.count({ where: { unitId: { not: null } } });
  const totalPersonnel = await prisma.personnel.count();
  const usersWithUnit = await prisma.user.count({ where: { unitId: { not: null } } });
  const userPositions = await prisma.userPosition.count();
  
  console.log(`  User <-> Personnel: ${userPersonnelLinked}/${totalUsers} (${Math.round(userPersonnelLinked/totalUsers*100)}%)`);
  console.log(`  Personnel with Unit: ${personnelWithUnit}/${totalPersonnel} (${Math.round(personnelWithUnit/totalPersonnel*100)}%)`);
  console.log(`  User with Unit: ${usersWithUnit}/${totalUsers} (${Math.round(usersWithUnit/totalUsers*100)}%)`);
  console.log(`  UserPosition (RBAC): ${userPositions}/${totalUsers} (${Math.round(userPositions/totalUsers*100)}%)`);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\u2705 Hoan thanh trong ${elapsed}s`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
