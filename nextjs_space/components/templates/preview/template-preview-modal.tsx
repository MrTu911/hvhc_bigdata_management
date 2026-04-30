'use client';

import { useState } from 'react';
import { Eye, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TemplatePreviewModalProps {
  templateId: string;
  entityType: 'personnel' | 'student' | 'party_member' | 'faculty';
  outputFormats: string[];
}

export function TemplatePreviewModal({ templateId, entityType, outputFormats }: TemplatePreviewModalProps) {
  const [open, setOpen] = useState(false);
  const [entityId, setEntityId] = useState('');
  const [outputFormat, setOutputFormat] = useState(outputFormats[0] ?? 'PDF');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handlePreview() {
    if (!entityId.trim()) {
      toast.error('Nhập ID đối tượng để preview');
      return;
    }
    setLoading(true);
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/templates/${templateId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: entityId.trim(), entityType, outputFormat }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi preview');
      setPreviewUrl(json.data?.previewUrl ?? json.data?.downloadUrl ?? null);
      toast.success('Preview sẵn sàng');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo preview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Eye className="h-4 w-4 mr-1" />
        Preview
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview Template với dữ liệu thực</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>ID đối tượng ({entityType})</Label>
              <Input
                placeholder="Nhập ID..."
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Định dạng xuất</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {outputFormats.map((fmt) => (
                    <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {previewUrl && (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-700">
                <Download className="h-4 w-4 shrink-0" />
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Mở file preview (URL hết hạn sau 1 giờ)
                </a>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Tạo Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
