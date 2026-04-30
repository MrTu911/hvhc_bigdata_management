'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ExportQuickButtonProps {
  templateId: string;
  entityId: string;
  entityType: 'personnel' | 'student' | 'party_member' | 'faculty';
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

const FORMAT_LABELS: Record<string, string> = {
  PDF: 'Xuất PDF',
  DOCX: 'Xuất DOCX',
  XLSX: 'Xuất Excel',
};

export function ExportQuickButton({
  templateId,
  entityId,
  entityType,
  label = 'Xuất file',
  size = 'sm',
  variant = 'outline',
}: ExportQuickButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport(outputFormat: 'PDF' | 'DOCX' | 'XLSX') {
    setLoading(true);
    try {
      const res = await fetch('/api/templates/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, entityId, entityType, outputFormat }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Lỗi xuất file');
      }
      const { downloadUrl } = json.data;
      window.open(downloadUrl, '_blank');
      toast.success(`Xuất ${outputFormat} thành công`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất file');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(['PDF', 'DOCX', 'XLSX'] as const).map((fmt) => (
          <DropdownMenuItem key={fmt} onClick={() => handleExport(fmt)}>
            {FORMAT_LABELS[fmt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
