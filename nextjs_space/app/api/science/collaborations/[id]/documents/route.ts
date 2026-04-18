/**
 * GET  /api/science/collaborations/[id]/documents
 * POST /api/science/collaborations/[id]/documents
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import prisma from '@/lib/db'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams { params: Promise<{ id: string }> }

const DOC_TYPES = ['AGREEMENT', 'REPORT', 'CORRESPONDENCE', 'OTHER'] as const

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id: collaborationId } = await params

  const items = await prisma.nckhCollaborationDocument.findMany({
    where: { collaborationId },
    select: {
      id: true, title: true, fileUrl: true, docType: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
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
  const { title, fileUrl, docType } = body

  if (!title?.trim() || !fileUrl?.trim()) {
    return NextResponse.json({ success: false, data: null, error: 'title và fileUrl là bắt buộc' }, { status: 400 })
  }
  const resolvedDocType = DOC_TYPES.includes(docType) ? docType : 'OTHER'

  const record = await prisma.nckhCollaborationDocument.create({
    data: {
      collaborationId,
      title: title.trim(),
      fileUrl: fileUrl.trim(),
      docType: resolvedDocType,
      uploadedById: auth.user!.id,
    },
    select: {
      id: true, title: true, fileUrl: true, docType: true, createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: SCIENCE.PROJECT_CREATE,
    action: 'CREATE',
    resourceType: 'NckhCollaborationDocument',
    resourceId: record.id,
    result: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ success: true, data: record, error: null }, { status: 201 })
}
