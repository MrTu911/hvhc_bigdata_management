/**
 * GET   /api/science/collaborations/[id]
 * PATCH /api/science/collaborations/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import prisma from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

const COLLAB_DETAIL_SELECT = {
  id: true,
  projectId: true,
  type: true,
  partnerName: true,
  partnerCountry: true,
  partnerUnit: true,
  agreementNumber: true,
  startDate: true,
  endDate: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, projectCode: true, title: true } },
  createdBy: { select: { id: true, name: true } },
  participants: {
    select: {
      id: true, name: true, institution: true, role: true, createdAt: true,
      user: { select: { id: true, name: true, rank: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  documents: {
    select: { id: true, title: true, fileUrl: true, docType: true, createdAt: true, uploadedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
} as const

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const record = await prisma.nckhCollaboration.findUnique({ where: { id }, select: COLLAB_DETAIL_SELECT })
  if (!record) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy hợp tác' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: record, error: null })
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const existing = await prisma.nckhCollaboration.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ success: false, data: null, error: 'Không tìm thấy hợp tác' }, { status: 404 })
  }

  const body = await req.json()
  const { partnerName, partnerCountry, partnerUnit, agreementNumber, startDate, endDate, status, notes } = body

  if (status && !['ACTIVE', 'COMPLETED', 'TERMINATED'].includes(status)) {
    return NextResponse.json(
      { success: false, data: null, error: 'status phải là ACTIVE | COMPLETED | TERMINATED' },
      { status: 400 }
    )
  }

  const updated = await prisma.nckhCollaboration.update({
    where: { id },
    data: {
      ...(partnerName     !== undefined ? { partnerName } : {}),
      ...(partnerCountry  !== undefined ? { partnerCountry } : {}),
      ...(partnerUnit     !== undefined ? { partnerUnit } : {}),
      ...(agreementNumber !== undefined ? { agreementNumber } : {}),
      ...(startDate       !== undefined ? { startDate: new Date(startDate) } : {}),
      ...(endDate         !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      ...(status          !== undefined ? { status } : {}),
      ...(notes           !== undefined ? { notes } : {}),
    },
    select: COLLAB_DETAIL_SELECT,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'UPDATE',
    resourceType: 'NckhCollaboration',
    resourceId: id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: updated, error: null })
}
