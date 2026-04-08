/**
 * M10 – UC-58: Điểm rèn luyện, khen thưởng, kỷ luật người học
 * /dashboard/education/conduct
 *
 * Trang quản lý điểm rèn luyện toàn trường với filter theo năm học / học kỳ.
 * Thêm bản ghi mới qua ConductRecordTable (per-student).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Star, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ConductRecordTable } from '@/components/education/student/conduct-record-table';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConductRecord {
  id: string;
  hocVienId: string;
  academicYear: string;
  semesterCode: string;
  conductScore: number;
  conductGrade: string | null;
  rewardSummary: string | null;
  disciplineSummary: string | null;
  approvedBy: string | null;
  hocVien: {
    id: string;
    maHocVien: string;
    hoTen: string;
    lop: string | null;
    khoaHoc: string | null;
  };
}

// ─── Score color helper ───────────────────────────────────────────────────────

function conductScoreClass(score: number) {
  if (score >= 90) return 'text-green-600 font-bold';
  if (score >= 80) return 'text-green-500 font-semibold';
  if (score >= 65) return 'text-yellow-600 font-semibold';
  if (score >= 50) return 'text-orange-500 font-semibold';
  return 'text-red-600 font-bold';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConductPage() {
  const [records, setRecords]     = useState<ConductRecord[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch]               = useState('');
  const [filterYear, setFilterYear]       = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Per-student detail sheet
  const [sheetStudent, setSheetStudent] = useState<ConductRecord['hocVien'] | null>(null);
  const [sheetRecords, setSheetRecords] = useState<any[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  // ── Fetch list ─────────────────────────────────────────────────────────────

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)         params.set('search', search);
      if (filterYear)     params.set('academicYear', filterYear);
      if (filterSemester) params.set('semesterCode', filterSemester);

      const res = await fetch(`/api/education/conduct?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) { setRecords(data.data); setTotal(data.meta.total); }
      } else {
        toast.error('Không thể tải danh sách điểm rèn luyện');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally   { setLoading(false); }
  }, [page, search, filterYear, filterSemester]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Per-student sheet ──────────────────────────────────────────────────────

  const openStudentSheet = async (student: ConductRecord['hocVien']) => {
    setSheetStudent(student);
    setSheetLoading(true);
    try {
      const res = await fetch(`/api/education/students/${student.id}/conduct`);
      if (res.ok) {
        const data = await res.json();
        setSheetRecords(data.data?.records ?? []);
      }
    } catch { toast.error('Không thể tải lịch sử rèn luyện'); }
    finally   { setSheetLoading(false); }
  };

  const closeSheet = () => {
    setSheetStudent(null);
    setSheetRecords([]);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleYearChange = (value: string) => { setFilterYear(value === '__ALL__' ? '' : value); setPage(1); };
  const handleSemesterChange = (value: string) => { setFilterSemester(value === '__ALL__' ? '' : value); setPage(1); };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Điểm rèn luyện</h1>
          <p className="text-muted-foreground">UC-58 – Quản lý điểm rèn luyện, khen thưởng, kỷ luật người học</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm tên hoặc mã học viên..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <Select value={filterYear || '__ALL__'} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Năm học" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả năm học</SelectItem>
                <SelectItem value="2024-2025">2024–2025</SelectItem>
                <SelectItem value="2023-2024">2023–2024</SelectItem>
                <SelectItem value="2022-2023">2022–2023</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSemester || '__ALL__'} onValueChange={handleSemesterChange}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Học kỳ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả HK</SelectItem>
                <SelectItem value="HK1">Học kỳ 1</SelectItem>
                <SelectItem value="HK2">Học kỳ 2</SelectItem>
                <SelectItem value="HK3">Học kỳ hè</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tải...</div>
          ) : records.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Star className="h-8 w-8 opacity-30" />
              <span>Không có bản ghi rèn luyện nào</span>
              {(search || filterYear || filterSemester) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterYear(''); setFilterSemester(''); setPage(1); }}>
                  <X className="h-4 w-4 mr-1" /> Xóa bộ lọc
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Năm học</TableHead>
                  <TableHead>Học kỳ</TableHead>
                  <TableHead>Điểm</TableHead>
                  <TableHead>Xếp loại</TableHead>
                  <TableHead>Khen thưởng</TableHead>
                  <TableHead>Kỷ luật</TableHead>
                  <TableHead className="w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{r.hocVien.hoTen}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.hocVien.maHocVien}
                        {r.hocVien.lop && ` · ${r.hocVien.lop}`}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.academicYear}</TableCell>
                    <TableCell className="text-sm">{r.semesterCode}</TableCell>
                    <TableCell>
                      <span className={conductScoreClass(r.conductScore)}>{r.conductScore}</span>
                    </TableCell>
                    <TableCell>
                      {r.conductGrade
                        ? <Badge variant="outline">{r.conductGrade}</Badge>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={r.rewardSummary ?? undefined}>
                      {r.rewardSummary || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px] truncate" title={r.disciplineSummary ?? undefined}>
                      {r.disciplineSummary
                        ? <span className="text-red-600">{r.disciplineSummary}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStudentSheet(r.hocVien)}
                      >
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page}/{totalPages} ({total} bản ghi)</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Per-student detail sheet */}
      <Sheet open={!!sheetStudent} onOpenChange={v => { if (!v) closeSheet(); }}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Điểm rèn luyện – {sheetStudent?.hoTen}
              <span className="text-sm font-normal text-muted-foreground ml-1">({sheetStudent?.maHocVien})</span>
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {sheetStudent && (
              <ConductRecordTable
                studentId={sheetStudent.id}
                records={sheetRecords}
                loading={sheetLoading}
                onRefresh={() => {
                  openStudentSheet(sheetStudent);
                  fetchRecords();
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
