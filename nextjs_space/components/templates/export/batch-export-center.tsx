'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ExportJobProgress } from './export-job-progress';

interface BatchExportCenterProps {
  templateId: string;
  entityIds: string[];
  entityType: 'personnel' | 'student' | 'party_member' | 'faculty';
}

export function BatchExportCenter({ templateId, entityIds, entityType }: BatchExportCenterProps) {
  const [outputFormat, setOutputFormat] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  const [zipName, setZipName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  async function handleStartBatch() {
    if (entityIds.length === 0) {
      toast.error('Chưa chọn đối tượng để xuất');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/templates/export/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          entityIds,
          entityType,
          outputFormat,
          zipName: zipName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi khởi động batch export');
      }
      setActiveJobId(json.data.jobId);
      toast.info(`Đã xếp hàng ${entityIds.length} bản ghi — vị trí #${json.data.queuePosition}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi batch export');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Đã chọn <strong>{entityIds.length}</strong> bản ghi
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Định dạng xuất</Label>
          <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as typeof outputFormat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
              <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Tên file ZIP (tuỳ chọn)</Label>
          <Input
            placeholder="xuat_hang_loat"
            value={zipName}
            onChange={(e) => setZipName(e.target.value)}
          />
        </div>
      </div>

      <Button onClick={handleStartBatch} disabled={loading || entityIds.length === 0} className="w-full">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Bắt đầu xuất hàng loạt
      </Button>

      {activeJobId && (
        <div className="border rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Tiến trình</p>
          <ExportJobProgress
            jobId={activeJobId}
            onComplete={(job) => {
              if (job.status === 'COMPLETED') toast.success('Xuất hàng loạt hoàn tất');
              else toast.error('Xuất hàng loạt thất bại');
            }}
          />
        </div>
      )}
    </div>
  );
}
