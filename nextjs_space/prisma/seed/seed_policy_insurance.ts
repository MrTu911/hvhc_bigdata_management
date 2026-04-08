/**
 * Seed dữ liệu CSDL Chính sách (A2.3) và Bảo hiểm XH (A2.4)
 * Chạy: yarn tsx --require dotenv/config prisma/seed/seed_policy_insurance.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =====================================================
// A2.3: DANH MỤC LOẠI CHÍNH SÁCH
// =====================================================
const policyCategories = [
  // Chế độ hưu trí
  {
    code: 'HUU_TRI',
    name: 'Chế độ hưu trí',
    description: 'Các chính sách liên quan đến hưu trí, lương hưu',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 1,
  },
  {
    code: 'HUU_TRI_TRUOC_TUOI',
    name: 'Hưu trí trước tuổi',
    description: 'Chế độ nghỉ hưu trước tuổi theo quy định',
    parentCode: 'HUU_TRI',
    requiresApproval: true,
    approvalLevels: 3,
    sortOrder: 11,
  },
  {
    code: 'HUU_TRI_DUNG_TUOI',
    name: 'Hưu trí đúng tuổi',
    description: 'Chế độ nghỉ hưu đúng tuổi theo quy định',
    parentCode: 'HUU_TRI',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 12,
  },
  
  // Chế độ thai sản
  {
    code: 'THAI_SAN',
    name: 'Chế độ thai sản',
    description: 'Các chính sách liên quan đến thai sản, nghỉ đẻ',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 2,
  },
  {
    code: 'THAI_SAN_SINH',
    name: 'Nghỉ sinh con',
    description: 'Chế độ nghỉ sinh con 6 tháng',
    parentCode: 'THAI_SAN',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 21,
  },
  {
    code: 'THAI_SAN_SAY',
    name: 'Sẩy thai, nạo thai',
    description: 'Chế độ nghỉ khi sẩy thai, nạo thai',
    parentCode: 'THAI_SAN',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 22,
  },
  
  // Chế độ tử tuất
  {
    code: 'TU_TUAT',
    name: 'Chế độ tử tuất',
    description: 'Các chính sách khi quân nhân, người thân qua đời',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 3,
  },
  {
    code: 'TU_TUAT_MAI_TANG',
    name: 'Trợ cấp mai táng',
    description: 'Trợ cấp chi phí mai táng',
    parentCode: 'TU_TUAT',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 31,
  },
  {
    code: 'TU_TUAT_TUAN_HANG_THANG',
    name: 'Trợ cấp tuất hàng tháng',
    description: 'Trợ cấp tuất hàng tháng cho thân nhân',
    parentCode: 'TU_TUAT',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 32,
  },
  
  // Chế độ thương binh, liệt sĩ
  {
    code: 'THUONG_BINH',
    name: 'Chế độ thương binh',
    description: 'Chính sách cho thương binh, người hưởng chính sách như thương binh',
    requiresApproval: true,
    approvalLevels: 3,
    sortOrder: 4,
  },
  {
    code: 'LIET_SI',
    name: 'Chế độ liệt sĩ',
    description: 'Chính sách cho gia đình liệt sĩ',
    requiresApproval: true,
    approvalLevels: 3,
    sortOrder: 5,
  },
  
  // Chế độ ốm đau
  {
    code: 'OM_DAU',
    name: 'Chế độ ốm đau',
    description: 'Nghỉ ốm, điều trị bệnh',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 6,
  },
  {
    code: 'OM_DAU_NGAN_HAN',
    name: 'Ốm đau ngắn hạn',
    description: 'Nghỉ ốm dưới 14 ngày',
    parentCode: 'OM_DAU',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 61,
  },
  {
    code: 'OM_DAU_DAI_HAN',
    name: 'Ốm đau dài hạn',
    description: 'Nghỉ ốm trên 14 ngày, điều trị dài ngày',
    parentCode: 'OM_DAU',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 62,
  },
  
  // Hỗ trợ đặc biệt
  {
    code: 'HO_TRO_DAC_BIET',
    name: 'Hỗ trợ đặc biệt',
    description: 'Các chế độ hỗ trợ đặc biệt, khẩn cấp',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 7,
  },
  {
    code: 'HO_TRO_THIEN_TAI',
    name: 'Hỗ trợ thiên tai',
    description: 'Hỗ trợ khi gặp thiên tai, bão lụt',
    parentCode: 'HO_TRO_DAC_BIET',
    requiresApproval: true,
    approvalLevels: 1,
    sortOrder: 71,
  },
  {
    code: 'HO_TRO_BENH_HIEM_NGHEO',
    name: 'Hỗ trợ bệnh hiểm nghèo',
    description: 'Hỗ trợ điều trị bệnh hiểm nghèo',
    parentCode: 'HO_TRO_DAC_BIET',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 72,
  },
  {
    code: 'HO_TRO_HOAN_CANH_KHO_KHAN',
    name: 'Hỗ trợ hoàn cảnh khó khăn',
    description: 'Hỗ trợ đột xuất khi hoàn cảnh gia đình khó khăn',
    parentCode: 'HO_TRO_DAC_BIET',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 73,
  },
  
  // Chế độ xuất ngũ
  {
    code: 'XUAT_NGU',
    name: 'Chế độ xuất ngũ',
    description: 'Các chính sách khi xuất ngũ, chuyển ngành',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 8,
  },
  {
    code: 'XUAT_NGU_TRO_CAP',
    name: 'Trợ cấp xuất ngũ',
    description: 'Trợ cấp một lần khi xuất ngũ',
    parentCode: 'XUAT_NGU',
    requiresApproval: true,
    approvalLevels: 2,
    sortOrder: 81,
  },
];

async function seedPolicyCategories() {
  console.log('📋 Seeding Policy Categories...');
  
  // Tạo danh mục cha trước
  const parentCategories = policyCategories.filter(c => !c.parentCode);
  const childCategories = policyCategories.filter(c => c.parentCode);
  
  // Tạo parent categories
  for (const category of parentCategories) {
    await prisma.policyCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        description: category.description,
        requiresApproval: category.requiresApproval,
        approvalLevels: category.approvalLevels,
        sortOrder: category.sortOrder,
      },
      create: {
        code: category.code,
        name: category.name,
        description: category.description,
        requiresApproval: category.requiresApproval,
        approvalLevels: category.approvalLevels,
        sortOrder: category.sortOrder,
      },
    });
  }
  
  // Tạo child categories với parentId
  for (const category of childCategories) {
    const parent = await prisma.policyCategory.findUnique({
      where: { code: category.parentCode },
    });
    
    if (parent) {
      await prisma.policyCategory.upsert({
        where: { code: category.code },
        update: {
          name: category.name,
          description: category.description,
          parentId: parent.id,
          requiresApproval: category.requiresApproval,
          approvalLevels: category.approvalLevels,
          sortOrder: category.sortOrder,
        },
        create: {
          code: category.code,
          name: category.name,
          description: category.description,
          parentId: parent.id,
          requiresApproval: category.requiresApproval,
          approvalLevels: category.approvalLevels,
          sortOrder: category.sortOrder,
        },
      });
    }
  }
  
  const count = await prisma.policyCategory.count();
  console.log(`   ✅ Created ${count} policy categories`);
}

// =====================================================
// A2.4: DỮ LIỆU MẪU BẢO HIỂM
// =====================================================
async function seedInsuranceSampleData() {
  console.log('🏥 Seeding Insurance Sample Data...');
  
  // Lấy một số user để tạo dữ liệu mẫu
  const users = await prisma.user.findMany({
    take: 10,
    where: {
      role: { in: ['GIANG_VIEN', 'QUAN_TRI_HE_THONG', 'CHI_HUY_KHOA_PHONG'] },
      insuranceInfo: null,
    },
  });
  
  if (users.length === 0) {
    console.log('   ⏭️ No users without insurance info found, skipping...');
    return;
  }
  
  for (const user of users) {
    // Tạo InsuranceInfo
    const insuranceInfo = await prisma.insuranceInfo.create({
      data: {
        userId: user.id,
        insuranceNumber: `BH${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(-4).toUpperCase()}`,
        insuranceStartDate: new Date('2020-01-01'),
        healthInsuranceNumber: `HS${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(-4).toUpperCase()}`,
        healthInsuranceStartDate: new Date('2024-01-01'),
        healthInsuranceEndDate: new Date('2024-12-31'),
        healthInsuranceHospital: 'Bệnh viện Quân y 103',
        beneficiaryName: `Thân nhân của ${user.name}`,
        beneficiaryRelation: 'VỢ/CHỒNG',
      },
    });
    
    // Tạo lịch sử đóng BHXH (12 tháng gần nhất)
    const currentYear = new Date().getFullYear();
    for (let month = 1; month <= 12; month++) {
      await prisma.insuranceHistory.create({
        data: {
          insuranceInfoId: insuranceInfo.id,
          transactionType: 'CONTRIBUTION',
          periodMonth: month,
          periodYear: currentYear - 1,
          baseSalary: 15000000,
          amount: 3150000, // 21% của lương
          employeeShare: 1275000, // 8.5%
          employerShare: 1875000, // 12.5%
          documentNumber: `CT-${currentYear - 1}-${month.toString().padStart(2, '0')}`,
          documentDate: new Date(currentYear - 1, month - 1, 25),
        },
      });
    }
    
    // Tạo người phụ thuộc mẫu
    await prisma.insuranceDependent.create({
      data: {
        insuranceInfoId: insuranceInfo.id,
        fullName: `Nguyễn Văn A (con ${user.name})`,
        relationship: 'CHILD',
        dateOfBirth: new Date('2015-05-15'),
        gender: 'Nam',
        healthInsuranceNumber: `HS-PT${Date.now().toString().slice(-6)}`,
        healthInsuranceStartDate: new Date('2024-01-01'),
        healthInsuranceEndDate: new Date('2024-12-31'),
        healthInsuranceHospital: 'Bệnh viện Nhi Trung ương',
        status: 'ACTIVE',
      },
    });
  }
  
  const insuranceCount = await prisma.insuranceInfo.count();
  const historyCount = await prisma.insuranceHistory.count();
  const dependentCount = await prisma.insuranceDependent.count();
  
  console.log(`   ✅ Created ${insuranceCount} insurance records`);
  console.log(`   ✅ Created ${historyCount} insurance history records`);
  console.log(`   ✅ Created ${dependentCount} dependent records`);
}

// =====================================================
// MAIN
// =====================================================
async function main() {
  console.log('\n🚀 Starting Policy & Insurance Seed...\n');
  
  await seedPolicyCategories();
  await seedInsuranceSampleData();
  
  console.log('\n✅ Seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
