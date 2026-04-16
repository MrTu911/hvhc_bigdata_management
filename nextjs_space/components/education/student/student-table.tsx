'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Eye, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang học',
  TEMP_SUSPENDED: 'Tạm ngưng',
  STUDY_DELAY: 'Bảo lưu',
  REPEATING: 'Học lại',
  DROPPED_OUT: 'Thôi học',
  GRADUATED: 'Tốt nghiệp',
  RESERVED: 'Dự bị',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  TEMP_SUSPENDED: 'secondary',
  STUDY_DELAY: 'secondary',
  REPEATING: 'outline',
  DROPPED_OUT: 'destructive',
  GRADUATED: 'secondary',
  RESERVED: 'outline',
};

type Meta = { total: number; totalPages: number };

export function StudentTable({
  students,
  loading,
  meta,
  page,
  onPageChange,
}: {
  students: any[];
  loading: boolean;
  meta: Meta;
  page: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Danh sách học viên
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy học viên nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HV</TableHead>
                <TableHead>Họ tên</TableHead>
                <TableHead>Hệ / Tiểu đoàn</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Ngành</TableHead>
                <TableHead>CTĐT</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Tín chỉ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm font-semibold">{s.maHocVien}</TableCell>
                  <TableCell>
                    <div className="font-medium">{s.hoTen}</div>
                    {s.studyMode && (
                      <div className="text-xs text-muted-foreground">{s.studyMode}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.trainingSystemUnit ? (
                      <div>
                        <div className="text-xs font-semibold text-indigo-700">{s.trainingSystemUnit.name}</div>
                        {s.battalionUnit && (
                          <div className="text-xs text-muted-foreground">{s.battalionUnit.name}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{s.lop || '—'}</TableCell>
                  <TableCell>{s.nganh || '—'}</TableCell>
                  <TableCell>
                    {s.currentProgramVersion ? (
                      <span className="text-xs font-mono bg-muted px-1 py-0.5 rounded">
                        {s.currentProgramVersion.versionCode}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {s.diemTrungBinh != null ? s.diemTrungBinh.toFixed(2) : '—'}
                    </span>
                  </TableCell>
                  <TableCell>{s.tinChiTichLuy ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[s.currentStatus] || 'outline'}>
                      {STATUS_LABELS[s.currentStatus] || s.currentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/education/students/${s.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Xem
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {meta.totalPages} ({meta.total} kết quả)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
