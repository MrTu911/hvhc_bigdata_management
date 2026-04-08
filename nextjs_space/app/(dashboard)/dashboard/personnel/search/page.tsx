'use client'

import { useState, useCallback } from 'react'
import { PersonnelSearchFilter } from '@/components/personnel/search/personnel-search-filter'
import { PersonnelSearchResultTable } from '@/components/personnel/search/personnel-search-result-table'
import type {
  PersonnelSearchFilterValues,
} from '@/components/personnel/search/personnel-search-filter'
import type {
  PersonnelSearchItem,
} from '@/components/personnel/search/personnel-search-result-table'
import { Search } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  data: PersonnelSearchItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PersonnelSearchPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [currentFilters, setCurrentFilters] = useState<PersonnelSearchFilterValues | null>(null)
  const [page, setPage] = useState(1)

  async function fetchSearch(filters: PersonnelSearchFilterValues, targetPage: number) {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      if (filters.keyword) params.set('keyword', filters.keyword)
      if (filters.category && filters.category !== '_all') params.set('category', filters.category)
      if (filters.status && filters.status !== '_all') params.set('status', filters.status)
      if (filters.rank) params.set('rank', filters.rank)
      if (filters.position) params.set('position', filters.position)
      if (filters.degree) params.set('degree', filters.degree)
      if (filters.academicTitle) params.set('academicTitle', filters.academicTitle)
      if (filters.major) params.set('major', filters.major)
      if (filters.politicalTheory) params.set('politicalTheory', filters.politicalTheory)
      if (filters.unitId) params.set('unitId', filters.unitId)
      if (filters.ageMin) params.set('ageMin', filters.ageMin)
      if (filters.ageMax) params.set('ageMax', filters.ageMax)
      if (filters.serviceYearsMin) params.set('serviceYearsMin', filters.serviceYearsMin)
      if (filters.hasResearch === true) params.set('hasResearch', 'true')
      params.set('page', String(targetPage))
      params.set('pageSize', '20')

      const res = await fetch(`/api/personnel/search?${params.toString()}`)
      const json = await res.json()

      if (!res.ok || !json.success) {
        console.error('[search]', json.error)
        return
      }

      setResult({
        data: json.data,
        pagination: json.pagination,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = useCallback((filters: PersonnelSearchFilterValues) => {
    setCurrentFilters(filters)
    setPage(1)
    fetchSearch(filters, 1)
  }, [])

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (!currentFilters) return
      setPage(newPage)
      fetchSearch(currentFilters, newPage)
    },
    [currentFilters],
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Tìm kiếm cán bộ nhân sự</h1>
          <p className="text-xs text-muted-foreground">
            Tìm kiếm nhiều chiều theo loại, đơn vị, học vị, chức vụ, tuổi, năm công tác
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <PersonnelSearchFilter onSearch={handleSearch} loading={loading} />

      {/* Results */}
      {result ? (
        <PersonnelSearchResultTable
          items={result.data}
          total={result.pagination.total}
          page={result.pagination.page}
          pageSize={result.pagination.pageSize}
          totalPages={result.pagination.totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      ) : (
        !loading && (
          <div className="rounded-md border py-12 text-center text-muted-foreground text-sm">
            Nhập tiêu chí và nhấn <strong>Tìm</strong> để bắt đầu tìm kiếm.
          </div>
        )
      )}
    </div>
  )
}
