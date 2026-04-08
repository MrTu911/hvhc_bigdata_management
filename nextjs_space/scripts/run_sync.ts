import { PrismaClient, OfficerRank, SoldierRank } from '@prisma/client';

const prisma = new PrismaClient();

// Map quân hàm string sang enum
const RANK_TO_ENUM: Record<string, OfficerRank> = {
  'Thiếu úy': 'THIEU_UY',
  'Trung úy': 'TRUNG_UY',
  'Thượng úy': 'THUONG_UY',
  'Đại úy': 'DAI_UY',
  'Thiếu tá': 'THIEU_TA',
  'Trung tá': 'TRUNG_TA',
  'Thượng tá': 'THUONG_TA',
  'Đại tá': 'DAI_TA',
  'Thiếu tướng': 'THIEU_TUONG',
  'Trung tướng': 'TRUNG_TUONG',
  'Thượng tướng': 'THUONG_TUONG',
  'Đại tướng': 'DAI_TUONG',
};

async function runSync() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        ĐỒNG BỘ CSDL CHUYÊN NGÀNH                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Lấy tất cả User
  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE' },
    include: { personnelProfile: true }
  });
  
  console.log(`\n📊 Tổng số User: ${users.length}`);
  
  let officerCount = 0;
  let soldierCount = 0;
  let partyCount = 0;
  let insuranceCount = 0;
  let policyCount = 0;
  
  for (const user of users) {
    // 1. Tạo OfficerCareer cho CAN_BO
    if (user.managementCategory === 'CAN_BO' && user.personnelId) {
      const existing = await prisma.officerCareer.findUnique({
        where: { personnelId: user.personnelId }
      });
      if (!existing) {
        try {
          const rankEnum = RANK_TO_ENUM[user.rank || ''];
          await prisma.officerCareer.create({
            data: {
              personnelId: user.personnelId,
              currentRank: rankEnum || null,
              commissionedDate: user.enlistmentDate || new Date('2010-01-01'),
              officerIdNumber: `SQ${String(officerCount + 1).padStart(6, '0')}`,
            }
          });
          officerCount++;
        } catch (e: any) {
          // Silent skip
        }
      }
    }
    
    // 2. Tạo SoldierProfile cho QUAN_LUC
    if (user.managementCategory === 'QUAN_LUC' && user.personnelId) {
      const existing = await prisma.soldierProfile.findUnique({
        where: { personnelId: user.personnelId }
      });
      if (!existing) {
        try {
          await prisma.soldierProfile.create({
            data: {
              personnelId: user.personnelId,
              soldierCategory: 'QNCN',
              serviceType: 'CHUYEN_NGHIEP',
              enlistmentDate: user.enlistmentDate || new Date('2015-01-01'),
              soldierIdNumber: `QN${String(soldierCount + 1).padStart(8, '0')}`,
            }
          });
          soldierCount++;
        } catch (e: any) {
          // Silent skip
        }
      }
    }
    
    // 3. Tạo PartyMember cho người có partyJoinDate
    if (user.partyJoinDate && user.id) {
      const existing = await prisma.partyMember.findUnique({
        where: { userId: user.id }
      });
      if (!existing) {
        try {
          await prisma.partyMember.create({
            data: {
              userId: user.id,
              joinDate: user.partyJoinDate,
              officialDate: user.partyJoinDate,
              partyCardNumber: `DV${String(partyCount + 1).padStart(6, '0')}`,
              partyCell: 'Chi bộ 1',
              status: 'ACTIVE',
            }
          });
          partyCount++;
        } catch (e: any) {
          // Silent skip
        }
      }
    }
    
    // 4. Tạo InsuranceInfo cho tất cả
    if (user.id) {
      const existing = await prisma.insuranceInfo.findUnique({
        where: { userId: user.id }
      });
      if (!existing) {
        try {
          await prisma.insuranceInfo.create({
            data: {
              userId: user.id,
              insuranceNumber: `BHXH${String(insuranceCount + 1).padStart(10, '0')}`,
              healthInsuranceNumber: `BH${String(insuranceCount + 1).padStart(12, '0')}`,
              healthInsuranceStartDate: new Date('2024-01-01'),
              healthInsuranceEndDate: new Date('2026-12-31'),
              insuranceStartDate: new Date('2020-01-01'),
            }
          });
          insuranceCount++;
        } catch (e: any) {
          // Silent skip
        }
      }
    }
    
    // 5. Tạo PolicyRecord cho tất cả
    if (user.id) {
      const existing = await prisma.policyRecord.findFirst({
        where: { userId: user.id }
      });
      if (!existing) {
        try {
          await prisma.policyRecord.create({
            data: {
              userId: user.id,
              recordType: 'REWARD',
              level: 'UNIT',
              title: 'Hoàn thành xuất sắc nhiệm vụ năm 2024',
              reason: 'Có thành tích xuất sắc trong công tác',
              status: 'ACTIVE',
              effectiveDate: new Date('2024-01-01'),
              workflowStatus: 'APPROVED',
            }
          });
          policyCount++;
        } catch (e: any) {
          // Silent skip
        }
      }
    }
  }
  
  console.log('\n✅ KếT QUẢ ĐỒNG BỘ:');
  console.log(`  • OfficerCareer (Sĩ quan):     ${officerCount}`);
  console.log(`  • SoldierProfile (QNCN):       ${soldierCount}`);
  console.log(`  • PartyMember (Đảng viên):     ${partyCount}`);
  console.log(`  • InsuranceInfo (Bảo hiểm):    ${insuranceCount}`);
  console.log(`  • PolicyRecord (Chính sách):   ${policyCount}`);
  
  // Thống kê cuối
  const stats = await Promise.all([
    prisma.officerCareer.count(),
    prisma.soldierProfile.count(),
    prisma.partyMember.count(),
    prisma.insuranceInfo.count(),
    prisma.policyRecord.count(),
  ]);
  
  console.log('\n📊 TỔNG SỐ TRONG DATABASE:');
  console.log(`  • OfficerCareer:    ${stats[0]}`);
  console.log(`  • SoldierProfile:   ${stats[1]}`);
  console.log(`  • PartyMember:      ${stats[2]}`);
  console.log(`  • InsuranceInfo:    ${stats[3]}`);
  console.log(`  • PolicyRecord:     ${stats[4]}`);
  
  console.log('\n🎉 HOÀN TẤT ĐỒNG BỘ!');
  
  await prisma.$disconnect();
}

runSync().catch(console.error);
