'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { FileText, Edit, Download, History, CheckCircle, XCircle, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface TemplateDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  moduleSource: string[];
  outputFormats: string[];
  version: number;
  isActive: boolean;
  rbacCode: string;
  fileKey?: string;
  isLatest: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { exportJobs: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  NHAN_SU: 'Nhân sự',
  DANG_VIEN: 'Đảng viên',
  BAO_HIEM: 'Bảo hiểm',
  CHE_DO: 'Chế độ',
  KHEN_THUONG: 'Khen thưởng',
  DAO_TAO: 'Đào tạo',
  NCKH: 'NCKH',
  TONG_HOP: 'Tổng hợp',
};

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  DOCX: 'bg-blue-100 text-blue-700',
  XLSX: 'bg-green-100 text-green-700',
  HTML: 'bg-purple-100 text-purple-700',
};

interface TemplateDetailDrawerProps {
  templateId: string | null;
  open: boolean;
  onClose: () => void;
}

export function TemplateDetailDrawer({ templateId, open, onClose }: TemplateDetailDrawerProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null);
      return;
    }
    setLoading(true);
    fetch(`/api/templates/${templateId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTemplate(json.data);
        else toast.error(json.error || 'Lỗi tải template');
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [open, templateId]);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <SheetTitle className="text-base">Chi tiết mẫu biểu</SheetTitle>
            </div>
          </div>
          {template && (
            <SheetDescription className="font-mono text-xs">{template.code}</SheetDescription>
          )}
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !template ? (
          <div className="text-center py-16 text-gray-400 text-sm">Không tìm thấy template</div>
        ) : (
          <div className="space-y-5">
            {/* Name + status */}
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              <div className="flex items-center gap-2">
                {template.isActive ? (
                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />Hoạt động
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">
                    <XCircle className="h-3 w-3 mr-1" />Vô hiệu
                  </Badge>
                )}
                <span className="text-xs text-gray-400">v{template.version}</span>
              </div>
              {template.description && (
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              )}
            </div>

            <Separator />

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nhóm nghiệp vụ</p>
                <p className="font-medium">
                  {template.category ? CATEGORY_LABELS[template.category] ?? template.category : '–'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">RBAC code</p>
                <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{template.rbacCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Định dạng xuất</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {template.outputFormats.map((f) => (
                    <span
                      key={f}
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[f] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Module nguồn</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {template.moduleSource.map((m) => (
                    <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* File status */}
            <div>
              <p className="text-xs text-gray-400 mb-1">File template</p>
              {template.fileKey ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Đã có file</span>
                  <span className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                    {template.fileKey.split('/').pop()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Chưa upload file</span>
                </div>
              )}
            </div>

            {/* Stats */}
            {template._count && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tổng lượt xuất</span>
                  <span className="font-semibold">{template._count.exportJobs}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>Tạo: {new Date(template.createdAt).toLocaleDateString('vi-VN')}</p>
              <p>Cập nhật: {new Date(template.updatedAt).toLocaleDateString('vi-VN')}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  router.push(`/dashboard/templates/${template.id}`);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Mở chi tiết
              </Button>
              <Button variant="outline" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
