/**
 * Seed Script: Faculty Profiles
 *
 * Mục tiêu:
 * - Tạo/cập nhật facultyProfile cho các user phù hợp
 * - Chạy lại nhiều lần không bị trùng
 * - Làm dữ liệu nền cho teaching / scientific publications
 */

import { PrismaClient, UserRole } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

const ACADEMIC_DEGREES = ['Cử nhân', 'Kỹ sư', 'Thạc sĩ', 'Tiến sĩ'] as const;
const SPECIALIZATIONS = [
  'Chỉ huy tham mưu HC-KT',
  'Quân nhu',
  'Vận tải',
  'Xăng dầu',
  'Doanh trại',
  'Tài chính',
  'Hệ thống thông tin',
  'Mạng máy tính',
  'An ninh mạng',
  'Khoa học dữ liệu',
  'Trí tuệ nhân tạo',
  'Hậu cần quân sự',
  'Tài chính quân sự',
  'Quản trị đào tạo',
] as const;

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildBiography(name: string, unitName?: string | null, rank?: string | null): string {
  return `${name} hiện công tác tại ${unitName || 'Học viện Hậu cần'}, cấp bậc ${
    rank || 'chưa cập nhật'
  }, tham gia giảng dạy và nghiên cứu khoa học trong hệ thống nhà trường quân đội.`;
}

function resolveAcademicDegree(role: UserRole, seed: number): string {
  if (role === 'NGHIEN_CUU_VIEN') {
    return pick(['Thạc sĩ', 'Tiến sĩ'] as const, seed);
  }

  if (role === 'GIANG_VIEN') {
    return pick(['Cử nhân', 'Thạc sĩ'] as const, seed);
  }

  return pick(ACADEMIC_DEGREES, seed);
}

function resolveAcademicRank(role: UserRole, seed: number): string | null {
  if (
    role === 'CHI_HUY_KHOA_PHONG' ||
    role === 'CHU_NHIEM_BO_MON' ||
    role === 'CHI_HUY_BO_MON'
  ) {
    return pick([null, null, 'Phó Giáo sư'] as const, seed);
  }

  if (role === 'NGHIEN_CUU_VIEN') {
    return pick([null, null, 'Phó Giáo sư', 'Giáo sư'] as const, seed);
  }

  return null;
}

function resolveTeachingSubjects(specialization: string): string[] {
  const base = [
    'Chỉ huy tham mưu HC-KT',
    'Quân nhu',
    'Vận tải',
    'Xăng dầu',
    'Doanh trại',
    'Tài chính',
    'Quản trị hệ thống',
    'Phân tích dữ liệu',
    'Cơ sở dữ liệu',
  ];

  if (!base.includes(specialization)) {
    return [specialization, ...base.slice(0, 4)];
  }

  return base;
}

function resolveAchievements(seed: number): string[] {
  const all = [
    'Hoàn thành tốt nhiệm vụ',
    'Tham gia đề tài cấp cơ sở',
    'Có sáng kiến cải tiến kỹ thuật',
    'Đạt danh hiệu chiến sĩ thi đua',
    'Tham gia biên soạn tài liệu giảng dạy',
  ];

  return [all[seed % all.length], all[(seed + 1) % all.length]];
}

function resolveCertifications(seed: number): string[] {
  const all = [
    'Chứng chỉ nghiệp vụ sư phạm',
    'Chứng chỉ ứng dụng CNTT nâng cao',
    'Chứng chỉ ngoại ngữ bậc 3',
    'Chứng chỉ phương pháp nghiên cứu khoa học',
    'Chứng chỉ quản lý giáo dục',
  ];

  return [all[seed % all.length], all[(seed + 2) % all.length]];
}

async function getCandidateUsers() {
  return prisma.user.findMany({
    where: {
      role: {
        in: [
          UserRole.GIANG_VIEN,
          UserRole.NGHIEN_CUU_VIEN,
          UserRole.CHU_NHIEM_BO_MON,
          UserRole.CHI_HUY_BO_MON,
          UserRole.CHI_HUY_KHOA_PHONG,
        ],
      },
      status: 'ACTIVE',
    },
    include: {
      unitRelation: true,
      specializationRef: true,
      facultyProfile: true,
    },
    orderBy: { email: 'asc' },
  });
}

async function main() {
  console.log('🎓 Seeding faculty profiles...');

  const users = await getCandidateUsers();

  if (users.length === 0) {
    throw new Error(
      'Không tìm thấy user phù hợp để seed facultyProfile. Hãy seed users/personnel trước.'
    );
  }

  console.log(`📌 Found ${users.length} candidate users`);

  let created = 0;
  let updated = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const seed = i + 1;

    const academicDegree = resolveAcademicDegree(user.role, seed);
    const academicRank = resolveAcademicRank(user.role, seed);
    const specialization =
      user.specialization ||
      user.specializationRef?.name ||
      pick(SPECIALIZATIONS, seed);

    const teachingSubjects = resolveTeachingSubjects(specialization);
    const achievements = resolveAchievements(seed);
    const certifications = resolveCertifications(seed);

    const payload = {
      userId: user.id,
      unitId: user.unitId ?? null,
      departmentId: null as string | null,

      academicRank: academicRank ?? null,
      academicDegree,
      specialization,

      teachingSubjects: teachingSubjects as any,
      researchInterests: `Nghiên cứu ứng dụng ${specialization} trong môi trường giáo dục quân sự và chuyển đổi số.`,

      researchProjects: 1 + (seed % 4),
      publications: 2 + (seed % 6),
      citations: 5 + seed * 2,
      teachingExperience: 3 + (seed % 12),
      industryExperience: 1 + (seed % 6),

      biography: buildBiography(
        user.name,
        user.unitRelation?.name || user.unit || user.department,
        user.rank
      ),

      achievements: achievements as any,
      certifications: certifications as any,

      linkedinUrl: null as string | null,
      googleScholarUrl: null as string | null,
      researchGateUrl: null as string | null,
      orcidId: null as string | null,

      isActive: true,
      isPublic: true,
    };

    if (!user.facultyProfile) {
      await prisma.facultyProfile.create({
        data: payload,
      });
      created++;
      console.log(`✅ Created facultyProfile: ${user.email}`);
    } else {
      await prisma.facultyProfile.update({
        where: { userId: user.id },
        data: payload,
      });
      updated++;
      console.log(`♻️ Updated facultyProfile: ${user.email}`);
    }
  }

  const total = await prisma.facultyProfile.count();

  console.log('\n================ RESULT ================');
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total faculty profiles: ${total}`);
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });