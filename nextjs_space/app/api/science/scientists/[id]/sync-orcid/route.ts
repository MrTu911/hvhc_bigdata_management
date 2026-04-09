/**
 * POST /api/science/scientists/:id/sync-orcid
 * Enqueue ORCID sync job cho nhà khoa học.
 *
 * Worker (chạy riêng) sẽ:
 *   1. Gọi ORCID Public API v3.0 với orcidId của profile
 *   2. Cập nhật totalPublications, totalCitations, hIndex, i10Index
 *   3. Import publications mới (nếu Phase 3 đã sẵn sàng)
 *
 * RBAC: SCIENCE.SCIENTIST_SYNC_ORCID
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { scientistRepo } from '@/lib/repositories/science/scientist.repo'
import { enqueueOrcidSync } from '@/lib/queue/science-queue'
import { logAudit } from '@/lib/audit'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await requireFunction(req, SCIENCE.SCIENTIST_SYNC_ORCID)
  if (!auth.allowed) return auth.response!

  const { id } = await params
  const profile = await scientistRepo.findById(id)

  if (!profile) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy hồ sơ nhà khoa học' }, { status: 404 })
  }

  if (!profile.orcidId) {
    return NextResponse.json(
      { success: false, error: 'Hồ sơ chưa có ORCID ID. Cập nhật orcidId trước khi sync.' },
      { status: 422 }
    )
  }

  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  const jobId = await enqueueOrcidSync({
    jobType: 'ORCID_SYNC',
    scientistProfileId: id,
    orcidId: profile.orcidId,
    requestedByUserId: auth.user!.id,
  })

  await logAudit({
    userId: auth.user!.id,
    functionCode: 'SYNC_ORCID',
    action: 'CREATE',
    resourceType: 'SCIENTIST_PROFILE',
    resourceId: id,
    result: 'SUCCESS',
    ipAddress,
    metadata: { jobId, orcidId: profile.orcidId },
  })

  return NextResponse.json({
    success: true,
    data: {
      jobId,
      orcidId: profile.orcidId,
      message: 'ORCID sync job đã được thêm vào hàng đợi',
    },
  })
}
