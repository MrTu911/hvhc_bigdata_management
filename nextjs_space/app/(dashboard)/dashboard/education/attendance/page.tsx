/**
 * M10 – UC-55: Điểm danh và chuyên cần
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CalendarCheck, ChevronRight, ClipboardList, Loader2 } from 'lucide-react';
import { AttendanceSheet } from '@/components/education/attendance/attendance-sheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SESSION_TYPE_LABELS: Record<string, string> = {
  THEORY:    'Lý thuyết',
  PRACTICE:  'Thực hành',
  SEMINAR:   'Seminar',
  EXAM:      'Kiểm tra',
  MAKEUP:    'Học bù',
};

const SESSION_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  SCHEDULED:  'outline',
  COMPLETED:  'default',
  CANCELLED:  'destructive',
};

const SESSION_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Chờ điểm danh',
  COMPLETED: 'Đã điểm danh',
  CANCELLED: 'Đã hủy',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  // Meta selectors
  const [terms, setTerms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // Selections
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Loading states
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Derived
  const selectedSection = sections.find(s => s.id === selectedSectionId);
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const sessionLabel = selectedSession
    ? `Buổi ${selectedSession.sessionNumber} – ${formatDate(selectedSession.sessionDate)}`
    : '';

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
      setSections([]);
      setSelectedSectionId('');
      return;
    }
    setLoadingSections(true);
    setSections([]);
    setSelectedSectionId('');
    setSelectedSessionId('');
    setSessions([]);
    fetch(`/api/education/class-sections?termId=${selectedTermId}&limit=200`)
      .then(r => r.json())
      .then(j => setSections(j.data || []))
      .catch(() => toast.error('Lỗi tải lớp học phần'))
      .finally(() => setLoadingSections(false));
  }, [selectedTermId]);

  // ─── Fetch sessions when section changes ──────────────────────────────

  useEffect(() => {
    if (!selectedSectionId || selectedSectionId === '__none__') {
      setSessions([]);
      setSelectedSessionId('');
      return;
    }
    setLoadingSessions(true);
    setSessions([]);
    setSelectedSessionId('');
    fetch(`/api/education/sessions?classSectionId=${selectedSectionId}`)
      .then(r => r.json())
      .then(j => setSessions(Array.isArray(j) ? j : []))
      .catch(() => toast.error('Lỗi tải buổi học'))
      .finally(() => setLoadingSessions(false));
  }, [selectedSectionId]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          Điểm danh & Chuyên cần
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          UC-55 – Ghi nhận điểm danh theo buổi học
        </p>
      </div>

      {/* Selector panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Chọn lớp học phần và buổi học
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: Term + Section */}
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
                      {t.name}
                      {t.isCurrent ? ' ★' : ''}
                      {t.academicYear ? ` (${t.academicYear.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />

            {/* Section */}
            <div className="flex items-center gap-2 min-w-[260px] flex-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Lớp học phần</span>
              <Select
                value={selectedSectionId || '__none__'}
                onValueChange={v => setSelectedSectionId(v === '__none__' ? '' : v)}
                disabled={!selectedTermId || loadingSections}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={
                    !selectedTermId ? 'Chọn học kỳ trước' :
                    loadingSections ? 'Đang tải...' :
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

          {/* Row 2: Section info + Session list */}
          {selectedSection && (
            <>
              <Separator />
              <div className="flex flex-wrap gap-4 text-sm">
                {selectedSection.curriculumCourse && (
                  <div>
                    <span className="text-muted-foreground">Học phần: </span>
                    <span className="font-medium">
                      {selectedSection.curriculumCourse.subjectName}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({selectedSection.curriculumCourse.subjectCode} – {selectedSection.curriculumCourse.credits} TC)
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
                <div>
                  <span className="text-muted-foreground">Sĩ số: </span>
                  <span className="font-medium">{selectedSection._count?.enrollments ?? 0} / {selectedSection.maxStudents}</span>
                </div>
              </div>
            </>
          )}

          {/* Session list */}
          {selectedSectionId && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {loadingSessions
                    ? 'Đang tải buổi học...'
                    : sessions.length === 0
                    ? 'Chưa có buổi học nào được tạo cho lớp này'
                    : `${sessions.length} buổi học`}
                </p>

                {loadingSessions && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải...
                  </div>
                )}

                {!loadingSessions && sessions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {sessions.map((sess: any) => {
                      const isSelected = selectedSessionId === sess.id;
                      const statusVariant = SESSION_STATUS_VARIANTS[sess.status] ?? 'outline';
                      return (
                        <button
                          key={sess.id}
                          onClick={() => setSelectedSessionId(isSelected ? '' : sess.id)}
                          className={[
                            'rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                            'hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40',
                            isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                              : 'border-border bg-background',
                          ].join(' ')}
                        >
                          <div className="font-semibold mb-1">
                            Buổi {sess.sessionNumber}
                          </div>
                          <div className="text-muted-foreground">
                            {formatDate(sess.sessionDate)}
                          </div>
                          <div className="mt-1 flex items-center gap-1 flex-wrap">
                            <span className="text-muted-foreground">
                              {SESSION_TYPE_LABELS[sess.sessionType] ?? sess.sessionType}
                            </span>
                            <Badge variant={statusVariant} className="text-xs px-1 py-0">
                              {SESSION_STATUS_LABELS[sess.status] ?? sess.status}
                            </Badge>
                            {sess._count?.attendances > 0 && (
                              <span className="text-green-700">
                                {sess._count.attendances}✓
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Attendance Sheet */}
      {selectedSessionId && selectedSectionId ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-5 w-5" />
              Bảng điểm danh – {sessionLabel}
              {selectedSection && (
                <span className="text-sm font-normal text-muted-foreground">
                  — {selectedSection.code}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceSheet
              key={selectedSessionId}   // remount when session changes
              sessionId={selectedSessionId}
              classSectionId={selectedSectionId}
              sessionLabel={sessionLabel}
            />
          </CardContent>
        </Card>
      ) : (
        selectedSectionId && !loadingSessions && sessions.length > 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <CalendarCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
            Chọn một buổi học ở trên để bắt đầu điểm danh
          </div>
        )
      )}
    </div>
  );
}
