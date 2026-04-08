'use client';

import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface TemplateCardData {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  outputFormats: string[];
  moduleSource: string[];
  version: number;
  isActive: boolean;
  fileKey?: string;
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

interface TemplateCardProps {
  template: TemplateCardData;
  onClick?: (template: TemplateCardData) => void;
}

export function TemplateCard({ template: t, onClick }: TemplateCardProps) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${!t.isActive ? 'opacity-60' : ''}`}
      onClick={() => onClick?.(t)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <FileText className="h-8 w-8 text-blue-500 shrink-0" />
          <div className="flex items-center gap-1">
            {t.fileKey ? (
              <span className="text-xs text-green-600 font-medium">• File</span>
            ) : (
              <span className="text-xs text-gray-400">Chưa có file</span>
            )}
            {t.isActive ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-500 ml-1" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-gray-400 ml-1" />
            )}
          </div>
        </div>
        <CardTitle className="text-sm mt-2 leading-tight line-clamp-2">{t.name}</CardTitle>
        <p className="text-xs text-gray-400 font-mono">{t.code}</p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {t.category && (
          <Badge variant="outline" className="text-xs">
            {CATEGORY_LABELS[t.category] ?? t.category}
          </Badge>
        )}
        <div className="flex gap-1 flex-wrap">
          {t.outputFormats.map((f) => (
            <span
              key={f}
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[f] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {f}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">v{t.version}</span>
          {t._count && t._count.exportJobs > 0 && (
            <span className="text-xs text-gray-400">{t._count.exportJobs} lần xuất</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
