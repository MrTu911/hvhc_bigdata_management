/**
 * M10 – UC-56: Quản lý điểm học phần
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { BookOpen, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { GradeGrid } from '@/components/education/grades/grade-grid';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chưa nhập', GRADED: 'Đã nhập', FINALIZED: 'Đã khóa',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GradesPage() {
  // Meta
  const [terms, setTerms]       = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Selections
  const [selectedTermId,    setSelectedTermId]    = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Grade data
  const [enrollments, setEnrollments] = useState<any[]>([]);

  // Loading
  const [loadingTerms,    setLoadingTerms]    = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingGrades,   setLoadingGrades]   = useState(false);

  const selectedSection = sections.find(s => s.id === selectedSectionId);

  // ─── Grade summary stats ─────────────────────────────────────────────

  const stats = {
    total:     enrollments.length,
    pending:   enrollments.filter(e => e.gradeStatus === 'PENDING').length,
    graded:    enrollments.filter(e => e.gradeStatus === 'GRADED').length,
    finalized: enrollments.filter(e => e.gradeStatus === 'FINALIZED').length,
    passed:    enrollments.filter(e => e.passFlag === true).length,
    failed:    enrollments.filter(e => e.passFlag === false).length,
  };

  // ─── Fetch terms ──────────────────────────────────────────────────────

  useEffect(() => {
    setLoadingTerms(true);
    fetch('/api/education/terms')
      .then(r => r.json())
      .then(j => setTerms(Array.isArray(j) ? j : []))
      .catch(() => toast.error('Lỗi tải học kỳ'))
      .finally(() => setLoadingTerms(false));
  }, []);

  // ─── Fetch sections when term changes ─────────────────────────────────

  useEffect(() => {
    if (!selectedTermId || selectedTermId === '__none__') {
      setSections([]); setSelectedSectionId(''); setEnrollments([]);
      return;
    }
    setLoadingSections(true);
    setSections([]); setSelectedSectionId(''); setEnrollments([]);
    fetch(`/api/education/class-sections?termId=${selectedTermId}&limit=200`)
      .then(r => r.json())
      .then(j => setSections(j.data || []))
      .catch(() => toast.error('Lỗi tải lớp học phần'))
      .finally(() => setLoadingSections(false));
  }, [selectedTermId]);

  // ─── Fetch grades when section changes ───────────────────────────────

  const fetchGrades = useCallback(async () => {
    if (!selectedSectionId || selectedSectionId === '__none__') {
      setEnrollments([]); return;
    }
    setLoadingGrades(true);
    try {
      const res  = await fetch(`/api/education/grades?classSectionId=${selectedSectionId}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải điểm');
      setEnrollments(json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingGrades(false);
    }
  }, [selectedSectionId]);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Quản lý điểm học phần
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          UC-56 – Nhập & tra cứu điểm, lịch sử thay đổi điểm
        </p>
      </div>

      {/* Selector panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Chọn học kỳ và lớp học phần
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selectors row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Term */}
            <div className="flex items-center gap-2 min-w-[220px]">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Học kỳ</span>
              <Select
                value={selectedTermId || '__none__'}
                onValueChange={v => setSelectedTermId(v === '__none__' ? '' : v)}
                disabled={loadingTerms}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={loadingTerms ? 'Đang tải...' : 'Chọn học kỳ'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chọn học kỳ —</SelectItem>
                  {terms.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}{t.isCurrent ? ' ★' : ''}
                      {t.academicYear ? ` (${t.academicYear.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

            {/* Section */}
            <div className="flex items-center gap-2 min-w-[280px] flex-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Lớp học phần</span>
              <Select
                value={selectedSectionId || '__none__'}
                onValueChange={v => setSelectedSectionId(v === '__none__' ? '' : v)}
                disabled={!selectedTermId || loadingSections}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={
                    !selectedTermId   ? 'Chọn học kỳ trước' :
                    loadingSections   ? 'Đang tải...' :
                    sections.length === 0 ? 'Không có lớp' : 'Chọn lớp học phần'
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Chọn lớp —</SelectItem>
                  {sections.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="font-mono text-xs mr-2">{s.code}</span>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section meta */}
          {selectedSection && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
                {selectedSection.curriculumCourse && (
                  <div>
                    <span className="text-muted-foreground">Học phần: </span>
                    <span className="font-medium">
                      {selectedSection.curriculumCourse.subjectName}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({selectedSection.curriculumCourse.subjectCode} · {selectedSection.curriculumCourse.credits} TC)
                      </span>
                    </span>
                  </div>
                )}
                {selectedSection.faculty?.user?.name && (
                  <div>
                    <span className="text-muted-foreground">Giảng viên: </span>
                    <span className="font-medium">{selectedSection.faculty.user.name}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Grade table */}
      {selectedSectionId && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Bảng điểm
                {selectedSection && (
                  <span className="text-sm font-normal text-muted-foreground">
                    — <span className="font-mono">{selectedSection.code}</span>
                  </span>
                )}
              </CardTitle>

              {/* Summary stats */}
              {!loadingGrades && enrollments.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">{stats.total} học viên</span>
                  <span>·</span>
                  <Badge variant="outline" className="text-xs">Chưa nhập: {stats.pending}</Badge>
                  <Badge variant="default" className="text-xs">Đã nhập: {stats.graded}</Badge>
                  <Badge variant="secondary" className="text-xs">Đã khóa: {stats.finalized}</Badge>
                  {stats.passed + stats.failed > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-green-700">Đạt: {stats.passed}</span>
                      <span className="text-destructive">Trượt: {stats.failed}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Column header legend */}
            {!loadingGrades && enrollments.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                CC = Chuyên cần · BT = Bài tập · GK = Giữa kỳ · CK = Cuối kỳ · TK = Tổng kết
              </p>
            )}
          </CardHeader>

          <CardContent>
            {loadingGrades ? (
              <div className="flex items-center gap-2 justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải bảng điểm...
              </div>
            ) : (
              <GradeGrid enrollments={enrollments} onRefresh={fetchGrades} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state — no section selected yet */}
      {!selectedSectionId && !loadingSections && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Chọn học kỳ và lớp học phần để xem bảng điểm
        </div>
      )}
    </div>
  );
}
