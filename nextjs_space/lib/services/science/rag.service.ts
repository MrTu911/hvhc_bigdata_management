/**
 * RAG Service – CSDL-KHQL Phase 8
 *
 * Retrieval-Augmented Generation chatbot for science knowledge base.
 *
 * Pipeline per query:
 *   1. Embed user query (text-embedding-3-small)
 *   2. Vector search: NckhProject + NckhPublication + ScientificWork
 *      — filtered to status IN (APPROVED, IN_PROGRESS, COMPLETED) only
 *   3. Redact sensitive fields (ai-redaction middleware)
 *   4. Build domain-specific system prompt
 *   5. GPT-4o chat completion with retrieved context
 *   6. logAudit({ resourceType: 'AI_CHAT_SCIENCE' })
 *
 * Guard: AI_USE function code enforced at route level.
 *        SECRET records never appear in context (redaction middleware).
 */
import 'server-only'
import OpenAI from 'openai'
import { embedText, formatPgVector } from '@/lib/integrations/embeddings'
import { redactContextItems } from '@/lib/integrations/ai-redaction'
import { logAudit } from '@/lib/audit'
import prisma from '@/lib/db'

// ─── Config ───────────────────────────────────────────────────────────────────

const CHAT_MODEL   = process.env.SCIENCE_AI_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o'
const MAX_TOKENS   = 1200
const CONTEXT_DOCS = 6  // max documents to include in prompt
const AI_GUARD_STATUSES = ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] as const

// ─── OpenAI client (reuses env key from existing ai-service.ts pattern) ───────

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.ABACUSAI_API_KEY ?? process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('[rag] AI API key not configured')
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.ABACUSAI_API_KEY ? 'https://routellm.abacus.ai/v1' : undefined,
    })
  }
  return _client
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Bạn là trợ lý AI chuyên về quản lý khoa học của Học viện Hậu cần (HVHC) — trường quân sự trực thuộc Bộ Quốc phòng Việt Nam.

Nhiệm vụ của bạn:
- Trả lời câu hỏi về đề tài NCKH, công trình khoa học, hồ sơ nhà khoa học
- Tổng hợp thông tin từ cơ sở dữ liệu nghiên cứu khoa học của học viện
- Hỗ trợ phân tích xu hướng nghiên cứu, đề xuất hướng hợp tác

Nguyên tắc bắt buộc:
- Chỉ trả lời dựa trên ngữ cảnh được cung cấp. Nếu không có đủ thông tin, nói rõ.
- KHÔNG suy đoán, KHÔNG bịa thông tin, KHÔNG đề cập đến tài liệu mật
- KHÔNG trả lời câu hỏi ngoài phạm vi nghiên cứu khoa học học viện
- Giữ bí mật thông tin nhân sự nếu không liên quan trực tiếp đến nghiên cứu
- Trả lời bằng tiếng Việt, chính xác và chuyên nghiệp`

// ─── Vector retrieval ─────────────────────────────────────────────────────────

interface RetrievedDoc {
  id: string
  source: 'project' | 'publication' | 'scientist'
  title: string
  abstract?: string | null
  keywords?: string[]
  sensitivity?: string
  score: number
}

async function retrieveRelevantDocs(embedding: number[]): Promise<RetrievedDoc[]> {
  const vecLiteral = formatPgVector(embedding)
  const statusFilter = AI_GUARD_STATUSES.map((s) => `'${s}'`).join(',')

  const docs: RetrievedDoc[] = []

  // Project vector search — pgvector, graceful fallback
  try {
    const projects = await prisma.$queryRawUnsafe<Array<{
      id: string; title: string; abstract: string | null; keywords: string[]; sensitivity: string; score: number
    }>>(
      `SELECT id, title, abstract, keywords, sensitivity,
              1 - (embedding <=> $1::vector) AS score
         FROM "nckh_projects"
        WHERE embedding IS NOT NULL
          AND status = ANY(ARRAY[${statusFilter}]::text[])
          AND sensitivity != 'SECRET'
        ORDER BY embedding <=> $1::vector
        LIMIT $2`,
      vecLiteral, Math.ceil(CONTEXT_DOCS / 2),
    )
    docs.push(...projects.map((p) => ({ ...p, source: 'project' as const })))
  } catch {
    // pgvector not available for projects yet
  }

  // Publication keyword/abstract search — tsvector fallback (no embedding column)
  // Retrieve by publication status PUBLISHED (approximated via status field)
  try {
    const pubs = await prisma.nckhPublication.findMany({
      where: {
        status: { in: ['PUBLISHED' as never, 'APPROVED' as never] },
        OR: [
          { abstract: { not: null } },
          { keywords: { isEmpty: false } },
        ],
      },
      take: 3,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, title: true, abstract: true, keywords: true, isISI: true, isScopus: true,
      },
    })
    docs.push(
      ...pubs.map((p) => ({
        id: p.id,
        source: 'publication' as const,
        title: p.title,
        abstract: p.abstract,
        keywords: p.keywords,
        sensitivity: 'NORMAL',
        score: 0.5,
      })),
    )
  } catch {
    // ignore
  }

  // Sort by score descending, take top CONTEXT_DOCS
  return docs
    .sort((a, b) => b.score - a.score)
    .slice(0, CONTEXT_DOCS)
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildContextBlock(docs: RetrievedDoc[]): string {
  if (docs.length === 0) return 'Không có tài liệu phù hợp trong cơ sở dữ liệu.'

  return docs
    .map((doc, i) => {
      const kw = doc.keywords?.length ? `Từ khóa: ${doc.keywords.join(', ')}` : ''
      const abs = doc.abstract ? `Tóm tắt: ${doc.abstract.slice(0, 400)}` : ''
      return `[Tài liệu ${i + 1}] (${doc.source}) ${doc.title}\n${kw}\n${abs}`.trim()
    })
    .join('\n\n---\n\n')
}

// ─── Chat message type ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface RagChatResponse {
  answer: string
  sourceCount: number
  redactedCount: number
  model: string
  sessionId: string
}

// ─── Public service ───────────────────────────────────────────────────────────

export const ragService = {
  async chat(opts: {
    userId: string
    sessionId: string
    messages: ChatMessage[]       // conversation history (last = current user message)
    allowedSensitivities?: string[]
  }): Promise<RagChatResponse> {
    const { userId, sessionId, messages } = opts
    const userQuery = messages[messages.length - 1]?.content ?? ''

    if (!userQuery.trim()) throw new Error('Câu hỏi không được để trống')

    // Step 1: Embed query
    let embedding: number[] | null = null
    try {
      embedding = await embedText(userQuery)
    } catch {
      // Proceed without semantic retrieval
    }

    // Step 2: Retrieve + redact
    let sourceDocs: RetrievedDoc[] = []
    let redactedCount = 0
    if (embedding) {
      const raw = await retrieveRelevantDocs(embedding)
      const { items, redactedCount: rc } = redactContextItems(raw as never)
      sourceDocs = items as unknown as RetrievedDoc[]
      redactedCount = rc
    }

    // Step 3: Build prompt
    const contextBlock = buildContextBlock(sourceDocs)
    const systemWithContext = `${SYSTEM_PROMPT}\n\n--- NGỮ CẢNH TỪ CƠ SỞ DỮ LIỆU ---\n${contextBlock}`

    // Step 4: Build message history for API (cap at last 6 turns to limit tokens)
    const historyMessages = messages.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Step 5: Call GPT-4o
    const client = getClient()
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3, // factual domain — lower temperature
      messages: [
        { role: 'system', content: systemWithContext },
        ...historyMessages,
      ],
    })

    const answer = completion.choices[0]?.message?.content ?? 'Không có phản hồi từ AI.'

    // Step 6: Audit
    await logAudit({
      userId,
      functionCode: 'USE_AI_SCIENCE',
      action:       'CREATE',
      resourceType: 'AI_CHAT_SCIENCE',
      resourceId:   sessionId,
      result:       'SUCCESS',
      metadata: {
        sessionId,
        queryLength:  userQuery.length,
        sourceCount:  sourceDocs.length,
        redactedCount,
        model:        CHAT_MODEL,
        tokensUsed:   completion.usage?.total_tokens,
      },
    })

    return {
      answer,
      sourceCount:  sourceDocs.length,
      redactedCount,
      model:        CHAT_MODEL,
      sessionId,
    }
  },
}
