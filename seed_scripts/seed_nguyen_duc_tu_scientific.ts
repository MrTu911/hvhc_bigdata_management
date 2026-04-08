import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Tìm user Nguyễn Đức Tú...');
  
  // Tìm user Nguyễn Đức Tú
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Nguyễn Đức Tú' } },
        { name: { contains: 'Nguyen Duc Tu' } },
        { email: { contains: 'nguyenductu' } },
      ]
    }
  });

  if (!user) {
    console.error('❌ Không tìm thấy user Nguyễn Đức Tú');
    return;
  }

  console.log(`✅ Tìm thấy user: ${user.name} (${user.email})`);

  // 1. TẠO EDUCATION HISTORY (4 bản ghi)
  console.log('\n📚 Tạo quá trình đào tạo...');
  
  const educationData = [
    {
      userId: user.id,
      level: 'DAI_HOC',
      institution: 'Học viện Hậu cần',
      major: 'Kỹ thuật Hậu cần',
      startDate: new Date('2002-09-01'),
      endDate: new Date('2007-06-30'),
      degreeNumber: 'SH-2007-123',
      classification: 'Khá',
      notes: 'Tốt nghiệp loại Khá, chuyên ngành Kỹ thuật Hậu cần'
    },
    {
      userId: user.id,
      level: 'THAC_SI',
      institution: 'Học viện Hậu cần',
      major: 'Quân sự - Hậu cần chiến đấu',
      startDate: new Date('2014-09-01'),
      endDate: new Date('2016-12-31'),
      thesis: 'Quản trị chuỗi cung ứng trong tác chiến phòng thủ đảo xa',
      advisor: 'PGS.TS Nguyễn Văn A',
      degreeNumber: 'ThS-2016-456',
      classification: 'Giỏi',
      notes: 'Luận văn đạt điểm 9.0'
    },
    {
      userId: user.id,
      level: 'TIEN_SI',
      institution: 'Học viện Hậu cần',
      major: 'Quân sự',
      startDate: new Date('2019-09-01'),
      endDate: new Date('2023-06-30'),
      thesis: 'Hoàn thiện hệ thống cung ứng hậu cần cho lực lượng bảo vệ biên giới biển trong tình hình mới',
      advisor: 'GS.TS Trần Văn B, PGS.TS Lê Thị C',
      degreeNumber: 'TS-2023-789',
      classification: 'Xuất sắc',
      notes: 'Luận án cấp Học viện, đạt điểm 9.5'
    },
    {
      userId: user.id,
      level: 'NGOAI_NGU',
      institution: 'Trung tâm Ngoại ngữ - Học viện Hậu cần',
      major: 'Tiếng Anh',
      startDate: new Date('2015-01-01'),
      endDate: new Date('2015-12-31'),
      degreeNumber: 'C-2015-321',
      classification: 'Khá',
      notes: 'Chứng chỉ C, điểm TOEIC 650'
    }
  ];

  for (const edu of educationData) {
    await prisma.educationHistory.create({ data: edu });
  }
  console.log(`✅ Đã tạo ${educationData.length} bản ghi đào tạo`);

  // 2. TẠO WORK EXPERIENCE (8 bản ghi)
  console.log('\n💼 Tạo quá trình công tác...');
  
  const workData = [
    {
      userId: user.id,
      organization: 'Trung đội 3, Đại đội Hậu cần, Tiểu đoàn 1',
      position: 'Trung đội trưởng',
      startDate: new Date('2007-08-01'),
      endDate: new Date('2010-07-31'),
      description: 'Chỉ huy trung đội, phụ trách công tác hậu cần cấp tiểu đoàn'
    },
    {
      userId: user.id,
      organization: 'Phòng Kế hoạch - Tài chính, Cục Hậu cần',
      position: 'Tham mưu',
      startDate: new Date('2010-08-01'),
      endDate: new Date('2014-07-31'),
      description: 'Tham mưu lập kế hoạch tài chính, quản lý nguồn kinh phí'
    },
    {
      userId: user.id,
      organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần',
      position: 'Giảng viên',
      startDate: new Date('2017-01-01'),
      endDate: new Date('2019-07-31'),
      description: 'Giảng dạy các môn: Tổ chức hậu cần, Quản lý chuỗi cung ứng'
    },
    {
      userId: user.id,
      organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần',
      position: 'Giảng viên chính',
      startDate: new Date('2019-08-01'),
      endDate: new Date('2021-12-31'),
      description: 'Giảng dạy và nghiên cứu khoa học, hướng dẫn luận văn thạc sĩ'
    },
    {
      userId: user.id,
      organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần',
      position: 'Phó chủ nhiệm bộ môn',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2023-12-31'),
      description: 'Phụ trách công tác giảng dạy và nghiên cứu khoa học'
    },
    {
      userId: user.id,
      organization: 'Ban Khoa học Công nghệ, Học viện Hậu cần',
      position: 'Phó trưởng ban (kiêm nhiệm)',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2024-06-30'),
      description: 'Quản lý hoạt động nghiên cứu khoa học cấp Học viện'
    },
    {
      userId: user.id,
      organization: 'Bộ môn Hậu cần chiến đấu, Khoa Chỉ huy Hậu cần',
      position: 'Chủ nhiệm bộ môn',
      startDate: new Date('2024-01-01'),
      description: 'Chủ trì công tác giảng dạy, nghiên cứu khoa học và đào tạo'
    },
    {
      userId: user.id,
      organization: 'Học viện Hậu cần',
      position: 'Giảng viên cao cấp',
      startDate: new Date('2024-07-01'),
      description: 'Giảng viên cao cấp, học hàm Phó Giáo sư (chờ phê duyệt)'
    }
  ];

  for (const work of workData) {
    await prisma.workExperience.create({ data: work });
  }
  console.log(`✅ Đã tạo ${workData.length} bản ghi công tác`);

  // 3. TẠO PUBLICATIONS (17 bản ghi)
  console.log('\n📖 Tạo công trình khoa học...');
  
  const publicationsData = [
    // 5 Giáo trình
    {
      userId: user.id,
      type: 'GIAO_TRINH',
      title: 'Tổ chức hậu cần quân đội trong chiến đấu phòng thủ',
      year: 2018,
      role: 'CHU_BIEN',
      publisher: 'Nhà xuất bản Quân đội Nhân dân',
      targetUsers: 'Học viện Hậu cần, Trường Sĩ quan Hậu cần',
      coAuthors: 'Lê Thành Công, Đặng Văn Thắng'
    },
    {
      userId: user.id,
      type: 'GIAO_TRINH',
      title: 'Quản trị chuỗi cung ứng trong quân sự',
      year: 2020,
      role: 'CHU_BIEN',
      publisher: 'Học viện Hậu cần',
      targetUsers: 'HVHC, Cục KHQS - BQP'
    },
    {
      userId: user.id,
      type: 'GIAO_TRINH',
      title: 'Hậu cần chiến dịch - chiến lược',
      year: 2021,
      role: 'THAM_GIA',
      publisher: 'Nhà xuất bản Quân đội Nhân dân',
      targetUsers: 'Các trường quân sự toàn quân',
      coAuthors: 'PGS.TS Nguyễn Văn A (Chủ biên), TS Trần B, ThS Lê C'
    },
    {
      userId: user.id,
      type: 'GIAO_TRINH',
      title: 'Công tác hậu cần trong tác chiến đổ bộ đường biển',
      year: 2022,
      role: 'CHU_BIEN',
      publisher: 'Học viện Hậu cần',
      targetUsers: 'HVHC, Lữ đoàn Hải quân Đánh bộ'
    },
    {
      userId: user.id,
      type: 'GIAO_TRINH',
      title: 'Logistics quân sự hiện đại',
      year: 2024,
      role: 'CHU_BIEN',
      publisher: 'Nhà xuất bản Quân đội Nhân dân',
      targetUsers: 'HVHC, Bộ Tư lệnh Hậu cần',
      coAuthors: 'Phạm Quốc Toàn, Hoàng Minh Tuấn'
    },
    // 2 Tài liệu
    {
      userId: user.id,
      type: 'TAI_LIEU',
      title: 'Bài giảng Tổ chức hậu cần các đơn vị chiến đấu',
      year: 2019,
      role: 'CHU_BIEN',
      publisher: 'Bộ môn Hậu cần chiến đấu - HVHC',
      targetUsers: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'TAI_LIEU',
      title: 'Tài liệu tham khảo: Logistics trong tác chiến phòng thủ biển đảo',
      year: 2023,
      role: 'CHU_BIEN',
      publisher: 'Học viện Hậu cần',
      targetUsers: 'HVHC, Bộ Tư lệnh Hải quân'
    },
    // 3 Bài tập
    {
      userId: user.id,
      type: 'BAI_TAP',
      title: 'Bài tập thực hành Quản trị chuỗi cung ứng quân sự',
      year: 2020,
      role: 'CHU_BIEN',
      publisher: 'Bộ môn Hậu cần chiến đấu - HVHC',
      targetUsers: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'BAI_TAP',
      title: 'Bài tập tình huống Hậu cần chiến dịch',
      year: 2021,
      role: 'CHU_BIEN',
      publisher: 'Khoa Chỉ huy Hậu cần - HVHC',
      targetUsers: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'BAI_TAP',
      title: 'Bài tập mô phỏng Logistics trong tác chiến biển',
      year: 2024,
      role: 'CHU_BIEN',
      publisher: 'Học viện Hậu cần',
      targetUsers: 'HVHC, Các đơn vị Hải quân',
      coAuthors: 'Trung tá Nguyễn Hữu Đức'
    },
    // 7 Bài báo
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Một số giải pháp hoàn thiện công tác hậu cần trong tác chiến phòng thủ đảo xa',
      year: 2018,
      role: 'CHU_BIEN',
      publisher: 'Tạp chí Nghiên cứu Quân sự',
      issueNumber: 'Số 5(207), tháng 10/2018',
      pageNumbers: '45-52'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Vận dụng công nghệ thông tin trong quản lý hậu cần quân đội',
      year: 2019,
      role: 'DONG_TAC_GIA',
      publisher: 'Tạp chí Khoa học và Công nghệ - Học viện Kỹ thuật Quân sự',
      issueNumber: 'Số 3(189), tháng 6/2019',
      pageNumbers: '78-85',
      coAuthors: 'TS Lê Văn D (Chủ biên)'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Quản trị chuỗi cung ứng hậu cần trong tác chiến phòng thủ biên giới biển',
      year: 2020,
      role: 'CHU_BIEN',
      publisher: 'Tạp chí Hậu cần - Kỹ thuật',
      issueNumber: 'Số 1(201), tháng 2/2020',
      pageNumbers: '12-18'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Xây dựng hệ thống dự trữ hậu cần phục vụ bảo vệ chủ quyền biển đảo',
      year: 2021,
      role: 'CHU_BIEN',
      publisher: 'Tạp chí Quốc phòng toàn dân',
      issueNumber: 'Số 8(245), tháng 8/2021',
      pageNumbers: '56-62'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Logistics quân sự trong thời kỳ công nghiệp hóa, hiện đại hóa',
      year: 2022,
      role: 'CHU_BIEN',
      publisher: 'Tạp chí Nghiên cứu Khoa học Quân sự và An ninh',
      issueNumber: 'Số 3(215), tháng 6/2022',
      pageNumbers: '108-111'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Ứng dụng Big Data trong quản lý hậu cần quân đội',
      year: 2023,
      role: 'DONG_TAC_GIA',
      publisher: 'Tạp chí Khoa học Công nghệ Quân sự',
      issueNumber: 'Số 87, tháng 9/2023',
      pageNumbers: '34-40',
      coAuthors: 'ThS Phạm Văn E (Chủ biên), TS Hoàng F'
    },
    {
      userId: user.id,
      type: 'BAI_BAO',
      title: 'Xây dựng mô hình hậu cần thông minh phục vụ nhiệm vụ quốc phòng',
      year: 2024,
      role: 'CHU_BIEN',
      publisher: 'Tạp chí Quốc phòng toàn dân',
      issueNumber: 'Số 3, tháng 3/2024',
      pageNumbers: '67-73'
    }
  ];

  for (const pub of publicationsData) {
    await prisma.scientificPublication.create({ data: pub });
  }
  console.log(`✅ Đã tạo ${publicationsData.length} công trình khoa học`);

  // 4. TẠO RESEARCH PROJECTS (9 bản ghi)
  console.log('\n🔬 Tạo đề tài nghiên cứu...');
  
  const researchData = [
    {
      userId: user.id,
      title: 'Nghiên cứu giải pháp nâng cao hiệu quả quản lý hậu cần trong tác chiến phòng thủ đảo xa',
      level: 'Học viện',
      type: 'Đề tài',
      year: 2017,
      role: 'CHU_NHIEM',
      institution: 'Học viện Hậu cần',
      result: 'Nghiệm thu đạt loại Giỏi, ứng dụng vào giảng dạy'
    },
    {
      userId: user.id,
      title: 'Xây dựng mô hình chuỗi cung ứng hậu cần cho lực lượng bảo vệ biên giới biển',
      level: 'Bộ',
      type: 'Đề tài',
      year: 2019,
      role: 'CHU_NHIEM',
      institution: 'Bộ Quốc phòng - Học viện Hậu cần',
      result: 'Nghiệm thu xuất sắc, được tặng Bằng khen của Bộ trưởng BQP'
    },
    {
      userId: user.id,
      title: 'Ứng dụng công nghệ thông tin trong quản lý kho tàng quân đội',
      level: 'Học viện',
      type: 'Đề tài',
      year: 2020,
      role: 'THAM_GIA',
      institution: 'Học viện Hậu cần',
      result: 'Nghiệm thu đạt loại Khá'
    },
    {
      userId: user.id,
      title: 'Nghiên cứu xây dựng hệ thống dự trữ hậu cần phục vụ bảo vệ chủ quyền biển đảo',
      level: 'Nhà nước',
      type: 'Nhiệm vụ',
      year: 2021,
      role: 'THANH_VIEN',
      institution: 'Bộ Khoa học Công nghệ - BQP',
      result: 'Nghiệm thu cấp Nhà nước, đạt giải Nhì'
    },
    {
      userId: user.id,
      title: 'Hoàn thiện quy trình vận chuyển hậu cần đường biển trong điều kiện hiện đại',
      level: 'Bộ',
      type: 'Đề tài',
      year: 2022,
      role: 'CHU_NHIEM',
      institution: 'Bộ Quốc phòng - Học viện Hậu cần',
      result: 'Nghiệm thu đạt loại Xuất sắc'
    },
    {
      userId: user.id,
      title: 'Ứng dụng trí tuệ nhân tạo trong dự báo nhu cầu hậu cần quân đội',
      level: 'Học viện',
      type: 'Sáng kiến',
      year: 2023,
      role: 'CHU_NHIEM',
      institution: 'Học viện Hậu cần',
      result: 'Đạt giải Nhất Sáng kiến cấp Học viện'
    },
    {
      userId: user.id,
      title: 'Xây dựng hệ thống quản lý hậu cần thông minh cho đơn vị tác chiến biển',
      level: 'Bộ',
      type: 'Đề tài',
      year: 2024,
      role: 'CHU_NHIEM',
      institution: 'Bộ Quốc phòng - Học viện Hậu cần',
      result: 'Đang thực hiện, dự kiến hoàn thành Q4/2024'
    },
    {
      userId: user.id,
      title: 'Nghiên cứu ứng dụng Blockchain trong quản lý chuỗi cung ứng hậu cần quân đội',
      level: 'Học viện',
      type: 'Sáng kiến',
      year: 2024,
      role: 'CHU_NHIEM',
      institution: 'Học viện Hậu cần',
      result: 'Đang thực hiện'
    },
    {
      userId: user.id,
      title: 'Xây dựng mô hình logistics xanh trong quân đội',
      level: 'Bộ',
      type: 'Đề tài',
      year: 2010,
      role: 'THAM_GIA',
      institution: 'Bộ Quốc phòng',
      result: 'Nghiệm thu đạt loại Khá, tham gia với vai trò nghiên cứu viên'
    }
  ];

  for (const research of researchData) {
    await prisma.scientificResearch.create({ data: research });
  }
  console.log(`✅ Đã tạo ${researchData.length} đề tài nghiên cứu`);

  // 5. TẠO AWARDS (12 bản ghi)
  console.log('\n🏆 Tạo khen thưởng...');
  
  const awardsData = [
    // 1 Bằng khen
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Bằng khen',
      description: 'Đã có nhiều thành tích trong công tác nghiên cứu khoa học và giảng dạy',
      year: 2019,
      awardedBy: 'Bộ trưởng Bộ Quốc phòng'
    },
    // 5 Giấy khen
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Giấy khen',
      description: 'Hoàn thành xuất sắc nhiệm vụ giảng dạy năm học 2017-2018',
      year: 2018,
      awardedBy: 'Học viện trưởng Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Giấy khen',
      description: 'Hoàn thành xuất sắc nhiệm vụ nghiên cứu khoa học',
      year: 2020,
      awardedBy: 'Giám đốc Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Giấy khen',
      description: 'Đạt thành tích cao trong công tác hướng dẫn học viên',
      year: 2021,
      awardedBy: 'Học viện trưởng Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Giấy khen',
      description: 'Hoàn thành xuất sắc nhiệm vụ năm 2022',
      year: 2022,
      awardedBy: 'Trưởng Khoa Chỉ huy Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Giấy khen',
      description: 'Có thành tích xuất sắc trong phong trào thi đua',
      year: 2023,
      awardedBy: 'Đảng ủy - Ban Giám đốc Học viện Hậu cần'
    },
    // 6 Chiến sĩ thi đua
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2018',
      year: 2018,
      awardedBy: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2019',
      year: 2019,
      awardedBy: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2020',
      year: 2020,
      awardedBy: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2021',
      year: 2021,
      awardedBy: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2022',
      year: 2022,
      awardedBy: 'Học viện Hậu cần'
    },
    {
      userId: user.id,
      type: 'KHEN_THUONG',
      category: 'Chiến sĩ thi đua cơ sở',
      description: 'Chiến sĩ thi đua cơ sở năm 2023',
      year: 2023,
      awardedBy: 'Học viện Hậu cần'
    }
  ];

  for (const award of awardsData) {
    await prisma.awardsRecord.create({ data: award });
  }
  console.log(`✅ Đã tạo ${awardsData.length} khen thưởng`);

  // 6. TẠO SCIENTIFIC PROFILE (summary)
  console.log('\n📋 Tạo scientific profile tổng hợp...');
  
  const existingProfile = await prisma.scientificProfile.findUnique({
    where: { userId: user.id }
  });

  if (!existingProfile) {
    await prisma.scientificProfile.create({
      data: {
        userId: user.id,
        summary: 'Tiến sĩ Quân sự, chuyên gia hậu cần quân đội. Có 17 công trình khoa học, 9 đề tài nghiên cứu cấp Nhà nước và Bộ. Tác giả 5 giáo trình chuyên ngành Hậu cần chiến đấu.',
        pdfPath: null,
        lastExported: null,
        isPublic: true
      }
    });
  } else {
    await prisma.scientificProfile.update({
      where: { userId: user.id },
      data: {
        summary: 'Tiến sĩ Quân sự, chuyên gia hậu cần quân đội. Có 17 công trình khoa học, 9 đề tài nghiên cứu cấp Nhà nước và Bộ. Tác giả 5 giáo trình chuyên ngành Hậu cần chiến đấu.',
        isPublic: true
      }
    });
  }
  console.log('✅ Đã tạo/cập nhật scientific profile');

  console.log('\n✅ HOÀN THÀNH! Đã tạo đầy đủ lý lịch khoa học cho Nguyễn Đức Tú:');
  console.log('   - 4 quá trình đào tạo');
  console.log('   - 8 quá trình công tác');
  console.log('   - 17 công trình khoa học');
  console.log('   - 9 đề tài nghiên cứu');
  console.log('   - 12 khen thưởng');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
