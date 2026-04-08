/**
 * Phase 4: Seed Demo Data for New Modules
 * - PartyMember (Đảng viên)
 * - InsuranceInfo (BHXH/BHYT)
 * - UserPermissionGrant (Phân quyền hồ sơ)
 * 
 * Run: npx tsx scripts/seed-phase4-demo.ts
 */

import 'dotenv/config';
import { PrismaClient, PartyMemberStatus, PermissionType, PermissionScopeType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const HOSPITALS = [
  'Bệnh viện Quân y 108',
  'Bệnh viện Quân y 103',
  'Bệnh viện Quân y 175',
  'Bệnh viện Quân đội Trung ương 108',
  'Bệnh viện 19-8',
  'Bệnh viện Đa khoa Hà Đông',
  'Bệnh viện Bạch Mai',
  'Bệnh viện Việt Đức'
];

const PARTY_CELLS = [
  'Chi bộ Khoa Hậu cần',
  'Chi bộ Khoa CNTT',
  'Chi bộ Khoa Tài chính',
  'Chi bộ Khoa Kỹ thuật Xây dựng',
  'Chi bộ Khoa Vận tải',
  'Chi bộ Phòng Đào tạo',
  'Chi bộ Phòng Chính trị',
  'Chi bộ Ban Giám hiệu'
];

const BENEFICIARY_RELATIONS = ['Vợ', 'Chồng', 'Con trai', 'Con gái', 'Bố', 'Mẹ', 'Anh/Chị/Em'];

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInsuranceNumber(): string {
  const prefix = '01';
  const body = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `${prefix}${body}`;
}

function generateHealthInsuranceNumber(): string {
  const letters = ['HN', 'DN', 'HCM', 'QN', 'HP'];
  const prefix = randomItem(letters);
  const body = Math.floor(Math.random() * 100000000).toString().padStart(10, '0');
  return `${prefix}${body}`;
}

function generatePartyCardNumber(): string {
  const year = 2000 + Math.floor(Math.random() * 25);
  const body = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
  return `${year}${body}`;
}

function generatePhone(): string {
  const prefixes = ['0912', '0915', '0918', '0988', '0978', '0968', '0358', '0368'];
  const prefix = randomItem(prefixes);
  const body = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}${body}`;
}

async function main() {
  console.log('🌱 Phase 4: Seeding demo data for new modules...');

  // Get existing users with roles suitable for personnel data
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [
          UserRole.GIANG_VIEN, 
          UserRole.CHI_HUY_KHOA_PHONG, 
          UserRole.CHI_HUY_HOC_VIEN, 
          UserRole.QUAN_TRI_HE_THONG,
          UserRole.CHU_NHIEM_BO_MON,
          UserRole.ADMIN
        ]
      }
    },
    include: {
      unitRelation: true
    },
    take: 100
  });

  console.log(`📋 Found ${users.length} users for data generation`);

  if (users.length === 0) {
    console.log('❌ No users found. Please run the main seed first.');
    return;
  }

  // Get admin user for permission grants
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'QUAN_TRI_HE_THONG'
    }
  });

  if (!adminUser) {
    console.log('❌ No admin user found.');
    return;
  }

  // Get units for scope-based permissions
  const units = await prisma.unit.findMany({ take: 10 });
  console.log(`📋 Found ${units.length} units`);

  // ============================================
  // 1. SEED PARTY MEMBER DATA
  // ============================================
  console.log('\n📌 Creating Party Member records...');
  
  let partyMemberCount = 0;
  const partyMemberStatuses: PartyMemberStatus[] = [
    PartyMemberStatus.ACTIVE, 
    PartyMemberStatus.ACTIVE, 
    PartyMemberStatus.ACTIVE, 
    PartyMemberStatus.SUSPENDED, 
    PartyMemberStatus.TRANSFERRED
  ];

  for (const user of users) {
    // ~70% chance to be party member
    if (Math.random() > 0.3) {
      try {
        const joinDate = randomDate(new Date(2000, 0, 1), new Date(2022, 11, 31));
        const officialDate = new Date(joinDate.getTime() + 365 * 24 * 60 * 60 * 1000); // +1 year
        
        await prisma.partyMember.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            partyCardNumber: generatePartyCardNumber(),
            joinDate,
            officialDate,
            partyCell: randomItem(PARTY_CELLS),
            partyCommittee: 'Đảng ủy Học viện Hậu cần',
            recommender1: users[Math.floor(Math.random() * users.length)]?.name || 'Nguyễn Văn A',
            recommender2: users[Math.floor(Math.random() * users.length)]?.name || 'Trần Văn B',
            status: randomItem(partyMemberStatuses)
          }
        });
        partyMemberCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  console.log(`✅ Created ${partyMemberCount} Party Member records`);

  // ============================================
  // 2. SEED INSURANCE INFO DATA
  // ============================================
  console.log('\n📌 Creating Insurance Info records...');
  
  let insuranceCount = 0;
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, 11, 31);

  for (const user of users) {
    // ~85% chance to have insurance
    if (Math.random() > 0.15) {
      try {
        const insuranceStartDate = randomDate(new Date(2015, 0, 1), new Date(2023, 5, 30));
        const healthInsuranceStartDate = new Date(now.getFullYear(), 0, 1);
        
        await prisma.insuranceInfo.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            // BHXH
            insuranceNumber: generateInsuranceNumber(),
            insuranceStartDate,
            insuranceEndDate: null, // Ongoing
            // BHYT
            healthInsuranceNumber: generateHealthInsuranceNumber(),
            healthInsuranceStartDate,
            healthInsuranceEndDate: nextYear,
            healthInsuranceHospital: randomItem(HOSPITALS),
            // Beneficiary
            beneficiaryName: `Nguyễn Thị ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
            beneficiaryRelation: randomItem(BENEFICIARY_RELATIONS),
            beneficiaryPhone: generatePhone(),
            notes: Math.random() > 0.7 ? 'Đã đóng đủ 20 năm BHXH' : null
          }
        });
        insuranceCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  console.log(`✅ Created ${insuranceCount} Insurance Info records`);

  // ============================================
  // 3. SEED PERMISSION GRANTS
  // ============================================
  console.log('\n📌 Creating Permission Grant records...');

  let permissionCount = 0;

  // Grant VIEW permission to some users (scope: ALL)
  const viewAllGrants = [
    {
      permission: PermissionType.PERSONNEL_VIEW,
      scopeType: PermissionScopeType.ALL,
      reason: 'Cấp quyền xem toàn bộ hồ sơ cho công tác thanh tra'
    }
  ];

  // Select 3 random users for VIEW ALL
  const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(3, shuffledUsers.length); i++) {
    try {
      const grant = viewAllGrants[0];
      await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: grant.permission,
          scopeType: grant.scopeType,
          grantedById: adminUser.id,
          reason: grant.reason,
          expiresAt: new Date(now.getFullYear() + 1, 11, 31)
        }
      });
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  // Grant UNIT-scoped permissions
  if (units.length > 0) {
    const unitPermissions: Array<{ permission: PermissionType; reason: string }> = [
      { permission: PermissionType.PERSONNEL_VIEW, reason: 'Xem hồ sơ cán bộ trong đơn vị' },
      { permission: PermissionType.PERSONNEL_EDIT, reason: 'Cập nhật hồ sơ cán bộ trong đơn vị' },
      { permission: PermissionType.PERSONNEL_EXPORT, reason: 'Xuất báo cáo nhân sự đơn vị' }
    ];

    for (let i = 3; i < Math.min(12, shuffledUsers.length); i++) {
      const unit = units[Math.floor(Math.random() * units.length)];
      const perm = unitPermissions[Math.floor(Math.random() * unitPermissions.length)];
      
      try {
        await prisma.userPermissionGrant.create({
          data: {
            userId: shuffledUsers[i].id,
            permission: perm.permission,
            scopeType: PermissionScopeType.UNIT,
            unitId: unit.id,
            grantedById: adminUser.id,
            reason: perm.reason,
            expiresAt: Math.random() > 0.3 ? new Date(now.getFullYear() + 1, 5, 30) : null
          }
        });
        permissionCount++;
      } catch (e) {
        // Skip
      }
    }
  }

  // Grant PERSONNEL-scoped permissions (specific individuals)
  for (let i = 12; i < Math.min(18, shuffledUsers.length); i++) {
    try {
      const grant = await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: PermissionType.PERSONNEL_VIEW,
          scopeType: PermissionScopeType.PERSONNEL,
          grantedById: adminUser.id,
          reason: 'Xem hồ sơ cá nhân được phân công quản lý',
          expiresAt: new Date(now.getFullYear(), 11, 31)
        }
      });

      // Add specific personnel to this grant
      const personnelIds = shuffledUsers
        .slice(0, 5)
        .map(u => u.id)
        .filter(id => id !== shuffledUsers[i].id);

      for (const personnelId of personnelIds) {
        try {
          await prisma.userPermissionGrantPersonnel.create({
            data: {
              grantId: grant.id,
              personnelId
            }
          });
        } catch (e) {
          // Skip duplicates
        }
      }
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  // Grant SELF-only permissions
  for (let i = 18; i < Math.min(25, shuffledUsers.length); i++) {
    try {
      await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: PermissionType.PERSONNEL_VIEW,
          scopeType: PermissionScopeType.SELF,
          grantedById: adminUser.id,
          reason: 'Chỉ được xem hồ sơ cá nhân'
        }
      });
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  // Grant sensitive permissions (EDIT_SENSITIVE) - very limited
  for (let i = 25; i < Math.min(28, shuffledUsers.length); i++) {
    try {
      await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: PermissionType.PERSONNEL_EDIT_SENSITIVE,
          scopeType: PermissionScopeType.UNIT,
          unitId: units[0]?.id,
          grantedById: adminUser.id,
          reason: 'Cập nhật thông tin nhạy cảm (CCCD, BHXH, Đảng viên)',
          expiresAt: new Date(now.getFullYear(), now.getMonth() + 3, 1) // 3 months
        }
      });
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  // Create some revoked permissions for demo
  for (let i = 28; i < Math.min(32, shuffledUsers.length); i++) {
    try {
      await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: PermissionType.PERSONNEL_DELETE,
          scopeType: PermissionScopeType.ALL,
          grantedById: adminUser.id,
          reason: 'Cấp tạm quyền xóa hồ sơ',
          isRevoked: true,
          revokedAt: new Date(),
          revokedById: adminUser.id,
          revokedReason: 'Hoàn thành công việc, thu hồi quyền'
        }
      });
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  // Create some expired permissions
  for (let i = 32; i < Math.min(35, shuffledUsers.length); i++) {
    try {
      await prisma.userPermissionGrant.create({
        data: {
          userId: shuffledUsers[i].id,
          permission: PermissionType.PERSONNEL_APPROVE,
          scopeType: PermissionScopeType.UNIT,
          unitId: units[Math.floor(Math.random() * units.length)]?.id,
          grantedById: adminUser.id,
          reason: 'Cấp quyền duyệt hồ sơ tạm thời',
          expiresAt: new Date(now.getFullYear() - 1, 5, 30) // Expired last year
        }
      });
      permissionCount++;
    } catch (e) {
      // Skip
    }
  }

  console.log(`✅ Created ${permissionCount} Permission Grant records`);

  // ============================================
  // 4. SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('📊 PHASE 4 SEED SUMMARY');
  console.log('='.repeat(50));
  
  const totalPartyMembers = await prisma.partyMember.count();
  const totalInsurance = await prisma.insuranceInfo.count();
  const totalPermissions = await prisma.userPermissionGrant.count();
  const activePermissions = await prisma.userPermissionGrant.count({
    where: {
      isRevoked: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  console.log(`\n🎖️  Party Members:      ${totalPartyMembers}`);
  console.log(`🏥 Insurance Records:  ${totalInsurance}`);
  console.log(`🔐 Permission Grants:  ${totalPermissions}`);
  console.log(`   └─ Active:          ${activePermissions}`);
  console.log(`   └─ Expired/Revoked: ${totalPermissions - activePermissions}`);
  
  console.log('\n✨ Phase 4 seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
