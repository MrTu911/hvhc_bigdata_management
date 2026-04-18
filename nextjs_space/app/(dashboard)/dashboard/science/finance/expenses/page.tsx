'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, ChevronLeft, ChevronRight, Search, MoreHorizontal } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp', SUBMITTED: 'Đã nộp', APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối', REIMBURSED: 'Đã hoàn tiền',
};
const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  REIMBURSED: 'bg-teal-100 text-teal-700',
};
const CATEGORY_LABELS: Record<string, string> = {
  PERSONNEL: 'Nhân công', EQUIPMENT: 'Thiết bị', TRAVEL: 'Đi lại',
  OVERHEAD: 'Chi phí chung', PRINTING: 'In ấn', OTHER: 'Khác',
};

function fmtVND(val: string): string {
  const n = Number(val);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ ₫`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} tr ₫`;
  return `${n.toLocaleString('vi-VN')} ₫`;
}

interface Expense {
  id: string; description: string; category: string; amount: string;
  expenseDate: string; status: string; rejectReason?: string;
  project?: { id: string; projectCode: string };
  submittedBy?: { id: string; fullName: string };
}

export default function ExpensesPage() {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/science/finance/expenses?${params}`);
      const json = await res.json();
      if (json.success) {
        const filtered = keyword
          ? json.data.items.filter((e: Expense) =>
              e.description.toLowerCase().includes(keyword.toLowerCase())
            )
          : json.data.items;
        setItems(filtered);
        setTotal(json.data.total);
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, [page, statusFilter, categoryFilter, keyword]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string, action: 'APPROVE' | 'REJECT') => {
    const rejectReason = action === 'REJECT' ? window.prompt('Lý do từ chối:') : undefined;
    if (action === 'REJECT' && !rejectReason) return;

    setActing(id);
    try {
      const res = await fetch(`/api/science/finance/expenses/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(action === 'APPROVE' ? 'Đã duyệt chi phí — ngân sách cập nhật tự động' : 'Đã từ chối chi phí');
        fetchData();
      } else {
        toast.error(json.error ?? 'Thao tác thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setActing(null); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Chi tiêu NCKH</h1>
          <p className="text-sm text-muted-foreground">Khoản chi thực tế cần phê duyệt và hoàn tiền</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm mô tả chi tiêu..." value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryFilter || 'ALL'} onValueChange={(v) => { setCategoryFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả danh mục</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mô tả</TableHead>
                <TableHead>Đề tài</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Ngày chi</TableHead>
                <TableHead>Người nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có chi tiêu</TableCell></TableRow>
              ) : items.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell className="text-sm max-w-xs truncate">{exp.description}</TableCell>
                  <TableCell className="text-sm">
                    {exp.project ? (
                      <Link href={`/dashboard/science/projects/${exp.project.id}`}
                        className="text-blue-600 hover:underline">{exp.project.projectCode}</Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{CATEGORY_LABELS[exp.category] ?? exp.category}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{fmtVND(exp.amount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(exp.expenseDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-sm">{exp.submittedBy?.fullName ?? '—'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[exp.status] ?? 'bg-gray-100'}`}>
                      {STATUS_LABELS[exp.status] ?? exp.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {['DRAFT', 'SUBMITTED'].includes(exp.status) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={!!acting}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleApprove(exp.id, 'APPROVE')}>
                            Duyệt chi phí
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleApprove(exp.id, 'REJECT')}>
                            Từ chối
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
