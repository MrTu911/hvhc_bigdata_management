'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Eye } from 'lucide-react';
import Link from 'next/link';

export const PROGRAM_TYPE_LABELS: Record<string, string> = {
  UNDERGRADUATE: 'Đại học',
  GRADUATE: 'Sau đại học',
  VOCATIONAL: 'Nghề',
  SHORT_COURSE: 'Ngắn hạn',
  PROFESSIONAL: 'Bồi dưỡng',
};

export const CURRICULUM_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  ACTIVE: 'Đang hoạt động',
  ARCHIVED: 'Lưu trữ',
  EXPIRED: 'Hết hạn',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'outline',
  PENDING_APPROVAL: 'secondary',
  ACTIVE: 'default',
  ARCHIVED: 'secondary',
  EXPIRED: 'destructive',
};

export function ProgramTable({
  programs,
  loading,
}: {
  programs: any[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Danh sách chương trình đào tạo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có chương trình đào tạo nào</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã CTĐT</TableHead>
                <TableHead>Tên chương trình</TableHead>
                <TableHead>Loại hình</TableHead>
                <TableHead>Khoa / Đơn vị</TableHead>
                <TableHead className="text-center">Tổng TC</TableHead>
                <TableHead className="text-center">Số TC kế hoạch</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold">{p.code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.nameEn && (
                      <div className="text-xs text-muted-foreground italic">{p.nameEn}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {PROGRAM_TYPE_LABELS[p.programType] || p.programType}
                    </span>
                    {p.durationYears && (
                      <span className="text-xs text-muted-foreground ml-1">({p.durationYears} năm)</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{p.unit?.name || '—'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold">{p.totalCredits ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {p._count?.curriculumPlans ?? 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[p.status] || 'outline'}>
                      {CURRICULUM_STATUS_LABELS[p.status] || p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/education/programs/${p.id}`}>
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
      </CardContent>
    </Card>
  );
}
