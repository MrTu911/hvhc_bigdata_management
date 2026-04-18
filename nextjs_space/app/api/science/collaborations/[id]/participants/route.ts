/**
 * GET  /api/science/collaborations/[id]/participants
 * POST /api/science/collaborations/[id]/participants
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import prisma from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id: collaborationId } = await params

  const items = await prisma.nckhCollaborationParticipant.findMany({
    where: { collaborationId },
    select: {
      id: true, name: true, institution: true, role: true, createdAt: true,
      user: { select: { id: true, name: true, rank: true, militaryId: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ success: true, data: items, error: null })
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
  ])
  if (!auth.allowed) return auth.response!

  const { id: collaborationId } = await params

  const collab = await prisma.nckhCollaboration.findUnique({ where: { id: collaborationId }, select: { id: true } })
  if (!collab) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy hợp tác' }, { status: 404 })
  }

  const body = await req.json()
  const { name, userId, institution, role } = body

  if (!name?.trim()) {
    return NextResponse.json({ success: false, data: null, error: 'Tên thành viên là bắt buộc' }, { status: 400 })
  }

  const record = await prisma.nckhCollaborationParticipant.create({
    data: {
      collaborationId,
      name: name.trim(),
      userId: userId ?? null,
      institution: institution?.trim() ?? null,
      role: role?.trim() ?? null,
    },
    select: {
      id: true, name: true, institution: true, role: true, createdAt: true,
      user: { select: { id: true, name: true, rank: true } },
    },
  })

  return NextResponse.json({ success: true, data: record, error: null }, { status: 201 })
}
