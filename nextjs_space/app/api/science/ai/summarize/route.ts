/**
 * POST /api/science/ai/summarize
 *
 * Tóm tắt văn bản khoa học bằng AI.
 *
 * Body:
 *   text      — nội dung cần tóm tắt (tối đa 8000 ký tự)
 *   maxLength — số từ tối đa trong tóm tắt (default 300, max 600)
 *
 * Guard: AI only summarizes text explicitly provided by caller —
 *        không tự truy xuất dữ liệu mật. Caller chịu trách nhiệm
 *        chỉ submit text từ bản ghi APPROVED/NORMAL.
 *
 * RBAC: SCIENCE.AI_USE ('USE_AI_SCIENCE')
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { summarizeResearch } from '@/lib/ai-service'
import { logAudit } from '@/lib/audit'

const bodySchema = z.object({
  text:      z.string().min(20, 'Văn bản quá ngắn').max(8000, 'Văn bản vượt quá 8000 ký tự'),
  maxLength: z.number().int().min(100).max(600).default(300),
})

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.AI_USE)
  if (!auth.allowed) return auth.response!

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { text, maxLength } = parsed.data
  const ipAddress = req.headers.get('x-forwarded-for') ?? undefined

  try {
    const summary = await summarizeResearch(text, maxLength)

    await logAudit({
      userId:       auth.user!.id,
      functionCode: SCIENCE.AI_USE,
      action:       'CREATE',
      resourceType: 'AI_SUMMARIZE_SCIENCE',
      resourceId:   'N/A',
      result:       'SUCCESS',
      ipAddress,
      metadata:     { inputLength: text.length, maxLength },
    })

    return NextResponse.json({ success: true, data: { summary }, error: null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    )
  }
}
