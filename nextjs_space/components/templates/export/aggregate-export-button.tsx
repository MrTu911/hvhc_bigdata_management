'use client';

/**
 * AggregateExportButton — xuất BẢNG DANH SÁCH tổng hợp (1 file) cho cả CSDL/đơn vị,
 * kèm bộ lọc nâng cao: đơn vị cụ thể, trạng thái/loại, từ khóa.
 *
 * Gọi POST /api/exports/aggregate (scope-aware, gate EXPORT_BATCH). Backend lọc
 * theo phạm vi quyền + bộ lọc rồi trả 1 file Excel/PDF.
 */

import { useState, useCallback } from 'react';
import { Download, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/hooks/use-permissions';
import { TEMPLATES } from '@/lib/rbac/function-codes';

type AggEntityType =
  | 'personnel' | 'officer' | 'soldier' | 'student' | 'party_member' | 'scientist_profile' | 'scientific_council'
  | 'policy' | 'award' | 'research_project' | 'publication' | 'legacy_project'
  | 'insurance' | 'faculty' | 'party_org' | 'subject';

const ALL = '__all__';

/** CSDL có lọc theo đơn vị (gắn unit trực tiếp hoặc qua user). */
const UNIT_FILTERABLE = new Set<AggEntityType>([
  'personnel', 'officer', 'soldier', 'party_member', 'scientist_profile', 'policy', 'award', 'research_project', 'publication', 'legacy_project',
  'insurance', 'faculty', 'party_org', 'subject',
]);

/** Tùy chọn trạng thái/loại theo từng CSDL (rỗng = không có select trạng thái). */
const STATUS_OPTIONS: Partial<Record<AggEntityType, { value: string; label: string }[]>> = {
  policy: [
    { value: 'ACTIVE', label: 'Hiệu lực' }, { value: 'EXPIRED', label: 'Hết hiệu lực' }, { value: 'VOIDED', label: 'Đã hủy' },
  ],
  award: [
    { value: 'KHEN_THUONG', label: 'Khen thưởng' }, { value: 'KY_LUAT', label: 'Kỷ luật' },
  ],
  research_project: [
    { value: 'IN_PROGRESS', label: 'Đang thực hiện' }, { value: 'APPROVED', label: 'Đã duyệt' },
    { value: 'COMPLETED', label: 'Hoàn thành' }, { value: 'SUBMITTED', label: 'Đã nộp' },
    { value: 'UNDER_REVIEW', label: 'Đang xét' }, { value: 'PAUSED', label: 'Tạm dừng' },
    { value: 'REJECTED', label: 'Từ chối' }, { value: 'CANCELLED', label: 'Đã hủy' }, { value: 'DRAFT', label: 'Nháp' },
  ],
  publication: [
    { value: 'BAI_BAO_QUOC_TE', label: 'Bài báo quốc tế' }, { value: 'BAI_BAO_TRONG_NUOC', label: 'Bài báo trong nước' },
    { value: 'SACH_CHUYEN_KHAO', label: 'Sách chuyên khảo' }, { value: 'GIAO_TRINH', label: 'Giáo trình' },
    { value: 'SANG_KIEN', label: 'Sáng kiến' }, { value: 'PATENT', label: 'Sáng chế' },
    { value: 'BAO_CAO_KH', label: 'Báo cáo KH' }, { value: 'LUAN_VAN', label: 'Luận văn' }, { value: 'LUAN_AN', label: 'Luận án' },
  ],
  party_member: [
    { value: 'CHINH_THUC', label: 'Chính thức' }, { value: 'DU_BI', label: 'Dự bị' },
    { value: 'CAM_TINH', label: 'Cảm tình' }, { value: 'QUAN_CHUNG', label: 'Quần chúng' },
  ],
  scientific_council: [
    { value: 'PASS', label: 'Đạt' }, { value: 'FAIL', label: 'Không đạt' }, { value: 'REVISE', label: 'Bổ sung' },
  ],
  legacy_project: [
    { value: 'Đang thực hiện', label: 'Đang thực hiện' }, { value: 'Hoàn thành', label: 'Hoàn thành' },
    { value: 'Nghiệm thu', label: 'Nghiệm thu' }, { value: 'Tạm dừng', label: 'Tạm dừng' },
  ],
};

interface UnitOption {
  id: string;
  name: string;
  code?: string;
}

interface AggregateExportButtonProps {
  entityType: AggEntityType;
  keyword?: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

export function AggregateExportButton({
  entityType,
  keyword: initialKeyword,
  label = 'Xuất danh sách',
  size = 'sm',
  variant = 'outline',
}: AggregateExportButtonProps) {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<UnitOption[] | null>(null);
  const [unitId, setUnitId] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [keyword, setKeyword] = useState<string>(initialKeyword ?? '');

  const statusOptions = STATUS_OPTIONS[entityType];
  const unitFilterable = UNIT_FILTERABLE.has(entityType);

  const loadUnits = useCallback(async () => {
    if (units || !unitFilterable) return;
    try {
      const res = await fetch('/api/units?limit=500');
      const json = await res.json();
      setUnits(json.units ?? []);
    } catch {
      setUnits([]);
    }
  }, [units, unitFilterable]);

  if (!permLoading && !hasPermission(TEMPLATES.EXPORT_BATCH)) return null;

  async function doExport(format: 'XLSX' | 'PDF') {
    setLoading(true);
    try {
      const res = await fetch('/api/exports/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          format,
          keyword: keyword.trim() || undefined,
          status: status !== ALL ? status : undefined,
          unitId: unitId !== ALL ? unitId : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi xuất danh sách');
      toast.success(`Đã xuất ${json.data.count} dòng (${format})`);
      if (json.data?.downloadUrl) window.open(json.data.downloadUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất danh sách');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover onOpenChange={(open) => { if (open) loadUnits(); }}>
      <PopoverTrigger asChild>
        <Button size={size} variant={variant} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <Filter className="h-4 w-4 text-blue-500" /> Bộ lọc danh sách
        </div>

        {unitFilterable && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Đơn vị</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả (trong quyền)</SelectItem>
                {(units ?? []).map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}{u.code ? ` (${u.code})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {statusOptions && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Trạng thái / Loại</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Từ khóa</Label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên/mã..."
            className="h-8 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" className="flex-1" disabled={loading} onClick={() => doExport('XLSX')}>
            Excel
          </Button>
          <Button size="sm" className="flex-1" disabled={loading} onClick={() => doExport('PDF')}>
            PDF
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
