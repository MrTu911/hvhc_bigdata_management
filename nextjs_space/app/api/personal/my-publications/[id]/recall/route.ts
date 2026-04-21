/**
 * POST /api/personal/my-publications/[id]/recall
 *   → Rút lại công bố đang chờ duyệt: SUBMITTED → DRAFT
 *   → Chỉ chủ sở hữu, chỉ khi status = SUBMITTED
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/rbac/middleware'
import prisma from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth(req)
  if (!authResult.allowed) return authResult.response!
  const user = authResult.user!

  const pub = await prisma.nckhPublication.findUnique({
    where: { id: params.id },
    select: { authorId: true, status: true },
  })

  if (!pub) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy công bố' }, { status: 404 })
  }
  if (pub.authorId !== user.id) {
    return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 })
  }
  if (pub.status !== 'SUBMITTED') {
    return NextResponse.json(
      { success: false, error: 'Chỉ có thể rút lại công bố đang ở trạng thái Chờ duyệt' },
      { status: 400 }
    )
  }

  await prisma.nckhPublication.update({
    where: { id: params.id },
    data: { status: 'DRAFT' },
  })

  return NextResponse.json({ success: true })
}
