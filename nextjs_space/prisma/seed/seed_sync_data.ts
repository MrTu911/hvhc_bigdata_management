/**
 * Script seed dữ liệu đồng bộ theo QĐ 144/BQP
 * Mỗi cán bộ sẽ có đầy đủ các bảng dữ liệu liên quan:
 * - User (CSDL Quân nhân)
 * - PartyMember (CSDL Đảng viên)
 * - InsuranceInfo (CSDL Bảo hiểm XH)
 * - PolicyRecord (CSDL Thi đua Khen thưởng)
 * - MedicalRecord (CSDL Quân y)
 * - FacultyProfile (Cho giảng viên)
 */

import { PrismaClient, UserRole, PersonnelCategory, WorkStatus, BloodType, ManagementLevel, PartyMemberStatus, PolicyRecordType, PolicyLevel, PolicyRecordStatus, MedicalRecordType, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Default password for all users
const DEFAULT_PASSWORD = 'Hv@2025';

interface PersonnelData {
  name: string;
  rank: string;
  position: string;
  unit: string;
  unitCode: string;
  category: string;
  role: string;
}

// Mapping rank to blood type (random but deterministic)
const rankToBloodType: Record<string, BloodType> = {
  'Trung tướng': BloodType.O_POSITIVE,
  'Thiếu tướng': BloodType.A_POSITIVE,
  'Đại tá': BloodType.B_POSITIVE,
  'Thượng tá': BloodType.AB_POSITIVE,
  'Trung tá': BloodType.O_POSITIVE,
  'Thiếu tá': BloodType.A_POSITIVE,
  'Đại úy': BloodType.B_POSITIVE,
  'Thượng úy': BloodType.AB_POSITIVE,
  'Trung úy': BloodType.O_POSITIVE,
  'Thiếu úy': BloodType.A_POSITIVE,
  'Trung úy CN': BloodType.B_POSITIVE,
  'Thiếu úy CN': BloodType.AB_POSITIVE,
  'Thượng tá CN': BloodType.O_POSITIVE,
  'Trung tá CN': BloodType.A_POSITIVE,
  'CCQP': BloodType.B_POSITIVE,
  'QNCN': BloodType.AB_POSITIVE,
};

// Map category string to PersonnelCategory enum
const categoryMap: Record<string, PersonnelCategory> = {
  'SI_QUAN': PersonnelCategory.CAN_BO_CHI_HUY,
  'QNCN': PersonnelCategory.CONG_NHAN_VIEN,
  'CCQP': PersonnelCategory.CONG_NHAN_VIEN,
  'HOC_VIEN': PersonnelCategory.HOC_VIEN_QUAN_SU,
};

// Map role string to UserRole enum
const roleMap: Record<string, UserRole> = {
  'CHI_HUY_HOC_VIEN': UserRole.CHI_HUY_HOC_VIEN,
  'CHI_HUY_KHOA_PHONG': UserRole.CHI_HUY_KHOA_PHONG,
  'CHU_NHIEM_BO_MON': UserRole.CHU_NHIEM_BO_MON,
  'GIANG_VIEN': UserRole.GIANG_VIEN,
  'CAN_BO': UserRole.NGHIEN_CUU_VIEN, // Fallback to NGHIEN_CUU_VIEN
  'HOC_VIEN': UserRole.HOC_VIEN,
};

// Vietnamese name to slug for email generation
function vietnameseToSlug(str: string): string {
  const map: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  };
  return str.split('').map(char => map[char] || char).join('').toLowerCase();
}

// Generate unique employee ID
function generateEmployeeId(index: number): string {
  return `HV${String(index).padStart(5, '0')}`;
}

// Generate unique military ID
function generateMilitaryId(index: number): string {
  return `QN${String(2025000 + index).padStart(10, '0')}`;
}

// Generate phone number
function generatePhone(index: number): string {
  return `09${String(10000000 + index).padStart(8, '0')}`;
}

// Generate citizen ID
function generateCitizenId(index: number): string {
  return `0${String(10000000000 + index).padStart(11, '0')}`;
}

// Generate party card number
function generatePartyCardNumber(index: number): string {
  return `DV${String(2020000 + index).padStart(8, '0')}`;
}

// Generate insurance number
function generateInsuranceNumber(index: number): string {
  return `BH${String(3000000 + index).padStart(10, '0')}`;
}

// Generate health insurance number
function generateHealthInsuranceNumber(index: number): string {
  return `BHYT${String(4000000 + index).padStart(10, '0')}`;
}

// Random date generator
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Random from array
function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting synchronized data seed...');
  
  // Hash password
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  
  // Read personnel data from JSON
  const dataPath = path.join(__dirname, 'hvhc_personnel_full.json');
  const personnelData: PersonnelData[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log(`📊 Found ${personnelData.length} personnel records`);
  
  // Get existing demo accounts to preserve
  const demoAccounts = await prisma.user.findMany({
    where: {
      email: {
        in: ['john@doe.com', 'admin@hvhc.edu.vn', 'test@hvhc.edu.vn']
      }
    },
    select: { id: true, email: true }
  });
  const demoIds = demoAccounts.map(a => a.id);
  console.log(`🔒 Preserving ${demoIds.length} demo accounts`);
  
  // Get existing units
  const existingUnits = await prisma.unit.findMany();
  const unitMap = new Map(existingUnits.map(u => [u.code, u.id]));
  console.log(`🏢 Found ${existingUnits.length} existing units`);
  
  // ===== PHASE 1: Clear old data (except demo accounts and units) =====
  console.log('\n🧹 Phase 1: Clearing old data...');
  
  // Delete related records first (cascade doesn't always work)
  await prisma.medicalRecord.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared medical records');
  
  await prisma.policyRecord.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared policy records');
  
  await prisma.insuranceInfo.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared insurance info');
  
  await prisma.partyActivity.deleteMany({});
  await prisma.partyMember.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared party members');
  
  await prisma.studentProfile.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared student profiles');
  
  await prisma.teachingSubject.deleteMany({});
  await prisma.researchProject.deleteMany({});
  await prisma.facultyProfile.deleteMany({
    where: { user: { id: { notIn: demoIds } } }
  });
  console.log('  ✓ Cleared faculty profiles');
  
  // Clear additional related tables
  await prisma.userPermissionGrant.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared permission grants');
  
  await prisma.userActivity.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared user activities');
  
  await prisma.systemLog.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared system logs');
  
  await prisma.scientificProfile.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared scientific profiles');
  
  await prisma.educationHistory.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared education history');
  
  await prisma.workExperience.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared work experience');
  
  await prisma.scientificPublication.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared scientific publications');
  
  await prisma.scientificResearch.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared scientific research');
  
  await prisma.awardsRecord.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared awards records');
  
  await prisma.personnelAttachment.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared personnel attachments');
  
  await prisma.personnelAIAnalysis.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared AI analyses');
  
  // Clear sessions and accounts  
  await prisma.session.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  await prisma.account.deleteMany({
    where: { userId: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared sessions and accounts');
  
  // Clear users except demo accounts
  await prisma.user.deleteMany({
    where: { id: { notIn: demoIds } }
  });
  console.log('  ✓ Cleared users (except demo accounts)');
  
  // ===== PHASE 2: Create users with synchronized data =====
  console.log('\n👤 Phase 2: Creating users with synchronized data...');
  
  const createdUsers: { id: string; name: string; role: UserRole; unitCode: string }[] = [];
  const usedEmails = new Set(demoAccounts.map(a => a.email));
  
  for (let i = 0; i < personnelData.length; i++) {
    const person = personnelData[i];
    const idx = i + 1;
    
    // Generate unique email
    const nameParts = person.name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstInitials = nameParts.slice(0, -1).map(p => p[0]).join('');
    let baseEmail = `${vietnameseToSlug(lastName)}.${vietnameseToSlug(firstInitials)}@hvhc.edu.vn`.toLowerCase();
    let email = baseEmail;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = baseEmail.replace('@', `${counter}@`);
      counter++;
    }
    usedEmails.add(email);
    
    // Determine gender from name
    const femaleNames = ['Thị', 'Thùy', 'Phương', 'Hương', 'Lan', 'Mai', 'Nhàn', 'Trang', 'Quỳnh', 'Hằng', 'Liên', 'Linh', 'Hường', 'Huyền', 'Ninh', 'Thanh'];
    const isFemale = femaleNames.some(fn => person.name.includes(fn));
    
    // Find unit
    const unitId = unitMap.get(person.unitCode) || null;
    
    // Determine management level based on position/rank
    let managementLevel: ManagementLevel = ManagementLevel.DON_VI;
    if (person.position.includes('Giám đốc') || person.position.includes('Chính ủy')) {
      managementLevel = ManagementLevel.TRUNG_UONG;
    } else if (person.position.includes('Trưởng phòng') || person.position.includes('Viện trưởng') || person.position.includes('CN Khoa')) {
      managementLevel = ManagementLevel.QUAN_CHUNG;
    } else if (person.position.includes('P.') || person.position.includes('Trưởng ban')) {
      managementLevel = ManagementLevel.HOC_VIEN;
    }
    
    try {
      // Create User
      const user = await prisma.user.create({
        data: {
          email,
          name: person.name,
          password: hashedPassword,
          role: roleMap[person.role] || UserRole.NGHIEN_CUU_VIEN,
          status: 'ACTIVE',
          militaryId: generateMilitaryId(idx),
          rank: person.rank,
          position: person.position,
          department: person.unit,
          unit: person.unitCode,
          phone: generatePhone(idx),
          dateOfBirth: randomDate(new Date(1965, 0, 1), new Date(2000, 11, 31)),
          gender: isFemale ? 'Nữ' : 'Nam',
          address: 'Hà Nội',
          employeeId: generateEmployeeId(idx),
          personnelType: categoryMap[person.category] || PersonnelCategory.CAN_BO_CHI_HUY,
          workStatus: WorkStatus.ACTIVE,
          placeOfOrigin: randomFromArray(['Hà Nội', 'Hải Phòng', 'Nam Định', 'Thái Bình', 'Nghệ An', 'Hà Tĩnh', 'Đà Nẵng', 'Hải Dương', 'Bắc Ninh']),
          specialization: person.role === 'GIANG_VIEN' ? 'Sư phạm Quân sự' : 'Quản lý',
          educationLevel: randomFromArray(['Đại học', 'Thạc sĩ', 'Tiến sĩ', 'Cao đẳng']),
          joinDate: randomDate(new Date(1990, 0, 1), new Date(2020, 11, 31)),
          militaryIdNumber: generateMilitaryId(idx),
          citizenId: generateCitizenId(idx),
          bloodType: rankToBloodType[person.rank] || BloodType.O_POSITIVE,
          ethnicity: 'Kinh',
          religion: 'Không',
          birthPlace: 'Hà Nội',
          permanentAddress: randomFromArray(['Số 10, Đường Lê Duẩn, Hà Nội', 'Số 25, Phố Hàng Bài, Hà Nội', 'Số 88, Đường Nguyễn Trãi, Hà Nội']),
          enlistmentDate: randomDate(new Date(1985, 0, 1), new Date(2015, 11, 31)),
          managementLevel,
          unitId,
        }
      });
      
      createdUsers.push({ id: user.id, name: user.name, role: user.role, unitCode: person.unitCode });
      
      // ===== Create PartyMember (90% are party members) =====
      if (Math.random() < 0.9) {
        await prisma.partyMember.create({
          data: {
            userId: user.id,
            partyCardNumber: generatePartyCardNumber(idx),
            joinDate: randomDate(new Date(1995, 0, 1), new Date(2020, 11, 31)),
            officialDate: randomDate(new Date(1996, 0, 1), new Date(2021, 11, 31)),
            partyCell: `Chi bộ ${person.unitCode}`,
            partyCommittee: 'Đảng ủy Học viện Hậu cần',
            recommender1: randomFromArray(['Nguyễn Văn A', 'Trần Văn B', 'Lê Văn C']),
            recommender2: randomFromArray(['Phạm Văn D', 'Hoàng Văn E', 'Vũ Văn F']),
            status: PartyMemberStatus.ACTIVE,
          }
        });
      }
      
      // ===== Create InsuranceInfo (100% have insurance) =====
      await prisma.insuranceInfo.create({
        data: {
          userId: user.id,
          insuranceNumber: generateInsuranceNumber(idx),
          insuranceStartDate: randomDate(new Date(2000, 0, 1), new Date(2010, 11, 31)),
          healthInsuranceNumber: generateHealthInsuranceNumber(idx),
          healthInsuranceStartDate: randomDate(new Date(2000, 0, 1), new Date(2010, 11, 31)),
          healthInsuranceEndDate: new Date(2030, 11, 31),
          healthInsuranceHospital: randomFromArray(['Bệnh viện 108', 'Bệnh viện 103', 'Bệnh viện Trung ương Quân đội 175', 'Bệnh viện Quân y 354']),
          beneficiaryName: isFemale ? `Nguyễn Văn ${['An', 'Bình', 'Cường'][idx % 3]}` : `Nguyễn Thị ${['Hằng', 'Lan', 'Mai'][idx % 3]}`,
          beneficiaryRelation: isFemale ? 'Chồng' : 'Vợ',
          beneficiaryPhone: generatePhone(idx + 1000),
        }
      });
      
      // ===== Create PolicyRecord (Awards - 70% have at least one) =====
      if (Math.random() < 0.7) {
        const rewardTypes = [
          { title: 'Chiến sĩ thi đua cơ sở', level: PolicyLevel.UNIT },
          { title: 'Chiến sĩ thi đua toàn quân', level: PolicyLevel.MINISTRY },
          { title: 'Bằng khen Bộ Quốc phòng', level: PolicyLevel.MINISTRY },
          { title: 'Bằng khen Học viện', level: PolicyLevel.UNIT },
          { title: 'Giấy khen', level: PolicyLevel.UNIT },
          { title: 'Huân chương Chiến công', level: PolicyLevel.NATIONAL },
        ];
        
        const numRewards = Math.floor(Math.random() * 3) + 1;
        for (let r = 0; r < numRewards; r++) {
          const reward = randomFromArray(rewardTypes);
          await prisma.policyRecord.create({
            data: {
              userId: user.id,
              recordType: PolicyRecordType.REWARD,
              level: reward.level,
              title: reward.title,
              reason: `Hoàn thành xuất sắc nhiệm vụ năm ${2020 + r}`,
              decisionNumber: `QĐ-${1000 + idx + r}/${2020 + r}/HV`,
              decisionDate: new Date(2020 + r, 11, 15),
              effectiveDate: new Date(2020 + r, 11, 15),
              signerName: 'Giám đốc Học viện',
              signerPosition: 'Trung tướng',
              issuingUnit: 'Học viện Hậu cần',
              status: PolicyRecordStatus.ACTIVE,
            }
          });
        }
      }
      
      // ===== Create MedicalRecord (100% have annual health check) =====
      await prisma.medicalRecord.create({
        data: {
          userId: user.id,
          recordType: MedicalRecordType.ANNUAL_CHECK,
          recordDate: new Date(2025, 5, Math.floor(Math.random() * 28) + 1),
          bloodType: rankToBloodType[person.rank] || 'O',
          height: 160 + Math.floor(Math.random() * 25),
          weight: 55 + Math.floor(Math.random() * 30),
          bloodPressure: `${110 + Math.floor(Math.random() * 20)}/${70 + Math.floor(Math.random() * 15)}`,
          healthGrade: randomFromArray(['Loại 1', 'Loại 2', 'Loại 3']),
          hospital: 'Bệnh xá Học viện Hậu cần',
          doctorName: randomFromArray(['BS. Nguyễn Văn A', 'BS. Trần Thị B', 'BS. Lê Văn C']),
          result: 'Đủ sức khỏe',
          recommendations: 'Tiếp tục duy trì chế độ tập luyện',
        }
      });
      
      // ===== Create FacultyProfile for GIANG_VIEN and CHU_NHIEM_BO_MON =====
      if (person.role === 'GIANG_VIEN' || person.role === 'CHU_NHIEM_BO_MON') {
        await prisma.facultyProfile.create({
          data: {
            userId: user.id,
            academicRank: randomFromArray(['Giáo sư', 'Phó Giáo sư', null]),
            academicDegree: randomFromArray(['Tiến sĩ', 'Thạc sĩ', 'Cử nhân']),
            specialization: person.unit,
            researchInterests: `Nghiên cứu về ${person.unit}`,
            researchProjects: Math.floor(Math.random() * 10),
            publications: Math.floor(Math.random() * 20),
            citations: Math.floor(Math.random() * 100),
            teachingExperience: Math.floor(Math.random() * 20) + 5,
            biography: `Giảng viên ${person.unit}`,
            isActive: true,
            isPublic: true,
          }
        });
      }
      
      if ((idx) % 20 === 0) {
        console.log(`  ✓ Created ${idx}/${personnelData.length} users...`);
      }
    } catch (error) {
      console.error(`  ✗ Error creating user ${person.name}:`, error);
    }
  }
  
  console.log(`\n✅ Created ${createdUsers.length} users with synchronized data`);
  
  // ===== PHASE 3: Create sample students =====
  console.log('\n🎓 Phase 3: Creating sample students...');
  
  const studentClasses = ['K45A', 'K45B', 'K46A', 'K46B', 'K47A', 'K47B'];
  const majors = ['Hậu cần Quân sự', 'Tài chính Quân sự', 'Vận tải Quân sự', 'Quân nhu', 'Doanh trại'];
  
  for (let s = 0; s < 50; s++) {
    const studentClass = randomFromArray(studentClasses);
    const major = randomFromArray(majors);
    const firstName = randomFromArray(['An', 'Bình', 'Cường', 'Dũng', 'Hùng', 'Minh', 'Tuấn', 'Long', 'Hải', 'Thành']);
    const lastName = randomFromArray(['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ']);
    const name = `${lastName} Văn ${firstName}`;
    const idx = 500 + s;
    
    let email = `${vietnameseToSlug(firstName)}.hv${s + 1}@hvhc.edu.vn`.toLowerCase();
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${vietnameseToSlug(firstName)}.hv${s + 1}_${counter}@hvhc.edu.vn`.toLowerCase();
      counter++;
    }
    usedEmails.add(email);
    
    try {
      const student = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: UserRole.HOC_VIEN,
          status: 'ACTIVE',
          militaryId: `HV${String(idx).padStart(6, '0')}`,
          rank: 'Học viên',
          position: 'Học viên',
          department: studentClass,
          phone: generatePhone(idx),
          dateOfBirth: randomDate(new Date(2000, 0, 1), new Date(2005, 11, 31)),
          gender: 'Nam',
          employeeId: `SV${String(idx).padStart(5, '0')}`,
          personnelType: PersonnelCategory.HOC_VIEN_QUAN_SU,
          workStatus: WorkStatus.ACTIVE,
          bloodType: randomFromArray([BloodType.A_POSITIVE, BloodType.B_POSITIVE, BloodType.O_POSITIVE, BloodType.AB_POSITIVE]),
        }
      });
      
      // Create StudentProfile
      await prisma.studentProfile.create({
        data: {
          userId: student.id,
          maHocVien: `HV${studentClass}${String(s + 1).padStart(3, '0')}`,
          lop: studentClass,
          khoaHoc: studentClass.substring(0, 3),
          nganh: major,
          heDaoTao: 'Chính quy',
          khoaQuanLy: 'Hệ Quản lý Học viên',
          trungDoi: `Trung đội ${(s % 3) + 1}`,
          daiDoi: `Đại đội ${Math.floor(s / 10) + 1}`,
          diemTrungBinh: 6 + Math.random() * 3.5,
          xepLoaiHocLuc: randomFromArray(['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình']),
          tongTinChi: 140,
          tinChiTichLuy: 70 + Math.floor(Math.random() * 70),
          trangThai: StudentStatus.DANG_HOC,
          ngayNhapHoc: randomDate(new Date(2021, 8, 1), new Date(2023, 8, 1)),
        }
      });
      
      // Create insurance for student
      await prisma.insuranceInfo.create({
        data: {
          userId: student.id,
          insuranceNumber: generateInsuranceNumber(idx),
          insuranceStartDate: new Date(2021, 8, 1),
          healthInsuranceNumber: generateHealthInsuranceNumber(idx),
          healthInsuranceStartDate: new Date(2021, 8, 1),
          healthInsuranceEndDate: new Date(2026, 8, 1),
          healthInsuranceHospital: 'Bệnh xá Học viện Hậu cần',
        }
      });
    } catch (error) {
      console.error(`  ✗ Error creating student ${name}:`, error);
    }
  }
  
  console.log('  ✓ Created 50 sample students');
  
  // ===== Summary =====
  const userCount = await prisma.user.count();
  const partyCount = await prisma.partyMember.count();
  const insuranceCount = await prisma.insuranceInfo.count();
  const policyCount = await prisma.policyRecord.count();
  const medicalCount = await prisma.medicalRecord.count();
  const facultyCount = await prisma.facultyProfile.count();
  const studentProfileCount = await prisma.studentProfile.count();
  
  console.log('\n📊 Summary:');
  console.log(`  - Users (CSDL Quân nhân): ${userCount}`);
  console.log(`  - Party Members (CSDL Đảng viên): ${partyCount}`);
  console.log(`  - Insurance Info (CSDL Bảo hiểm XH): ${insuranceCount}`);
  console.log(`  - Policy Records (CSDL Thi đua): ${policyCount}`);
  console.log(`  - Medical Records (CSDL Quân y): ${medicalCount}`);
  console.log(`  - Faculty Profiles (CSDL Giảng viên): ${facultyCount}`);
  console.log(`  - Student Profiles (CSDL Học viên): ${studentProfileCount}`);
  
  console.log('\n✅ Synchronized data seed completed successfully!');
  console.log(`🔐 Default password for all accounts: ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
