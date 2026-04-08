import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 VERIFY DỮ LIỆU LÝ LỊCH KHOA HỌC\n');

  // 1. Tổng số users
  const totalUsers = await prisma.user.count();
  console.log(`📊 Tổng số users: ${totalUsers}`);

  // 2. Số users có Faculty Profile
  const facultyProfilesCount = await prisma.facultyProfile.count();
  console.log(`📝 Số users có Faculty Profile: ${facultyProfilesCount}/${totalUsers}`);

  // 3. Số users có Scientific Profile
  const scientificProfilesCount = await prisma.scientificProfile.count();
  console.log(`📚 Số users có Scientific Profile: ${scientificProfilesCount}/${totalUsers}`);

  // 4. Thống kê dữ liệu lý lịch khoa học
  const educationCount = await prisma.educationHistory.count();
  const workCount = await prisma.workExperience.count();
  const publicationsCount = await prisma.scientificPublication.count();
  const researchCount = await prisma.scientificResearch.count();
  const awardsCount = await prisma.awardsRecord.count();

  console.log(`\n📋 Thống kê dữ liệu lý lịch khoa học:`);
  console.log(`   - Quá trình đào tạo: ${educationCount}`);
  console.log(`   - Quá trình công tác: ${workCount}`);
  console.log(`   - Công trình khoa học: ${publicationsCount}`);
  console.log(`   - Đề tài nghiên cứu: ${researchCount}`);
  console.log(`   - Khen thưởng/Kỷ luật: ${awardsCount}`);

  // 5. Chi tiết Nguyễn Đức Tú
  const nguyenDucTu = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Nguyễn Đức Tú' } },
        { name: { contains: 'NGUYEN DUC TU' } },
        { email: { contains: 'ductu' } },
      ]
    },
    include: {
      educationHistory: { orderBy: { startDate: 'asc' } },
      workExperience: { orderBy: { startDate: 'asc' } },
      scientificPublications: { orderBy: { year: 'desc' } },
      scientificResearch: { orderBy: { year: 'desc' } },
      awardsRecords: { orderBy: { year: 'desc' } },
      scientificProfile: true,
      facultyProfile: true
    }
  });

  if (nguyenDucTu) {
    console.log(`\n✅ Chi tiết Nguyễn Đức Tú (${nguyenDucTu.email}):`);
    console.log(`   - Quá trình đào tạo: ${nguyenDucTu.educationHistory.length}`);
    console.log(`   - Quá trình công tác: ${nguyenDucTu.workExperience.length}`);
    console.log(`   - Công trình khoa học: ${nguyenDucTu.scientificPublications.length}`);
    console.log(`     • Giáo trình: ${nguyenDucTu.scientificPublications.filter(p => p.type === 'GIAO_TRINH').length}`);
    console.log(`     • Tài liệu: ${nguyenDucTu.scientificPublications.filter(p => p.type === 'TAI_LIEU').length}`);
    console.log(`     • Bài tập: ${nguyenDucTu.scientificPublications.filter(p => p.type === 'BAI_TAP').length}`);
    console.log(`     • Bài báo: ${nguyenDucTu.scientificPublications.filter(p => p.type === 'BAI_BAO').length}`);
    console.log(`   - Đề tài nghiên cứu: ${nguyenDucTu.scientificResearch.length}`);
    console.log(`   - Khen thưởng: ${nguyenDucTu.awardsRecords.filter(a => a.type === 'KHEN_THUONG').length}`);
    console.log(`   - Faculty Profile: ${nguyenDucTu.facultyProfile ? '✓' : '✗'}`);
    console.log(`   - Scientific Profile: ${nguyenDucTu.scientificProfile ? '✓' : '✗'}`);
    
    if (nguyenDucTu.scientificProfile) {
      console.log(`\n📄 Scientific Profile Summary:`);
      console.log(`   "${nguyenDucTu.scientificProfile.summary}"`);
      console.log(`   Public: ${nguyenDucTu.scientificProfile.isPublic ? 'Yes' : 'No'}`);
    }
  }

  // 6. Top 10 users có nhiều dữ liệu nhất
  console.log(`\n🏆 TOP 10 users có nhiều dữ liệu lý lịch nhất:`);
  
  const usersWithCounts = await prisma.user.findMany({
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
    },
    take: 1299
  });

  const sorted = usersWithCounts
    .map(u => ({
      name: u.name,
      email: u.email,
      total: u._count.educationHistory + u._count.workExperience + u._count.scientificPublications + u._count.scientificResearch + u._count.awardsRecords,
      education: u._count.educationHistory,
      work: u._count.workExperience,
      publications: u._count.scientificPublications,
      research: u._count.scientificResearch,
      awards: u._count.awardsRecords
    }))
    .filter(u => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  sorted.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.name} (${u.email})`);
    console.log(`      Tổng: ${u.total} records (ĐT:${u.education} | CT:${u.work} | CT:${u.publications} | NC:${u.research} | KT:${u.awards})`);
  });

  console.log(`\n✅ VERIFY HOÀN TẤT!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
