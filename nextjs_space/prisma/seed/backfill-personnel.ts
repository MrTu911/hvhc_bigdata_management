/**
 * BACKFILL SCRIPT: Chuyển dữ liệu từ User sang Personnel
 * Phương pháp: Expand - Không xóa dữ liệu cũ
 * 
 * Chạy: yarn tsx prisma/seed/backfill-personnel.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, PersonnelCategory, ManagingOrgan, PersonnelStatus, PersonnelEventType, UserRole, WorkStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Xác định cơ quan quản lý từ loại cán bộ
function deriveManagingOrgan(category: PersonnelCategory | null, role: UserRole): ManagingOrgan {
  if (!category) {
    // Derive từ role nếu không có category
    switch (role) {
      case 'GIANG_VIEN':
      case 'CHU_NHIEM_BO_MON':
        return 'PHONG_CHINH_TRI';
      case 'HOC_VIEN':
      case 'HOC_VIEN_SINH_VIEN':
        return 'PHONG_DAO_TAO';
      case 'CHI_HUY_HOC_VIEN':
      case 'CHI_HUY_KHOA_PHONG':
        return 'BAN_CAN_BO';
      default:
        return 'PHONG_CHINH_TRI';
    }
  }

  switch (category) {
    case 'CAN_BO_CHI_HUY':
    case 'HOC_VIEN_QUAN_SU':
      return 'BAN_CAN_BO';
    case 'CONG_NHAN_VIEN':
      return 'BAN_QUAN_LUC';
    case 'SINH_VIEN_DAN_SU':
      return 'PHONG_DAO_TAO';
    case 'GIANG_VIEN':
    case 'NGHIEN_CUU_VIEN':
    default:
      return 'PHONG_CHINH_TRI';
  }
}

// Xác định category từ role nếu chưa có
function deriveCategoryFromRole(role: UserRole): PersonnelCategory {
  switch (role) {
    case 'CHI_HUY_HOC_VIEN':
    case 'CHI_HUY_KHOA_PHONG':
      return 'CAN_BO_CHI_HUY';
    case 'GIANG_VIEN':
    case 'CHU_NHIEM_BO_MON':
      return 'GIANG_VIEN';
    case 'NGHIEN_CUU_VIEN':
      return 'NGHIEN_CUU_VIEN';
    case 'HOC_VIEN':
    case 'HOC_VIEN_SINH_VIEN':
      return 'SINH_VIEN_DAN_SU';
    case 'KY_THUAT_VIEN':
      return 'CONG_NHAN_VIEN';
    default:
      return 'CONG_NHAN_VIEN';
  }
}

// Chuyển WorkStatus sang PersonnelStatus
function mapWorkStatus(workStatus: WorkStatus | null): PersonnelStatus {
  switch (workStatus) {
    case 'ACTIVE':
      return 'DANG_CONG_TAC';
    case 'TRANSFERRED':
      return 'CHUYEN_CONG_TAC';
    case 'RETIRED':
      return 'NGHI_HUU';
    case 'SUSPENDED':
      return 'TAM_NGHI';
    case 'RESIGNED':
      return 'XUAT_NGU';
    default:
      return 'DANG_CONG_TAC';
  }
}

// Generate mã cán bộ duy nhất
function generatePersonnelCode(user: any, index: number): string {
  // Ưu tiên: employeeId > militaryId > militaryIdNumber > auto-generate
  if (user.employeeId) return user.employeeId;
  if (user.militaryId) return user.militaryId;
  if (user.militaryIdNumber) return user.militaryIdNumber;
  
  // Auto-generate
  const year = new Date().getFullYear();
  return `CB${year}${String(index).padStart(5, '0')}`;
}

async function backfillPersonnel() {
  console.log('\n🚀 BẮT ĐẦU BACKFILL PERSONNEL...');
  console.log('=' .repeat(60));

  // 1. Lấy tất cả users chưa có personnelId
  const users = await prisma.user.findMany({
    where: {
      personnelId: null,
      // Bỏ qua tài khoản hệ thống
      NOT: {
        OR: [
          { email: { contains: '@system' } },
          { email: { contains: 'admin@' } },
          { role: 'QUAN_TRI_HE_THONG' },
          { role: 'ADMIN' },
        ]
      }
    },
    include: {
      unitRelation: true,
    }
  });

  console.log(`📋 Tìm thấy ${users.length} user cần tạo Personnel`);

  let created = 0;
  let skipped = 0;
  let errors: string[] = [];

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const personnelCode = generatePersonnelCode(user, i + 1);

    try {
      // Kiểm tra đã có Personnel với code này chưa
      const existingPersonnel = await prisma.personnel.findUnique({
        where: { personnelCode }
      });

      if (existingPersonnel) {
        console.log(`⚠️  Đã tồn tại Personnel code: ${personnelCode}, skip ${user.name}`);
        skipped++;
        continue;
      }

      // Xác định category và managingOrgan
      const category = user.personnelType || deriveCategoryFromRole(user.role);
      const managingOrgan = deriveManagingOrgan(category, user.role);
      const status = mapWorkStatus(user.workStatus);

      // Tạo Personnel
      const personnel = await prisma.personnel.create({
        data: {
          personnelCode,
          fullName: user.name,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          placeOfOrigin: user.placeOfOrigin,
          birthPlace: user.birthPlace,
          ethnicity: user.ethnicity,
          religion: user.religion,
          category,
          managingOrgan,
          unitId: user.unitId,
          status,
          militaryIdNumber: user.militaryIdNumber,
          militaryRank: user.rank,
          position: user.position,
          enlistmentDate: user.enlistmentDate,
          dischargeDate: user.dischargeDate,
          employeeIdNumber: user.employeeId,
          educationLevel: user.educationLevel,
          specialization: user.specialization,
        }
      });

      // Link User → Personnel
      await prisma.user.update({
        where: { id: user.id },
        data: { personnelId: personnel.id }
      });

      // Tạo SensitiveIdentity (nếu có dữ liệu nhạy cảm)
      const hasSensitiveData = user.citizenId || user.officerIdCard;
      if (hasSensitiveData) {
        await prisma.sensitiveIdentity.create({
          data: {
            personnelId: personnel.id,
            citizenIdEncrypted: user.citizenId, // Trong thực tế cần mã hóa
            officerIdEncrypted: user.officerIdCard,
          }
        });
      }

      // Tạo PersonnelEvent đầu tiên
      await prisma.personnelEvent.create({
        data: {
          personnelId: personnel.id,
          eventType: 'CREATED',
          eventDate: user.createdAt || new Date(),
          summary: `Tạo hồ sơ cán bộ từ User: ${user.email}`,
          payload: {
            source: 'backfill',
            userId: user.id,
            category,
            managingOrgan,
          },
          createdBy: 'system-backfill',
        }
      });

      // Nếu có tài khoản, ghi thêm event
      await prisma.personnelEvent.create({
        data: {
          personnelId: personnel.id,
          eventType: 'ACCOUNT_CREATED',
          eventDate: user.createdAt || new Date(),
          summary: `Đã có tài khoản: ${user.email}`,
          payload: { userId: user.id, email: user.email },
          createdBy: 'system-backfill',
        }
      });

      created++;
      console.log(`✅ [${created}/${users.length}] Tạo Personnel: ${user.name} (${personnelCode})`);

    } catch (error: any) {
      const errMsg = `❌ Lỗi tạo Personnel cho ${user.name}: ${error.message}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 KẾT QUẢ BACKFILL:');
  console.log(`   ✅ Đã tạo: ${created} Personnel`);
  console.log(`   ⏭️  Đã bỏ qua: ${skipped}`);
  console.log(`   ❌ Lỗi: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  CÁC LỖI:');
    errors.forEach(e => console.log(`   ${e}`));
  }

  // Thống kê sau backfill
  const stats = await getStats();
  console.log('\n📈 THỐNG KÊ SAU BACKFILL:');
  console.log(`   Tổng Personnel: ${stats.totalPersonnel}`);
  console.log(`   Users đã link: ${stats.usersLinked}`);
  console.log(`   Users chưa link: ${stats.usersNotLinked}`);
  console.log(`   SensitiveIdentity: ${stats.sensitiveCount}`);
  console.log(`   PersonnelEvents: ${stats.eventsCount}`);
}

async function getStats() {
  const totalPersonnel = await prisma.personnel.count();
  const usersLinked = await prisma.user.count({ where: { personnelId: { not: null } } });
  const usersNotLinked = await prisma.user.count({ where: { personnelId: null } });
  const sensitiveCount = await prisma.sensitiveIdentity.count();
  const eventsCount = await prisma.personnelEvent.count();

  return { totalPersonnel, usersLinked, usersNotLinked, sensitiveCount, eventsCount };
}

// Chạy backfill
backfillPersonnel()
  .then(() => {
    console.log('\n✅ BACKFILL HOÀN TẤT!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ BACKFILL THẤT BẠI:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
