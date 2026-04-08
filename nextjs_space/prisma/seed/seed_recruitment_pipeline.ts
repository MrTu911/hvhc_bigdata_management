import { PrismaClient, RecruitmentStep } from '@prisma/client';

const prisma = new PrismaClient();

// ─── User IDs ──────────────────────────────────────────────────────────────
const users: { code: string; id: string }[] = [
  { code: 'HV000500', id: 'cmmuk9rv001uw8i4626vn99a7' },
  { code: 'HV000501', id: 'cmmuk9rv601v18i46d6bazqsj' },
  { code: 'HV000502', id: 'cmmuk9rvd01v68i464lqoaimv' },
  { code: 'HV000503', id: 'cmmuk9rvh01vb8i46tudwk19v' },
  { code: 'HV000504', id: 'cmmuk9rvl01vg8i460wk0oml9' },
  { code: 'HV000505', id: 'cmmuk9rvo01vl8i46bqjlrnyx' },
  { code: 'HV000506', id: 'cmmuk9rvr01vq8i46k2o4ycm7' },
  { code: 'HV000507', id: 'cmmuk9rvu01vv8i46z5hge0u4' },
  { code: 'HV000508', id: 'cmmuk9rvx01w08i46x2ap9113' },
  { code: 'HV000509', id: 'cmmuk9rw001w58i4659dqhr36' },
  { code: 'HV000510', id: 'cmmuk9rw301wa8i46v7irfmce' },
  { code: 'HV000511', id: 'cmmuk9rw601wf8i465k5vdjw2' },
  { code: 'HV000512', id: 'cmmuk9rwa01wk8i46ytaxgvco' },
  { code: 'HV000513', id: 'cmmuk9rwc01wp8i46b7v69hpu' },
  { code: 'HV000514', id: 'cmmuk9rwf01wu8i46e4r5dock' },
  { code: 'HV000515', id: 'cmmuk9rwi01wz8i46yvx0yta4' },
  { code: 'HV000516', id: 'cmmuk9rwl01x48i46ss7h934k' },
  { code: 'HV000517', id: 'cmmuk9rwn01x98i469evz88du' },
  { code: 'HV000518', id: 'cmmuk9rwq01xe8i460utvvu04' },
  { code: 'HV000519', id: 'cmmuk9rwt01xj8i46mxeprzvr' },
  { code: 'HV000520', id: 'cmmuk9rww01xo8i46ad518zp7' },
  { code: 'HV000521', id: 'cmmuk9rwz01xt8i46b29qqjbi' },
  { code: 'HV000522', id: 'cmmuk9rx101xy8i46grksi6oy' },
  { code: 'HV000523', id: 'cmmuk9rx401y38i4664v4ze4v' },
  { code: 'HV000524', id: 'cmmuk9rx701y88i467clw3o4v' },
  { code: 'HV000525', id: 'cmmuk9rxa01yd8i46qxat2yc2' },
  { code: 'HV000526', id: 'cmmuk9rxd01yi8i468agutcgr' },
  { code: 'HV000527', id: 'cmmuk9rxh01yn8i46ma2fohm3' },
  { code: 'HV000528', id: 'cmmuk9rxk01ys8i46i9yyvemy' },
  { code: 'HV000529', id: 'cmmuk9rxn01yx8i46hlp5fdj9' },
  { code: 'HV000530', id: 'cmmuk9rxq01z28i46e4jb8lsv' },
  { code: 'HV000531', id: 'cmmuk9rxt01z78i46j7ycnbew' },
];

// ─── Org IDs (rotate) ────────────────────────────────────────────────────────
const orgIds: string[] = [
  'cmmuk9c3900018iapj3yih8wm',
  'cmmuk9c3g00028iap8n6qj6xu',
  'cmmuk9c3l00038iap9ir6b4z0',
  'cmmuk9c3r00048iapkpluznfg',
  'cmmuk9c3x00058iap2w3tsajx',
  'cmnfaa2n300058iepn4eix46t',
  'cmnfaa2n400078iepztpt5dot',
  'cmnfaa2n600098iepglpbzjad',
  'cmnfaa2oj00318iepno0fp53z',
  'cmnfaa2ok00338iepjyxsxcbf',
];

// ─── Vietnamese assistant names ───────────────────────────────────────────────
const assistants1 = [
  'Đ/c Nguyễn Văn Thắng',
  'Đ/c Trần Minh Đức',
  'Đ/c Lê Quang Hùng',
  'Đ/c Phạm Văn Bình',
  'Đ/c Hoàng Đức Mạnh',
  'Đ/c Vũ Quốc Tuấn',
  'Đ/c Đặng Văn Khoa',
  'Đ/c Bùi Thế Anh',
  'Đ/c Ngô Xuân Trường',
  'Đ/c Đinh Văn Hiệp',
];

const assistants2 = [
  'Đ/c Lê Thị Hương',
  'Đ/c Nguyễn Thị Lan',
  'Đ/c Trần Thị Hoa',
  'Đ/c Phạm Thị Thu',
  'Đ/c Vũ Thị Ngân',
  'Đ/c Hoàng Thị Bích',
  'Đ/c Mai Thị Yến',
  'Đ/c Đỗ Thị Nhung',
  'Đ/c Lưu Thị Kim Anh',
  'Đ/c Tô Thị Thanh',
];

function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// ─── Records to upsert ───────────────────────────────────────────────────────
// Steps: 7 more THEO_DOI, 6 more HOC_CAM_TINH, 6 DOI_TUONG, 5 CHI_BO_XET,
//        4 CAP_TREN_DUYET, 4 DA_KET_NAP  → 32 new records
interface RecordSpec {
  userId: string;
  currentStep: RecruitmentStep;
  targetPartyOrgId: string;
  camTinhDate?: Date;
  doiTuongDate?: Date;
  chiBoProposalDate?: Date;
  capTrenApprovalDate?: Date;
  joinedDate?: Date;
  assistantMember1?: string;
  assistantMember2?: string;
  dossierStatus?: string;
  note?: string;
}

const records: RecordSpec[] = [
  // ── THEO_DOI (7 more, idx 0–6) ──────────────────────────────────────────
  {
    userId: users[0].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[0],
    assistantMember1: assistants1[0],
    assistantMember2: assistants2[0],
    dossierStatus: 'IN_PROGRESS',
    note: 'Đang theo dõi quá trình tu dưỡng, rèn luyện đạo đức.',
  },
  {
    userId: users[1].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[1],
    assistantMember1: assistants1[1],
    assistantMember2: assistants2[1],
    dossierStatus: 'IN_PROGRESS',
    note: 'Tích cực tham gia các hoạt động của chi bộ.',
  },
  {
    userId: users[2].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[2],
    assistantMember1: assistants1[2],
    assistantMember2: assistants2[2],
    dossierStatus: 'PENDING_REVIEW',
    note: 'Cần theo dõi thêm về quan điểm chính trị.',
  },
  {
    userId: users[3].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[3],
    assistantMember1: assistants1[3],
    assistantMember2: assistants2[3],
    dossierStatus: 'IN_PROGRESS',
    note: 'Có tinh thần trách nhiệm cao trong học tập.',
  },
  {
    userId: users[4].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[4],
    assistantMember1: assistants1[4],
    assistantMember2: assistants2[4],
    dossierStatus: 'IN_PROGRESS',
    note: 'Tham gia đầy đủ các buổi sinh hoạt chi bộ.',
  },
  {
    userId: users[5].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[5],
    assistantMember1: assistants1[5],
    assistantMember2: assistants2[5],
    dossierStatus: 'PENDING_REVIEW',
    note: 'Đang hoàn thiện hồ sơ lý lịch.',
  },
  {
    userId: users[6].id,
    currentStep: 'THEO_DOI',
    targetPartyOrgId: orgIds[6],
    assistantMember1: assistants1[6],
    assistantMember2: assistants2[6],
    dossierStatus: 'IN_PROGRESS',
    note: 'Được chi bộ đánh giá cao về phẩm chất đạo đức.',
  },

  // ── HOC_CAM_TINH (6 more, idx 7–12) ─────────────────────────────────────
  {
    userId: users[7].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[7],
    camTinhDate: d(2025, 1, 15),
    assistantMember1: assistants1[7],
    assistantMember2: assistants2[7],
    dossierStatus: 'IN_PROGRESS',
    note: 'Hoàn thành lớp bồi dưỡng cảm tình Đảng tháng 1/2025.',
  },
  {
    userId: users[8].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[8],
    camTinhDate: d(2025, 2, 20),
    assistantMember1: assistants1[8],
    assistantMember2: assistants2[8],
    dossierStatus: 'IN_PROGRESS',
    note: 'Đang học lớp nhận thức về Đảng.',
  },
  {
    userId: users[9].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[9],
    camTinhDate: d(2025, 3, 10),
    assistantMember1: assistants1[9],
    assistantMember2: assistants2[9],
    dossierStatus: 'COMPLETE',
    note: 'Đã hoàn thành lớp cảm tình Đảng, chờ xét kết nạp.',
  },
  {
    userId: users[10].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[0],
    camTinhDate: d(2025, 4, 5),
    assistantMember1: assistants1[0],
    assistantMember2: assistants2[0],
    dossierStatus: 'IN_PROGRESS',
    note: 'Tích cực học tập lý luận chính trị.',
  },
  {
    userId: users[11].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[1],
    camTinhDate: d(2025, 5, 12),
    assistantMember1: assistants1[1],
    assistantMember2: assistants2[1],
    dossierStatus: 'PENDING_REVIEW',
    note: 'Cần bổ sung thêm tài liệu học tập.',
  },
  {
    userId: users[12].id,
    currentStep: 'HOC_CAM_TINH',
    targetPartyOrgId: orgIds[2],
    camTinhDate: d(2025, 6, 18),
    assistantMember1: assistants1[2],
    assistantMember2: assistants2[2],
    dossierStatus: 'IN_PROGRESS',
    note: 'Có nhận thức chính trị tốt, đang hoàn thiện hồ sơ.',
  },

  // ── DOI_TUONG (6, idx 13–18) ─────────────────────────────────────────────
  {
    userId: users[13].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[3],
    camTinhDate: d(2024, 9, 10),
    doiTuongDate: d(2025, 1, 20),
    assistantMember1: assistants1[3],
    assistantMember2: assistants2[3],
    dossierStatus: 'IN_PROGRESS',
    note: 'Được công nhận đối tượng kết nạp Đảng.',
  },
  {
    userId: users[14].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[4],
    camTinhDate: d(2024, 10, 5),
    doiTuongDate: d(2025, 2, 15),
    assistantMember1: assistants1[4],
    assistantMember2: assistants2[4],
    dossierStatus: 'IN_PROGRESS',
    note: 'Đang hoàn thiện hồ sơ đối tượng Đảng.',
  },
  {
    userId: users[15].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[5],
    camTinhDate: d(2024, 8, 20),
    doiTuongDate: d(2025, 3, 1),
    assistantMember1: assistants1[5],
    assistantMember2: assistants2[5],
    dossierStatus: 'COMPLETE',
    note: 'Hồ sơ đối tượng đã hoàn chỉnh, chờ chi bộ xét.',
  },
  {
    userId: users[16].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[6],
    camTinhDate: d(2024, 7, 15),
    doiTuongDate: d(2025, 4, 10),
    assistantMember1: assistants1[6],
    assistantMember2: assistants2[6],
    dossierStatus: 'IN_PROGRESS',
    note: 'Tham gia đầy đủ các buổi bồi dưỡng đối tượng.',
  },
  {
    userId: users[17].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[7],
    camTinhDate: d(2024, 11, 8),
    doiTuongDate: d(2025, 5, 5),
    assistantMember1: assistants1[7],
    assistantMember2: assistants2[7],
    dossierStatus: 'PENDING_REVIEW',
    note: 'Đang bổ sung lý lịch tự thuật theo yêu cầu chi bộ.',
  },
  {
    userId: users[18].id,
    currentStep: 'DOI_TUONG',
    targetPartyOrgId: orgIds[8],
    camTinhDate: d(2024, 12, 1),
    doiTuongDate: d(2025, 6, 20),
    assistantMember1: assistants1[8],
    assistantMember2: assistants2[8],
    dossierStatus: 'IN_PROGRESS',
    note: 'Được đánh giá là đối tượng ưu tiên kết nạp.',
  },

  // ── CHI_BO_XET (5, idx 19–23) ────────────────────────────────────────────
  {
    userId: users[19].id,
    currentStep: 'CHI_BO_XET',
    targetPartyOrgId: orgIds[9],
    camTinhDate: d(2024, 6, 10),
    doiTuongDate: d(2024, 10, 15),
    chiBoProposalDate: d(2025, 2, 25),
    assistantMember1: assistants1[9],
    assistantMember2: assistants2[9],
    dossierStatus: 'COMPLETE',
    note: 'Chi bộ đã họp xét, đề nghị cấp trên phê duyệt.',
  },
  {
    userId: users[20].id,
    currentStep: 'CHI_BO_XET',
    targetPartyOrgId: orgIds[0],
    camTinhDate: d(2024, 5, 20),
    doiTuongDate: d(2024, 9, 10),
    chiBoProposalDate: d(2025, 3, 15),
    assistantMember1: assistants1[0],
    assistantMember2: assistants2[0],
    dossierStatus: 'COMPLETE',
    note: 'Kết quả xét: đồng ý kết nạp với 100% phiếu thuận.',
  },
  {
    userId: users[21].id,
    currentStep: 'CHI_BO_XET',
    targetPartyOrgId: orgIds[1],
    camTinhDate: d(2024, 7, 5),
    doiTuongDate: d(2024, 11, 20),
    chiBoProposalDate: d(2025, 4, 8),
    assistantMember1: assistants1[1],
    assistantMember2: assistants2[1],
    dossierStatus: 'COMPLETE',
    note: 'Đã bỏ phiếu kín, kết quả đủ điều kiện trình cấp trên.',
  },
  {
    userId: users[22].id,
    currentStep: 'CHI_BO_XET',
    targetPartyOrgId: orgIds[2],
    camTinhDate: d(2024, 8, 12),
    doiTuongDate: d(2025, 1, 5),
    chiBoProposalDate: d(2025, 5, 20),
    assistantMember1: assistants1[2],
    assistantMember2: assistants2[2],
    dossierStatus: 'PENDING_REVIEW',
    note: 'Chờ bổ sung biên bản họp chi bộ.',
  },
  {
    userId: users[23].id,
    currentStep: 'CHI_BO_XET',
    targetPartyOrgId: orgIds[3],
    camTinhDate: d(2024, 9, 18),
    doiTuongDate: d(2025, 1, 30),
    chiBoProposalDate: d(2025, 6, 10),
    assistantMember1: assistants1[3],
    assistantMember2: assistants2[3],
    dossierStatus: 'COMPLETE',
    note: 'Hồ sơ đầy đủ, trình lên cấp trên xét duyệt.',
  },

  // ── CAP_TREN_DUYET (4, idx 24–27) ────────────────────────────────────────
  {
    userId: users[24].id,
    currentStep: 'CAP_TREN_DUYET',
    targetPartyOrgId: orgIds[4],
    camTinhDate: d(2024, 3, 10),
    doiTuongDate: d(2024, 7, 20),
    chiBoProposalDate: d(2024, 11, 15),
    capTrenApprovalDate: d(2025, 1, 28),
    assistantMember1: assistants1[4],
    assistantMember2: assistants2[4],
    dossierStatus: 'COMPLETE',
    note: 'Đảng ủy cấp trên đang xem xét hồ sơ kết nạp.',
  },
  {
    userId: users[25].id,
    currentStep: 'CAP_TREN_DUYET',
    targetPartyOrgId: orgIds[5],
    camTinhDate: d(2024, 4, 5),
    doiTuongDate: d(2024, 8, 10),
    chiBoProposalDate: d(2024, 12, 20),
    capTrenApprovalDate: d(2025, 2, 15),
    assistantMember1: assistants1[5],
    assistantMember2: assistants2[5],
    dossierStatus: 'COMPLETE',
    note: 'Hồ sơ đã trình Đảng ủy Học viện phê duyệt.',
  },
  {
    userId: users[26].id,
    currentStep: 'CAP_TREN_DUYET',
    targetPartyOrgId: orgIds[6],
    camTinhDate: d(2024, 2, 18),
    doiTuongDate: d(2024, 6, 5),
    chiBoProposalDate: d(2024, 10, 30),
    capTrenApprovalDate: d(2025, 3, 10),
    assistantMember1: assistants1[6],
    assistantMember2: assistants2[6],
    dossierStatus: 'COMPLETE',
    note: 'Đang chờ quyết định phê duyệt của cấp trên.',
  },
  {
    userId: users[27].id,
    currentStep: 'CAP_TREN_DUYET',
    targetPartyOrgId: orgIds[7],
    camTinhDate: d(2024, 5, 22),
    doiTuongDate: d(2024, 9, 15),
    chiBoProposalDate: d(2025, 1, 10),
    capTrenApprovalDate: d(2025, 4, 5),
    assistantMember1: assistants1[7],
    assistantMember2: assistants2[7],
    dossierStatus: 'COMPLETE',
    note: 'Cấp trên đã nhận hồ sơ, đang xem xét.',
  },

  // ── DA_KET_NAP (4, idx 28–31) ────────────────────────────────────────────
  {
    userId: users[28].id,
    currentStep: 'DA_KET_NAP',
    targetPartyOrgId: orgIds[8],
    camTinhDate: d(2023, 9, 10),
    doiTuongDate: d(2024, 1, 15),
    chiBoProposalDate: d(2024, 5, 20),
    capTrenApprovalDate: d(2024, 8, 12),
    joinedDate: d(2025, 1, 3),
    assistantMember1: assistants1[8],
    assistantMember2: assistants2[8],
    dossierStatus: 'COMPLETE',
    note: 'Đã kết nạp vào Đảng Cộng sản Việt Nam, lễ kết nạp ngày 03/01/2025.',
  },
  {
    userId: users[29].id,
    currentStep: 'DA_KET_NAP',
    targetPartyOrgId: orgIds[9],
    camTinhDate: d(2023, 10, 5),
    doiTuongDate: d(2024, 2, 20),
    chiBoProposalDate: d(2024, 6, 15),
    capTrenApprovalDate: d(2024, 9, 8),
    joinedDate: d(2025, 2, 14),
    assistantMember1: assistants1[9],
    assistantMember2: assistants2[9],
    dossierStatus: 'COMPLETE',
    note: 'Kết nạp Đảng viên dự bị tháng 2/2025.',
  },
  {
    userId: users[30].id,
    currentStep: 'DA_KET_NAP',
    targetPartyOrgId: orgIds[0],
    camTinhDate: d(2023, 11, 18),
    doiTuongDate: d(2024, 3, 10),
    chiBoProposalDate: d(2024, 7, 25),
    capTrenApprovalDate: d(2024, 10, 15),
    joinedDate: d(2025, 3, 19),
    assistantMember1: assistants1[0],
    assistantMember2: assistants2[0],
    dossierStatus: 'COMPLETE',
    note: 'Hoàn thành quy trình kết nạp Đảng viên chính thức.',
  },
  {
    userId: users[31].id,
    currentStep: 'DA_KET_NAP',
    targetPartyOrgId: orgIds[1],
    camTinhDate: d(2023, 12, 8),
    doiTuongDate: d(2024, 4, 5),
    chiBoProposalDate: d(2024, 8, 20),
    capTrenApprovalDate: d(2024, 11, 10),
    joinedDate: d(2025, 4, 22),
    assistantMember1: assistants1[1],
    assistantMember2: assistants2[1],
    dossierStatus: 'COMPLETE',
    note: 'Kết nạp Đảng viên, hoàn thành toàn bộ thủ tục hồ sơ.',
  },
];

async function main() {
  console.log(`\nUpserting ${records.length} PartyRecruitmentPipeline records...\n`);

  let created = 0;
  let updated = 0;

  for (const rec of records) {
    const { userId, ...rest } = rec;

    // Check if exists
    const existing = await prisma.partyRecruitmentPipeline.findUnique({
      where: { userId },
    });

    await prisma.partyRecruitmentPipeline.upsert({
      where: { userId },
      update: { ...rest },
      create: { userId, ...rest },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`Done: ${created} created, ${updated} updated.\n`);

  // ── Verify count per step ─────────────────────────────────────────────────
  const counts = await prisma.partyRecruitmentPipeline.groupBy({
    by: ['currentStep'],
    _count: { _all: true },
    orderBy: { currentStep: 'asc' },
  });

  const stepOrder: RecruitmentStep[] = [
    'THEO_DOI',
    'HOC_CAM_TINH',
    'DOI_TUONG',
    'CHI_BO_XET',
    'CAP_TREN_DUYET',
    'DA_KET_NAP',
  ];

  console.log('── Count per step (all records in DB) ──');
  let total = 0;
  for (const step of stepOrder) {
    const row = counts.find((c) => c.currentStep === step);
    const count = row ? row._count._all : 0;
    total += count;
    console.log(`  ${step.padEnd(18)} : ${count}`);
  }
  console.log(`  ${'TOTAL'.padEnd(18)} : ${total}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
