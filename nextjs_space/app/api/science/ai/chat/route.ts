/**
 * POST /api/science/ai/chat
 *
 * RAG chatbot for HVHC science knowledge base.
 *
 * Body:
 *   sessionId  — string (required, caller-managed for multi-turn)
 *   messages   — ChatMessage[] (role: 'user'|'assistant', content: string)
 *                Last element must be role='user'.
 *
 * Guards:
 *   - RBAC: SCIENCE.AI_USE
 *   - AI only uses APPROVED/IN_PROGRESS/COMPLETED records (enforced in rag.service)
 *   - SECRET records are redacted to sentinel before LLM sees them
 *   - Every session logged via logAudit (resourceType: AI_CHAT_SCIENCE)
 *
 * RBAC: SCIENCE.AI_USE ('USE_AI_SCIENCE')
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireFunction } from '@/lib/rbac/middleware'
import { SCIENCE } from '@/lib/rbac/function-codes'
import { ragService } from '@/lib/services/science/rag.service'

// ─── Validation ───────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
})

const chatBodySchema = z.object({
  sessionId: z.string().min(1).max(100),
  messages:  z
    .array(chatMessageSchema)
    .min(1)
    .max(20)
    .refine(
      (msgs) => msgs[msgs.length - 1]?.role === 'user',
      { message: 'Tin nhắn cuối phải là của người dùng (role: user)' },
    ),
})

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireFunction(req, SCIENCE.AI_USE)
  if (!auth.allowed) return auth.response!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: 'Request body phải là JSON hợp lệ' },
      { status: 400 },
    )
  }

  const parsed = chatBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { sessionId, messages } = parsed.data

  const result = await ragService.chat({
    userId:    auth.user!.id,
    sessionId,
    messages,
  })

  return NextResponse.json({
    success: true,
    data: {
      answer:        result.answer,
      sessionId:     result.sessionId,
      model:         result.model,
      sourceCount:   result.sourceCount,
      redactedCount: result.redactedCount,
    },
    error: null,
  })
}
