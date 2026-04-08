'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { TransferForm } from '@/components/party/transfer/transfer-form';
import { TransferTable } from '@/components/party/transfer/transfer-table';

export default function PartyTransfersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        ...(search && { search }),
        ...(direction !== 'all' && { direction }),
      });

      const res = await fetch(`/api/party/transfers?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách chuyển sinh hoạt');

      const rows = data.transfers || data.data || [];
      setItems(
        rows.map((x: any) => ({
          ...x,
          transferType: x.historyType === 'TRANSFER_IN' ? 'CHUYEN_DANG_CHINH_THUC' : 'CHUYEN_SINH_HOAT_TAM_THOI',
          transferDate: x.effectiveDate,
          fromPartyOrgName: x.fromOrganization,
          toPartyOrgName: x.toOrganization,
          confirmStatus: x.confirmStatus || 'PENDING',
        })),
      );
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [direction]);

  const handleCreate = async (payload: any) => {
    try {
      const mapped = {
        partyMemberId: payload.partyMemberId,
        historyType: payload.transferType === 'CHUYEN_DANG_CHINH_THUC' ? 'TRANSFER_IN' : 'TRANSFER_OUT',
        organizationId: payload.toPartyOrgId || null,
        effectiveDate: payload.transferDate,
        fromOrganization: payload.fromPartyOrgId,
        toOrganization: payload.toPartyOrgId,
        decisionNumber: payload.introductionLetterNo,
        notes: payload.note,
      };

      const res = await fetch('/api/party/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mapped),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Tạo hồ sơ chuyển thất bại');

      toast({ title: 'Thành công', description: 'Đã tạo hồ sơ chuyển sinh hoạt' });
      setOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chuyển sinh hoạt / chuyển Đảng</h1>
          <p className="text-sm text-muted-foreground">UC-70 – Quản lý hồ sơ chuyển và trạng thái xác nhận đơn vị nhận</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Tạo hồ sơ chuyển</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo chuyển sinh hoạt</DialogTitle>
            </DialogHeader>
            <TransferForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo đảng viên / tổ chức" />
          <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
            <SelectTrigger className="md:w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="in">Chuyển đến</SelectItem>
              <SelectItem value="out">Chuyển đi</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchData} disabled={loading}>Lọc</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách chuyển sinh hoạt</CardTitle>
        </CardHeader>
        <CardContent>
          <TransferTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
