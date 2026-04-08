/**
 * M10 – UC-53: Kế hoạch đào tạo theo học kỳ
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, CalendarDays } from 'lucide-react';
import {
  SemesterPlanBoard,
  PLAN_STATUS_LABELS,
} from '@/components/education/planning/semester-plan-board';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('');
  const [filterProgram, setFilterProgram] = useState('');

  const fetchMeta = useCallback(async () => {
    try {
      const [progRes, yearRes] = await Promise.all([
        fetch('/api/education/programs?status=ACTIVE'),
        fetch('/api/education/academic-years'),
      ]);
      if (progRes.ok) {
        const pj = await progRes.json();
        setPrograms(Array.isArray(pj) ? pj : pj.data || []);
      }
      if (yearRes.ok) {
        const yj = await yearRes.json();
        setAcademicYears(Array.isArray(yj) ? yj : yj.data || []);
      }
    } catch {
      // meta failures are non-critical for rendering the page
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterAcademicYear && filterAcademicYear !== 'ALL') params.set('academicYearId', filterAcademicYear);
      if (filterProgram && filterProgram !== 'ALL') params.set('programId', filterProgram);

      const res = await fetch(`/api/education/curriculum?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setPlans(Array.isArray(json) ? json : json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterAcademicYear, filterProgram]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Kế hoạch Đào tạo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            UC-53 – Lập và quản lý kế hoạch đào tạo theo học kỳ
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{plans.length} kế hoạch</span>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Tìm mã hoặc tên kế hoạch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={filterAcademicYear} onValueChange={v => setFilterAcademicYear(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Năm học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả năm học</SelectItem>
                {academicYears.map((y: any) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProgram} onValueChange={v => setFilterProgram(v)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Chương trình ĐT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả CTĐT</SelectItem>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} – {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={v => setFilterStatus(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(PLAN_STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" /> Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      <SemesterPlanBoard
        plans={plans}
        programs={programs}
        academicYears={academicYears}
        loading={loading}
        onRefresh={fetchPlans}
      />
    </div>
  );
}
