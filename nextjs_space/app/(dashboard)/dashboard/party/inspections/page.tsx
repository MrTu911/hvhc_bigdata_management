'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MasterDataSelect } from '@/components/shared/MasterDataSelect';
import { useMasterData } from '@/hooks/use-master-data';
import { InspectionTable } from '@/components/party/inspection/inspection-table';
import { InspectionDetailDrawer } from '@/components/party/inspection/inspection-detail-drawer';
import { toast } from '@/components/ui/use-toast';

const INSPECTION_TYPE_FALLBACK = [
  { code: 'KIEM_TRA_DINH_KY', nameVi: 'Kiểm tra định kỳ' },
  { code: 'KIEM_TRA_KHI_CO_DAU_HIEU', nameVi: 'Khi có dấu hiệu' },
  { code: 'GIAM_SAT_CHUYEN_DE', nameVi: 'Giám sát chuyên đề' },
  { code: 'PHUC_KET_KY_LUAT', nameVi: 'Phúc kết kỷ luật' },
];

export default function PartyInspectionsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [inspectionType, setInspectionType] = useState('ALL');
  const [selected, setSelected] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const { items: mdInspectionTypes } = useMasterData('MD_PARTY_INSPECTION_TYPE');

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '100',
        ...(search ? { search } : {}),
        ...(inspectionType !== 'ALL' ? { inspectionType } : {}),
      });

      const res = await fetch(`/api/party/inspections?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không thể tải danh sách kiểm tra');

      setItems(data.data || []);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/party/inspections/${id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Không tải được chi tiết hồ sơ');

      setSelected(data);
      setOpenDetail(true);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">UBKT – Kiểm tra, giám sát</h1>
        <p className="text-sm text-muted-foreground">Quản lý đợt kiểm tra định kỳ, theo dấu hiệu, chuyên đề và phúc kết kỷ luật</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder="Tìm theo tiêu đề/đối tượng/kết luận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {mdInspectionTypes.length > 0 ? (
            <div className="space-y-1">
              <MasterDataSelect
                categoryCode="MD_PARTY_INSPECTION_TYPE"
                value={inspectionType === 'ALL' ? '' : inspectionType}
                onChange={(v) => setInspectionType(v || 'ALL')}
                searchable
                placeholder="Tất cả loại"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <Select value={inspectionType} onValueChange={setInspectionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại kiểm tra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả loại</SelectItem>
                  {INSPECTION_TYPE_FALLBACK.map((x) => (
                    <SelectItem key={x.code} value={x.code}>{x.nameVi}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">MDM chưa có MD_PARTY_INSPECTION_TYPE, đang dùng fallback cục bộ.</p>
            </div>
          )}

          <Button variant="outline" onClick={fetchList} disabled={loading}>
            {loading ? 'Đang tải...' : 'Lọc dữ liệu'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách đợt kiểm tra</CardTitle>
        </CardHeader>
        <CardContent>
          <InspectionTable items={items} onView={handleView} />
        </CardContent>
      </Card>

      <InspectionDetailDrawer open={openDetail} onOpenChange={setOpenDetail} item={selected} />
    </div>
  );
}
