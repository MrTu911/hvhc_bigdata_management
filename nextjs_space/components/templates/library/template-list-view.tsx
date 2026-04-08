'use client';

import {
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { TemplateCardData } from './template-card';

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

interface TemplateListViewProps {
  templates: TemplateCardData[];
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onView: (template: TemplateCardData) => void;
  onEdit: (template: TemplateCardData) => void;
  onToggleStatus: (template: TemplateCardData) => void;
  onDelete: (template: TemplateCardData) => void;
}

export function TemplateListView({
  templates,
  page,
  limit,
  total,
  onPageChange,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: TemplateListViewProps) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-3">
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Mã / Tên mẫu biểu</TableHead>
              <TableHead className="w-28">Nhóm</TableHead>
              <TableHead className="w-40">Định dạng</TableHead>
              <TableHead className="w-32">Module</TableHead>
              <TableHead className="w-20">Phiên bản</TableHead>
              <TableHead className="w-28">Trạng thái</TableHead>
              <TableHead className="w-16 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Chưa có mẫu biểu nào
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow
                  key={t.id}
                  className={`hover:bg-gray-50 ${!t.isActive ? 'opacity-60' : ''}`}
                >
                  <TableCell>
                    <button
                      className="text-left group"
                      onClick={() => onView(t)}
                    >
                      <p className="font-medium text-sm group-hover:text-blue-600 transition-colors">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400 font-mono">{t.code}</p>
                    </button>
                  </TableCell>
                  <TableCell>
                    {t.category ? (
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </Badge>
                    ) : (
                      <span className="text-gray-300 text-xs">–</span>
                    )}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {t.moduleSource.map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500 font-mono">v{t.version}</span>
                    {!t.fileKey && (
                      <p className="text-xs text-amber-500">Chưa có file</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.isActive ? (
                      <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />Hoạt động
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">
                        <XCircle className="h-3 w-3 mr-1" />Vô hiệu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(t)}>
                          <Eye className="mr-2 h-4 w-4" />Xem nhanh
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(t)}>
                          <Edit className="mr-2 h-4 w-4" />Chi tiết / Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggleStatus(t)}>
                          {t.isActive ? (
                            <><XCircle className="mr-2 h-4 w-4" />Vô hiệu hóa</>
                          ) : (
                            <><CheckCircle className="mr-2 h-4 w-4" />Kích hoạt</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDelete(t)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />Xóa / Vô hiệu hóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} mẫu biểu
          </span>
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 border rounded text-xs">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
