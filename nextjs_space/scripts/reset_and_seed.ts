import { PrismaClient, ManagementCategory, UserRole, UserStatus, PersonnelCategory, WorkStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// ===================== CONSTANTS =====================
const DEFAULT_PASSWORD = 'Hv@2025';
const ADMIN_EMAIL = 'john@doe.com';

// Quân hàm và quy tắc
const RANK_CONFIG: Record<string, {
  managementCategory: ManagementCategory;
  partyJoinYearRange: [number, number];
  partyRate: number; // Tỷ lệ là Đảng viên
  partyPositionRate: number; // Tỷ lệ có chức danh Đảng cao hơn
}> = {
  'Trung tướng': { managementCategory: 'CAN_BO', partyJoinYearRange: [1980, 1990], partyRate: 1.0, partyPositionRate: 0.5 },
  'Thiếu tướng': { managementCategory: 'CAN_BO', partyJoinYearRange: [1980, 1990], partyRate: 1.0, partyPositionRate: 0.5 },
  'Đại tá': { managementCategory: 'CAN_BO', partyJoinYearRange: [1990, 2000], partyRate: 1.0, partyPositionRate: 0.3 },
  'Thượng tá': { managementCategory: 'CAN_BO', partyJoinYearRange: [1995, 2005], partyRate: 1.0, partyPositionRate: 0.2 },
  'Trung tá': { managementCategory: 'CAN_BO', partyJoinYearRange: [2000, 2010], partyRate: 0.95, partyPositionRate: 0.15 },
  'Thiếu tá': { managementCategory: 'CAN_BO', partyJoinYearRange: [2005, 2012], partyRate: 0.9, partyPositionRate: 0.1 },
  'Đại úy': { managementCategory: 'CAN_BO', partyJoinYearRange: [2008, 2015], partyRate: 0.85, partyPositionRate: 0.05 },
  'Thượng úy': { managementCategory: 'CAN_BO', partyJoinYearRange: [2010, 2018], partyRate: 0.8, partyPositionRate: 0.02 },
  'Trung úy': { managementCategory: 'CAN_BO', partyJoinYearRange: [2012, 2020], partyRate: 0.75, partyPositionRate: 0.01 },
  'Thiếu úy': { managementCategory: 'CAN_BO', partyJoinYearRange: [2015, 2022], partyRate: 0.7, partyPositionRate: 0 },
  // QNCN (có đuôi CN)
  'Thượng tá CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2000, 2010], partyRate: 0.6, partyPositionRate: 0.05 },
  'Trung tá CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2005, 2012], partyRate: 0.55, partyPositionRate: 0.02 },
  'Trung tá QNCN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2005, 2012], partyRate: 0.55, partyPositionRate: 0.02 },
  'Thiếu tá CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2008, 2015], partyRate: 0.5, partyPositionRate: 0.01 },
  'Đại úy CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2010, 2018], partyRate: 0.45, partyPositionRate: 0 },
  'Thượng úy CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2012, 2020], partyRate: 0.4, partyPositionRate: 0 },
  'Trung úy CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2015, 2022], partyRate: 0.35, partyPositionRate: 0 },
  'Thiếu úy CN': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2018, 2024], partyRate: 0.3, partyPositionRate: 0 },
  'CCQP': { managementCategory: 'QUAN_LUC', partyJoinYearRange: [2015, 2022], partyRate: 0.3, partyPositionRate: 0 },
};

// Chức danh Đảng
const PARTY_POSITIONS = ['Đảng viên', 'Chi ủy viên', 'Đảng ủy viên', 'Bí thư Chi bộ'];

// ===================== HELPER FUNCTIONS =====================

function vietnameseToSlug(str: string): string {
  const map: Record<string, string> = {
    'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
    'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
    'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
    'đ':'d',
    'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
    'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
    'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
    'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
    'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
    'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
    'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
    'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
    'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y'
  };
  return str.toLowerCase().split('').map(c => map[c] || c).join('')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRankConfig(rank: string) {
  // Tìm config chính xác
  if (RANK_CONFIG[rank]) return RANK_CONFIG[rank];
  
  // Tìm theo pattern
  if (rank.includes('CN') || rank.includes('QNCN')) {
    return { managementCategory: 'QUAN_LUC' as ManagementCategory, partyJoinYearRange: [2010, 2020] as [number, number], partyRate: 0.4, partyPositionRate: 0 };
  }
  if (rank.includes('CCQP')) {
    return { managementCategory: 'QUAN_LUC' as ManagementCategory, partyJoinYearRange: [2015, 2022] as [number, number], partyRate: 0.3, partyPositionRate: 0 };
  }
  
  // Mặc định là CAN_BO
  return { managementCategory: 'CAN_BO' as ManagementCategory, partyJoinYearRange: [2010, 2020] as [number, number], partyRate: 0.7, partyPositionRate: 0.05 };
}

function getPartyPosition(partyPositionRate: number): string {
  const rand = Math.random();
  if (rand < partyPositionRate * 0.3) return 'Bí thư Chi bộ';
  if (rand < partyPositionRate * 0.6) return 'Đảng ủy viên';
  if (rand < partyPositionRate) return 'Chi ủy viên';
  return 'Đảng viên';
}

function mapRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'QUAN_TRI_HE_THONG': 'ADMIN',
    'CHI_HUY_HOC_VIEN': 'CHI_HUY_HOC_VIEN',
    'CHI_HUY_KHOA_PHONG': 'CHI_HUY_KHOA_PHONG',
    'CHU_NHIEM_BO_MON': 'CHU_NHIEM_BO_MON',
    'GIANG_VIEN': 'GIANG_VIEN',
    'NGHIEN_CUU_VIEN': 'NGHIEN_CUU_VIEN',
    'CAN_BO_QUAN_LY': 'KY_THUAT_VIEN',
    'KY_THUAT_VIEN': 'KY_THUAT_VIEN',
    'HOC_VIEN': 'HOC_VIEN',
    'KHACH': 'HOC_VIEN',
  };
  return roleMap[role] || 'HOC_VIEN';
}

function mapPersonnelType(type: string): PersonnelCategory {
  const typeMap: Record<string, PersonnelCategory> = {
    'SI_QUAN': 'CAN_BO_CHI_HUY',
    'QUAN_NHAN_CHUYEN_NGHIEP': 'CONG_NHAN_VIEN',
    'CONG_NHAN_VIEN': 'CONG_NHAN_VIEN',
    'HOC_VIEN_QUAN_SU': 'HOC_VIEN_QUAN_SU',
    'GIANG_VIEN': 'GIANG_VIEN',
    'CAN_BO_CHI_HUY': 'CAN_BO_CHI_HUY',
    'NGHIEN_CUU_VIEN': 'NGHIEN_CUU_VIEN',
  };
  return typeMap[type] || 'CONG_NHAN_VIEN';
}

// ===================== MAIN FUNCTIONS =====================

async function cleanOldData() {
  console.log('\n🗑️  BƯỚC 1: XÓA DỮ LIỆU CŨ (giữ Unit, Position, Function)...');
  
  // Xóa theo thứ tự cascade
  const tables = [
    // CSDL Chuyên ngành
    { name: 'OfficerPromotion', model: prisma.officerPromotion },
    { name: 'OfficerCareer', model: prisma.officerCareer },
    { name: 'SoldierServiceRecord', model: prisma.soldierServiceRecord },
    { name: 'SoldierProfile', model: prisma.soldierProfile },
    { name: 'PartyActivity', model: prisma.partyActivity },
    { name: 'PartyMember', model: prisma.partyMember },
    { name: 'InsuranceHistory', model: prisma.insuranceHistory },
    { name: 'InsuranceDependent', model: prisma.insuranceDependent },
    { name: 'InsuranceInfo', model: prisma.insuranceInfo },
    { name: 'PolicyAttachment', model: prisma.policyAttachment },
    { name: 'PolicyWorkflowLog', model: prisma.policyWorkflowLog },
    { name: 'PolicyRequest', model: prisma.policyRequest },
    { name: 'PolicyRecord', model: prisma.policyRecord },
    // Đào tạo
    { name: 'KetQuaHocTap', model: prisma.ketQuaHocTap },
    { name: 'HocVien', model: prisma.hocVien },
    { name: 'TeachingSubject', model: prisma.teachingSubject },
    { name: 'ResearchProject', model: prisma.researchProject },
    { name: 'FacultyProfile', model: prisma.facultyProfile },
    // Profile
    { name: 'EducationHistory', model: prisma.educationHistory },
    { name: 'WorkExperience', model: prisma.workExperience },
    { name: 'ScientificPublication', model: prisma.scientificPublication },
    { name: 'ScientificResearch', model: prisma.scientificResearch },
    { name: 'AwardsRecord', model: prisma.awardsRecord },
    { name: 'ScientificProfile', model: prisma.scientificProfile },
    { name: 'FamilyRelation', model: prisma.familyRelation },
    { name: 'MedicalRecord', model: prisma.medicalRecord },
    { name: 'PersonnelAttachment', model: prisma.personnelAttachment },
    { name: 'PersonnelEvent', model: prisma.personnelEvent },
    { name: 'SensitiveIdentity', model: prisma.sensitiveIdentity },
    { name: 'Personnel', model: prisma.personnel },
    // User related
    { name: 'UserPosition', model: prisma.userPosition },
    { name: 'UserPermissionGrant', model: prisma.userPermissionGrant },
    { name: 'UserPermissionGrantPersonnel', model: prisma.userPermissionGrantPersonnel },
    { name: 'AIUsageLog', model: prisma.aIUsageLog },
    { name: 'PersonnelAIAnalysis', model: prisma.personnelAIAnalysis },
    { name: 'Session', model: prisma.session },
    { name: 'Account', model: prisma.account },
  ];
  
  for (const table of tables) {
    try {
      const count = await (table.model as any).deleteMany({});
      if (count.count > 0) {
        console.log(`  ✓ Đã xóa ${count.count} bản ghi từ ${table.name}`);
      }
    } catch (e: any) {
      // Bỏ qua lỗi nếu bảng không tồn tại
      if (!e.message?.includes('does not exist')) {
        console.log(`  ⚠ Lỗi xóa ${table.name}: ${e.message}`);
      }
    }
  }
  
  // Xóa User (trừ admin)
  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { not: ADMIN_EMAIL } }
  });
  console.log(`  ✓ Đã xóa ${deletedUsers.count} User (giữ lại ${ADMIN_EMAIL})`);
  
  console.log('✅ Hoàn tất xóa dữ liệu cũ!');
}

async function seedUsers() {
  console.log('\n👥 BƯỚC 2: TẠO USER TỪ FILE hvhc_personnel.json...');
  
  // Đọc file JSON
  const jsonPath = path.join(__dirname, '../prisma/hvhc_personnel.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const personnelData = JSON.parse(rawData);
  
  console.log(`  📄 Đọc được ${personnelData.length} cán bộ từ file`);
  
  // Lấy danh sách Unit
  const units = await prisma.unit.findMany();
  const unitMap = new Map(units.map(u => [u.code, u.id]));
  
  // Lấy danh sách Position
  const positions = await prisma.position.findMany();
  const positionMap = new Map(positions.map(p => [p.code, p.id]));
  
  // Hash password
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  
  // Track emails để tránh trùng
  const usedEmails = new Set<string>();
  usedEmails.add(ADMIN_EMAIL);
  
  let created = 0;
  let skipped = 0;
  
  for (let i = 0; i < personnelData.length; i++) {
    const person = personnelData[i];
    const { name, rank, position, unit_code, role, personnel_type } = person;
    
    // Tạo email duy nhất
    let baseEmail = vietnameseToSlug(name);
    let email = `${baseEmail}@hvhc.edu.vn`;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${baseEmail}${counter}@hvhc.edu.vn`;
      counter++;
    }
    usedEmails.add(email);
    
    // Lấy config theo quân hàm
    const rankConfig = getRankConfig(rank);
    
    // Xác định partyJoinDate và partyPosition
    let partyJoinDate: Date | null = null;
    let partyPosition: string | null = null;
    
    if (Math.random() < rankConfig.partyRate) {
      partyJoinDate = randomDate(rankConfig.partyJoinYearRange[0], rankConfig.partyJoinYearRange[1]);
      partyPosition = getPartyPosition(rankConfig.partyPositionRate);
    }
    
    // Tìm unitId
    let unitId = unitMap.get(unit_code) || unitMap.get('HVHC');
    
    // Tạo User
    try {
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          rank,
          position,
          role: mapRole(role),
          status: 'ACTIVE' as UserStatus,
          personnelType: mapPersonnelType(personnel_type),
          managementCategory: rankConfig.managementCategory,
          partyJoinDate,
          partyPosition,
          unitId,
          employeeId: `QN${String(i + 1).padStart(4, '0')}`,
          enlistmentDate: randomDate(1995, 2015),
        }
      });
      
      // Tạo UserPosition
      const positionCode = mapRoleToPositionCode(role);
      const posId = positionMap.get(positionCode);
      if (posId) {
        await prisma.userPosition.create({
          data: {
            userId: user.id,
            positionId: posId,
            isPrimary: true,
            startDate: new Date(),
            isActive: true,
          }
        });
      }
      
      created++;
    } catch (e: any) {
      console.log(`  ⚠ Lỗi tạo ${name}: ${e.message}`);
      skipped++;
    }
    
    // Log tiến độ
    if ((i + 1) % 50 === 0) {
      console.log(`  📊 Tiến độ: ${i + 1}/${personnelData.length}`);
    }
  }
  
  console.log(`✅ Hoàn tất! Đã tạo ${created} User, bỏ qua ${skipped}`);
}

function mapRoleToPositionCode(role: string): string {
  const map: Record<string, string> = {
    'QUAN_TRI_HE_THONG': 'QUAN_TRI_VIEN',
    'CHI_HUY_HOC_VIEN': 'CHI_HUY_HOC_VIEN',
    'CHI_HUY_KHOA_PHONG': 'TRUONG_KHOA',
    'CHU_NHIEM_BO_MON': 'CHU_NHIEM_BO_MON',
    'GIANG_VIEN': 'GIANG_VIEN',
    'NGHIEN_CUU_VIEN': 'NGHIEN_CUU_VIEN',
    'CAN_BO_QUAN_LY': 'CAN_BO_QUAN_LY',
    'KY_THUAT_VIEN': 'KY_THUAT_VIEN',
    'HOC_VIEN': 'HOC_VIEN',
    'KHACH': 'KHACH',
  };
  return map[role] || 'KHACH';
}

async function seedPersonnel() {
  console.log('\n📋 BƯỚC 3: TẠO PERSONNEL CHO MỖI USER...');
  
  const users = await prisma.user.findMany({
    where: { personnelId: null }
  });
  
  let created = 0;
  
  for (const user of users) {
    try {
      // Tạo Personnel
      const personnelCode = `CB${String(created + 1).padStart(5, '0')}`;
      const personnel = await prisma.personnel.create({
        data: {
          personnelCode,
          fullName: user.name || 'Chưa có tên',
          dateOfBirth: randomDate(1960, 2000),
          gender: Math.random() > 0.2 ? 'MALE' : 'FEMALE',
          militaryIdNumber: `QN${String(created + 1).padStart(8, '0')}`,
          militaryRank: user.rank,
          position: user.position,
          unitId: user.unitId,
          status: 'DANG_CONG_TAC',
          category: user.personnelType || 'CONG_NHAN_VIEN',
          enlistmentDate: randomDate(1995, 2015),
        }
      });
      
      // Cập nhật User.personnelId
      await prisma.user.update({
        where: { id: user.id },
        data: { personnelId: personnel.id }
      });
      
      created++;
    } catch (e: any) {
      console.log(`  ⚠ Lỗi tạo Personnel cho ${user.name}: ${e.message}`);
    }
    
    if (created % 50 === 0) {
      console.log(`  📊 Tiến độ: ${created}/${users.length}`);
    }
  }
  
  console.log(`✅ Hoàn tất! Đã tạo ${created} Personnel`);
}

async function showStats() {
  console.log('\n📊 THỐNG KÊ SAU KHI SEED:');
  
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.personnel.count(),
    prisma.userPosition.count(),
    prisma.user.count({ where: { managementCategory: 'CAN_BO' } }),
    prisma.user.count({ where: { managementCategory: 'QUAN_LUC' } }),
    prisma.user.count({ where: { partyJoinDate: { not: null } } }),
  ]);
  
  console.log(`  • User:                    ${stats[0]}`);
  console.log(`  • Personnel:               ${stats[1]}`);
  console.log(`  • UserPosition:            ${stats[2]}`);
  console.log(`  • CAN_BO (Sĩ quan):        ${stats[3]}`);
  console.log(`  • QUAN_LUC (QNCN/CCQP):    ${stats[4]}`);
  console.log(`  • Đảng viên:               ${stats[5]}`);
}

// ===================== MAIN =====================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        RESET & SEED DỮ LIỆU HVHC BIGDATA                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  try {
    await cleanOldData();
    await seedUsers();
    await seedPersonnel();
    await showStats();
    
    console.log('\n🎉 HOÀN TẤT! Tiếp theo chạy API Sync để tạo CSDL chuyên ngành.');
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
