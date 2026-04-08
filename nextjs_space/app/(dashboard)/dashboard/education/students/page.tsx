/**
 * M10 – UC-51: Danh sách học viên
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { GraduationCap, Search } from 'lucide-react';
import { StudentTable, STATUS_LABELS } from '@/components/education/student/student-table';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKhoaHoc, setFilterKhoaHoc] = useState('');
  const [filterStudyMode, setFilterStudyMode] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const limit = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filterStatus && filterStatus !== 'ALL') params.set('currentStatus', filterStatus);
      if (filterKhoaHoc) params.set('khoaHoc', filterKhoaHoc);
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
  }, [page, search, filterStatus, filterKhoaHoc, filterStudyMode]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Quản lý Học viên
          </h1>
          <p className="text-muted-foreground text-sm mt-1">UC-51 – Hồ sơ người học toàn trình</p>
        </div>
        <div className="text-sm text-muted-foreground">{meta.total} học viên</div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm mã học viên, họ tên, email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStudyMode} onValueChange={v => { setFilterStudyMode(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Hình thức đào tạo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hình thức</SelectItem>
                <SelectItem value="CHINH_QUY">Chính quy</SelectItem>
                <SelectItem value="LIEN_THONG">Liên thông</SelectItem>
                <SelectItem value="SAU_DAI_HOC">Sau đại học</SelectItem>
                <SelectItem value="BOI_DUONG">Bồi dưỡng ngắn hạn</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Khóa học (VD: K45)"
              className="w-36"
              value={filterKhoaHoc}
              onChange={e => { setFilterKhoaHoc(e.target.value); setPage(1); }}
            />

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      <StudentTable
        students={students}
        loading={loading}
        meta={meta}
        page={page}
        onPageChange={setPage}
      />
    </div>
  );
}
