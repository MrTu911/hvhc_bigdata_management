'use client';

/**
 * CadreAssignmentPanel — gán/gỡ CÁN BỘ (Personnel) vào một đơn vị.
 *
 * Khác panel gán theo tài khoản: làm việc trực tiếp trên Personnel nên quản lý được cả cán bộ
 * chưa có tài khoản User. Gọi:
 *   - GET  /api/personnel/search?unitId=...   (danh sách cán bộ trong đơn vị, scope-aware)
 *   - POST /api/admin/units/assign-cadre       (gán)
 *   - DELETE /api/admin/units/assign-cadre     (gỡ)
 * Đồng bộ Personnel→User→FacultyProfile do backend (service projectUnitMembership) lo.
 */
import { useCallback, useEffect, useState } from 'react';
import { UserPlus, X, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PersonnelCombobox, type PersonnelOption } from '@/components/personnel/personnel-combobox';
import { getRankLabel } from '@/lib/constants/rank-declaration';

interface CadreRow {
  id: string;
  fullName: string;
  personnelCode: string;
  militaryRank: string | null;
  account?: { id: string } | null;
}

interface CadreAssignmentPanelProps {
  unitId: string;
  /** Báo cho cha cập nhật badge "số cán bộ" (delta dương khi gán, âm khi gỡ). */
  onMemberCountChange?: (delta: number) => void;
}

async function fetchWithTimeout(input: string, init?: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function CadreAssignmentPanel({ unitId, onMemberCountChange }: CadreAssignmentPanelProps) {
  const [cadre, setCadre] = useState<CadreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<PersonnelOption | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadCadre = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWithTimeout(`/api/personnel/search?unitId=${unitId}&pageSize=100`);
      if (res.status === 429) {
        toast.error('Thao tác quá nhanh, đợi vài giây rồi thử lại.');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setCadre(json.data || []);
      } else {
        toast.error(json.error || 'Không thể tải danh sách cán bộ');
      }
    } catch {
      toast.error('Không thể tải cán bộ (kết nối chậm hoặc bị ngắt)');
    } finally {
      setLoading(false);
    }
  }, [unitId]);

  useEffect(() => {
    loadCadre();
  }, [loadCadre]);

  const handleAssign = async () => {
    if (!picked) return;
    setAssigning(true);
    try {
      const res = await fetchWithTimeout('/api/admin/units/assign-cadre', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, personnelIds: [picked.id] }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(`Đã gán ${picked.fullName} vào đơn vị`);
        onMemberCountChange?.(data.count ?? 1);
        setPicked(null);
        loadCadre();
      } else if (res.status === 429) {
        toast.error('Thao tác quá nhanh, đợi vài giây rồi thử lại.');
      } else {
        toast.error(data.error || 'Không thể gán cán bộ');
      }
    } catch {
      toast.error('Lỗi khi gán cán bộ vào đơn vị');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async (personnelId: string) => {
    setRemovingId(personnelId);
    try {
      const res = await fetchWithTimeout(
        `/api/admin/units/assign-cadre?personnelId=${personnelId}&unitId=${unitId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        toast.success('Đã gỡ cán bộ khỏi đơn vị');
        onMemberCountChange?.(-1);
        loadCadre();
      } else if (res.status === 429) {
        toast.error('Thao tác quá nhanh, đợi vài giây rồi thử lại.');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Không thể gỡ cán bộ');
      }
    } catch {
      toast.error('Lỗi khi gỡ cán bộ');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2 px-4 py-3 border-b">
        <div className="flex-1">
          <PersonnelCombobox value={picked} onChange={setPicked} placeholder="Tìm cán bộ theo tên hoặc mã..." />
        </div>
        <Button onClick={handleAssign} size="sm" disabled={!picked || assigning} className="whitespace-nowrap">
          {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-1.5" /> Gán</>}
        </Button>
      </div>

      <ScrollArea className="h-[440px]">
        {loading ? (
          <div className="space-y-2 p-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : cadre.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">Chưa có cán bộ trong đơn vị này</p>
            <p className="text-xs opacity-50">Tìm và nhấn "Gán" để thêm cán bộ</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cadre.map((c) => (
              <div key={c.id} className="p-3 border rounded-lg hover:bg-accent/50 transition-colors group flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{c.fullName}</span>
                    {c.militaryRank && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                        {getRankLabel(c.militaryRank)}
                      </span>
                    )}
                    {!c.account && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium" title="Chưa có tài khoản đăng nhập">
                        Chưa có tài khoản
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{c.personnelCode}</div>
                </div>
                <button
                  onClick={() => handleRemove(c.id)}
                  disabled={removingId === c.id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                  title="Gỡ khỏi đơn vị"
                >
                  {removingId === c.id
                    ? <div className="w-3.5 h-3.5 border-2 border-destructive/50 border-t-transparent rounded-full animate-spin" />
                    : <X className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
