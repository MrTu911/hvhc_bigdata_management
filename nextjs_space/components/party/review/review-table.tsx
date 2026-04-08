'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, ExternalLink, Send, CheckCircle2, RotateCcw } from 'lucide-react';
import { REVIEW_GRADES } from './review-form';

// ─── Submission status helpers ────────────────────────
const SUBMISSION_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  DRAFT:     { label: 'Nháp',         badgeClass: 'bg-slate-100 text-slate-600 border border-slate-300' },
  SUBMITTED: { label: 'Đã nộp',       badgeClass: 'bg-amber-100 text-amber-700 border border-amber-300' },
  APPROVED:  { label: 'Đã duyệt',     badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300' },
  REJECTED:  { label: 'Trả lại',      badgeClass: 'bg-red-100 text-red-700 border border-red-300' },
};

function SubmissionBadge({ status }: { status?: string }) {
  const cfg = SUBMISSION_CONFIG[status ?? 'DRAFT'] ?? SUBMISSION_CONFIG.DRAFT;
  return <Badge className={cfg.badgeClass}>{cfg.label}</Badge>;
}

// ─── Grade helpers ────────────────────────────────────
const GRADE_MAP = Object.fromEntries(REVIEW_GRADES.map((g) => [g.value, g]));

function GradeBadge({ grade }: { grade: string }) {
  const g = GRADE_MAP[grade?.toUpperCase()];
  if (!g) return <Badge variant="outline">{grade || '—'}</Badge>;
  return <Badge className={g.badgeClass}>{g.short}</Badge>;
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Types ────────────────────────────────────────────
export interface ReviewRow {
  id: string;
  reviewYear?: number;
  grade?: string;
  comments?: string | null;
  evidenceUrl?: string | null;
  submissionStatus?: string;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  reviewNote?: string | null;
  createdAt?: string;
  partyMember?: {
    user?: {
      name?: string;
      militaryId?: string | null;
      rank?: string | null;
      position?: string | null;
      unitRelation?: { name: string } | null;
    };
  };
  // normalized fields from page
  partyMemberName?: string;
}

interface ReviewTableProps {
  items: ReviewRow[];
  loading?: boolean;
  onEdit?: (item: ReviewRow) => void;
  onDelete?: (item: ReviewRow) => void;
  onSubmit?: (item: ReviewRow) => void;
  onApprove?: (item: ReviewRow) => void;
  onReject?: (item: ReviewRow) => void;
  /** 'unit' = can submit; 'dept' = can approve/reject; 'academy' = read-only view */
  userRole?: 'unit' | 'dept' | 'academy';
}

// ─── Skeleton rows ────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────
export function ReviewTable({
  items, loading, onEdit, onDelete, onSubmit, onApprove, onReject, userRole = 'academy',
}: ReviewTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Đảng viên</TableHead>
            <TableHead className="w-[95px]">Mã QN</TableHead>
            <TableHead className="w-[150px]">Đơn vị</TableHead>
            <TableHead className="w-[60px] text-center">Năm</TableHead>
            <TableHead className="w-[110px] text-center">Xếp loại</TableHead>
            <TableHead className="w-[110px] text-center">Trạng thái</TableHead>
            <TableHead>Nhận xét</TableHead>
            <TableHead className="w-[72px] text-center">Minh chứng</TableHead>
            <TableHead className="w-[110px] text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <SkeletonRows />}

          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu đánh giá phân loại đảng viên.
              </TableCell>
            </TableRow>
          )}

          {!loading && items.map((x) => {
            const user = x.partyMember?.user;
            const name = x.partyMemberName || user?.name || '—';
            const militaryId = user?.militaryId || '—';
            const unit = user?.unitRelation?.name || '—';
            const grade = String(x.grade || '').toUpperCase();
            const status = x.submissionStatus ?? 'DRAFT';

            return (
              <TableRow key={x.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="font-medium text-sm">{name}</div>
                  {user?.position && (
                    <div className="text-xs text-muted-foreground">{user.position}</div>
                  )}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{militaryId}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{unit}</TableCell>
                <TableCell className="text-center font-semibold text-sm">{x.reviewYear ?? '—'}</TableCell>
                <TableCell className="text-center">
                  <GradeBadge grade={grade} />
                </TableCell>
                <TableCell className="text-center">
                  <SubmissionBadge status={status} />
                  {x.reviewNote && status === 'REJECTED' && (
                    <p className="text-xs text-red-600 mt-0.5 max-w-[100px] truncate" title={x.reviewNote}>
                      {x.reviewNote}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="max-w-[200px] truncate text-sm text-muted-foreground" title={x.comments ?? undefined}>
                    {x.comments || <span className="italic text-muted-foreground/40">—</span>}
                  </p>
                </TableCell>
                <TableCell className="text-center">
                  {x.evidenceUrl ? (
                    <a
                      href={x.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />Xem
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/40">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-0.5">
                    {/* Unit commander: edit + submit */}
                    {userRole === 'unit' && status === 'DRAFT' && onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Chỉnh sửa" onClick={() => onEdit(x)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {userRole === 'unit' && status === 'DRAFT' && onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" title="Xóa" onClick={() => onDelete(x)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {userRole === 'unit' && (status === 'DRAFT' || status === 'REJECTED') && onSubmit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50" title="Nộp lên ban chính trị" onClick={() => onSubmit(x)}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Political dept: approve + reject */}
                    {userRole === 'dept' && status === 'SUBMITTED' && onApprove && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" title="Duyệt" onClick={() => onApprove(x)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {userRole === 'dept' && status === 'SUBMITTED' && onReject && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" title="Trả lại" onClick={() => onReject(x)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {/* Academy / fallback: view only */}
                    {userRole === 'academy' && onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Xem chi tiết" onClick={() => onEdit(x)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
