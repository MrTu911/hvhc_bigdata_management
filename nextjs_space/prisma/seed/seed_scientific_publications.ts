/**
 * Seed Script: Scientific Publications (CSDL Khoa học)
 * 
 * Thêm dữ liệu cho các loại công trình khoa học còn thiếu:
 * - SANG_KIEN (Sáng kiến)
 * - DE_TAI (Đề tài NCKH)
 * - GIAO_TRINH_DT (Giáo trình điện tử)
 * 
 * Nguyên tắc: Liên thông dữ liệu với Personnel (User) làm cốt lõi
 */

import { PrismaClient, PublicationType, PublicationRole } from '@prisma/client';

const prisma = new PrismaClient();

// Danh sách sáng kiến mẫu
const sangKienTemplates = [
  { title: 'Phương pháp mới trong huấn luyện chiến thuật', org: 'Khoa Chiến thuật' },
  { title: 'Cải tiến quy trình kiểm tra vũ khí', org: 'Khoa Vũ khí' },
  { title: 'Ứng dụng AI trong phân tích dữ liệu chiến trường', org: 'Khoa Công nghệ thông tin' },
  { title: 'Giải pháp tiết kiệm năng lượng trong đơn vị', org: 'Phòng Hậu cần' },
  { title: 'Phương pháp rèn luyện thể lực hiệu quả', org: 'Khoa Thể chất Quân sự' },
  { title: 'Hệ thống giám sát an ninh thông minh', org: 'Khoa An ninh Quốc phòng' },
  { title: 'Cải tiến hệ thống thông tin chỉ huy', org: 'Khoa Chỉ huy Tham mưu' },
  { title: 'Phương pháp giảng dạy trực tuyến hiệu quả', org: 'Phòng Đào tạo' },
  { title: 'Ứng dụng blockchain trong quản lý hồ sơ', org: 'Khoa Công nghệ thông tin' },
  { title: 'Giải pháp bảo mật thông tin quân sự', org: 'Khoa An ninh Quốc phòng' },
  { title: 'Cải tiến quy trình đăng ký học phần', org: 'Phòng Đào tạo' },
  { title: 'Phương pháp đánh giá năng lực cán bộ', org: 'Phòng Tổ chức Cán bộ' },
];

// Danh sách đề tài NCKH mẫu
const deTaiTemplates = [
  { title: 'Nghiên cứu chiến thuật tác chiến đô thị hiện đại', level: 'Cấp Bộ Quốc phòng' },
  { title: 'Phát triển hệ thống mô phỏng huấn luyện', level: 'Cấp Học viện' },
  { title: 'Ứng dụng Big Data trong quản lý nhân sự quốc phòng', level: 'Cấp Bộ Quốc phòng' },
  { title: 'Nghiên cứu tâm lý chiến tranh thông tin', level: 'Cấp Khoa' },
  { title: 'Phát triển vũ khí thông minh thế hệ mới', level: 'Cấp Bộ Quốc phòng' },
  { title: 'Nghiên cứu mô hình đào tạo sĩ quan hiện đại', level: 'Cấp Học viện' },
  { title: 'Ứng dụng trí tuệ nhân tạo trong tác chiến', level: 'Cấp Bộ Quốc phòng' },
  { title: 'Nghiên cứu chiến lược bảo vệ biển đảo', level: 'Cấp Nhà nước' },
  { title: 'Phát triển drone trinh sát quân sự', level: 'Cấp Học viện' },
  { title: 'Nghiên cứu y học quân sự trong điều kiện khắc nghiệt', level: 'Cấp Khoa' },
];

// Danh sách giáo trình điện tử mẫu
const giaoTrinhDTTemplates = [
  { title: 'E-Learning: Cơ sở lý luận Mác-Lênin', target: 'Học viên năm 1-2' },
  { title: 'Khóa học trực tuyến: Chiến thuật cơ bản', target: 'Học viên năm 2-3' },
  { title: 'Video bài giảng: Vũ khí bộ binh', target: 'Học viên năm 3-4' },
  { title: 'Mô phỏng 3D: Huấn luyện bắn súng', target: 'Học viên tất cả các năm' },
  { title: 'E-Learning: Kỹ năng chỉ huy đơn vị', target: 'Sĩ quan trẻ' },
  { title: 'Video tutorial: Lập bản đồ quân sự', target: 'Học viên năm 2-3' },
  { title: 'Khóa học trực tuyến: An toàn thông tin', target: 'Cán bộ CNTT' },
  { title: 'E-Learning: Quản lý hậu cần hiện đại', target: 'Cán bộ hậu cần' },
];

async function seedScientificPublications() {
  console.log('🔬 Seeding Scientific Publications (CSDL Khoa học)...\n');
  
  // Lấy danh sách faculty có liên kết với User
  const faculties = await prisma.facultyProfile.findMany({
    include: { user: { select: { id: true, name: true } } },
    take: 30
  });
  
  if (faculties.length === 0) {
    console.log('❌ No faculty profiles found. Please seed faculty first.');
    return;
  }
  
  console.log(`📋 Found ${faculties.length} faculty profiles\n`);
  
  let sangKienCount = 0;
  let deTaiCount = 0;
  let giaoTrinhDTCount = 0;
  
  // Seed SANG_KIEN (Sáng kiến)
  console.log('📝 Creating SANG_KIEN (Sáng kiến)...');
  for (let i = 0; i < sangKienTemplates.length; i++) {
    const template = sangKienTemplates[i];
    const faculty = faculties[i % faculties.length];
    
    // Check if already exists
    const existing = await prisma.scientificPublication.findFirst({
      where: {
        userId: faculty.userId,
        type: PublicationType.SANG_KIEN,
        title: template.title
      }
    });
    
    if (!existing) {
      await prisma.scientificPublication.create({
        data: {
          userId: faculty.userId,
          type: PublicationType.SANG_KIEN,
          title: template.title,
          year: 2023 + Math.floor(Math.random() * 3), // 2023-2025
          month: 1 + Math.floor(Math.random() * 12),
          role: i % 3 === 0 ? PublicationRole.CHU_BIEN : PublicationRole.THAM_GIA,
          organization: template.org,
          notes: `Sáng kiến được đánh giá loại ${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}`,
          sortOrder: i,
        }
      });
      sangKienCount++;
      console.log(`   ✅ ${template.title} - ${faculty.user.name}`);
    }
  }
  
  // Seed DE_TAI (Đề tài NCKH)
  console.log('\n📝 Creating DE_TAI (Đề tài NCKH)...');
  for (let i = 0; i < deTaiTemplates.length; i++) {
    const template = deTaiTemplates[i];
    const faculty = faculties[(i + 5) % faculties.length]; // Offset để phân bổ khác
    
    const existing = await prisma.scientificPublication.findFirst({
      where: {
        userId: faculty.userId,
        type: PublicationType.DE_TAI,
        title: template.title
      }
    });
    
    if (!existing) {
      await prisma.scientificPublication.create({
        data: {
          userId: faculty.userId,
          type: PublicationType.DE_TAI,
          title: template.title,
          year: 2022 + Math.floor(Math.random() * 4), // 2022-2025
          month: 1 + Math.floor(Math.random() * 12),
          role: i % 2 === 0 ? PublicationRole.CHU_BIEN : PublicationRole.DONG_TAC_GIA,
          organization: template.level,
          publisher: template.level,
          notes: `Kết quả nghiệm thu: ${['Xuất sắc', 'Tốt', 'Đạt'][Math.floor(Math.random() * 3)]}`,
          sortOrder: i,
        }
      });
      deTaiCount++;
      console.log(`   ✅ ${template.title} - ${faculty.user.name}`);
    }
  }
  
  // Seed GIAO_TRINH_DT (Giáo trình điện tử)
  console.log('\n📝 Creating GIAO_TRINH_DT (Giáo trình điện tử)...');
  for (let i = 0; i < giaoTrinhDTTemplates.length; i++) {
    const template = giaoTrinhDTTemplates[i];
    const faculty = faculties[(i + 10) % faculties.length];
    
    const existing = await prisma.scientificPublication.findFirst({
      where: {
        userId: faculty.userId,
        type: PublicationType.GIAO_TRINH_DT,
        title: template.title
      }
    });
    
    if (!existing) {
      await prisma.scientificPublication.create({
        data: {
          userId: faculty.userId,
          type: PublicationType.GIAO_TRINH_DT,
          title: template.title,
          year: 2024 + Math.floor(Math.random() * 2), // 2024-2025
          month: 1 + Math.floor(Math.random() * 12),
          role: PublicationRole.CHU_BIEN,
          targetUsers: template.target,
          organization: 'Học viện HVHC',
          notes: 'Giáo trình điện tử được số hóa và đưa lên hệ thống LMS',
          sortOrder: i,
        }
      });
      giaoTrinhDTCount++;
      console.log(`   ✅ ${template.title} - ${faculty.user.name}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   - SANG_KIEN created: ${sangKienCount}`);
  console.log(`   - DE_TAI created: ${deTaiCount}`);
  console.log(`   - GIAO_TRINH_DT created: ${giaoTrinhDTCount}`);
  console.log(`   - Total new publications: ${sangKienCount + deTaiCount + giaoTrinhDTCount}`);
  
  // Verify final counts
  const finalCounts = await prisma.scientificPublication.groupBy({
    by: ['type'],
    _count: true
  });
  
  console.log('\n📈 Final Publication Counts by Type:');
  finalCounts.forEach(c => console.log(`   - ${c.type}: ${c._count}`));
}

seedScientificPublications()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
