import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

const CRITERIA_LABELS: Record<string, string> = {
  SCIENTIFIC_VALUE: 'Giá trị khoa học',
  FEASIBILITY: 'Tính khả thi',
  BUDGET: 'Kinh phí',
  TEAM: 'Nhân lực',
  OUTCOME: 'Sản phẩm đầu ra',
}

// GET /api/research/councils/[id]/reviews — phiếu chấm điểm theo tiêu chí
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const reviews = await db.scientificCouncilReview.findMany({
      where: { councilId: params.id },
      orderBy: [{ memberId: 'asc' }, { criteria: 'asc' }],
    })

    // Nhóm theo thành viên và tính điểm trung bình từng tiêu chí
    const memberMap: Record<string, Record<string, { score: number; comment?: string | null }>> = {}
    for (const r of reviews) {
      if (!memberMap[r.memberId]) memberMap[r.memberId] = {}
      memberMap[r.memberId][r.criteria] = { score: r.score, comment: r.comment }
    }

    // Điểm trung bình toàn hội đồng theo từng tiêu chí
    const criteriaAvg: Record<string, number> = {}
    const criteriaList = ['SCIENTIFIC_VALUE', 'FEASIBILITY', 'BUDGET', 'TEAM', 'OUTCOME']
    for (const c of criteriaList) {
      const scores = reviews.filter((r) => r.criteria === c).map((r) => r.score)
      criteriaAvg[c] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    }

    const overallAvg =
      Object.values(criteriaAvg).length
        ? Object.values(criteriaAvg).reduce((a, b) => a + b, 0) / Object.values(criteriaAvg).length
        : 0

    return NextResponse.json({
      success: true,
      data: {
        reviews,
        criteriaAvg: criteriaList.map((c) => ({
          criteria: c,
          label: CRITERIA_LABELS[c],
          avg: Math.round(criteriaAvg[c] * 100) / 100,
        })),
        overallAvg: Math.round(overallAvg * 100) / 100,
      },
    })
  } catch (err) {
    console.error('[research/councils/[id]/reviews GET]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải phiếu chấm điểm' }, { status: 500 })
  }
}

// POST /api/research/councils/[id]/reviews — nộp/cập nhật phiếu chấm
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.EVALUATE)
  if (!auth.allowed) return auth.response!

  try {
    const body = await req.json()
    const { memberId, scores } = body
    // scores: Array<{ criteria: string; score: number; comment?: string }>

    if (!memberId || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json({ success: false, error: 'Thiếu memberId hoặc danh sách điểm' }, { status: 400 })
    }

    // Upsert từng tiêu chí
    const upsertOps = scores.map((s: { criteria: string; score: number; comment?: string }) =>
      db.scientificCouncilReview.upsert({
        where: {
          // councilId + memberId + criteria là unique
          // Prisma không tự sinh compound unique filter nên dùng findFirst + create/update
          id: '', // workaround: dùng createMany với skipDuplicates bên dưới
        },
        update: { score: s.score, comment: s.comment ?? null },
        create: {
          councilId: params.id,
          memberId,
          criteria: s.criteria,
          score: s.score,
          comment: s.comment ?? null,
        },
      }),
    )

    // Vì Prisma ScientificCouncilReview chưa có compound unique trên (councilId, memberId, criteria),
    // dùng deleteMany + createMany thay thế
    await db.scientificCouncilReview.deleteMany({
      where: { councilId: params.id, memberId },
    })
    await db.scientificCouncilReview.createMany({
      data: scores.map((s: { criteria: string; score: number; comment?: string }) => ({
        councilId: params.id,
        memberId,
        criteria: s.criteria,
        score: s.score,
        comment: s.comment ?? null,
      })),
    })

    // Cập nhật overallScore trên hội đồng sau khi có điểm mới
    const allReviews = await db.scientificCouncilReview.findMany({
      where: { councilId: params.id },
    })
    const overallAvg =
      allReviews.length
        ? allReviews.reduce((sum, r) => sum + r.score, 0) / allReviews.length
        : null

    if (overallAvg !== null) {
      await db.scientificCouncil.update({
        where: { id: params.id },
        data: { overallScore: Math.round(overallAvg * 100) / 100 },
      })
    }

    return NextResponse.json({ success: true, message: 'Nộp phiếu chấm thành công' })
  } catch (err) {
    console.error('[research/councils/[id]/reviews POST]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi nộp phiếu chấm' }, { status: 500 })
  }
}
