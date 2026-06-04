'use client';

/**
 * Expense Detail
 * /dashboard/science/finance/expenses/[id]
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronLeft, CheckCircle2, XCircle, Receipt } from 'lucide-react';

interface Expense {
  id: string;
  projectId: string;
  expenseDate: string;
  category: string;
  amount: string;
  description: string;
  status: string;
  receiptUrl?: string;
  submittedBy?: string;
  project?: { title: string };
}

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  PENDING:  { label: 'Chờ duyệt', variant: 'secondary'    },
  APPROVED: { label: 'Đã duyệt',  variant: 'default'       },
  REJECTED: { label: 'Từ chối',   variant: 'destructive'   },
  PAID:     { label: 'Đã thanh toán', variant: 'default'   },
};

const CATEGORY_LABEL: Record<string, string> = {
  PERSONNEL: 'Nhân công', EQUIPMENT: 'Thiết bị', TRAVEL: 'Đi lại',
  OVERHEAD: 'Chi phí chung', PRINTING: 'In ấn', OTHER: 'Khác',
};

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  const [expense, setExpense]   = useState<Expense | null>(null);
  const [loading, setLoading]   = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/science/finance/expenses/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setExpense(data.data); })
      .catch(() => toast.error('Không thể tải chi phí'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleApprove() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/science/finance/expenses/${params.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã phê duyệt chi phí');
      setExpense(prev => prev ? { ...prev, status: 'APPROVED' } : prev);
    } catch (e: any) {
      toast.error(e.message || 'Phê duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/science/finance/expenses/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã từ chối chi phí');
      setExpense(prev => prev ? { ...prev, status: 'REJECTED' } : prev);
    } catch (e: any) {
      toast.error(e.message || 'Từ chối thất bại');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
  if (!expense) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy chi phí</p>
      <Link href="/dashboard/science/finance/expenses">
        <Button variant="outline" className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</Button>
      </Link>
    </div>
  );

  const statusCfg = STATUS_CONFIG[expense.status] ?? { label: expense.status, variant: 'secondary' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/science/finance/expenses">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-xl font-bold">Chi phí nghiên cứu</h1>
          </div>
        </div>
        <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin chi phí</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Đề tài</dt><dd className="font-medium">{expense.project?.title ?? expense.projectId}</dd></div>
            <div><dt className="text-muted-foreground">Ngày chi</dt><dd className="font-medium">{new Date(expense.expenseDate).toLocaleDateString('vi-VN')}</dd></div>
            <div><dt className="text-muted-foreground">Loại chi phí</dt><dd className="font-medium">{CATEGORY_LABEL[expense.category] ?? expense.category}</dd></div>
            <div><dt className="text-muted-foreground">Số tiền</dt><dd className="font-medium text-lg">{Number(expense.amount).toLocaleString('vi-VN')} VNĐ</dd></div>
            <div className="col-span-2"><dt className="text-muted-foreground">Mô tả</dt><dd className="font-medium">{expense.description}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {expense.receiptUrl && (
        <Card>
          <CardContent className="pt-4">
            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline"><Receipt className="h-4 w-4 mr-2" />Xem chứng từ</Button>
            </a>
          </CardContent>
        </Card>
      )}

      {expense.status === 'PENDING' && (
        <div className="flex gap-3">
          <Button onClick={handleApprove} disabled={actionLoading}>
            <CheckCircle2 className="h-4 w-4 mr-2" />Phê duyệt
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
            <XCircle className="h-4 w-4 mr-2" />Từ chối
          </Button>
        </div>
      )}
    </div>
  );
}
