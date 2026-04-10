/**
 * Embeddings Integration – Phase 4
 *
 * Tạo text embedding dùng OpenAI text-embedding-3-small (1536 dims).
 * Reuse OpenAI client đã có trong lib/ai-service.ts (chung ABACUSAI_API_KEY).
 *
 * Dùng cho:
 *   - Library semantic search (Phase 4)
 *   - ScientificWork duplicate check nâng cao (Phase 5)
 *   - NckhProject similarity (Phase 5)
 */
import 'server-only'
import OpenAI from 'openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMS = 1536

// ─── Lazy singleton (giống ai-service.ts) ────────────────────────────────────

let _client: OpenAI | null = null

function getEmbeddingClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.ABACUSAI_API_KEY ?? process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('[embeddings] API key not configured (ABACUSAI_API_KEY or OPENAI_API_KEY)')
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.ABACUSAI_API_KEY ? 'https://routellm.abacus.ai/v1' : undefined,
    })
  }
  return _client
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Tạo embedding vector cho một đoạn văn bản.
 * Truncate ở 8192 tokens (giới hạn của model).
 */
export async function embedText(text: string): Promise<number[]> {
  const client = getEmbeddingClient()
  // Truncate thô bằng ký tự (~4 chars/token) để tránh lỗi
  const truncated = text.slice(0, 8192 * 4)

  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
    dimensions: EMBEDDING_DIMS,
  })

  return res.data[0].embedding
}

/**
 * Batch embed nhiều đoạn văn (tối đa 100/batch theo giới hạn OpenAI).
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const client = getEmbeddingClient()

  const truncated = texts.map((t) => t.slice(0, 8192 * 4))
  const res = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: truncated,
    dimensions: EMBEDDING_DIMS,
  })

  return res.data.map((d) => d.embedding)
}

/**
 * Format embedding array thành chuỗi pgvector literal: '[0.1,0.2,...]'
 */
export function formatPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

export { EMBEDDING_DIMS }
