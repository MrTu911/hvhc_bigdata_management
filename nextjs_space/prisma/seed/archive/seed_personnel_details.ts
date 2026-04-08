/**
 * Seed: EducationHistory + WorkExperience + AwardsRecord + ScientificPublications
 * Tạo chi tiết lý lịch cho tất cả cán bộ (User role != HOC_VIEN_SINH_VIEN)
 * và lý lịch khoa học cho giảng viên / nghiên cứu viên.
 */
import {
  PrismaClient,
  UserRole,
  WorkStatus,
  PublicationType,
  PublicationRole,
  ResearchRole,
  AwardType,
  EducationLevel,
} from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}


const INSTITUTIONS = [
  'Học viện Kỹ thuật Quân sự',
  'Học viện Hậu cần',
  'Đại học Bách khoa Hà Nội',
  'Đại học Quốc gia Hà Nội',
  'Học viện Chính trị',
  'Trường Sĩ quan Lục quân 2',
  'Đại học Kinh tế Quốc dân',
  'Học viện An ninh Nhân dân',
  'Trường Đại học Ngoại ngữ Quân sự',
];

const MAJORS_MILITARY = [
  'Chỉ huy tham mưu hậu cần',
  'Quản lý kinh tế quân sự',
  'Tài chính quân sự',
  'Vận tải quân sự',
  'Xăng dầu quân sự',
  'Quân nhu',
  'An ninh thông tin',
  'Khoa học máy tính',
  'Quản trị hành chính',
];

const WORK_POSITIONS = [
  'Giảng viên',
  'Trợ lý khoa',
  'Phó trưởng bộ môn',
  'Trưởng bộ môn',
  'Phó trưởng khoa',
  'Trưởng khoa',
  'Phó phòng',
  'Trưởng phòng',
  'Chỉ huy tiểu đoàn',
];

const ORGS = [
  'Học viện Hậu cần',
  'Học viện Kỹ thuật Quân sự',
  'Trường Sĩ quan Lục quân 2',
  'Bộ Quốc phòng',
  'Quân khu 1',
  'Quân khu 3',
  'Quân chủng Phòng không - Không quân',
];

const AWARD_CATEGORIES = [
  'Chiến sĩ thi đua cơ sở',
  'Bằng khen Bộ Quốc phòng',
  'Bằng khen Quân khu',
  'Giấy khen đơn vị',
  'Huân chương Chiến sĩ vẻ vang',
  'Danh hiệu Chiến sĩ xuất sắc',
  'Bằng khen Chính phủ',
];

const PUB_TITLES = [
  'Nghiên cứu ứng dụng trí tuệ nhân tạo trong quản lý hậu cần quân sự',
  'Tối ưu hóa chuỗi cung ứng trong điều kiện tác chiến hiện đại',
  'Phương pháp phân tích dữ liệu lớn cho hệ thống quân nhu',
  'Giáo trình Hậu cần chiến đấu cấp chiến dịch',
  'Ứng dụng GIS trong quản lý tuyến đường vận chuyển quân sự',
  'Hệ thống thông tin quản lý kho vũ khí trang bị',
  'Cơ sở lý luận và thực tiễn bảo đảm hậu cần trong chiến tranh nhân dân',
  'Quản lý tài chính quân sự trong thời kỳ đổi mới',
  'Mô hình dự báo nhu cầu vật tư kỹ thuật bằng machine learning',
  'Phát triển hệ thống CNTT phục vụ quản lý đào tạo học viện quân sự',
];

async function main() {
  console.log('📚 Bắt đầu seed chi tiết lý lịch cán bộ...');

  // Lấy tất cả cán bộ (không phải học viên)
  const officers = await prisma.user.findMany({
    where: {
      role: {
        notIn: ['HOC_VIEN_SINH_VIEN', 'HOC_VIEN'] as UserRole[],
      },
      workStatus: { in: ['ACTIVE', 'TRANSFERRED'] as WorkStatus[] },
    },
    select: { id: true, name: true, role: true, rank: true, joinDate: true, dateOfBirth: true },
  });

  console.log(`  ✔ Tìm thấy ${officers.length} cán bộ cần seed lý lịch`);

  let eduCreated = 0;
  let workCreated = 0;
  let awardCreated = 0;
  let pubCreated = 0;
  let researchCreated = 0;

  for (let i = 0; i < officers.length; i++) {
    const officer = officers[i];
    const seed = i + 1;
    const baseYear = 1990 + (seed % 15);

    // ---- EDUCATION HISTORY ----
    const existingEdu = await prisma.educationHistory.count({ where: { userId: officer.id } });
    if (existingEdu === 0) {
      // Trình độ đại học
      await prisma.educationHistory.create({
        data: {
          userId: officer.id,
          level: EducationLevel.DAI_HOC,
          institution: pick(INSTITUTIONS, seed),
          trainingSystem: pick(['Chính quy', 'Tại chức', 'Từ xa'], seed),
          major: pick(MAJORS_MILITARY, seed),
          startDate: new Date(`${baseYear}-09-01`),
          endDate: new Date(`${baseYear + 4}-06-30`),
          thesisTitle: seed % 3 === 0 ? `Nghiên cứu ${pick(MAJORS_MILITARY, seed + 1)} trong điều kiện hiện đại` : null,
          certificateCode: `ĐH${String(seed + 1000).slice(1)}`,
          certificateDate: new Date(`${baseYear + 4}-07-15`),
          classification: pick(['Xuất sắc', 'Giỏi', 'Khá', 'Trung bình khá'], seed),
        },
      });
      eduCreated++;

      // Thạc sĩ/Tiến sĩ cho một số cán bộ
      if (
        officer.role === 'GIANG_VIEN' ||
        officer.role === 'CHU_NHIEM_BO_MON' ||
        officer.role === 'CHI_HUY_KHOA_PHONG' ||
        officer.role === 'NGHIEN_CUU_VIEN'
      ) {
        await prisma.educationHistory.create({
          data: {
            userId: officer.id,
            level: seed % 4 === 0 ? EducationLevel.TIEN_SI : EducationLevel.THAC_SI,
            institution: pick(INSTITUTIONS, seed + 3),
            trainingSystem: 'Chính quy',
            major: pick(MAJORS_MILITARY, seed + 2),
            startDate: new Date(`${baseYear + 5}-09-01`),
            endDate: new Date(`${baseYear + 7}-06-30`),
            thesisTitle: pick(PUB_TITLES, seed),
            supervisor: `PGS.TS. ${pick(['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Đức D'], seed)}`,
            defenseDate: new Date(`${baseYear + 7}-05-20`),
            defenseLocation: pick(INSTITUTIONS, seed + 5),
            certificateCode: `TS${String(seed + 2000).slice(1)}`,
            certificateDate: new Date(`${baseYear + 7}-07-01`),
            classification: 'Xuất sắc',
          },
        });
        eduCreated++;
      }
    }

    // ---- WORK EXPERIENCE ----
    const existingWork = await prisma.workExperience.count({ where: { userId: officer.id } });
    if (existingWork === 0) {
      const numJobs = 2 + (seed % 3);
      for (let j = 0; j < numJobs; j++) {
        const startYear = baseYear + 4 + j * 3;
        await prisma.workExperience.create({
          data: {
            userId: officer.id,
            organization: pick(ORGS, seed + j),
            position: pick(WORK_POSITIONS, seed + j * 2),
            startDate: new Date(`${startYear}-01-01`),
            endDate: j < numJobs - 1 ? new Date(`${startYear + 3}-12-31`) : null,
            description: `Công tác tại ${pick(ORGS, seed + j)}, thực hiện nhiệm vụ ${pick(WORK_POSITIONS, seed + j * 2).toLowerCase()}`,
            sortOrder: j,
          },
        });
        workCreated++;
      }
    }

    // ---- AWARDS RECORD ----
    const existingAwards = await prisma.awardsRecord.count({ where: { userId: officer.id } });
    if (existingAwards === 0) {
      const numAwards = 1 + (seed % 4);
      for (let k = 0; k < numAwards; k++) {
        const awardYear = 2018 + (seed + k) % 7;
        await prisma.awardsRecord.create({
          data: {
            userId: officer.id,
            type: k % 2 === 0 ? AwardType.KHEN_THUONG : AwardType.KY_LUAT,
            category: pick(AWARD_CATEGORIES, seed + k),
            description: `${pick(AWARD_CATEGORIES, seed + k)} - Năm ${awardYear}`,
            year: awardYear,
            awardedBy: pick(['Bộ Quốc phòng', 'Quân khu', 'Học viện Hậu cần', 'Bộ Tổng Tham mưu'], seed + k),
            sortOrder: k,
          },
        });
        awardCreated++;
      }
    }

    // ---- SCIENTIFIC PUBLICATIONS (giảng viên/nghiên cứu viên) ----
    if (
      officer.role === 'GIANG_VIEN' ||
      officer.role === 'NGHIEN_CUU_VIEN' ||
      officer.role === 'CHU_NHIEM_BO_MON' ||
      officer.role === 'CHI_HUY_KHOA_PHONG'
    ) {
      const existingPubs = await prisma.scientificPublication.count({ where: { userId: officer.id } });
      if (existingPubs === 0) {
        const numPubs = 2 + (seed % 4);
        for (let p = 0; p < numPubs; p++) {
          const pubYear = 2018 + (seed + p) % 7;
          const pubType: PublicationType =
            p === 0 ? 'GIAO_TRINH_DT' : p === 1 ? 'BAI_BAO' : p === 2 ? 'SANG_KIEN' : 'DE_TAI';

          await prisma.scientificPublication.create({
            data: {
              userId: officer.id,
              type: pubType,
              title: pick(PUB_TITLES, seed + p),
              year: pubYear,
              month: 3 + (seed % 9),
              role:
                p === 0
                  ? PublicationRole.CHU_BIEN
                  : p % 2 === 0
                  ? PublicationRole.DONG_TAC_GIA
                  : PublicationRole.THAM_GIA,
              publisher: p === 0 ? 'Nhà xuất bản Quân đội Nhân dân' : pick(ORGS, seed + p),
              organization: pick(ORGS, seed + p + 1),
              issueNumber: p > 0 ? String(seed % 12 + 1) : null,
              pageNumbers: p > 0 ? `${10 + seed * 3}-${15 + seed * 3}` : null,
              coAuthors:
                p % 2 === 0 ? `${pick(['TS. Nguyễn A', 'ThS. Trần B', 'PGS. Lê C'], seed + p)}` : null,
              sortOrder: p,
            },
          });
          pubCreated++;
        }

        // Scientific Research (đề tài nghiên cứu)
        const numResearch = 1 + (seed % 3);
        for (let r = 0; r < numResearch; r++) {
          const resYear = 2019 + (seed + r) % 6;
          await prisma.scientificResearch.create({
            data: {
              userId: officer.id,
              title: pick(PUB_TITLES, seed + r + 5),
              year: resYear,
              role: r === 0 ? ResearchRole.CHU_NHIEM : ResearchRole.THANH_VIEN,
              level: pick(['Cơ sở', 'Bộ', 'Nhà nước', 'Học viện'], seed + r),
              type: pick(['Nghiên cứu cơ bản', 'Nghiên cứu ứng dụng', 'Triển khai thực nghiệm'], seed + r),
              institution: pick(INSTITUTIONS, seed + r),
              result: pick(['Xuất sắc', 'Tốt', 'Đạt', 'Khá'], seed + r),
              sortOrder: r,
            },
          });
          researchCreated++;
        }
      }
    }
  }

  console.log('\n📊 TỔNG KẾT:');
  console.log(`  EducationHistory: tạo ${eduCreated}`);
  console.log(`  WorkExperience: tạo ${workCreated}`);
  console.log(`  AwardsRecord: tạo ${awardCreated}`);
  console.log(`  ScientificPublication: tạo ${pubCreated}`);
  console.log(`  ScientificResearch: tạo ${researchCreated}`);

  console.log('\n=== DB TOTALS ===');
  console.log('  EducationHistory:', await prisma.educationHistory.count());
  console.log('  WorkExperience:', await prisma.workExperience.count());
  console.log('  AwardsRecord:', await prisma.awardsRecord.count());
  console.log('  ScientificPublication:', await prisma.scientificPublication.count());
  console.log('  ScientificResearch:', await prisma.scientificResearch.count());
  console.log('\n✅ Seed chi tiết lý lịch hoàn tất!');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
