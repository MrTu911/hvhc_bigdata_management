'use client';

/**
 * Invoice Detail
 * /dashboard/science/finance/invoices/[id]
 *
 * Chi tiết hóa đơn: items, tổng tiền, trạng thái thanh toán.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { ChevronLeft, FileText, CreditCard } from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: string;
  currency: string;
  status: string;
  project?: { title: string };
  items: InvoiceItem[];
}

const STATUS_CONFIG: Record<string, { label: string; variant: string }> = {
  DRAFT:    { label: 'Nháp',          variant: 'secondary'  },
  PENDING:  { label: 'Chờ thanh toán', variant: 'outline'   },
  PAID:     { label: 'Đã thanh toán',  variant: 'default'   },
  OVERDUE:  { label: 'Quá hạn',       variant: 'destructive' },
  CANCELLED:{ label: 'Đã hủy',        variant: 'secondary'  },
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);

  useEffect(() => {
    fetch(`/api/science/finance/invoices/${params.id}`)
      .then(r => r.json())
      .then(data => { if (data.success) setInvoice(data.data); })
      .catch(() => toast.error('Không thể tải hóa đơn'))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch(`/api/science/finance/invoices/${params.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidAt: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Đã ghi nhận thanh toán');
      setInvoice(prev => prev ? { ...prev, status: 'PAID' } : prev);
    } catch (e: any) {
      toast.error(e.message || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  }

  if (loading) return <div className="p-6 text-center text-muted-foreground">Đang tải...</div>;
  if (!invoice) return (
    <div className="p-6 text-center">
      <p className="text-muted-foreground">Không tìm thấy hóa đơn</p>
      <Link href="/dashboard/science/finance/invoices">
        <Button variant="outline" className="mt-4"><ChevronLeft className="h-4 w-4 mr-1" />Quay lại</Button>
      </Link>
    </div>
  );

  const statusCfg = STATUS_CONFIG[invoice.status] ?? { label: invoice.status, variant: 'secondary' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/science/finance/invoices">
            <Button variant="ghost" size="sm"><ChevronLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-xl font-bold">HĐ {invoice.invoiceNumber}</h1>
              <p className="text-sm text-muted-foreground">{invoice.vendorName}</p>
            </div>
          </div>
        </div>
        <Badge variant={statusCfg.variant as any}>{statusCfg.label}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin hóa đơn</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Đề tài</dt><dd className="font-medium">{invoice.project?.title ?? invoice.projectId}</dd></div>
            <div><dt className="text-muted-foreground">Ngày hóa đơn</dt><dd>{new Date(invoice.invoiceDate).toLocaleDateString('vi-VN')}</dd></div>
            {invoice.dueDate && <div><dt className="text-muted-foreground">Hạn thanh toán</dt><dd>{new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</dd></div>}
            <div><dt className="text-muted-foreground">Tổng tiền</dt><dd className="font-bold text-lg">{Number(invoice.totalAmount).toLocaleString('vi-VN')} {invoice.currency}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* Items */}
      {(invoice.items ?? []).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Danh mục hàng hóa/dịch vụ</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{Number(item.unitPrice).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="text-right font-medium">{Number(item.totalPrice).toLocaleString('vi-VN')}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-bold text-right">Tổng cộng</TableCell>
                  <TableCell className="text-right font-bold">{Number(invoice.totalAmount).toLocaleString('vi-VN')} {invoice.currency}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pay action */}
      {invoice.status === 'PENDING' && (
        <Button onClick={handlePay} disabled={paying}>
          <CreditCard className="h-4 w-4 mr-2" />
          {paying ? 'Đang xử lý...' : 'Ghi nhận đã thanh toán'}
        </Button>
      )}
    </div>
  );
}
