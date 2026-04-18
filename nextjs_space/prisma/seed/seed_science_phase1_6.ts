/**
 * seed_science_phase1_6.ts
 *
 * Dữ liệu mẫu đầy đủ cho các tính năng mới Phase 1–6:
 *   1. NckhProposal + NckhProposalReview
 *   2. NckhProgressReport
 *   3. NckhMidtermReview
 *   4. NckhExtension
 *   5. NckhClosure + NckhLessonLearned
 *   6. NckhAcceptance + NckhAcceptanceScore
 *   7. NckhCouncilMeeting + NckhMeetingVote
 *   8. Finance: NckhPurchaseOrder + Items, NckhInvoice + Items, NckhExpense, NckhGrant + Disbursements
 *   9. Chat: NckhChatRoom + NckhChatMessage
 *  10. NckhCollaboration + Participants + Documents
 *
 * Idempotent — dùng deleteMany + create để làm sạch trước khi seed.
 *
 * Run:
 *   npx tsx prisma/seed/seed_science_phase1_6.ts
 *
 * Prerequisites:
 *   seed_m09_research_demo.ts   (NckhProject, NckhScientistProfile)
 *   seed_faculty_profiles.ts    (FacultyProfile)
 *   seed_units.ts               (Unit)
 */

import {
  PrismaClient,
  NckhType,
  NckhCategory,
  NckhField,
  NckhProposalStatus,
  NckhReportType,
  NckhExpenseCategory,
  NckhExpenseStatus,
  NckhGrantStatus,
  NckhPoStatus,
  NckhAcceptanceType,
  NckhAcceptanceResult,
  NckhCollaborationType,
  NckhInvoiceStatus,
  NckhMidtermRecommendation,
  NckhExtensionStatus,
  NckhClosureType,
  NckhImpactLevel,
} from '@prisma/client'
import 'dotenv/config'

const db = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number) { return new Date(Date.now() - n * 86400_000) }
function daysFromNow(n: number) { return new Date(Date.now() + n * 86400_000) }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔬 seed_science_phase1_6.ts — Phase 1–6 demo data\n')

  // ── 0. Fetch prerequisites ───────────────────────────────────────────────────

  const projects = await db.nckhProject.findMany({
    select: {
      id: true,
      projectCode: true,
      status: true,
      principalInvestigatorId: true,
      budgetApproved: true,
      unitId: true,
    },
    take: 8,
    orderBy: { createdAt: 'desc' },
  })
  if (projects.length < 3) throw new Error('Cần ít nhất 3 NckhProject. Chạy seed_m09_research_demo.ts trước.')

  const facultyUsers = await db.user.findMany({
    where: { facultyProfile: { isNot: null } },
    select: { id: true, name: true },
    take: 10,
  })
  if (facultyUsers.length < 4) throw new Error('Cần ít nhất 4 faculty users. Chạy seed_faculty_profiles.ts trước.')

  const adminUser = facultyUsers[0]
  const unit = await db.unit.findFirst({ select: { id: true } })
  if (!unit) throw new Error('Cần Unit. Chạy seed_units.ts trước.')

  const council = await db.scientificCouncil.findFirst({
    where: { projectId: projects[0].id },
    select: { id: true },
  })

  const proj0 = projects[0] // IN_PROGRESS → full lifecycle demo
  const proj1 = projects[1] // IN_PROGRESS → finance demo
  const proj2 = projects[2] // APPROVED    → proposal link
  const completedProject = projects.find(p => p.status === 'COMPLETED')

  console.log(`  Projects: ${projects.map(p => p.projectCode).join(', ')}`)
  console.log(`  Admin user: ${adminUser.name}`)
  console.log(`  Council: ${council?.id ?? 'none'}`)
  console.log(`  Completed project: ${completedProject?.projectCode ?? 'none'}\n`)

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — NckhProposal
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📝 1. NckhProposal...')
  await db.nckhProposalReview.deleteMany()
  await db.nckhProposal.deleteMany()

  const [p1, p2, p3] = await Promise.all([
    db.nckhProposal.create({
      data: {
        title: 'Nghiên cứu ứng dụng trí tuệ nhân tạo trong huấn luyện quân sự',
        titleEn: 'Applying AI in Military Training',
        abstract: 'Đề xuất nghiên cứu các giải pháp AI hỗ trợ huấn luyện chiến thuật, nâng cao hiệu quả đào tạo cán bộ quân sự.',
        keywords: ['AI', 'huấn luyện', 'quân sự', 'deep learning'],
        researchType: NckhType.CO_BAN,
        category: NckhCategory.CAP_HOC_VIEN,
        field: NckhField.CNTT,
        budgetRequested: 280_000_000,
        durationMonths: 24,
        piId: facultyUsers[0].id,
        unitId: unit.id,
        status: NckhProposalStatus.APPROVED,
        submittedAt: daysAgo(45),
        approvedAt: daysAgo(10),
        approvedById: adminUser.id,
        projectId: proj2.id,
      },
    }),
    db.nckhProposal.create({
      data: {
        title: 'Phát triển hệ thống quản lý logistics hậu cần thông minh',
        titleEn: 'Smart Logistics Management System for Military',
        abstract: 'Nghiên cứu xây dựng nền tảng số hóa quản lý hậu cần, tích hợp IoT và phân tích dữ liệu lớn.',
        keywords: ['logistics', 'IoT', 'big data', 'hậu cần'],
        researchType: NckhType.UNG_DUNG,
        category: NckhCategory.CAP_HOC_VIEN,
        field: NckhField.HAU_CAN_KY_THUAT,
        budgetRequested: 350_000_000,
        durationMonths: 18,
        piId: facultyUsers[1].id,
        unitId: unit.id,
        status: NckhProposalStatus.REVIEWING,
        submittedAt: daysAgo(15),
        reviewDeadline: daysFromNow(10),
      },
    }),
    db.nckhProposal.create({
      data: {
        title: 'Nghiên cứu giải pháp bảo mật mạng cho hệ thống chỉ huy điều hành',
        abstract: 'Xây dựng khung bảo mật đa lớp cho các hệ thống thông tin quân sự, tập trung vào phòng thủ mạng.',
        keywords: ['bảo mật', 'cybersecurity', 'chỉ huy', 'mạng quân sự'],
        researchType: NckhType.CO_BAN,
        category: NckhCategory.CAP_TONG_CUC,
        field: NckhField.CNTT,
        budgetRequested: 200_000_000,
        durationMonths: 12,
        piId: facultyUsers[2].id,
        unitId: unit.id,
        status: NckhProposalStatus.DRAFT,
      },
    }),
  ])

  await db.nckhProposalReview.create({
    data: {
      proposalId: p2.id,
      reviewerId: facultyUsers[3].id,
      score: 82,
      comment: 'Đề tài có tính ứng dụng cao, cần làm rõ thêm phương pháp đánh giá hiệu quả logistics.',
      recommendation: 'APPROVE_WITH_REVISION',
    },
  })
  console.log('  ✓ 3 đề xuất, 1 review')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — NckhProgressReport
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('📊 2. NckhProgressReport...')
  await db.nckhProgressReport.deleteMany({ where: { projectId: { in: [proj0.id, proj1.id] } } })

  await db.nckhProgressReport.createMany({
    data: [
      {
        projectId: proj0.id,
        reportPeriod: 'Q1-2025',
        reportType: NckhReportType.QUARTERLY,
        status: 'APPROVED',
        content: 'Hoàn thành 30% khối lượng nghiên cứu. Đã khảo sát tài liệu, xây dựng khung lý thuyết. Tổ chức 3 buổi seminar nội bộ.',
        completionPercent: 30,
        issues: 'Một thành viên nhóm đi công tác dài ngày, cần điều chỉnh tiến độ.',
        nextSteps: 'Bắt đầu giai đoạn thực nghiệm, thu thập dữ liệu thực tế.',
        submittedById: proj0.principalInvestigatorId,
        submittedAt: daysAgo(80),
        reviewedAt: daysAgo(70),
        reviewNote: 'Tiến độ đảm bảo, cần chú ý vấn đề nhân lực.',
        reviewedById: adminUser.id,
      },
      {
        projectId: proj0.id,
        reportPeriod: 'Q2-2025',
        reportType: NckhReportType.QUARTERLY,
        status: 'APPROVED',
        content: 'Hoàn thành 60% khối lượng. Đã xây dựng mô hình thử nghiệm, thu thập 500 mẫu dữ liệu. Kết quả bước đầu khả quan.',
        completionPercent: 60,
        nextSteps: 'Phân tích kết quả, viết bài báo khoa học.',
        submittedById: proj0.principalInvestigatorId,
        submittedAt: daysAgo(30),
        reviewedAt: daysAgo(20),
        reviewedById: adminUser.id,
      },
      {
        projectId: proj1.id,
        reportPeriod: 'T01/2025',
        reportType: NckhReportType.MONTHLY,
        status: 'SUBMITTED',
        content: 'Hoàn thành phân tích yêu cầu, xây dựng kiến trúc hệ thống. Đã triển khai module quản lý kho.',
        completionPercent: 25,
        submittedById: proj1.principalInvestigatorId,
        submittedAt: daysAgo(5),
      },
    ],
  })
  console.log('  ✓ 3 báo cáo tiến độ')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — NckhMidtermReview
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🔍 3. NckhMidtermReview...')
  await db.nckhMidtermReview.deleteMany({ where: { projectId: proj0.id } })

  await db.nckhMidtermReview.create({
    data: {
      projectId: proj0.id,
      councilId: council?.id ?? null,
      reviewDate: daysAgo(25),
      overallScore: 78.5,
      scientificScore: 80,
      progressScore: 75,
      budgetScore: 82,
      recommendation: NckhMidtermRecommendation.CONTINUE,
      adjustmentRequired: true,
      adjustmentNote: 'Bổ sung thêm 100 mẫu thực nghiệm. Hoàn thiện bộ công cụ đánh giá trước tháng 9/2025.',
      conclusionText: 'Đề tài đạt yêu cầu giữa kỳ. Kết quả nghiên cứu bước đầu đáp ứng mục tiêu đề ra. Hội đồng đề nghị tiếp tục thực hiện với một số điều chỉnh về phương pháp.',
      approvedById: adminUser.id,
    },
  })
  console.log('  ✓ 1 đánh giá giữa kỳ')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — NckhExtension
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('⏱️  4. NckhExtension...')
  await db.nckhExtension.deleteMany({ where: { projectId: proj1.id } })

  await db.nckhExtension.create({
    data: {
      projectId: proj1.id,
      requestedById: proj1.principalInvestigatorId,
      extensionMonths: 3,
      originalEndDate: daysAgo(30),
      requestedEndDate: daysFromNow(60),
      reason: 'Do thiếu thiết bị thực nghiệm chuyên dụng nhập khẩu bị chậm, cần gia hạn thêm 3 tháng để hoàn thành giai đoạn kiểm thử tích hợp hệ thống.',
      status: NckhExtensionStatus.APPROVED,
      approvedById: adminUser.id,
      approvedAt: daysAgo(7),
    },
  })
  console.log('  ✓ 1 gia hạn')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — NckhClosure + NckhLessonLearned
  // ═══════════════════════════════════════════════════════════════════════════

  if (completedProject) {
    console.log('✅ 5. NckhClosure + NckhLessonLearned...')
    await db.nckhLessonLearned.deleteMany({ where: { projectId: completedProject.id } })
    await db.nckhClosure.deleteMany({ where: { projectId: completedProject.id } })

    await db.nckhClosure.create({
      data: {
        projectId: completedProject.id,
        closureType: NckhClosureType.COMPLETED,
        closureDate: daysAgo(30),
        finalScore: 85.5,
        finalGrade: 'Tốt',
        archiveLocation: 'Kho lưu trữ PQLKH – Kệ số 12, Hộp 2025-05',
        notes: 'Đề tài hoàn thành đúng tiến độ, đạt tất cả mục tiêu. 3 bài báo ISI/Scopus, 1 sáng kiến ứng dụng thực tế, đào tạo 2 thạc sĩ.',
        closedById: completedProject.principalInvestigatorId,
      },
    })

    await db.nckhLessonLearned.createMany({
      data: [
        {
          projectId: completedProject.id,
          category: 'PROCESS',
          title: 'Quản lý tiến độ linh hoạt với sprint 2-tuần',
          description: 'Áp dụng phương pháp Agile với sprint 2-tuần giúp phát hiện sớm vấn đề, điều chỉnh kịp thời. Đề xuất áp dụng cho các đề tài kỹ thuật tương lai.',
          impact: NckhImpactLevel.HIGH,
          recommendation: 'Áp dụng cho tất cả đề tài cấp học viện nhóm ≥ 3 người.',
          addedById: completedProject.principalInvestigatorId,
        },
        {
          projectId: completedProject.id,
          category: 'TECHNICAL',
          title: 'Kết hợp dữ liệu thực và mô phỏng trong đánh giá hiệu quả',
          description: 'Kết hợp dữ liệu thực từ đơn vị với kịch bản mô phỏng giúp tăng độ tin cậy kết quả đến 35%. Cần thiết lập giao thức thu thập dữ liệu từ đầu.',
          impact: NckhImpactLevel.HIGH,
          recommendation: 'Lập giao thức thu thập dữ liệu thực tế ngay từ giai đoạn lập đề cương.',
          addedById: completedProject.principalInvestigatorId,
        },
        {
          projectId: completedProject.id,
          category: 'COLLABORATION',
          title: 'Mời phản biện quốc tế trước khi nộp bài báo',
          description: 'Việc mời chuyên gia nước ngoài phản biện nội bộ trước khi nộp bài giúp tăng tỷ lệ chấp nhận đăng từ 40% lên 80%.',
          impact: NckhImpactLevel.MEDIUM,
          recommendation: 'Mỗi đề tài nên dành ngân sách tối thiểu 5 triệu cho phản biện quốc tế.',
          addedById: adminUser.id,
        },
      ],
    })
    console.log('  ✓ 1 đóng đề tài, 3 bài học kinh nghiệm')
  } else {
    console.log('  ⚠️  Không có project COMPLETED, bỏ qua Closure/Lessons')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — NckhAcceptance + NckhAcceptanceScore
  // ═══════════════════════════════════════════════════════════════════════════

  if (completedProject) {
    console.log('🏆 6. NckhAcceptance...')
    await db.nckhAcceptanceScore.deleteMany({ where: { acceptance: { projectId: completedProject.id } } })
    await db.nckhAcceptance.deleteMany({ where: { projectId: completedProject.id } })

    const acceptance = await db.nckhAcceptance.create({
      data: {
        projectId: completedProject.id,
        councilId: council?.id,
        acceptanceDate: daysAgo(28),
        acceptanceType: NckhAcceptanceType.FINAL,
        finalScore: 85.5,
        grade: 'Tốt',
        result: NckhAcceptanceResult.PASS,
        conditions: 'Chỉnh sửa báo cáo tổng kết theo góp ý hội đồng trong vòng 30 ngày.',
        acceptedById: adminUser.id,
      },
    })

    // Lấy thành viên hội đồng để ghi điểm
    const councilMembers = council
      ? await db.scientificCouncilMember.findMany({
          where: { councilId: council.id, role: { in: ['REVIEWER', 'CHAIRMAN'] } },
          select: { id: true },
          take: 3,
        })
      : []

    if (councilMembers.length > 0) {
      const CRITERIA = ['SCIENTIFIC_VALUE', 'FEASIBILITY', 'OUTCOMES']
      await db.nckhAcceptanceScore.createMany({
        data: councilMembers.map((m, i) => ({
          acceptanceId: acceptance.id,
          memberId: m.id,
          criteria: CRITERIA[i % CRITERIA.length],
          score: 82 + i * 2,
          comment: [
            'Đề tài có chất lượng tốt, kết quả ứng dụng rõ ràng.',
            'Hướng nghiên cứu đúng đắn, phương pháp khoa học.',
            'Kết quả đáng ghi nhận, cần mở rộng phạm vi áp dụng.',
          ][i],
        })),
      })
      console.log(`  ✓ 1 nghiệm thu chính thức, ${councilMembers.length} điểm thành viên HĐ`)
    } else {
      console.log('  ✓ 1 nghiệm thu chính thức (không có council members để ghi điểm)')
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — NckhCouncilMeeting + NckhMeetingVote
  // ═══════════════════════════════════════════════════════════════════════════

  if (council) {
    console.log('🏛️  7. NckhCouncilMeeting + NckhMeetingVote...')
    await db.nckhMeetingVote.deleteMany({ where: { meeting: { councilId: council.id } } })
    await db.nckhCouncilMeeting.deleteMany({ where: { councilId: council.id } })

    const meeting = await db.nckhCouncilMeeting.create({
      data: {
        councilId: council.id,
        meetingDate: daysAgo(20),
        location: 'Phòng họp A2 – Học viện HVHC',
        agenda: 'Thẩm định đề cương chi tiết và kế hoạch nghiên cứu',
        minutesContent: 'Hội đồng đã xem xét toàn diện đề cương, phương pháp nghiên cứu và dự toán kinh phí. Các thành viên thảo luận và biểu quyết theo quy định.',
        attendanceCount: 5,
        createdById: adminUser.id,
      },
    })

    const allMembers = await db.scientificCouncilMember.findMany({
      where: { councilId: council.id },
      select: { id: true },
      take: 5,
    })

    if (allMembers.length > 0) {
      await db.nckhMeetingVote.createMany({
        data: allMembers.map((m, i) => ({
          meetingId: meeting.id,
          memberId: m.id,
          voteType: 'APPROVAL',
          vote: i < 4 ? 'APPROVE' : 'ABSTAIN',
          comment: i < 4 ? 'Nhất trí thông qua đề cương.' : 'Cần nghiên cứu thêm trước khi quyết định.',
        })),
      })
      console.log(`  ✓ 1 phiên họp, ${allMembers.length} phiếu bầu`)
    } else {
      console.log('  ✓ 1 phiên họp (không có council members)')
    }
  } else {
    console.log('  ⚠️  Không có ScientificCouncil, bỏ qua Meeting/Vote')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 8 — Finance
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('💰 8. Finance (PO, Invoice, Expense, Grant)...')

  // Cascade: deleting PO cascades to PO items; Invoice cascades to invoice items; Grant cascades to disbursements
  await db.nckhGrant.deleteMany({ where: { projectId: proj1.id } })
  await db.nckhInvoice.deleteMany({ where: { projectId: proj1.id } })
  await db.nckhPurchaseOrder.deleteMany({ where: { projectId: proj1.id } })
  await db.nckhExpense.deleteMany({ where: { projectId: proj1.id } })

  const poNum1 = `PO-2025-${String(Date.now()).slice(-5)}`
  const poNum2 = `PO-2025-${String(Date.now() + 1).slice(-5)}`

  const po1 = await db.nckhPurchaseOrder.create({
    data: {
      projectId: proj1.id,
      poNumber: poNum1,
      vendor: 'Công ty TNHH Thiết bị Kỹ thuật Việt Nam',
      orderDate: daysAgo(60),
      totalAmount: BigInt(45_000_000),
      status: NckhPoStatus.APPROVED,
      approvedById: adminUser.id,
      approvedAt: daysAgo(55),
      notes: 'Mua thiết bị thực nghiệm giai đoạn 1',
      createdById: proj1.principalInvestigatorId,
      items: {
        create: [
          { itemName: 'Máy đo đạc chuyên dụng Model X200', quantity: 2, unitPrice: BigInt(15_000_000), amount: BigInt(30_000_000), category: NckhExpenseCategory.EQUIPMENT, unit: 'chiếc' },
          { itemName: 'Phần mềm phân tích dữ liệu (license 1 năm)', quantity: 3, unitPrice: BigInt(5_000_000), amount: BigInt(15_000_000), category: NckhExpenseCategory.OTHER, unit: 'license' },
        ],
      },
    },
  })

  await db.nckhPurchaseOrder.create({
    data: {
      projectId: proj1.id,
      poNumber: poNum2,
      vendor: 'Công ty Cổ phần Công nghệ Quốc Phòng',
      orderDate: daysAgo(20),
      totalAmount: BigInt(28_000_000),
      status: NckhPoStatus.DRAFT,
      notes: 'Mua vật tư thực nghiệm giai đoạn 2',
      createdById: proj1.principalInvestigatorId,
      items: {
        create: [
          { itemName: 'Linh kiện điện tử chuyên dụng', quantity: 50, unitPrice: BigInt(400_000), amount: BigInt(20_000_000), category: NckhExpenseCategory.EQUIPMENT, unit: 'bộ' },
          { itemName: 'Công cụ thực hành nhóm', quantity: 4, unitPrice: BigInt(2_000_000), amount: BigInt(8_000_000), category: NckhExpenseCategory.EQUIPMENT, unit: 'bộ' },
        ],
      },
    },
  })

  const invNum1 = `INV-2025-${String(Date.now()).slice(-5)}`
  const invNum2 = `INV-2025-${String(Date.now() + 2).slice(-5)}`

  await db.nckhInvoice.create({
    data: {
      projectId: proj1.id,
      poId: po1.id,
      invoiceNumber: invNum1,
      vendor: po1.vendor,
      invoiceDate: daysAgo(50),
      totalAmount: BigInt(30_000_000),
      status: NckhInvoiceStatus.PAID,
      paidAt: daysAgo(45),
      notes: 'Thanh toán đợt 1 theo PO',
      createdById: proj1.principalInvestigatorId,
      items: {
        create: [
          { description: 'Máy đo đạc chuyên dụng Model X200 x2', quantity: 2, unitPrice: BigInt(15_000_000), amount: BigInt(30_000_000), category: NckhExpenseCategory.EQUIPMENT },
        ],
      },
    },
  })

  await db.nckhInvoice.create({
    data: {
      projectId: proj1.id,
      poId: po1.id,
      invoiceNumber: invNum2,
      vendor: po1.vendor,
      invoiceDate: daysAgo(15),
      totalAmount: BigInt(15_000_000),
      status: NckhInvoiceStatus.PENDING,
      notes: 'Thanh toán đợt 2 - phần mềm',
      createdById: proj1.principalInvestigatorId,
      items: {
        create: [
          { description: 'Phần mềm phân tích dữ liệu x3', quantity: 3, unitPrice: BigInt(5_000_000), amount: BigInt(15_000_000), category: NckhExpenseCategory.OTHER },
        ],
      },
    },
  })

  await db.nckhExpense.createMany({
    data: [
      {
        projectId: proj1.id,
        expenseDate: daysAgo(55),
        category: NckhExpenseCategory.TRAVEL,
        amount: BigInt(3_500_000),
        description: 'Công tác Hà Nội tham dự hội thảo khoa học quốc gia',
        status: NckhExpenseStatus.APPROVED,
        submittedById: proj1.principalInvestigatorId,
        approvedById: adminUser.id,
        approvedAt: daysAgo(50),
      },
      {
        projectId: proj1.id,
        expenseDate: daysAgo(40),
        category: NckhExpenseCategory.PRINTING,
        amount: BigInt(1_200_000),
        description: 'In ấn tài liệu thực nghiệm, biểu mẫu thu thập dữ liệu',
        status: NckhExpenseStatus.APPROVED,
        submittedById: proj1.principalInvestigatorId,
        approvedById: adminUser.id,
        approvedAt: daysAgo(35),
      },
      {
        projectId: proj1.id,
        expenseDate: daysAgo(10),
        category: NckhExpenseCategory.OTHER,
        amount: BigInt(5_000_000),
        description: 'Thuê chuyên gia ngoài đánh giá kết quả thực nghiệm giai đoạn 1',
        status: NckhExpenseStatus.SUBMITTED,
        submittedById: proj1.principalInvestigatorId,
      },
      {
        projectId: proj1.id,
        expenseDate: daysAgo(5),
        category: NckhExpenseCategory.EQUIPMENT,
        amount: BigInt(2_800_000),
        description: 'Mua vật tư tiêu hao, linh kiện thay thế',
        status: NckhExpenseStatus.DRAFT,
        submittedById: proj1.principalInvestigatorId,
      },
    ],
  })

  const grantNum = `GRANT-2025-${String(Date.now()).slice(-5)}`
  const grant = await db.nckhGrant.create({
    data: {
      projectId: proj1.id,
      grantNumber: grantNum,
      grantor: 'Quỹ Phát triển Khoa học và Công nghệ Quốc gia (NAFOSTED)',
      grantorType: 'DOMESTIC',
      amount: BigInt(150_000_000),
      currency: 'VND',
      startDate: daysAgo(120),
      endDate: daysFromNow(240),
      conditions: 'Báo cáo tiến độ 6 tháng/lần. Tối thiểu 2 công bố ISI trong thời gian thực hiện.',
      status: NckhGrantStatus.ACTIVE,
      reportDeadline: daysFromNow(60),
      createdById: proj1.principalInvestigatorId,
    },
  })

  await db.nckhGrantDisbursement.createMany({
    data: [
      {
        grantId: grant.id,
        disbursementDate: daysAgo(100),
        amount: BigInt(75_000_000),
        description: 'Đợt 1: 50% tổng kinh phí tài trợ',
      },
      {
        grantId: grant.id,
        disbursementDate: daysAgo(30),
        amount: BigInt(50_000_000),
        description: 'Đợt 2: sau khi nộp báo cáo tiến độ 6 tháng',
      },
    ],
  })
  console.log('  ✓ 2 PO, 2 Invoice, 4 Expense, 1 Grant (2 đợt giải ngân)')

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 9 — Chat
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('💬 9. NckhChatRoom + NckhChatMessage...')
  await db.nckhChatMessage.deleteMany({ where: { room: { projectId: proj0.id } } })
  await db.nckhChatParticipant.deleteMany({ where: { room: { projectId: proj0.id } } })
  await db.nckhChatRoom.deleteMany({ where: { projectId: proj0.id } })

  const chatRoom = await db.nckhChatRoom.create({
    data: {
      projectId: proj0.id,
      name: `Nhóm nghiên cứu ${proj0.projectCode}`,
      participants: {
        create: facultyUsers.slice(0, 4).map(u => ({
          userId: u.id,
          lastReadAt: new Date(),
        })),
      },
    },
  })

  const chatMessages = [
    { userId: facultyUsers[0].id, content: 'Mọi người đã xem qua bản tổng hợp dữ liệu Q2 chưa? Cần feedback trước 18h hôm nay.', createdAt: daysAgo(5) },
    { userId: facultyUsers[1].id, content: 'Rồi. Phần phân tích hồi quy ở mục 3.2 cần bổ sung thêm test Durbin-Watson để kiểm tra tương quan chuỗi.', createdAt: daysAgo(5) },
    { userId: facultyUsers[2].id, content: 'Đồng ý. Ngoài ra cần tăng cỡ mẫu thêm khoảng 80 đơn vị nữa mới đủ mức ý nghĩa 0.01.', createdAt: daysAgo(4) },
    { userId: facultyUsers[0].id, content: 'OK, mình sẽ liên hệ đơn vị K3 để bổ sung mẫu. Dự kiến xong trước 15/8. Anh Long kiểm tra lại model thứ 2 nhé.', createdAt: daysAgo(4) },
    { userId: facultyUsers[3].id, content: 'Đã check model 2 — converge bình thường, R²=0.87 là chấp nhận được với dữ liệu quân sự. Ghi chú vào phần giới hạn nghiên cứu.', createdAt: daysAgo(3) },
    { userId: facultyUsers[1].id, content: 'Tốt. Vậy deadline nộp draft báo cáo Q3 vẫn là 20/8 chứ?', createdAt: daysAgo(3) },
    { userId: facultyUsers[0].id, content: 'Đúng. Ai có câu hỏi gì thêm về phương pháp thì hỏi ngay tuần này, tuần sau mình bắt đầu viết kết quả rồi.', createdAt: daysAgo(2) },
    { userId: facultyUsers[2].id, content: 'Phần so sánh với nghiên cứu quốc tế — tìm được 2 bài 2024 trên Scopus rất phù hợp. Upload lên shared folder rồi nhé.', createdAt: daysAgo(1) },
  ]

  for (const msg of chatMessages) {
    await db.nckhChatMessage.create({
      data: {
        roomId: chatRoom.id,
        senderId: msg.userId,
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.createdAt,
      },
    })
  }
  console.log(`  ✓ 1 phòng chat, 4 thành viên, ${chatMessages.length} tin nhắn`)

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 10 — NckhCollaboration
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('🤝 10. NckhCollaboration...')
  await db.nckhCollaborationDocument.deleteMany({ where: { collaboration: { projectId: { in: [proj0.id, proj1.id] } } } })
  await db.nckhCollaborationParticipant.deleteMany({ where: { collaboration: { projectId: { in: [proj0.id, proj1.id] } } } })
  await db.nckhCollaboration.deleteMany({ where: { projectId: { in: [proj0.id, proj1.id] } } })

  await db.nckhCollaboration.create({
    data: {
      projectId: proj0.id,
      type: NckhCollaborationType.INTERNATIONAL,
      partnerName: 'Defense Technology Institute (DTI), Thailand',
      partnerCountry: 'Thái Lan',
      partnerUnit: 'Học viện Công nghệ Quốc phòng Thái Lan',
      agreementNumber: 'MOU-VN-TH-2025-003',
      startDate: daysAgo(90),
      endDate: daysFromNow(270),
      status: 'ACTIVE',
      notes: 'Hợp tác nghiên cứu ứng dụng AI trong huấn luyện quân sự. Trao đổi 2 nhà khoa học mỗi năm, tổ chức hội thảo chung hàng quý.',
      createdById: proj0.principalInvestigatorId,
      participants: {
        create: [
          { name: 'Assoc. Prof. Dr. Somchai Wongkiat', institution: 'DTI Thailand', role: 'Principal Researcher',  },
          { name: 'Dr. Apinya Thanakit', institution: 'DTI Thailand', role: 'Co-Researcher',  },
          { userId: facultyUsers[0].id, name: facultyUsers[0].name, institution: 'HVHC', role: 'PI phía Việt Nam',  },
          { userId: facultyUsers[1].id, name: facultyUsers[1].name, institution: 'HVHC', role: 'Thành viên nhóm',  },
        ],
      },
      documents: {
        create: [
          { title: 'Biên bản ghi nhớ hợp tác 2025', fileUrl: '/docs/mou-vn-th-2025.pdf', docType: 'MOU', uploadedById: proj0.principalInvestigatorId },
          { title: 'Kế hoạch triển khai hợp tác năm 2025', fileUrl: '/docs/plan-vn-th-2025.pdf', docType: 'PLAN', uploadedById: proj0.principalInvestigatorId },
          { title: 'Báo cáo kết quả trao đổi chuyên gia Q1', fileUrl: '/docs/exchange-report-q1.pdf', docType: 'REPORT', uploadedById: proj0.principalInvestigatorId },
        ],
      },
    },
  })

  await db.nckhCollaboration.create({
    data: {
      projectId: proj1.id,
      type: NckhCollaborationType.INTERNAL,
      partnerName: 'Học viện Kỹ thuật Quân sự (HVKTQS)',
      partnerCountry: 'Việt Nam',
      partnerUnit: 'Khoa Điện tử Viễn thông',
      agreementNumber: 'COLLAB-HVHC-HVKTQS-2025-001',
      startDate: daysAgo(60),
      endDate: daysFromNow(180),
      status: 'ACTIVE',
      notes: 'Phối hợp nghiên cứu và chia sẻ cơ sở hạ tầng thực nghiệm. HVKTQS cung cấp phòng lab đặc thù.',
      createdById: proj1.principalInvestigatorId,
      participants: {
        create: [
          { name: 'TS. Nguyễn Mạnh Cường', institution: 'HVKTQS', role: 'Trưởng nhóm đối tác',  },
          { userId: facultyUsers[2].id, name: facultyUsers[2].name, institution: 'HVHC', role: 'Điều phối viên',  },
        ],
      },
      documents: {
        create: [
          { title: 'Hợp đồng hợp tác nghiên cứu', fileUrl: '/docs/contract-hvhc-hvktqs.pdf', docType: 'CONTRACT', uploadedById: proj1.principalInvestigatorId },
          { title: 'Biên bản họp khởi động dự án', fileUrl: '/docs/kickoff-meeting.pdf', docType: 'MINUTES', uploadedById: proj1.principalInvestigatorId },
        ],
      },
    },
  })

  await db.nckhCollaboration.create({
    data: {
      projectId: proj0.id,
      type: NckhCollaborationType.EXTERNAL,
      partnerName: 'Tập đoàn Viettel – Trung tâm Nghiên cứu CNTT',
      partnerCountry: 'Việt Nam',
      partnerUnit: 'R&D Center',
      agreementNumber: 'COLLAB-HVHC-VTT-2025-002',
      startDate: daysAgo(30),
      endDate: daysFromNow(365),
      status: 'ACTIVE',
      notes: 'Viettel cung cấp dataset thực tế và cơ sở hạ tầng cloud. HVHC cung cấp mô hình AI và kết quả nghiên cứu.',
      createdById: proj0.principalInvestigatorId,
      participants: {
        create: [
          { name: 'ThS. Trần Đức Hiếu', institution: 'Viettel R&D', role: 'Technical Lead',  },
          { userId: facultyUsers[3].id, name: facultyUsers[3].name, institution: 'HVHC', role: 'Nhà nghiên cứu chính',  },
        ],
      },
    },
  })
  console.log('  ✓ 3 hợp tác (1 quốc tế, 1 nội bộ, 1 doanh nghiệp), 8 thành viên, 5 tài liệu')

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log('\n✅ seed_science_phase1_6.ts hoàn thành!\n')
  console.log('Tài khoản test (xem seed_demo_rbac_accounts.ts):')
  console.log('  giangvien@demo.hvhc.edu.vn  / Demo@2025  → PI đề tài')
  console.log('  giamdoc@demo.hvhc.edu.vn    / Demo@2025  → Phê duyệt')
  console.log('')
  console.log('URLs để test:')
  console.log('  /dashboard/science/activities/proposals     → Đề xuất')
  console.log('  /dashboard/science/activities/midterm       → Giữa kỳ')
  console.log('  /dashboard/science/activities/extensions    → Gia hạn')
  console.log('  /dashboard/science/activities/lessons       → Bài học kinh nghiệm')
  console.log('  /dashboard/science/finance                  → Tài chính tổng quan')
  console.log('  /dashboard/science/finance/purchase-orders → Đơn mua sắm')
  console.log('  /dashboard/science/finance/invoices        → Hóa đơn')
  console.log('  /dashboard/science/finance/expenses        → Chi tiêu')
  console.log('  /dashboard/science/finance/grants          → Tài trợ')
  console.log(`  /dashboard/science/projects/${proj0.id}`)
  console.log('    → Tab "Thảo luận" có 8 tin nhắn chat mẫu')
  console.log('  /dashboard/science/collaborations           → Hợp tác nghiên cứu')
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error('❌ Seed thất bại:', e.message)
    await db.$disconnect()
    process.exit(1)
  })
