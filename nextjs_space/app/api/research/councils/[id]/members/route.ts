import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// GET /api/research/councils/[id]/members
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const members = await db.scientificCouncilMember.findMany({
      where: { councilId: params.id },
      include: {
        user: { select: { id: true, name: true } },
        scientist: {
          select: { id: true, primaryField: true, hIndex: true, degree: true, academicRank: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: members })
  } catch (err) {
    console.error('[research/councils/[id]/members GET]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi tải danh sách thành viên' }, { status: 500 })
  }
}

// POST /api/research/councils/[id]/members — thêm thành viên
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  try {
    const body = await req.json()
    const { userId, role, scientistId } = body

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'userId và role là bắt buộc' }, { status: 400 })
    }
    if (!['CHAIRMAN', 'SECRETARY', 'REVIEWER', 'EXPERT'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Vai trò không hợp lệ' }, { status: 400 })
    }

    const existing = await db.scientificCouncilMember.findFirst({
      where: { councilId: params.id, userId },
    })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Thành viên đã có trong hội đồng' }, { status: 409 })
    }

    const member = await db.scientificCouncilMember.create({
      data: { councilId: params.id, userId, role, scientistId: scientistId ?? null },
      include: {
        user: { select: { id: true, name: true } },
        scientist: { select: { id: true, primaryField: true, hIndex: true, degree: true } },
      },
    })

    return NextResponse.json({ success: true, data: member, message: 'Thêm thành viên thành công' }, { status: 201 })
  } catch (err) {
    console.error('[research/councils/[id]/members POST]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi thêm thành viên' }, { status: 500 })
  }
}

// DELETE /api/research/councils/[id]/members?memberId=xxx
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireFunction(req, RESEARCH.APPROVE)
  if (!auth.allowed) return auth.response!

  try {
    const memberId = new URL(req.url).searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ success: false, error: 'Thiếu memberId' }, { status: 400 })

    await db.scientificCouncilMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true, message: 'Xóa thành viên thành công' })
  } catch (err) {
    console.error('[research/councils/[id]/members DELETE]', err)
    return NextResponse.json({ success: false, error: 'Lỗi khi xóa thành viên' }, { status: 500 })
  }
}
