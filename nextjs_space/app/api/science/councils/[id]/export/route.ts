/**
 * POST /api/science/councils/:id/export
 * Xuất biên bản hội đồng khoa học qua M18 export engine.
 *
 * Body: { templateId: string; outputFormat: 'PDF' | 'DOCX' | 'XLSX' }
 * Nếu không có templateId, trả về structured JSON summary để UI render.
 *
 * RBAC: SCIENCE.COUNCIL_FINALIZE (chairman / admin)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { exportSingle } from '@/lib/services/export-engine-service'
import { resolveEntityData } from '@/lib/services/data-resolver-service'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

const exportBodySchema = z.object({
  templateId:   z.string().cuid().optional(),
  outputFormat: z.enum(['PDF', 'DOCX', 'XLSX']).default('DOCX'),
})

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.COUNCIL_FINALIZE)
  if (!auth.allowed) return auth.response!

  const { id } = await params

  // Kiểm tra hội đồng tồn tại và đã có kết luận
  const council = await prisma.scientificCouncil.findUnique({
    where: { id },
    select: { id: true, result: true, type: true, projectId: true },
  })
  if (!council) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hội đồng' }, { status: 404 })
  }
  if (!council.result) {
    return NextResponse.json(
      { success: false, error: 'Hội đồng chưa có kết luận — không thể xuất biên bản' },
      { status: 422 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const parsed = exportBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { templateId, outputFormat } = parsed.data
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  // ── Nhánh A: có templateId → dùng M18 export engine đầy đủ ──────────────────
  if (templateId) {
    try {
      const result = await exportSingle({
        templateId,
        entityId:   id,
        entityType: 'scientific_council',
        outputFormat,
        requestedBy: auth.user!.id,
        callerType:  'science_council',
      })

      await logAudit({
        userId:        auth.user!.id,
        functionCode:  'FINALIZE_ACCEPTANCE',
        action:        'EXPORT',
        resourceType:  'SCIENTIFIC_COUNCIL',
        resourceId:    id,
        result:        'SUCCESS',
        ipAddress,
        metadata:      { templateId, outputFormat, jobId: result.jobId },
      })

      return NextResponse.json({
        success: true,
        data: {
          jobId:       result.jobId,
          downloadUrl: result.downloadUrl,
          expiresIn:   result.expiresIn,
        },
        error: null,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi xuất file'
      await logAudit({
        userId:       auth.user!.id,
        functionCode: 'FINALIZE_ACCEPTANCE',
        action:       'EXPORT',
        resourceType: 'SCIENTIFIC_COUNCIL',
        resourceId:   id,
        result:       'FAIL',
        ipAddress,
        metadata:     { templateId, outputFormat, error: msg },
      })
      return NextResponse.json({ success: false, error: msg }, { status: 500 })
    }
  }

  // ── Nhánh B: không có templateId → trả JSON summary (light export) ──────────
  try {
    const summaryData = await resolveEntityData({
      entityId:   id,
      entityType: 'scientific_council',
      dataMap:    {},
      requestedBy: auth.user!.id,
    })

    await logAudit({
      userId:       auth.user!.id,
      functionCode: 'FINALIZE_ACCEPTANCE',
      action:       'EXPORT',
      resourceType: 'SCIENTIFIC_COUNCIL',
      resourceId:   id,
      result:       'SUCCESS',
      ipAddress,
      metadata:     { mode: 'json_summary' },
    })

    return NextResponse.json({
      success:  true,
      data:     summaryData,
      meta:     { mode: 'json_summary', note: 'Chưa có template — trả JSON để UI tự render' },
      error:    null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi tổng hợp dữ liệu'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
