/**
 * M10 – Quản lý Sinh viên Dân sự
 * /dashboard/education/civil-students
 *
 * Filtered view of HocVien where khoaQuanLy IS NULL (không có cơ cấu đơn vị quân sự).
 * Reuses /api/education/students?studentType=civil
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { GraduationCap, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CivilStudent {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  nganh: string | null;
  trangThai: string;
  currentStatus: string;
  diemTrungBinh: number;
  studyMode: string | null;
  email: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:      'Đang học',
  SUSPENDED:   'Tạm dừng',
  TRANSFERRED: 'Chuyển trường',
  GRADUATED:   'Đã tốt nghiệp',
  DROPPED_OUT: 'Thôi học',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:      'bg-green-100 text-green-700',
  SUSPENDED:   'bg-yellow-100 text-yellow-700',
  TRANSFERRED: 'bg-blue-100 text-blue-700',
  GRADUATED:   'bg-purple-100 text-purple-700',
  DROPPED_OUT: 'bg-red-100 text-red-700',
};

const STUDY_MODE_LABELS: Record<string, string> = {
  CHINH_QUY:       'Chính quy',
  TAI_CHUC:        'Tại chức',
  TU_XA:           'Từ xa',
  VAN_BANG_2:      'Văn bằng 2',
  LIEN_THONG:      'Liên thông',
  NGHIEN_CUU_SINH: 'Nghiên cứu sinh',
  THUC_TAP_SINH:   'Thực tập sinh',
  BOI_DUONG:       'Bồi dưỡng',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CivilStudentsPage() {
  const router = useRouter();

  const [students, setStudents]   = useState<CivilStudent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [meta, setMeta]           = useState({ total: 0, totalPages: 1 });
  const limit = 20;

  // Filters
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [filterStudyMode, setFilterStudyMode] = useState('');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        studentType: 'civil',
      });
      if (search)        params.set('search', search);
      if (filterStatus && filterStatus !== 'ALL') params.set('currentStatus', filterStatus);
      if (filterStudyMode && filterStudyMode !== 'ALL') params.set('studyMode', filterStudyMode);

      const res = await fetch(`/api/education/students?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setStudents(json.data || []);
      setMeta(json.meta || { total: 0, totalPages: 1 });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterStudyMode]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchStudents(); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 text-white p-6 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Sinh viên Dân sự</h1>
              <p className="text-sm text-white/80">
                Quản lý sinh viên dân sự (không có cơ cấu đơn vị quân sự)
              </p>
            </div>
          </div>
          <Badge className="bg-white/20 text-white border-white/30 text-base px-3 py-1">
            {meta.total} sinh viên
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Tìm tên, mã sinh viên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterStatus || 'ALL'} onValueChange={v => { setFilterStatus(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStudyMode || 'ALL'} onValueChange={v => { setFilterStudyMode(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Hình thức ĐT" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hình thức</SelectItem>
                {Object.entries(STUDY_MODE_LABELS).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">Tìm</Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-muted-foreground">Đang tải...</div>
          ) : students.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <GraduationCap className="h-8 w-8 opacity-30" />
              <span>Không có sinh viên dân sự nào phù hợp bộ lọc</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead>Lớp / Khóa</TableHead>
                  <TableHead>Ngành</TableHead>
                  <TableHead>Hình thức ĐT</TableHead>
                  <TableHead>Điểm TB</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{s.hoTen}</div>
                      <div className="text-xs text-muted-foreground">{s.maHocVien}</div>
                      {s.email && <div className="text-xs text-muted-foreground">{s.email}</div>}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{s.lop ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.khoaHoc ?? ''}</div>
                    </TableCell>
                    <TableCell className="text-sm">{s.nganh ?? '—'}</TableCell>
                    <TableCell className="text-sm">
                      {s.studyMode
                        ? <Badge variant="outline">{STUDY_MODE_LABELS[s.studyMode] ?? s.studyMode}</Badge>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold text-sm ${s.diemTrungBinh >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                        {s.diemTrungBinh.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[s.currentStatus] ?? 'bg-gray-100 text-gray-700'}>
                        {STATUS_LABELS[s.currentStatus] ?? s.currentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/dashboard/education/students/${s.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
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
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {page}/{meta.totalPages} · Tổng {meta.total} sinh viên</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
