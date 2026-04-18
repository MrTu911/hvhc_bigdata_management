'use client';

/**
 * M10 – useStudentList hook
 *
 * Shared fetch hook cho civil-students và military-students pages.
 * Encapsulates: fetch URL building, pagination, aggregate stats.
 * Không replace page-level form/CRUD state — chỉ handle data fetching.
 */

import { useState, useEffect, useCallback } from 'react';
import type { HocVienListItem, AggregateStats, PaginationMeta, StudentListParams } from '@/types/education';

const DEFAULT_AGGREGATE_STATS: AggregateStats = {
  byStatus: {},
  lowGpaCount: 0,
  warningCount: 0,
};

const DEFAULT_META: PaginationMeta = { total: 0, page: 1, limit: 20, totalPages: 1 };

interface UseStudentListReturn {
  students: HocVienListItem[];
  aggregateStats: AggregateStats;
  loading: boolean;
  meta: PaginationMeta;
  apiError: string | null;
  refetch: () => void;
}

export function useStudentList(params: StudentListParams): UseStudentListReturn {
  const [students, setStudents]       = useState<HocVienListItem[]>([]);
  const [aggregateStats, setAggStats] = useState<AggregateStats>(DEFAULT_AGGREGATE_STATS);
  const [loading, setLoading]         = useState(true);
  const [meta, setMeta]               = useState<PaginationMeta>(DEFAULT_META);
  const [apiError, setApiError]       = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setApiError(null);

    const qs = new URLSearchParams();
    if (params.page)                  qs.set('page',                  String(params.page));
    if (params.limit)                 qs.set('limit',                 String(params.limit));
    if (params.studentType)           qs.set('studentType',           params.studentType);
    if (params.search?.trim())        qs.set('search',                params.search.trim());
    if (params.currentStatus)         qs.set('currentStatus',         params.currentStatus);
    if (params.studyMode)             qs.set('studyMode',             params.studyMode);
    if (params.nganh?.trim())         qs.set('nganh',                 params.nganh.trim());
    if (params.khoaHoc?.trim())       qs.set('khoaHoc',               params.khoaHoc.trim());
    if (params.lop?.trim())           qs.set('lop',                   params.lop.trim());
    if (params.trainingSystemUnitId)  qs.set('trainingSystemUnitId',  params.trainingSystemUnitId);
    if (params.battalionUnitId)       qs.set('battalionUnitId',       params.battalionUnitId);
    if (params.heDaoTao)              qs.set('heDaoTao',              params.heDaoTao);

    try {
      const res  = await fetch(`/api/education/students?${qs}`);
      const json = await res.json();
      if (!res.ok) {
        setApiError(json.error || `Lỗi ${res.status}`);
        return;
      }
      setStudents(json.data || []);
      setMeta(json.meta || DEFAULT_META);
      setAggStats(json.aggregateStats || DEFAULT_AGGREGATE_STATS);
    } catch (err: any) {
      setApiError(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  }, [
    params.page, params.limit, params.studentType, params.search,
    params.currentStatus, params.studyMode, params.nganh, params.khoaHoc,
    params.lop, params.trainingSystemUnitId, params.battalionUnitId, params.heDaoTao,
  ]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { students, aggregateStats, loading, meta, apiError, refetch: fetch_ };
}
