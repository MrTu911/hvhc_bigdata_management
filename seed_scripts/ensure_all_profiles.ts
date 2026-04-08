import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Lấy danh sách tất cả users...');
  
  const allUsers = await prisma.user.findMany({
    include: {
      facultyProfile: true,
      scientificProfile: true
    }
  });

  console.log(`✅ Tìm thấy ${allUsers.length} users trong hệ thống`);

  let createdFacultyProfiles = 0;
  let createdScientificProfiles = 0;

  for (const user of allUsers) {
    // 1. TẠO FACULTY PROFILE nếu chưa có
    if (!user.facultyProfile) {
      console.log(`📝 Tạo Faculty Profile cho: ${user.name}`);
      
      await prisma.facultyProfile.create({
        data: {
          userId: user.id,
          academicRank: null,
          academicDegree: null,
          specialization: '',
          teachingSubjects: null,
          researchInterests: '',
          researchProjects: 0,
          publications: 0,
          citations: 0,
          teachingExperience: 0,
          industryExperience: 0,
          biography: '',
          achievements: null,
          certifications: null,
          linkedinUrl: null,
          googleScholarUrl: null,
          researchGateUrl: null,
          orcidId: null,
          isActive: true,
          isPublic: false
        }
      });
      createdFacultyProfiles++;
    }

    // 2. TẠO SCIENTIFIC PROFILE nếu chưa có
    if (!user.scientificProfile) {
      console.log(`📚 Tạo Scientific Profile cho: ${user.name}`);
      
      await prisma.scientificProfile.create({
        data: {
          userId: user.id,
          summary: '',
          pdfPath: null,
          lastExported: null,
          isPublic: false
        }
      });
      createdScientificProfiles++;
    }
  }

  console.log('\n✅ HOÀN THÀNH!');
  console.log(`   - Tạo mới ${createdFacultyProfiles} Faculty Profiles`);
  console.log(`   - Tạo mới ${createdScientificProfiles} Scientific Profiles`);
  console.log(`   - Tổng users có đầy đủ profiles: ${allUsers.length}`);

  // Thống kê
  const stats = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          educationHistory: true,
          workExperience: true,
          scientificPublications: true,
          scientificResearch: true,
          awardsRecords: true
        }
      }
    }
  });

  const usersWithData = stats.filter(u => 
    u._count.educationHistory > 0 || 
    u._count.workExperience > 0 || 
    u._count.scientificPublications > 0 ||
    u._count.scientificResearch > 0 ||
    u._count.awardsRecords > 0
  );

  console.log(`\n📊 Thống kê:`);
  console.log(`   - Users có dữ liệu lý lịch: ${usersWithData.length}/${allUsers.length}`);
  console.log(`   - Users chưa có dữ liệu: ${allUsers.length - usersWithData.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
