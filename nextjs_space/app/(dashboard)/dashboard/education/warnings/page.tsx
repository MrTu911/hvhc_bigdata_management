/**
 * M10 – UC-57: Academic Warning Engine — màn hình quản lý đào tạo
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import {
  WarningSummaryCards,
  type WarningSummary,
} from '@/components/education/warning/warning-summary-cards';
import {
  WarningList,
  type Warning,
} from '@/components/education/warning/warning-list';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WarningsPage() {
  // Summary (unfiltered, active only)
  const [summary, setSummary]             = useState<WarningSummary>({ CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 });
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Table data
  const [warnings, setWarnings]   = useState<Warning[]>([]);
  const [meta, setMeta]           = useState({ total: 0, page: 1, totalPages: 1 });
  const [tableLoading, setTableLoading] = useState(false);

  // Filters
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterSemesterCode, setFilterSemesterCode] = useState('');
  const [filterLevel,        setFilterLevel]        = useState('');
  const [filterResolved,     setFilterResolved]     = useState('');
  const [page, setPage] = useState(1);

  // Per-row recalculate state
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);

  // ─── Fetch summary counts (unfiltered, isResolved=false) ─────────────

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res  = await fetch('/api/education/warnings?isResolved=false&limit=100&page=1');
      const json = await res.json();
      if (!json.success) return;

      const all: Warning[] = json.data || [];
      // If there are more pages, make additional requests
      const totalPages = json.meta?.totalPages ?? 1;
      let allData = [...all];

      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            fetch(`/api/education/warnings?isResolved=false&limit=100&page=${i + 2}`)
              .then(r => r.json())
              .then(j => j.data || [])
          )
        );
        allData = allData.concat(rest.flat());
      }

      setSummary({
        CRITICAL: allData.filter(w => w.warningLevel === 'CRITICAL').length,
        HIGH:     allData.filter(w => w.warningLevel === 'HIGH').length,
        MEDIUM:   allData.filter(w => w.warningLevel === 'MEDIUM').length,
        LOW:      allData.filter(w => w.warningLevel === 'LOW').length,
      });
    } catch {
      // non-critical
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // ─── Fetch table data (filtered + paginated) ──────────────────────────

  const fetchTable = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (filterAcademicYear.trim()) params.set('academicYear', filterAcademicYear.trim());
      if (filterSemesterCode.trim()) params.set('semesterCode', filterSemesterCode.trim());
      if (filterLevel   && filterLevel   !== 'ALL') params.set('warningLevel', filterLevel);
      if (filterResolved && filterResolved !== 'ALL') params.set('isResolved',  filterResolved);

      const res  = await fetch(`/api/education/warnings?${params}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setWarnings(json.data || []);
      setMeta(json.meta ?? { total: 0, page: 1, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTableLoading(false);
    }
  }, [page, filterAcademicYear, filterSemesterCode, filterLevel, filterResolved]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchTable();   }, [fetchTable]);

  // ─── Filter submit ────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTable();
  };

  // ─── Recalculate one student ──────────────────────────────────────────

  const handleRecalculate = async (w: Warning) => {
    setRecalculatingId(w.id);
    try {
      const res  = await fetch('/api/education/warnings/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hocVienId:    w.hocVienId,
          academicYear: w.academicYear,
          semesterCode: w.semesterCode,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tính lại');

      const result = json.data;
      if (!result.warningLevel) {
        toast.success(`${w.hocVien.hoTen} — Không còn cảnh báo học vụ`);
      } else {
        toast.success(`${w.hocVien.hoTen} — Mức cảnh báo: ${result.warningLevel}`);
      }

      // Refresh both summary and table
      await Promise.all([fetchSummary(), fetchTable()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRecalculatingId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Cảnh báo Học vụ
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            UC-57 – Academic Warning Engine · Theo dõi và cảnh báo sớm kết quả học tập
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { fetchSummary(); fetchTable(); }}
          disabled={summaryLoading || tableLoading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(summaryLoading || tableLoading) ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* KPI Summary cards */}
      <WarningSummaryCards counts={summary} loading={summaryLoading} />

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex items-center gap-2 min-w-[160px]">
              <Input
                placeholder="Năm học (VD: 2024-2025)"
                value={filterAcademicYear}
                onChange={e => setFilterAcademicYear(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2 min-w-[140px]">
              <Input
                placeholder="Học kỳ (VD: HK1)"
                value={filterSemesterCode}
                onChange={e => setFilterSemesterCode(e.target.value)}
                className="flex-1"
              />
            </div>

            <Select value={filterLevel} onValueChange={v => { setFilterLevel(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mức cảnh báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả mức</SelectItem>
                <SelectItem value="CRITICAL">Nghiêm trọng</SelectItem>
                <SelectItem value="HIGH">Cao</SelectItem>
                <SelectItem value="MEDIUM">Trung bình</SelectItem>
                <SelectItem value="LOW">Nhẹ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterResolved} onValueChange={v => { setFilterResolved(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="false">Chưa xử lý</SelectItem>
                <SelectItem value="true">Đã xử lý</SelectItem>
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Warning table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base flex-wrap gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Danh sách cảnh báo
              {!tableLoading && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({meta.total} cảnh báo)
                </span>
              )}
            </span>
            <p className="text-xs font-normal text-muted-foreground">
              Nút <strong>Tính lại</strong> chạy engine cho từng học viên dựa trên GPA và TC trượt hiện tại
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WarningList
            warnings={warnings}
            loading={tableLoading}
            meta={meta}
            onPageChange={p => setPage(p)}
            onRecalculate={handleRecalculate}
            recalculatingId={recalculatingId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
