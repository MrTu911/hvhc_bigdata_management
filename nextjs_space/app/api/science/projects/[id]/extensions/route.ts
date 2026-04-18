import { NextRequest, NextResponse } from 'next/server'
import { requireAnyFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { lifecycleService } from '@/lib/services/science/lifecycle.service'
import { logAudit } from '@/lib/audit'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/science/projects/[id]/extensions — danh sách yêu cầu gia hạn
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [
    SCIENCE.PROJECT_CREATE,
    SCIENCE.PROJECT_APPROVE_DEPT,
    SCIENCE.PROJECT_APPROVE_ACADEMY,
  ])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const extensions = await lifecycleService.listExtensions(id)
  return NextResponse.json({ success: true, data: extensions, error: null })
}

// POST /api/science/projects/[id]/extensions — tạo yêu cầu gia hạn
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAnyFunction(req, [SCIENCE.PROJECT_CREATE])
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const body = await req.json()
  const { originalEndDate, requestedEndDate, extensionMonths, reason } = body

  if (!originalEndDate || !requestedEndDate || !extensionMonths || !reason) {
    return NextResponse.json(
      { success: false, data: null, error: 'originalEndDate, requestedEndDate, extensionMonths, reason là bắt buộc' },
      { status: 400 }
    )
  }

  try {
    const extension = await lifecycleService.createExtension({
      projectId: id,
      originalEndDate: new Date(originalEndDate),
      requestedEndDate: new Date(requestedEndDate),
      extensionMonths: Number(extensionMonths),
      reason,
      requestedById: auth.user!.id,
    })

    await logAudit({
      userId: auth.user!.id,
      functionCode: SCIENCE.PROJECT_CREATE,
      action: 'CREATE',
      resourceType: 'NckhExtension',
      resourceId: extension.id,
      result: 'SUCCESS',
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: extension, error: null }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    return NextResponse.json({ success: false, data: null, error: message }, { status: 400 })
  }
}
