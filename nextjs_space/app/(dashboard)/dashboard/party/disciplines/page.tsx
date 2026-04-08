'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { DisciplineForm } from '@/components/party/discipline/discipline-form';
import { DisciplineTable } from '@/components/party/discipline/discipline-table';

export default function PartyDisciplinesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100', ...(search && { search }) });
      const res = await fetch(`/api/party/disciplines?${params}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Endpoint /api/party/disciplines chưa sẵn sàng');
      }

      setItems(data.data || data.disciplines || []);
    } catch (e: any) {
      setItems([]);
      toast({ title: 'Thông báo', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (payload: any) => {
    try {
      const res = await fetch('/api/party/disciplines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Tạo kỷ luật thất bại');

      toast({ title: 'Thành công', description: 'Đã tạo bản ghi kỷ luật' });
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
          <h1 className="text-2xl font-bold">Kỷ luật trong Đảng</h1>
          <p className="text-sm text-muted-foreground">UC-69 – Quản lý mức độ kỷ luật, quyết định và hiệu lực</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Thêm kỷ luật</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo kỷ luật</DialogTitle>
            </DialogHeader>
            <DisciplineForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo đảng viên / số quyết định" />
          <Button variant="outline" onClick={fetchData} disabled={loading}>Lọc</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách kỷ luật</CardTitle>
        </CardHeader>
        <CardContent>
          <DisciplineTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
