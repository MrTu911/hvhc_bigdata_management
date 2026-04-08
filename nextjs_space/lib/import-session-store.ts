/**
 * ImportSessionStore – M19 MDM
 *
 * Lưu import session trong Redis (nếu có) với fallback sang in-process Map.
 * TTL mặc định 15 phút.
 *
 * Session bị xóa sau khi confirm hoặc khi TTL hết.
 * Field `consumed` ngăn double-import nếu client gọi confirm 2 lần.
 */
import 'server-only'
import { redis } from './redis'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportSessionItem = {
  code: string
  nameVi: string
  nameEn?: string | null
  shortName?: string | null
  parentCode?: string | null
  externalCode?: string | null
  sortOrder?: number
  metadata?: unknown
}

export type ImportSession = {
  importId: string
  categoryCode: string
  validItems: ImportSessionItem[]
  createdBy: string
  createdAt: string
  consumed: boolean
}

// ─── In-process fallback ──────────────────────────────────────────────────────

const fallback = new Map<string, { data: ImportSession; expiresAt: number }>()

const SESSION_TTL_SECONDS = 15 * 60 // 15 min

function sessionKey(importId: string): string {
  return `hvhc:mdm:import:${importId}`
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const importSessionStore = {
  async set(session: ImportSession): Promise<void> {
    const key = sessionKey(session.importId)
    const stored = await redis.set(key, session, { ttl: SESSION_TTL_SECONDS })
    if (!stored) {
      // Redis unavailable — use in-process Map
      fallback.set(key, {
        data: session,
        expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
      })
    }
  },

  async get(importId: string): Promise<ImportSession | null> {
    const key = sessionKey(importId)
    const fromRedis = await redis.get<ImportSession>(key)
    if (fromRedis) return fromRedis

    const entry = fallback.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      fallback.delete(key)
      return null
    }
    return entry.data
  },

  async markConsumed(importId: string): Promise<void> {
    const key = sessionKey(importId)
    const session = await importSessionStore.get(importId)
    if (!session) return
    const updated = { ...session, consumed: true }
    // Short TTL after consume — keep for 60s in case of retries
    await redis.set(key, updated, { ttl: 60 })
    const entry = fallback.get(key)
    if (entry) {
      fallback.set(key, { data: updated, expiresAt: Date.now() + 60_000 })
    }
  },

  async del(importId: string): Promise<void> {
    const key = sessionKey(importId)
    await redis.del(key)
    fallback.delete(key)
  },
}
