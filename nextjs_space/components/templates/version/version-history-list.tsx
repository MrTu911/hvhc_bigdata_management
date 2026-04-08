'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { History, FileCheck, FileX, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RollbackConfirmModal, type RollbackTarget } from './rollback-confirm-modal';

interface VersionRow {
  id: string;
  version: number;
  fileKey?: string;
  placeholders?: string[];
  changeNote?: string;
  isLatest: boolean;
  createdBy: string;
  createdAt: string;
}

interface VersionHistoryListProps {
  templateId: string;
  currentVersion: number;
  /** Callback sau khi rollback thành công */
  onRollbackSuccess?: () => void;
}

export function VersionHistoryList({
  templateId,
  currentVersion,
  onRollbackSuccess,
}: VersionHistoryListProps) {
  const [rows, setRows] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<VersionRow | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}/versions?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Lỗi tải lịch sử version');
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [templateId, page]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRollbackConfirm = async (changeNote: string) => {
    if (!rollbackTarget) return;
    const res = await fetch(`/api/templates/${templateId}/rollback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetVersion: rollbackTarget.version, changeNote }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Lỗi rollback');
    toast.success(`Đã rollback về v${rollbackTarget.version}`);
    setRollbackOpen(false);
    fetchVersions();
    onRollbackSuccess?.();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Lịch sử phiên bản</h3>
        <Badge variant="secondary" className="text-xs">{total} version</Badge>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <History className="h-6 w-6 mx-auto mb-2 opacity-30" />
          Chưa có lịch sử phiên bản. Upload file để tạo version đầu tiên.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Version</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="w-28">File</TableHead>
              <TableHead className="w-36">Thời gian</TableHead>
              <TableHead className="w-28 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={row.isLatest ? 'bg-blue-50' : ''}>
                <TableCell>
                  <span className="font-mono text-sm font-medium">v{row.version}</span>
                  {row.isLatest && (
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-700 border-0">Hiện tại</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{row.changeNote || '–'}</span>
                  {row.placeholders && row.placeholders.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {row.placeholders.length} placeholder
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {row.fileKey ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <FileCheck className="h-3.5 w-3.5" /> Có file
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FileX className="h-3.5 w-3.5" /> Không có
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(row.createdAt).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {!row.isLatest && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setRollbackTarget(row as RollbackTarget);
                        setRollbackOpen(true);
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-500">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <RollbackConfirmModal
        open={rollbackOpen}
        onOpenChange={setRollbackOpen}
        target={rollbackTarget}
        currentVersion={currentVersion}
        onConfirm={handleRollbackConfirm}
      />
    </div>
  );
}
