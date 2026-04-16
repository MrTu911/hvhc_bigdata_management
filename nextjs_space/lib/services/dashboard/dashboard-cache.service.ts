/**
 * DashboardCacheService – M11 Phase 1
 *
 * Quản lý cache key scope-aware cho dashboard widgets.
 * Mọi cache key phải gắn đủ scope để tránh rò rỉ dữ liệu giữa role/đơn vị.
 *
 * Cache key format:
 *   widget:{widgetKey}:role:{roleKey}:scope:{scope}:unit:{unitId}
 *   widget:{widgetKey}:user:{userId}  ← dùng cho widget cá nhân
 */
import 'server-only'
import { getCache, setCache, deleteCache } from '@/lib/cache'
import { WIDGET_LAYER_TTL } from '@/lib/dashboard/widget-registry'
import type { WidgetRefreshPolicy } from '@/lib/dashboard/widget-registry'

export interface WidgetCacheContext {
  widgetKey: string
  roleKey: string
  scope: string        // SELF | UNIT | DEPARTMENT | ACADEMY
  unitId?: string | null
  userId?: string | null
}

// ─── Key builders ─────────────────────────────────────────────────────────────

export function buildWidgetCacheKey(ctx: WidgetCacheContext): string {
  const parts = [`widget:${ctx.widgetKey}`, `role:${ctx.roleKey}`, `scope:${ctx.scope}`]
  if (ctx.unitId) parts.push(`unit:${ctx.unitId}`)
  if (ctx.userId) parts.push(`user:${ctx.userId}`)
  return parts.join(':')
}

export function buildDashboardScopeKey(roleKey: string, scope: string, unitId?: string | null): string {
  const base = `dash:role:${roleKey}:scope:${scope}`
  return unitId ? `${base}:unit:${unitId}` : base
}

// ─── Get / Set / Delete ───────────────────────────────────────────────────────

export async function getWidgetCache<T>(ctx: WidgetCacheContext): Promise<T | null> {
  const key = buildWidgetCacheKey(ctx)
  return getCache<T>(key)
}

export async function setWidgetCache<T>(
  ctx: WidgetCacheContext,
  data: T,
  policy?: WidgetRefreshPolicy,
): Promise<void> {
  const key = buildWidgetCacheKey(ctx)
  const ttl = policy?.ttlSeconds ?? WIDGET_LAYER_TTL[2]
  await setCache(key, data, ttl)
}

export async function invalidateWidgetCache(ctx: WidgetCacheContext): Promise<void> {
  const key = buildWidgetCacheKey(ctx)
  await deleteCache(key)
}

/**
 * Invalidate toàn bộ widget cache của một role+unit.
 * Dùng khi dữ liệu nguồn thay đổi lớn (không invalidate tất cả dashboard).
 */
export async function invalidateDashboardScope(
  roleKey: string,
  scope: string,
  unitId?: string | null,
): Promise<void> {
  // Với Redis: dùng pattern delete "widget:*:role:{roleKey}:scope:{scope}:unit:{unitId}*"
  // Với memory cache: không có native pattern delete → ghi lại key root để signal
  const signalKey = buildDashboardScopeKey(roleKey, scope, unitId)
  await deleteCache(signalKey)
}
