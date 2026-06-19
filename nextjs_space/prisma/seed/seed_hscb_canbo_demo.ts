/**
 * Seed dữ liệu đầy đủ 99 trường hồ sơ cán bộ điện tử cho cán bộ Viện B12:
 * Nguyễn Đức Tú (militaryId: 648300200001)
 * Chạy: npx tsx --require dotenv/config prisma/seed/seed_hscb_canbo_demo.ts
 */
import { PrismaClient, AssetType, EvaluationPeriodType, CommandMgmtLevel, PoliticalTheoryLevel, MaritalStatus } from '@prisma/client';

const prisma = new PrismaClient();

const USER_ID = 'cmpzc4wgj000j8ienx2wv1bdz';
const PERSONNEL_ID = 'cmpzd8s8a004x8i8fbn8ubxls';

async function main() {
  console.log('→ Seeding HSCB demo data cho userId:', USER_ID);

  // 1. Scalar User (nhóm 1-18, 28-82)
  await prisma.user.update({
    where: { id: USER_ID },
    data: {
      aliasName: 'Tú',
      maritalStatus: MaritalStatus.KET_HON,
      identifyingMarks: 'Nốt ruồi bên má phải',
      healthGrade: 'A (Loại 1)',
      height: 169,
      weight: 65,
      chronicDisease: 'Không',
      disabilityStatus: 'Không',
      disabilityDetail: null,
      warMartyrFamily: 'Không',
      academicTitleId: 'PGS',
      academicTitleDate: new Date('2022-05-15'),
      academicDegreeId: 'DAIHOC',
      commandMgmtLevel: CommandMgmtLevel.TRUNG_CAP,
      commandMgmtLevelDate: new Date('2018-09-01'),
      politicalTheoryLevel: PoliticalTheoryLevel.TRUNG_CAP,
      politicalTheoryDate: new Date('2017-06-30'),
      generalEducationLevel: '12/12',
      revolutionJoinDate: new Date('2005-03-01'),
      recruitmentDate: new Date('2005-03-01'),
      recruitmentUnit: 'Học viện Hậu cần',
      enlistmentUnit: 'Trung đoàn 168, Quân khu 1',
      dischargeUnit: null,
      reenlistmentDate: null,
      reenlistmentUnit: null,
      salaryRaiseCount: 3,
      salaryRaiseDate: new Date('2023-01-01'),
      salaryCoefficient: 5.76,
      salaryAmount: 8250000,
      positionAllowanceCoeff: 0.35,
      familyBackgroundId: 'QUAN_DOI',
      personalBackgroundId: 'TRI_THUC',
      partyJoinPlace: 'Chi bộ Khoa Hậu cần Kỹ thuật - HVHC',
      partyOfficialPlace: 'Chi bộ Phòng Nghiên cứu Khoa học - HVHC',
      recommenderPartyPosition: 'Bí thư chi bộ',
      workStrength: 'Nghiên cứu khoa học, giảng dạy chuyên ngành hậu cần',
      personalStrength: 'Phân tích dữ liệu, lập trình, tiếng Anh',
      personalHobby: 'Đọc sách, chạy bộ',
      currentMainWork: 'Nghiên cứu viên chính - Phòng NCKH',
      longestWork: 'Nghiên cứu khoa học kỹ thuật quân sự',
      currentSector: 'Nghiên cứu khoa học',
      cadreType: 'Sĩ quan',
      entrySource: 'Tuyển sinh từ THPT',
      isCorrectPosition: true,
      headcountIncreaseReason: 'Bổ sung chỉ tiêu năm 2005',
      headcountIncreaseDate: new Date('2005-03-01'),
    },
  });
  console.log('  ✓ User scalars cập nhật');

  // 2. Đoàn Thanh niên (trường 65-67)
  await prisma.youthUnionMembership.upsert({
    where: { userId: USER_ID },
    create: {
      userId: USER_ID,
      personnelId: PERSONNEL_ID,
      joinDate: new Date('2000-04-15'),
      joinPlace: 'Chi đoàn trường THPT Yên Lạc, Vĩnh Phúc',
      currentPosition: 'Không (đã chuyển sinh hoạt Đảng)',
    },
    update: {
      joinDate: new Date('2000-04-15'),
      joinPlace: 'Chi đoàn trường THPT Yên Lạc, Vĩnh Phúc',
      currentPosition: 'Không (đã chuyển sinh hoạt Đảng)',
    },
  });
  console.log('  ✓ YouthUnionMembership');

  // 3. Tài sản kê khai (trường 88)
  const cntAsset = await prisma.assetDeclaration.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntAsset === 0) {
    await prisma.assetDeclaration.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          assetType: AssetType.NHA,
          assetName: 'Nhà ở riêng lẻ tại Hà Nội',
          area: '72 m²',
          value: 3200000000,
          documentRef: 'GCN QSDĐ số: AO 123456',
          declaredDate: new Date('2024-01-05'),
          notes: 'Nhận thừa kế từ bố mẹ năm 2020',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          assetType: AssetType.O_TO,
          assetName: 'Xe ô tô Toyota Vios 2020',
          area: null,
          value: 450000000,
          documentRef: 'Đăng ký xe số: 30A-567.89',
          declaredDate: new Date('2024-01-05'),
          notes: '',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ AssetDeclarations (2 bản ghi)');
  } else {
    console.log('  ~ AssetDeclarations đã tồn tại, bỏ qua');
  }

  // 4. Đi nước ngoài (trường 90)
  const cntTrip = await prisma.foreignTrip.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntTrip === 0) {
    await prisma.foreignTrip.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          fromDate: new Date('2019-09-10'),
          toDate: new Date('2019-09-17'),
          country: 'Singapore',
          purpose: 'Tham dự hội thảo khoa học quốc tế ICMISC 2019',
          sponsor: 'Đề tài NCKH cấp Học viện',
          decisionNumber: 'CV số 89/HVHC-NCKH ngày 01/09/2019',
          notes: '',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          fromDate: new Date('2023-06-20'),
          toDate: new Date('2023-07-01'),
          country: 'Trung Quốc',
          purpose: 'Học tập kinh nghiệm quản lý hậu cần quân đội',
          sponsor: 'Ngân sách Học viện Hậu cần',
          decisionNumber: 'QĐ số 200/QĐ-HVHC ngày 10/06/2023',
          notes: '',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ ForeignTrips (2 bản ghi)');
  } else {
    console.log('  ~ ForeignTrips đã tồn tại, bỏ qua');
  }

  // 5. Danh hiệu thi đua (trường 91)
  const cntHonor = await prisma.honorTitleRecord.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntHonor === 0) {
    await prisma.honorTitleRecord.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          meritTitleId: 'CSTT_HV',
          titleName: 'Chiến sĩ thi đua cấp Học viện',
          level: 'Học viện',
          awardYear: 2022,
          awardedBy: 'Viện trưởng Học viện Hậu cần',
          decisionNumber: 'QĐ số 120/QĐ-HVHC ngày 30/12/2022',
          notes: '',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          meritTitleId: 'LDTT',
          titleName: 'Lao động tiên tiến',
          level: 'Học viện',
          awardYear: 2023,
          awardedBy: 'Viện trưởng Học viện Hậu cần',
          decisionNumber: 'QĐ số 110/QĐ-HVHC ngày 28/12/2023',
          notes: '',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ HonorTitleRecords (2 bản ghi)');
  } else {
    console.log('  ~ HonorTitleRecords đã tồn tại, bỏ qua');
  }

  // 6. Quá trình chiến đấu (trường 83)
  const cntCombat = await prisma.combatHistory.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntCombat === 0) {
    await prisma.combatHistory.create({
      data: {
        userId: USER_ID,
        personnelId: PERSONNEL_ID,
        fromDate: new Date('2007-01-01'),
        toDate: new Date('2007-12-31'),
        battlefield: 'Vùng biên giới Lào Cai',
        unit: 'Tiểu đoàn 2, Trung đoàn 168',
        role: 'Trợ lý hậu cần',
        description: 'Tham gia diễn tập phòng thủ biên giới khu vực Lào Cai',
        sortOrder: 1,
      },
    });
    console.log('  ✓ CombatHistory (1 bản ghi)');
  } else {
    console.log('  ~ CombatHistories đã tồn tại, bỏ qua');
  }

  // 7. Đánh giá xếp loại (trường 95)
  const cntEval = await prisma.personnelEvaluation.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntEval === 0) {
    await prisma.personnelEvaluation.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          periodType: EvaluationPeriodType.NAM,
          periodYear: 2022,
          taskResultRankId: 'HTXSNV',
          taskResultLabel: 'Hoàn thành xuất sắc nhiệm vụ',
          partyMemberRank: 'Hoàn thành xuất sắc nhiệm vụ',
          decisionNumber: 'BN số 01/HVHC-NCKH năm 2023',
          notes: 'Đề tài NCKH được nghiệm thu xếp loại tốt',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          periodType: EvaluationPeriodType.NAM,
          periodYear: 2023,
          taskResultRankId: 'HTTNV',
          taskResultLabel: 'Hoàn thành tốt nhiệm vụ',
          partyMemberRank: 'Hoàn thành tốt nhiệm vụ',
          decisionNumber: 'BN số 01/HVHC-NCKH năm 2024',
          notes: 'Tích cực tham gia NCKH và giảng dạy',
          sortOrder: 2,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          periodType: EvaluationPeriodType.QUY,
          periodYear: 2024,
          periodQuarter: 1,
          taskResultRankId: 'HTTNV',
          taskResultLabel: 'Hoàn thành tốt nhiệm vụ',
          partyMemberRank: 'Hoàn thành tốt nhiệm vụ',
          decisionNumber: null,
          notes: 'Quý 1/2024',
          sortOrder: 3,
        },
      ],
    });
    console.log('  ✓ PersonnelEvaluations (3 bản ghi)');
  } else {
    console.log('  ~ PersonnelEvaluations đã tồn tại, bỏ qua');
  }

  // 8. Phụ cấp (trường 96)
  const cntAllowance = await prisma.allowanceRecord.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntAllowance === 0) {
    await prisma.allowanceRecord.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          allowanceTypeId: 'CHUC_VU',
          allowanceLabel: 'Phụ cấp chức vụ',
          coefficient: 0.35,
          fromDate: new Date('2020-01-01'),
          toDate: null,
          reason: 'Nghiên cứu viên chính Hạng II',
          decisionNumber: 'QĐ số 45/QĐ-HVHC',
          notes: '',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          allowanceTypeId: 'THAM_NIEN',
          allowanceLabel: 'Phụ cấp thâm niên',
          coefficient: 0.30,
          fromDate: new Date('2015-03-01'),
          toDate: null,
          reason: 'Thâm niên 10 năm công tác quân đội',
          decisionNumber: 'QĐ số 22/QĐ-HVHC',
          notes: '',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ AllowanceRecords (2 bản ghi)');
  } else {
    console.log('  ~ AllowanceRecords đã tồn tại, bỏ qua');
  }

  // 9. Chức vụ kiêm (trường 19-21)
  const cntConcurrent = await prisma.concurrentPosition.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntConcurrent === 0) {
    await prisma.concurrentPosition.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          positionTitle: 'Chủ nhiệm đề tài NCKH cấp Bộ',
          fromDate: new Date('2022-01-01'),
          toDate: new Date('2024-12-31'),
          unit: 'Học viện Hậu cần',
          detail: 'Đề tài: Ứng dụng AI trong quản lý hậu cần quân đội',
          decisionNumber: 'QĐ số 15/QĐ-HVHC ngày 10/01/2022',
          notes: '',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          positionTitle: 'Thành viên Hội đồng Khoa học Học viện',
          fromDate: new Date('2021-03-15'),
          toDate: null,
          unit: 'Học viện Hậu cần',
          detail: 'Phản biện và thẩm định đề tài NCKH',
          decisionNumber: 'QĐ số 88/QĐ-HVHC ngày 15/03/2021',
          notes: '',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ ConcurrentPositions (2 bản ghi)');
  } else {
    console.log('  ~ ConcurrentPositions đã tồn tại, bỏ qua');
  }

  // 10. Chức danh chuyên môn kỹ thuật nghiệp vụ (trường 68-69)
  const cntProfTitle = await prisma.professionalTitleRecord.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntProfTitle === 0) {
    await prisma.professionalTitleRecord.createMany({
      data: [
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          titleName: 'Nghiên cứu viên chính Hạng II',
          effectiveDate: new Date('2019-07-01'),
          decisionNumber: 'QĐ số 156/QĐ-BQP ngày 01/07/2019',
          issuer: 'Bộ Quốc phòng',
          notes: '',
          sortOrder: 1,
        },
        {
          userId: USER_ID,
          personnelId: PERSONNEL_ID,
          titleName: 'Giảng viên chính Hạng II',
          effectiveDate: new Date('2021-09-01'),
          decisionNumber: 'QĐ số 890/QĐ-BGDĐT ngày 01/09/2021',
          issuer: 'Bộ Giáo dục và Đào tạo',
          notes: 'Kiêm nhiệm giảng dạy tại khoa',
          sortOrder: 2,
        },
      ],
    });
    console.log('  ✓ ProfessionalTitleRecords (2 bản ghi)');
  } else {
    console.log('  ~ ProfessionalTitleRecords đã tồn tại, bỏ qua');
  }

  // 11. Tiếng dân tộc (trường 85)
  const cntLang = await prisma.ethnicLanguage.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntLang === 0) {
    await prisma.ethnicLanguage.create({
      data: {
        userId: USER_ID,
        personnelId: PERSONNEL_ID,
        language: 'Tiếng Tày',
        proficiency: 'Giao tiếp cơ bản',
        notes: 'Học trong thời gian công tác tại Lào Cai',
        sortOrder: 1,
      },
    });
    console.log('  ✓ EthnicLanguage (1 bản ghi)');
  } else {
    console.log('  ~ EthnicLanguages đã tồn tại, bỏ qua');
  }

  // 12. Chức vụ ngoài quân đội (trường 99)
  const cntExternal = await prisma.externalPosition.count({ where: { userId: USER_ID, deletedAt: null } });
  if (cntExternal === 0) {
    await prisma.externalPosition.create({
      data: {
        userId: USER_ID,
        personnelId: PERSONNEL_ID,
        positionTitle: 'Ủy viên Ban Chấp hành',
        organization: 'Hiệp hội Trí tuệ nhân tạo Việt Nam (VAAI)',
        fromDate: new Date('2023-05-01'),
        toDate: null,
        decisionNumber: 'QĐ số 15/QĐ-VAAI ngày 01/05/2023',
        notes: 'Tham gia với tư cách chuyên gia kỹ thuật quân sự',
        sortOrder: 1,
      },
    });
    console.log('  ✓ ExternalPosition (1 bản ghi)');
  } else {
    console.log('  ~ ExternalPositions đã tồn tại, bỏ qua');
  }

  console.log('\n✅ Seed HSCB demo hoàn thành!');
  console.log('   Cán bộ: Nguyễn Đức Tú | userId:', USER_ID);
  console.log('   Trang chi tiết: /dashboard/personnel/' + USER_ID);
}

main()
  .catch((e) => { console.error('SEED ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
