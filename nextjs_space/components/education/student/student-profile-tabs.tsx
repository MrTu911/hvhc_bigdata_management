'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import {
  AlertTriangle, BookOpen, GraduationCap, Loader2, Star, User,
} from 'lucide-react';
import { ConductRecordTable } from './conduct-record-table';

const GRADE_WORKFLOW_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground min-w-[160px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

type Profile360 = {
  profile: any;
  summary: any;
  ketQuaHocTap: any[];
  classEnrollments: any[];
};

export function StudentProfileTabs({
  studentId,
  profile360,
}: {
  studentId: string;
  profile360: Profile360;
}) {
  const { profile, ketQuaHocTap, classEnrollments } = profile360;

  const [conductRecords, setConductRecords] = useState<any[]>([]);
  const [conductLoading, setConductLoading] = useState(false);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [warningsLoading, setWarningsLoading] = useState(false);
  const [thesis, setThesis] = useState<any[]>([]);
  const [thesisLoading, setThesisLoading] = useState(false);
  const [graduationAudits, setGraduationAudits] = useState<any[]>([]);
  const [graduationLoading, setGraduationLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [runningAudit, setRunningAudit] = useState(false);

  const fetchConduct = async () => {
    setConductLoading(true);
    try {
      const res = await fetch(`/api/education/students/${studentId}/conduct`);
      const json = await res.json();
      if (res.ok) setConductRecords(json.data?.records || []);
    } finally {
      setConductLoading(false);
    }
  };

  const fetchWarnings = async () => {
    setWarningsLoading(true);
    try {
      const res = await fetch(`/api/education/warnings?hocVienId=${studentId}&limit=50`);
      const json = await res.json();
      if (res.ok) setWarnings(json.data || []);
    } finally {
      setWarningsLoading(false);
    }
  };

  const fetchThesis = async () => {
    setThesisLoading(true);
    try {
      const res = await fetch(`/api/education/thesis?hocVienId=${studentId}`);
      const json = await res.json();
      if (res.ok) setThesis(json.data || []);
    } finally {
      setThesisLoading(false);
    }
  };

  const fetchGraduation = async () => {
    setGraduationLoading(true);
    try {
      const res = await fetch(`/api/education/graduation/audit?hocVienId=${studentId}`);
      const json = await res.json();
      if (res.ok) setGraduationAudits(json.data || []);
    } finally {
      setGraduationLoading(false);
    }
  };

  const handleRecalculateWarning = async () => {
    const academicYear = prompt('Năm học (VD: 2024-2025):');
    const semesterCode = prompt('Học kỳ (VD: HK1):');
    if (!academicYear || !semesterCode) return;
    setRecalculating(true);
    try {
      const res = await fetch('/api/education/warnings/recalculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hocVienId: studentId, academicYear, semesterCode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.data.warningLevel
        ? `Cảnh báo: ${json.data.warningLevel}`
        : 'Không có cảnh báo học vụ');
      fetchWarnings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRecalculating(false);
    }
  };

  const handleRunGraduationAudit = async () => {
    setRunningAudit(true);
    try {
      const res = await fetch('/api/education/graduation/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hocVienId: studentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(json.data.graduationEligible
        ? 'Học viên đủ điều kiện tốt nghiệp'
        : 'Chưa đủ điều kiện tốt nghiệp');
      fetchGraduation();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRunningAudit(false);
    }
  };

  return (
    <Tabs defaultValue="profile">
      <TabsList className="flex-wrap">
        <TabsTrigger value="profile"><User className="h-4 w-4 mr-1" />Hồ sơ</TabsTrigger>
        <TabsTrigger value="grades"><BookOpen className="h-4 w-4 mr-1" />Kết quả học tập</TabsTrigger>
        <TabsTrigger value="conduct" onClick={fetchConduct}><Star className="h-4 w-4 mr-1" />Rèn luyện</TabsTrigger>
        <TabsTrigger value="enrollments"><GraduationCap className="h-4 w-4 mr-1" />Đăng ký học phần</TabsTrigger>
        <TabsTrigger value="warnings" onClick={fetchWarnings}><AlertTriangle className="h-4 w-4 mr-1" />Cảnh báo học vụ</TabsTrigger>
        <TabsTrigger value="thesis" onClick={fetchThesis}><BookOpen className="h-4 w-4 mr-1" />Khóa luận</TabsTrigger>
        <TabsTrigger value="graduation" onClick={fetchGraduation}><GraduationCap className="h-4 w-4 mr-1" />Tốt nghiệp</TabsTrigger>
      </TabsList>

      {/* ── Hồ sơ cá nhân ── */}
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Thông tin cá nhân</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <InfoRow label="Mã học viên" value={profile.maHocVien} />
              <InfoRow label="Họ tên" value={profile.hoTen} />
              <InfoRow label="Ngày sinh" value={profile.ngaySinh ? new Date(profile.ngaySinh).toLocaleDateString('vi-VN') : '—'} />
              <InfoRow label="Giới tính" value={profile.gioiTinh || '—'} />
              <InfoRow label="Email" value={profile.email || '—'} />
              <InfoRow label="Điện thoại" value={profile.dienThoai || '—'} />
              <InfoRow label="Lớp" value={profile.lop || '—'} />
              <InfoRow label="Khóa học" value={profile.khoaHoc || '—'} />
              <InfoRow label="Ngành" value={profile.major?.name || profile.nganh || '—'} />
              <InfoRow label="Hình thức đào tạo" value={profile.studyMode || profile.heDaoTao || '—'} />
              <InfoRow label="Khoa quản lý" value={profile.khoaQuanLy || '—'} />
              <InfoRow label="Ngày nhập học" value={profile.ngayNhapHoc ? new Date(profile.ngayNhapHoc).toLocaleDateString('vi-VN') : '—'} />
              <InfoRow label="Cố vấn học tập" value={profile.giangVienHuongDan?.user?.name || '—'} />
              <InfoRow label="CTĐT phiên bản" value={profile.currentProgramVersion?.versionCode || '—'} />
              {profile.currentProgramVersion?.program && (
                <InfoRow label="Chương trình" value={profile.currentProgramVersion.program.name} />
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Kết quả học tập ── */}
      <TabsContent value="grades">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />Kết quả học tập ({ketQuaHocTap.length} môn)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ketQuaHocTap.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có dữ liệu kết quả học tập.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Mã môn</TableHead>
                    <TableHead>Năm học</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>TC</TableHead>
                    <TableHead>ĐTK</TableHead>
                    <TableHead>Xếp loại</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ketQuaHocTap.map((k: any) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.monHoc}</TableCell>
                      <TableCell className="font-mono text-xs">{k.maMon || '—'}</TableCell>
                      <TableCell>{k.namHoc || '—'}</TableCell>
                      <TableCell>{k.hocKy || '—'}</TableCell>
                      <TableCell>{k.soTinChi}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${k.diemTongKet != null && k.diemTongKet >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                          {k.diemTongKet?.toFixed(1) ?? k.diem?.toFixed(1) ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>{k.xepLoai || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={k.ketQua === 'Yếu' || k.ketQua === 'Kém' ? 'destructive' : 'secondary'}>
                          {k.ketQua || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {GRADE_WORKFLOW_LABELS[k.workflowStatus] || k.workflowStatus}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Rèn luyện ── */}
      <TabsContent value="conduct">
        <ConductRecordTable
          studentId={studentId}
          records={conductRecords}
          loading={conductLoading}
          onRefresh={fetchConduct}
        />
      </TabsContent>

      {/* ── Đăng ký học phần ── */}
      <TabsContent value="enrollments">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />Đăng ký học phần ({classEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classEnrollments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có đăng ký học phần.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp học phần</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>TC</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classEnrollments.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-sm">{e.classSection?.code || '—'}</TableCell>
                      <TableCell>{e.classSection?.curriculumCourse?.subjectName || e.classSection?.name || '—'}</TableCell>
                      <TableCell>{e.classSection?.curriculumCourse?.credits ?? '—'}</TableCell>
                      <TableCell>{e.classSection?.term?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'ENROLLED' ? 'default' : 'secondary'}>
                          {e.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Cảnh báo học vụ ── */}
      <TabsContent value="warnings">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />Cảnh báo học vụ
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleRecalculateWarning} disabled={recalculating}>
              {recalculating
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <AlertTriangle className="h-4 w-4 mr-1" />}
              Tính lại cảnh báo
            </Button>
          </CardHeader>
          <CardContent>
            {warningsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : warnings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Không có cảnh báo học vụ.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Năm học</TableHead>
                    <TableHead>Học kỳ</TableHead>
                    <TableHead>Mức cảnh báo</TableHead>
                    <TableHead>Gợi ý xử lý</TableHead>
                    <TableHead>Đã xử lý</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell>{w.academicYear}</TableCell>
                      <TableCell>{w.semesterCode}</TableCell>
                      <TableCell>
                        <Badge variant={
                          w.warningLevel === 'CRITICAL' || w.warningLevel === 'HIGH'
                            ? 'destructive'
                            : w.warningLevel === 'MEDIUM'
                              ? 'secondary'
                              : 'outline'
                        }>
                          {w.warningLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{w.suggestedAction || '—'}</TableCell>
                      <TableCell>
                        {w.isResolved
                          ? <Badge variant="secondary">Đã xử lý</Badge>
                          : <Badge variant="outline">Chưa xử lý</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Khóa luận ── */}
      <TabsContent value="thesis">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />Khóa luận / Luận văn / Đồ án
            </CardTitle>
          </CardHeader>
          <CardContent>
            {thesisLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : thesis.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có đề tài khóa luận.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại</TableHead>
                    <TableHead>Tên đề tài</TableHead>
                    <TableHead>GV hướng dẫn</TableHead>
                    <TableHead>Ngày bảo vệ</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thesis.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="capitalize">{t.thesisType}</TableCell>
                      <TableCell className="font-medium">{t.title}</TableCell>
                      <TableCell>{t.advisor?.user?.name || '—'}</TableCell>
                      <TableCell>
                        {t.defenseDate ? new Date(t.defenseDate).toLocaleDateString('vi-VN') : '—'}
                      </TableCell>
                      <TableCell>{t.defenseScore != null ? t.defenseScore.toFixed(1) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          t.status === 'DEFENDED' ? 'default'
                            : t.status === 'ARCHIVED' ? 'secondary'
                              : 'outline'
                        }>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tốt nghiệp ── */}
      <TabsContent value="graduation">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />Xét tốt nghiệp
            </CardTitle>
            <Button size="sm" onClick={handleRunGraduationAudit} disabled={runningAudit}>
              {runningAudit
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <GraduationCap className="h-4 w-4 mr-1" />}
              Chạy xét tốt nghiệp
            </Button>
          </CardHeader>
          <CardContent>
            {graduationLoading ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
            ) : graduationAudits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Chưa có kết quả xét tốt nghiệp.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày xét</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Tín chỉ đạt</TableHead>
                    <TableHead>Rèn luyện</TableHead>
                    <TableHead>Khóa luận</TableHead>
                    <TableHead>Đủ điều kiện</TableHead>
                    <TableHead>Số văn bằng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {graduationAudits.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>{new Date(a.auditDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="font-semibold">{a.gpa?.toFixed(2) ?? '—'}</TableCell>
                      <TableCell>{a.totalCreditsEarned ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={a.conductEligible ? 'default' : 'destructive'}>
                          {a.conductEligible ? 'Đạt' : 'Chưa đạt'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.thesisEligible ? 'default' : 'destructive'}>
                          {a.thesisEligible ? 'Đạt' : 'Chưa đạt'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.graduationEligible ? 'default' : 'destructive'}>
                          {a.graduationEligible ? 'Đủ điều kiện' : 'Chưa đủ'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {a.diplomaRecord?.diplomaNo || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
