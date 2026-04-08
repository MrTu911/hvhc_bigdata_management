'use client'

/**
 * M19 MDM – hooks dùng chung cho toàn hệ thống.
 *
 * useMasterData(categoryCode)         – hook chính, dùng trong mọi form dropdown
 * useMasterDataMultiple(codes[])      – lấy nhiều category cùng lúc
 * useCategories(groupTag?)            – lấy danh sách category cho admin UI
 * invalidateMasterDataClientCache()   – invalidate query cache client-side
 *
 * Tất cả hooks dùng @tanstack/react-query v5 – cần ReactQueryProvider ở app layout.
 */

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query'

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
  isActive: boolean
  metadata?: unknown
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
  description?: string | null
  itemCount?: number
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mdQueryKeys = {
  items: (code: string, onlyActive: boolean) =>
    ['master-data', 'items', code, onlyActive] as const,
  categories: (groupTag?: string) =>
    ['master-data', 'categories', groupTag ?? 'all'] as const,
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchItems(
  categoryCode: string,
  onlyActive: boolean
): Promise<MdItem[]> {
  const url = `/api/master-data/${encodeURIComponent(categoryCode)}${onlyActive ? '' : '?onlyActive=false'}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch master data: ${categoryCode}`)
  const json = await res.json()
  // { success, data: { category, items } }  — GET /api/master-data/[code]
  if (json?.data?.items) return json.data.items as MdItem[]
  // { success, data: [...] }                — GET /api/master-data/[code]/items
  if (Array.isArray(json?.data)) return json.data as MdItem[]
  // legacy plain-array fallback
  if (Array.isArray(json)) return json as MdItem[]
  return []
}

async function fetchCategories(groupTag?: string): Promise<MdCategory[]> {
  const url = groupTag
    ? `/api/master-data/categories?withCount=true&groupTag=${encodeURIComponent(groupTag)}`
    : '/api/master-data/categories?withCount=true'
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch categories')
  return res.json()
}

// ─── useMasterData ────────────────────────────────────────────────────────────

export function useMasterData(
  categoryCode: string | null | undefined,
  onlyActive = true
) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: mdQueryKeys.items(categoryCode ?? '', onlyActive),
    queryFn: () => fetchItems(categoryCode!, onlyActive),
    enabled: !!categoryCode,
  })

  const items: MdItem[] = data ?? []

  return {
    items,
    loading: isLoading,              // backward compat với callers cũ
    isLoading,
    error: error ? (error as Error).message : null,
    refresh: refetch,
    /** Lookup item theo code – O(n) nhưng list ngắn */
    getItem: (code: string) => items.find(i => i.code === code) ?? null,
  }
}

// ─── useMasterDataMultiple ────────────────────────────────────────────────────

export function useMasterDataMultiple(categoryCodes: string[]) {
  const results = useQueries({
    queries: categoryCodes.map(code => ({
      queryKey: mdQueryKeys.items(code, true),
      queryFn: () => fetchItems(code, true),
      enabled: !!code,
    })),
  })

  const data: Record<string, MdItem[]> = {}
  for (let i = 0; i < categoryCodes.length; i++) {
    data[categoryCodes[i]] = results[i].data ?? []
  }

  const loading = results.some(r => r.isLoading)

  return { data, loading }
}

// ─── useCategories ────────────────────────────────────────────────────────────

export function useCategories(groupTag?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: mdQueryKeys.categories(groupTag),
    queryFn: () => fetchCategories(groupTag),
    staleTime: 10 * 60 * 1000, // categories ít thay đổi hơn items
  })

  return {
    categories: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

/**
 * invalidateMasterDataClientCache
 * Gọi từ admin UI sau khi tạo/sửa/xóa item để force refetch.
 * Phải dùng trong component (có react-query context).
 */
export function useInvalidateMasterData() {
  const queryClient = useQueryClient()
  return (categoryCode?: string) => {
    if (categoryCode) {
      queryClient.invalidateQueries({
        queryKey: ['master-data', 'items', categoryCode],
      })
    } else {
      queryClient.invalidateQueries({ queryKey: ['master-data'] })
    }
  }
}

/**
 * @deprecated Dùng useInvalidateMasterData() hook thay thế.
 * Giữ lại để không break code cũ đang gọi function này trực tiếp.
 */
export function invalidateMasterDataClientCache(_categoryCode?: string) {
  console.warn(
    '[MDM] invalidateMasterDataClientCache() is deprecated. Use useInvalidateMasterData() instead.'
  )
}
