/**
 * GET  /api/science/collaborations?projectId=&type=&status=&page=&pageSize=
 * POST /api/science/collaborations
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import prisma from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

const COLLAB_SELECT = {
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
  _count: { select: { participants: true, documents: true } },
} as const

export async function GET(req: NextRequest) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { searchParams } = req.nextUrl
  const projectId = searchParams.get('projectId')
  const type      = searchParams.get('type')
  const status    = searchParams.get('status')
  const page      = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize  = Math.min(50, Math.max(5, Number(searchParams.get('pageSize') ?? 20)))
  const skip      = (page - 1) * pageSize

  const where = {
    ...(projectId ? { projectId } : {}),
    ...(type      ? { type: type as any } : {}),
    ...(status    ? { status } : {}),
  }

  const [items, total] = await Promise.all([
    prisma.nckhCollaboration.findMany({ where, select: COLLAB_SELECT, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
    prisma.nckhCollaboration.count({ where }),
  ])

  return NextResponse.json({ success: true, data: { items, total, page, pageSize }, error: null })
}

export async function POST(req: NextRequest) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
  ])
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const { projectId, type, partnerName, partnerCountry, partnerUnit, agreementNumber, startDate, endDate, notes } = body

  if (!projectId || !type || !partnerName || !startDate) {
    return NextResponse.json(
      { success: false, data: null, error: 'projectId, type, partnerName và startDate là bắt buộc' },
      { status: 400 }
    )
  }
  if (!['INTERNAL', 'EXTERNAL', 'INTERNATIONAL'].includes(type)) {
    return NextResponse.json(
      { success: false, data: null, error: 'type phải là INTERNAL | EXTERNAL | INTERNATIONAL' },
      { status: 400 }
    )
  }

  const project = await prisma.nckhProject.findUnique({ where: { id: projectId }, select: { id: true } })
  if (!project) {
    return NextResponse.json({ success: false, data: null, error: 'Đề tài không tồn tại' }, { status: 404 })
  }

  const record = await prisma.nckhCollaboration.create({
    data: {
      projectId,
      type,
      partnerName,
      partnerCountry: partnerCountry ?? null,
      partnerUnit: partnerUnit ?? null,
      agreementNumber: agreementNumber ?? null,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes ?? null,
      createdById: auth.user!.id,
    },
    select: COLLAB_SELECT,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'CREATE',
    resourceType: 'NckhCollaboration',
    resourceId: record.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: record, error: null }, { status: 201 })
}
