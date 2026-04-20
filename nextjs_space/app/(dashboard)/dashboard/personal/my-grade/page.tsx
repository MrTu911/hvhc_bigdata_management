'use client';

/**
 * /dashboard/personal/my-grade
 * Xem điểm học tập của bản thân — Tầng 2, Học viên/Sinh viên.
 */

import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GradeItem {
  courseId: string;
  courseCode: string;
  courseName: string;
  credits: number;
  registrationStatus: string;
  registeredAt: string;
  grade: {
    id: string;
    midtermScore: number | null;
    finalScore: number | null;
    totalScore: number | null;
    letterGrade: string | null;
    status: string;
    gradedAt: string | null;
  } | null;
}

interface HocVienInfo {
  id: string;
  maHocVien: string;
  hoTen: string;
  diemTrungBinh: number;
  academicStatus: string;
}

interface GradeData {
  hocVien: HocVienInfo | null;
  grades: GradeItem[];
}

const GRADE_COLOR: Record<string, string> = {
  A: 'text-green-600', B: 'text-blue-600', C: 'text-yellow-600',
  D: 'text-orange-600', F: 'text-red-600',
};

export default function MyGradePage() {
  const [data, setData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/personal/my-grade')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        else setError(res.error ?? 'Không thể tải dữ liệu');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-muted-foreground">Đang tải...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;

  if (!data?.hocVien) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Không tìm thấy hồ sơ học viên liên kết với tài khoản này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" /> Điểm học tập
        </h1>
        <p className="text-muted-foreground mt-1">{data.hocVien.hoTen} — Mã: {data.hocVien.maHocVien}</p>
      </div>

      <div className="flex gap-4">
        <Card className="flex-1">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-primary">{data.hocVien.diemTrungBinh.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">Điểm trung bình</div>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{data.grades.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Môn học đã đăng ký</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bảng điểm chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4">Môn học</th>
                  <th className="py-2 pr-4 text-center">TC</th>
                  <th className="py-2 pr-4 text-center">Giữa kỳ</th>
                  <th className="py-2 pr-4 text-center">Cuối kỳ</th>
                  <th className="py-2 pr-4 text-center">Tổng</th>
                  <th className="py-2 text-center">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {data.grades.map((g) => (
                  <tr key={g.courseId} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-4">
                      <div>{g.courseName}</div>
                      <div className="text-xs text-muted-foreground">{g.courseCode}</div>
                    </td>
                    <td className="py-2 pr-4 text-center">{g.credits}</td>
                    <td className="py-2 pr-4 text-center">{g.grade?.midtermScore ?? '—'}</td>
                    <td className="py-2 pr-4 text-center">{g.grade?.finalScore ?? '—'}</td>
                    <td className="py-2 pr-4 text-center font-medium">{g.grade?.totalScore ?? '—'}</td>
                    <td className="py-2 text-center">
                      {g.grade?.letterGrade ? (
                        <span className={`font-bold ${GRADE_COLOR[g.grade.letterGrade.charAt(0)] ?? ''}`}>
                          {g.grade.letterGrade}
                        </span>
                      ) : (
                        <Badge variant="outline">{g.grade?.status ?? 'Chờ điểm'}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
                {data.grades.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Chưa có điểm nào.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
