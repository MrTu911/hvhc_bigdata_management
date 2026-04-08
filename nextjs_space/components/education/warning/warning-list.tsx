'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, ShieldAlert } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReasonJson = {
  gpa?: number;
  failedCredits?: number;
  tinChiTichLuy?: number;
  tongTinChi?: number;
};

export type Warning = {
  id: string;
  hocVienId: string;
  academicYear: string;
  semesterCode: string;
  warningLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  warningReasonJson: ReasonJson | null;
  suggestedAction: string | null;
  isResolved: boolean;
  resolvedAt: string | null;
  generatedAt: string;
  hocVien: {
    id: string;
    maHocVien: string | null;
    hoTen: string;
    lop: string | null;
  };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_BADGE: Record<string, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  className: string;
}> = {
  CRITICAL: { label: 'Nghiêm trọng', variant: 'destructive', className: '' },
  HIGH:     { label: 'Cao',          variant: 'outline', className: 'border-orange-300 text-orange-700 bg-orange-50' },
  MEDIUM:   { label: 'Trung bình',   variant: 'outline', className: 'border-amber-300 text-amber-700 bg-amber-50' },
  LOW:      { label: 'Nhẹ',          variant: 'outline', className: 'border-blue-300 text-blue-700 bg-blue-50' },
};

const ROW_BG: Record<string, string> = {
  CRITICAL: 'bg-red-50/40',
  HIGH:     'bg-orange-50/30',
  MEDIUM:   'bg-amber-50/30',
  LOW:      '',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ─── WarningList ──────────────────────────────────────────────────────────────

export function WarningList({
  warnings,
  loading,
  meta,
  onPageChange,
  onRecalculate,
  recalculatingId,
}: {
  warnings: Warning[];
  loading: boolean;
  meta: { total: number; page: number; totalPages: number };
  onPageChange: (p: number) => void;
  onRecalculate: (w: Warning) => void;
  recalculatingId: string | null;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 justify-center py-14 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Đang tải danh sách cảnh báo...
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <div className="text-center py-14 text-muted-foreground">
        <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-500 opacity-60" />
        <p className="font-medium">Không có cảnh báo học vụ nào</p>
        <p className="text-sm mt-1">Thay đổi bộ lọc hoặc chạy lại engine để cập nhật</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead className="w-24">Mã HV</TableHead>
              <TableHead className="min-w-[150px]">Họ và tên</TableHead>
              <TableHead className="w-20">Lớp</TableHead>
              <TableHead className="w-24">Năm học</TableHead>
              <TableHead className="w-20">Học kỳ</TableHead>
              <TableHead className="w-32">Mức cảnh báo</TableHead>
              <TableHead className="text-center w-20">GPA</TableHead>
              <TableHead className="text-center w-20">TC trượt</TableHead>
              <TableHead className="min-w-[200px]">Gợi ý xử lý</TableHead>
              <TableHead className="w-24 text-center">Trạng thái</TableHead>
              <TableHead className="w-28">Ngày tạo</TableHead>
              <TableHead className="text-right w-28">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warnings.map((w, idx) => {
              const levelCfg = LEVEL_BADGE[w.warningLevel] ?? LEVEL_BADGE.LOW;
              const reason   = w.warningReasonJson as ReasonJson | null;
              const isCalc   = recalculatingId === w.id;

              return (
                <TableRow key={w.id} className={w.isResolved ? 'opacity-60' : ROW_BG[w.warningLevel]}>
                  {/* # */}
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {(meta.page - 1) * 20 + idx + 1}
                  </TableCell>

                  {/* Mã HV */}
                  <TableCell>
                    <span className="font-mono text-xs">{w.hocVien.maHocVien ?? '—'}</span>
                  </TableCell>

                  {/* Họ tên */}
                  <TableCell>
                    <span className="font-medium text-sm">{w.hocVien.hoTen}</span>
                  </TableCell>

                  {/* Lớp */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{w.hocVien.lop ?? '—'}</span>
                  </TableCell>

                  {/* Năm học */}
                  <TableCell>
                    <span className="text-sm">{w.academicYear}</span>
                  </TableCell>

                  {/* Học kỳ */}
                  <TableCell>
                    <span className="text-sm">{w.semesterCode}</span>
                  </TableCell>

                  {/* Mức cảnh báo */}
                  <TableCell>
                    <Badge
                      variant={levelCfg.variant}
                      className={`text-xs ${levelCfg.className}`}
                    >
                      {w.warningLevel === 'CRITICAL' && (
                        <ShieldAlert className="h-3 w-3 mr-1 inline" />
                      )}
                      {levelCfg.label}
                    </Badge>
                  </TableCell>

                  {/* GPA */}
                  <TableCell className="text-center">
                    {reason?.gpa != null ? (
                      <span className={`font-mono text-sm font-medium ${
                        reason.gpa < 1.5 ? 'text-destructive' :
                        reason.gpa < 2.0 ? 'text-orange-600' :
                        reason.gpa < 2.5 ? 'text-amber-600' : ''
                      }`}>
                        {reason.gpa.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Tín chỉ trượt */}
                  <TableCell className="text-center">
                    {reason?.failedCredits != null ? (
                      <span className={`font-mono text-sm font-medium ${
                        reason.failedCredits >= 12 ? 'text-destructive' :
                        reason.failedCredits >= 6  ? 'text-orange-600' : 'text-amber-600'
                      }`}>
                        {reason.failedCredits}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Gợi ý xử lý */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground leading-snug">
                      {w.suggestedAction ?? '—'}
                    </span>
                  </TableCell>

                  {/* Trạng thái */}
                  <TableCell className="text-center">
                    {w.isResolved ? (
                      <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1 inline" />
                        Đã xử lý
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-orange-700 border-orange-200">
                        Chưa xử lý
                      </Badge>
                    )}
                  </TableCell>

                  {/* Ngày tạo */}
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{formatDate(w.generatedAt)}</span>
                  </TableCell>

                  {/* Thao tác */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onRecalculate(w)}
                      disabled={isCalc}
                      title="Tính lại cảnh báo cho học viên này"
                    >
                      {isCalc
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5" />}
                      Tính lại
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Trang {meta.page} / {meta.totalPages} ({meta.total} cảnh báo)</span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page === meta.totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
