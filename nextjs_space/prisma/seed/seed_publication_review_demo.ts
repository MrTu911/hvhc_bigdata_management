/**
 * Seed: Dữ liệu mẫu cho luồng tự đăng & duyệt công bố khoa học
 *
 * Chạy: npx tsx --env-file=.env prisma/seed/seed_publication_review_demo.ts
 *
 * Tạo:
 * 1. Function codes: SUBMIT_MY_PUBLICATION, REVIEW_RESEARCH_PUB
 * 2. PositionFunction: gán quyền cho GIANG_VIEN, NGHIEN_CUU_VIEN → SUBMIT
 *                      TRUONG_PHONG_KHOA_HOC → REVIEW
 * 3. UserPosition: Nguyễn Văn A → GIANG_VIEN; Admin → TRUONG_PHONG_KHOA_HOC
 * 4. NckhPublication mẫu: DRAFT, SUBMITTED, PUBLISHED, REJECTED
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── IDs từ DB hiện có ───────────────────────────────────────────────────────

const POSITION_GIANG_VIEN        = 'cmmuk8n8v000a8igbxcpmtq87'
const POSITION_GIANG_VIEN_CHINH  = 'cmmuk8n8t00098igb0htefqga'
const POSITION_NGHIEN_CUU_VIEN   = 'cmmuk8n8y000c8igb5tv2yssc'
const POSITION_TRUONG_PHONG_KH   = 'cmo3ts1uw004u8i9sy4y37r3g'

// user giảng viên test
const USER_GV_A    = 'cmmuk9qw300018i46dsj56wjr' // Nguyễn Văn A
const USER_GV_B    = 'cmmuk9r14008f8i46tnzjqnaj' // Bùi Huy Hoàng
// user phòng KH (dùng admin cho demo)
const USER_ADMIN   = 'cmmuk9py600ae8i27ciojecph' // Nguyễn Đức Tú

const UNIT_GV_A    = 'cmn6x5g5i00298infqpfrh9pn'
const UNIT_ADMIN   = 'cmmuk87n100018i5tcde3ln6w'

// ─── Step 1: Tạo Function codes ───────────────────────────────────────────────

async function upsertFunctions() {
  console.log('1. Tạo/cập nhật function codes...')

  const fnSubmit = await prisma.function.upsert({
    where: { code: 'SUBMIT_MY_PUBLICATION' },
    create: {
      code: 'SUBMIT_MY_PUBLICATION',
      name: 'Tự đăng công bố khoa học (nộp duyệt)',
      module: 'PERSONAL',
      actionType: 'SUBMIT',
      isActive: true,
      isCritical: false,
    },
    update: { isActive: true },
  })

  const fnReview = await prisma.function.upsert({
    where: { code: 'REVIEW_RESEARCH_PUB' },
    create: {
      code: 'REVIEW_RESEARCH_PUB',
      name: 'Duyệt / từ chối công bố khoa học cá nhân',
      module: 'RESEARCH',
      actionType: 'APPROVE',
      isActive: true,
      isCritical: false,
    },
    update: { isActive: true },
  })

  // VIEW_MY_PUBLICATIONS đã có id: cmo6o2p98000b8ihybe8jz95m
  const fnView = await prisma.function.findUnique({ where: { code: 'VIEW_MY_PUBLICATIONS' } })

  console.log(`   ✓ SUBMIT_MY_PUBLICATION: ${fnSubmit.id}`)
  console.log(`   ✓ REVIEW_RESEARCH_PUB:   ${fnReview.id}`)
  console.log(`   ✓ VIEW_MY_PUBLICATIONS:  ${fnView?.id ?? 'not found'}`)

  return { fnSubmit, fnReview, fnView }
}

// ─── Step 2: Gán Function vào Position ───────────────────────────────────────

async function upsertPositionFunctions(fnSubmitId: string, fnReviewId: string, fnViewId?: string) {
  console.log('2. Gán quyền vào Position...')

  const submitPositions = [POSITION_GIANG_VIEN, POSITION_GIANG_VIEN_CHINH, POSITION_NGHIEN_CUU_VIEN]

  for (const posId of submitPositions) {
    const existing = await prisma.positionFunction.findFirst({
      where: { positionId: posId, functionId: fnSubmitId },
    })
    if (!existing) {
      await prisma.positionFunction.create({
        data: { positionId: posId, functionId: fnSubmitId, scope: 'SELF', isActive: true },
      })
    }
    // VIEW_MY_PUBLICATIONS
    if (fnViewId) {
      const existingView = await prisma.positionFunction.findFirst({
        where: { positionId: posId, functionId: fnViewId },
      })
      if (!existingView) {
        await prisma.positionFunction.create({
          data: { positionId: posId, functionId: fnViewId, scope: 'SELF', isActive: true },
        })
      }
    }
  }
  console.log(`   ✓ SUBMIT_MY_PUBLICATION → GIANG_VIEN, GIANG_VIEN_CHINH, NGHIEN_CUU_VIEN`)

  // REVIEW → TRUONG_PHONG_KHOA_HOC
  const existingReview = await prisma.positionFunction.findFirst({
    where: { positionId: POSITION_TRUONG_PHONG_KH, functionId: fnReviewId },
  })
  if (!existingReview) {
    await prisma.positionFunction.create({
      data: { positionId: POSITION_TRUONG_PHONG_KH, functionId: fnReviewId, scope: 'ACADEMY', isActive: true },
    })
  }
  console.log(`   ✓ REVIEW_RESEARCH_PUB   → TRUONG_PHONG_KHOA_HOC`)
}

// ─── Step 3: Gán UserPosition ─────────────────────────────────────────────────

async function upsertUserPositions() {
  console.log('3. Gán UserPosition...')

  // Nguyễn Văn A → GIANG_VIEN
  const existingA = await prisma.userPosition.findFirst({
    where: { userId: USER_GV_A, positionId: POSITION_GIANG_VIEN, isActive: true },
  })
  if (!existingA) {
    await prisma.userPosition.create({
      data: {
        userId: USER_GV_A,
        positionId: POSITION_GIANG_VIEN,
        unitId: UNIT_GV_A,
        startDate: new Date('2020-01-01'),
        isPrimary: true,
        isActive: true,
      },
    })
    console.log('   ✓ Nguyễn Văn A → GIANG_VIEN')
  } else {
    console.log('   (skip) Nguyễn Văn A → GIANG_VIEN đã có')
  }

  // Bùi Huy Hoàng → NGHIEN_CUU_VIEN
  const existingB = await prisma.userPosition.findFirst({
    where: { userId: USER_GV_B, positionId: POSITION_NGHIEN_CUU_VIEN, isActive: true },
  })
  if (!existingB) {
    const unitB = await prisma.user.findUnique({ where: { id: USER_GV_B }, select: { unitId: true } })
    await prisma.userPosition.create({
      data: {
        userId: USER_GV_B,
        positionId: POSITION_NGHIEN_CUU_VIEN,
        unitId: unitB?.unitId ?? UNIT_GV_A,
        startDate: new Date('2020-01-01'),
        isPrimary: true,
        isActive: true,
      },
    })
    console.log('   ✓ Bùi Huy Hoàng → NGHIEN_CUU_VIEN')
  } else {
    console.log('   (skip) Bùi Huy Hoàng → NGHIEN_CUU_VIEN đã có')
  }

  // Admin → TRUONG_PHONG_KHOA_HOC (để test review)
  const existingAdmin = await prisma.userPosition.findFirst({
    where: { userId: USER_ADMIN, positionId: POSITION_TRUONG_PHONG_KH, isActive: true },
  })
  if (!existingAdmin) {
    await prisma.userPosition.create({
      data: {
        userId: USER_ADMIN,
        positionId: POSITION_TRUONG_PHONG_KH,
        unitId: UNIT_ADMIN,
        startDate: new Date('2020-01-01'),
        isPrimary: false,
        isActive: true,
      },
    })
    console.log('   ✓ Nguyễn Đức Tú (admin) → TRUONG_PHONG_KHOA_HOC')
  } else {
    console.log('   (skip) Admin → TRUONG_PHONG_KHOA_HOC đã có')
  }
}

// ─── Step 4: Tạo NckhPublication mẫu ─────────────────────────────────────────

async function seedPublications() {
  console.log('4. Tạo NckhPublication mẫu...')

  const samples = [
    {
      title: '[DEMO] Ứng dụng AI trong huấn luyện quân sự: Phân tích thực nghiệm tại HVHC',
      pubType: 'BAI_BAO_QUOC_TE' as const,
      publishedYear: 2024,
      journal: 'Journal of Military Science and Technology',
      doi: '10.1234/jmst.2024.001',
      impactFactor: 2.1,
      isISI: true,
      isScopus: true,
      scopusQ: 'Q2',
      status: 'DRAFT' as const,
      authorsText: 'Nguyễn Văn A, Bùi Huy Hoàng',
      abstract: 'Bài báo trình bày kết quả ứng dụng mô hình AI trong hỗ trợ huấn luyện tại học viện. Nghiên cứu thực nghiệm trên 200 học viên cho thấy hiệu quả cải thiện đáng kể.',
      userId: USER_GV_A,
      authorName: 'Nguyễn Văn A',
    },
    {
      title: '[DEMO] Phương pháp đánh giá năng lực chỉ huy trong môi trường tác chiến điện tử',
      pubType: 'BAI_BAO_TRONG_NUOC' as const,
      publishedYear: 2024,
      journal: 'Tạp chí Khoa học Quân sự',
      doi: null,
      impactFactor: null,
      isISI: false,
      isScopus: false,
      scopusQ: null,
      status: 'SUBMITTED' as const,
      authorsText: 'Nguyễn Văn A',
      abstract: 'Nghiên cứu đề xuất phương pháp mới đánh giá năng lực chỉ huy trong điều kiện tác chiến điện tử hiện đại.',
      userId: USER_GV_A,
      authorName: 'Nguyễn Văn A',
    },
    {
      title: '[DEMO] Giáo trình Công nghệ thông tin ứng dụng trong quản lý hậu cần quân đội',
      pubType: 'GIAO_TRINH' as const,
      publishedYear: 2023,
      journal: 'NXB Quân đội nhân dân',
      doi: null,
      impactFactor: null,
      isISI: false,
      isScopus: false,
      scopusQ: null,
      status: 'PUBLISHED' as const,
      authorsText: 'Nguyễn Văn A, Lê Thành Long',
      abstract: 'Giáo trình dùng cho chương trình đào tạo đại học ngành Hậu cần Quân đội, biên soạn theo khung chương trình mới.',
      userId: USER_GV_A,
      authorName: 'Nguyễn Văn A',
    },
    {
      title: '[DEMO] Mô hình dự báo nhu cầu hậu cần sử dụng học máy — thử nghiệm tại đơn vị cấp sư đoàn',
      pubType: 'BAI_BAO_QUOC_TE' as const,
      publishedYear: 2024,
      journal: 'Defence Technology',
      doi: '10.1016/j.dt.2024.05.012',
      impactFactor: 3.4,
      isISI: true,
      isScopus: true,
      scopusQ: 'Q1',
      status: 'REJECTED' as const,
      authorsText: 'Bùi Huy Hoàng, Nguyễn Văn A',
      abstract: 'Đề xuất mô hình ML dự báo nhu cầu hậu cần với độ chính xác 94.2% trên tập dữ liệu thực nghiệm.',
      userId: USER_GV_B,
      authorName: 'Bùi Huy Hoàng',
      reviewNote: 'Cần bổ sung mô tả bộ dữ liệu huấn luyện và làm rõ phương pháp đánh giá chéo. Vui lòng chỉnh sửa và nộp lại.',
    },
    {
      title: '[DEMO] Sáng kiến cải tiến quy trình nhập kho vật tư kỹ thuật số hóa',
      pubType: 'SANG_KIEN' as const,
      publishedYear: 2023,
      journal: null,
      doi: null,
      impactFactor: null,
      isISI: false,
      isScopus: false,
      scopusQ: null,
      status: 'DRAFT' as const,
      authorsText: 'Bùi Huy Hoàng',
      abstract: 'Sáng kiến đề xuất quy trình số hóa nhập kho vật tư, giảm 40% thời gian xử lý so với phương pháp truyền thống.',
      userId: USER_GV_B,
      authorName: 'Bùi Huy Hoàng',
    },
  ]

  let created = 0
  for (const s of samples) {
    // Skip nếu đã có demo pub với tiêu đề này
    const existing = await prisma.nckhPublication.findFirst({
      where: { title: s.title },
    })
    if (existing) {
      console.log(`   (skip) Đã có: ${s.title.substring(0, 50)}...`)
      continue
    }

    const pub = await prisma.nckhPublication.create({
      data: {
        title: s.title,
        pubType: s.pubType,
        publishedYear: s.publishedYear,
        journal: s.journal,
        doi: s.doi,
        impactFactor: s.impactFactor,
        isISI: s.isISI,
        isScopus: s.isScopus,
        scopusQ: s.scopusQ,
        authorsText: s.authorsText,
        abstract: s.abstract,
        status: s.status,
        authorId: s.userId,
        unitId: s.userId === USER_GV_A ? UNIT_GV_A : undefined,
        citationCount: 0,
        keywords: [],
        submittedAt: s.status === 'SUBMITTED' || s.status === 'PUBLISHED' || s.status === 'REJECTED'
          ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          : null,
        reviewNote: s.reviewNote ?? null,
        reviewedAt: s.status === 'PUBLISHED' || s.status === 'REJECTED'
          ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          : null,
        reviewedById: s.status === 'PUBLISHED' || s.status === 'REJECTED'
          ? USER_ADMIN
          : null,
      },
    })

    // Tạo NckhPublicationAuthor
    await prisma.nckhPublicationAuthor.create({
      data: {
        publicationId: pub.id,
        userId: s.userId,
        authorName: s.authorName,
        authorOrder: 1,
        isInternal: true,
      },
    })

    console.log(`   ✓ [${s.status.padEnd(9)}] ${s.title.substring(0, 60)}...`)
    created++
  }

  console.log(`   → Đã tạo ${created} công bố mới`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Seed: Publication Review Demo ===\n')

  const { fnSubmit, fnReview, fnView } = await upsertFunctions()
  await upsertPositionFunctions(fnSubmit.id, fnReview.id, fnView?.id)
  await upsertUserPositions()
  await seedPublications()

  console.log('\n=== Hoàn thành ===')
  console.log('\nTài khoản test:')
  console.log('  Giảng viên  : son.pt@hvhc.edu.vn     (Nguyễn Văn A   — có SUBMIT_MY_PUBLICATION)')
  console.log('  Nghiên cứu  : hoang.bh@hvhc.edu.vn   (Bùi Huy Hoàng  — có SUBMIT_MY_PUBLICATION)')
  console.log('  Phòng KH    : admin@hvhc.edu.vn       (Nguyễn Đức Tú  — có REVIEW_RESEARCH_PUB)')
  console.log('\nDữ liệu mẫu (tiêu đề có prefix [DEMO]):')
  console.log('  DRAFT     × 2  — Nguyễn Văn A, Bùi Huy Hoàng')
  console.log('  SUBMITTED × 1  — Nguyễn Văn A (có thể duyệt/từ chối)')
  console.log('  PUBLISHED × 1  — Nguyễn Văn A (đã duyệt)')
  console.log('  REJECTED  × 1  — Bùi Huy Hoàng (có reviewNote)')
}

main().catch(console.error).finally(() => prisma.$disconnect())
