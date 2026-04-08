import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding faculty profiles...');

  // Tìm giảng viên trong hệ thống
  const instructors = await prisma.user.findMany({
    where: {
      role: {
        in: ['GIANG_VIEN', 'NGHIEN_CUU_VIEN', 'CHU_NHIEM_BO_MON']
      }
    },
    take: 5
  });

  console.log(`Found ${instructors.length} instructors`);

  // Tạo profile cho từng giảng viên
  for (const instructor of instructors) {
    // Check if profile exists
    const existingProfile = await prisma.facultyProfile.findUnique({
      where: { userId: instructor.id }
    });

    if (existingProfile) {
      console.log(`Profile already exists for ${instructor.name}`);
      continue;
    }

    // Tạo profile mới
    await prisma.facultyProfile.create({
      data: {
        userId: instructor.id,
        academicRank: ['Giáo sư', 'Phó Giáo sư', null][Math.floor(Math.random() * 3)],
        academicDegree: ['Tiến sĩ', 'Thạc sĩ', 'Kỹ sư'][Math.floor(Math.random() * 3)],
        specialization: [
          'Hệ thống thông tin',
          'Mạng máy tính',
          'Trí tuệ nhân tạo',
          'An ninh mạng',
          'Khoa học dữ liệu'
        ][Math.floor(Math.random() * 5)],
        teachingSubjects: [
          'Cơ sở dữ liệu',
          'Lập trình hướng đối tượng',
          'Cấu trúc dữ liệu'
        ],
        researchInterests: 'Nghiên cứu về BigData, Machine Learning và ứng dụng trong quân sự',
        researchProjects: Math.floor(Math.random() * 10) + 1,
        publications: Math.floor(Math.random() * 20) + 1,
        citations: Math.floor(Math.random() * 50),
        teachingExperience: Math.floor(Math.random() * 15) + 3,
        industryExperience: Math.floor(Math.random() * 10),
        biography: `${instructor.name} là giảng viên kinh nghiệm với nhiều năm công tác tại Học viện Hậu cần. Chuyên sâu trong lĩnh vực công nghệ thông tin và ứng dụng cho quốc phòng.`,
        isActive: true,
        isPublic: Math.random() > 0.5
      }
    });

    console.log(`✓ Created profile for ${instructor.name}`);
  }

  console.log('\n✓ Faculty profiles seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding faculty profiles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
