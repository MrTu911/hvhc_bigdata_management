'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const CATEGORY_LABELS: Record<string, string> = {
  PERSONNEL: 'Nhân công', EQUIPMENT: 'Thiết bị', TRAVEL: 'Đi lại',
  OVERHEAD: 'Chi phí chung', PRINTING: 'In ấn', OTHER: 'Khác',
};

interface POItem {
  itemName: string; quantity: string; unitPrice: string; unit: string;
  category: string; notes: string;
}

interface Project { id: string; projectCode: string; title: string; }

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    projectId: '', vendor: '', notes: '', currency: 'VND',
  });
  const [items, setItems] = useState<POItem[]>([
    { itemName: '', quantity: '1', unitPrice: '', unit: 'cái', category: 'EQUIPMENT', notes: '' },
  ]);

  useEffect(() => {
    fetch('/api/science/projects?status=ACTIVE&pageSize=100')
      .then((r) => r.json())
      .then((j) => { if (j.success) setProjects(j.data?.items ?? j.data ?? []); });
  }, []);

  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice.replace(/,/g, '')) || 0;
    return sum + qty * price;
  }, 0);

  const addItem = () => setItems((prev) => [
    ...prev,
    { itemName: '', quantity: '1', unitPrice: '', unit: 'cái', category: 'EQUIPMENT', notes: '' },
  ]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof POItem, value: string) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.vendor) {
      toast.error('Vui lòng chọn đề tài và nhập nhà cung cấp');
      return;
    }
    if (items.some((i) => !i.itemName || !i.unitPrice)) {
      toast.error('Vui lòng điền đầy đủ thông tin các hạng mục');
      return;
    }

    setSubmitting(true);
    try {
      const parsedItems = items.map((i) => {
        const qty = Number(i.quantity);
        const price = Number(i.unitPrice.replace(/,/g, ''));
        return {
          itemName: i.itemName,
          quantity: qty,
          unitPrice: price,
          amount: qty * price,
          category: i.category,
          unit: i.unit || undefined,
          notes: i.notes || undefined,
        };
      });

      const res = await fetch('/api/science/finance/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: form.projectId,
          vendor: form.vendor,
          totalAmount: totalAmount,
          currency: form.currency,
          notes: form.notes || undefined,
          items: parsedItems,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Đã tạo PO thành công');
        router.push('/dashboard/science/finance/purchase-orders');
      } else {
        toast.error(json.error ?? 'Tạo PO thất bại');
      }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/science/finance/purchase-orders">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Tạo Đề nghị Mua sắm</h1>
          <p className="text-sm text-muted-foreground">PO được tạo tự động số thứ tự</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Đề tài NCKH <span className="text-red-500">*</span></Label>
              <Select value={form.projectId} onValueChange={(v) => setForm((f) => ({ ...f, projectId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đề tài..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectCode} — {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Nhà cung cấp <span className="text-red-500">*</span></Label>
              <Input placeholder="Tên công ty / cá nhân cung cấp"
                value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea rows={2} placeholder="Mô tả mục đích mua sắm..."
                value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Danh sách hạng mục</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />Thêm hạng mục
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Hạng mục {idx + 1}</span>
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Tên hạng mục *</Label>
                    <Input placeholder="Máy tính xách tay, Thiết bị đo..." value={item.itemName}
                      onChange={(e) => updateItem(idx, 'itemName', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Số lượng</Label>
                    <Input type="number" min="1" value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Đơn vị tính</Label>
                    <Input placeholder="cái, bộ, tháng..." value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Đơn giá (VNĐ) *</Label>
                    <Input placeholder="5000000" value={item.unitPrice}
                      onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Danh mục chi</Label>
                    <Select value={item.category} onValueChange={(v) => updateItem(idx, 'category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {item.quantity && item.unitPrice && (
                  <p className="text-right text-sm font-medium text-emerald-700">
                    Thành tiền: {(Number(item.quantity) * Number(item.unitPrice.replace(/,/g, ''))).toLocaleString('vi-VN')} ₫
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t">
              <p className="text-base font-bold">
                Tổng cộng: <span className="text-emerald-700">{totalAmount.toLocaleString('vi-VN')} ₫</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href="/dashboard/science/finance/purchase-orders">
            <Button type="button" variant="outline">Hủy</Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Đang lưu...' : 'Tạo PO'}
          </Button>
        </div>
      </form>
    </div>
  );
}
