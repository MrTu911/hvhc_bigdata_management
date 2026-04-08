/**
 * Master Data Cache Helper – M19 MDM
 * In-process Map cache for static/semi-static lookup data.
 * Falls back gracefully; never throws.
 */
import 'server-only'
import { getCache, setCache, deleteCachePattern, getCacheTtl } from './cache'
import db from './db'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MdItem = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  shortName: string | null
  parentCode: string | null
  externalCode: string | null
  sortOrder: number
  metadata: unknown
  isActive: boolean
  validFrom: string | null
  validTo: string | null
}

export type MdCategory = {
  id: string
  code: string
  nameVi: string
  nameEn: string | null
  groupTag: string
  cacheType: string
  sourceType: string
  isActive: boolean
  sortOrder: number
  description: string | null
  items?: MdItem[]
}

// ─── TTL map ─────────────────────────────────────────────────────────────────

const TTL: Record<string, number> = {
  STATIC: 86400,   // 24 h
  SEMI: 43200,     // 12 h (design spec)
  DYNAMIC: 300,    // 5 min
}

function ttlFor(cacheType: string) {
  return TTL[cacheType] ?? 3600
}

// ─── Category list ────────────────────────────────────────────────────────────

const CATEGORIES_KEY = 'mdm:categories:all'

export async function getAllCategories(): Promise<MdCategory[]> {
  const cached = await getCache<MdCategory[]>(CATEGORIES_KEY)
  if (cached) return cached

  const rows = await db.masterCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  const result = rows as MdCategory[]
  await setCache(CATEGORIES_KEY, result, TTL.STATIC)
  return result
}

export async function getCategoryByCode(code: string): Promise<MdCategory | null> {
  const cats = await getAllCategories()
  return cats.find(c => c.code === code) ?? null
}

// ─── Items per category ───────────────────────────────────────────────────────

export async function getItemsByCategory(
  categoryCode: string,
  onlyActive = true
): Promise<MdItem[]> {
  const cat = await getCategoryByCode(categoryCode)
  const cacheType = cat?.cacheType ?? 'SEMI'
  const key = `mdm:items:${categoryCode}:${onlyActive ? 'active' : 'all'}`

  const cached = await getCache<MdItem[]>(key)
  if (cached) return cached

  const rows = await db.masterDataItem.findMany({
    where: {
      categoryCode,
      ...(onlyActive ? { isActive: true } : {}),
    },
    orderBy: { sortOrder: 'asc' },
  })
  const result = rows as MdItem[]
  await setCache(key, result, ttlFor(cacheType))
  return result
}

export async function getItemByCode(
  categoryCode: string,
  code: string
): Promise<MdItem | null> {
  const items = await getItemsByCategory(categoryCode)
  return items.find(i => i.code === code) ?? null
}

// ─── Bulk fetch ───────────────────────────────────────────────────────────────

export async function getItemsMultiCategory(
  categoryCodes: string[]
): Promise<Record<string, MdItem[]>> {
  const entries = await Promise.all(
    categoryCodes.map(async code => [code, await getItemsByCategory(code)] as const)
  )
  return Object.fromEntries(entries)
}

// ─── Tree (parent-child) ──────────────────────────────────────────────────────

export type MdItemNode = MdItem & { children: MdItemNode[] }

export async function getItemTree(categoryCode: string): Promise<MdItemNode[]> {
  const items = await getItemsByCategory(categoryCode)
  const map = new Map<string, MdItemNode>()
  for (const item of items) map.set(item.code, { ...item, children: [] })

  const roots: MdItemNode[] = []
  for (const node of map.values()) {
    if (node.parentCode && map.has(node.parentCode)) {
      map.get(node.parentCode)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

// ─── Cache invalidation ───────────────────────────────────────────────────────

/** Returns the number of cache keys deleted. */
export async function invalidateCategoryCache(categoryCode?: string): Promise<number> {
  if (categoryCode) {
    return deleteCachePattern(`mdm:items:${categoryCode}:*`)
  }
  return deleteCachePattern('mdm:*')
}

/** Returns the number of cache keys deleted. */
export async function invalidateAllMasterDataCache(): Promise<number> {
  return deleteCachePattern('mdm:*')
}

// ─── TTL inspection ───────────────────────────────────────────────────────────

export type CategoryTtlEntry = {
  code: string
  /** Seconds remaining, or -1 if the key exists with no expiry, or null if not cached. */
  ttlSeconds: number | null
  cached: boolean
}

/**
 * Returns the remaining TTL for each category's primary cache key
 * (`mdm:items:<code>:active`). Useful for the admin cache dashboard.
 */
export async function getItemCacheTtls(
  categoryCodes: string[]
): Promise<CategoryTtlEntry[]> {
  return Promise.all(
    categoryCodes.map(async (code): Promise<CategoryTtlEntry> => {
      const ttl = await getCacheTtl(`mdm:items:${code}:active`)
      return {
        code,
        ttlSeconds: ttl === -1 ? null : ttl, // -1 (no expiry) treated as null for display
        cached: ttl !== null,
      }
    })
  )
}

// ─── Warm-up (call from app startup) ─────────────────────────────────────────

export async function warmMasterDataCache(): Promise<void> {
  try {
    const cats = await getAllCategories()
    // Pre-warm static categories only
    const statics = cats.filter(c => c.cacheType === 'STATIC')
    await Promise.allSettled(statics.map(c => getItemsByCategory(c.code)))
    console.log(`✅ Master data cache warmed: ${statics.length} static categories`)
  } catch (e) {
    console.warn('⚠️ Master data cache warm-up failed:', e)
  }
}
