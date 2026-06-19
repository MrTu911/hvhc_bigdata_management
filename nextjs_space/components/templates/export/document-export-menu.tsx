'use client';

/**
 * DocumentExportMenu — nút xuất văn bản cá nhân theo CSDL, lọc theo quyền/chức vụ.
 *
 * Khác ExportQuickButton (1 template cố định): menu này tự nạp danh sách MẪU phù hợp
 * với CSDL (module tương ứng entityType) và LỌC theo quyền của người dùng
 * (hasPermission(template.rbacCode) + cần EXPORT_DATA). Mỗi mẫu chọn được định dạng.
 *
 * Xuất qua POST /api/templates/export (backend tự enforce RBAC + scope + audit).
 */

import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { TEMPLATES } from '@/lib/rbac/function-codes';

export type ExportEntityType =
  | 'personnel' | 'student' | 'party_member' | 'faculty'
  | 'scientific_council' | 'scientist_profile';

/** CSDL (entityType) → module nguồn của mẫu văn bản. */
const MODULE_BY_ENTITY: Record<ExportEntityType, string> = {
  personnel: 'M02',
  faculty: 'M02',
  student: 'M10',
  party_member: 'M03',
  scientist_profile: 'M25',
  scientific_council: 'M23',
};

/** Định dạng tải xuống cho người dùng (HTML chỉ dùng preview). */
const DOWNLOAD_FORMATS = ['DOCX', 'PDF', 'XLSX'];

interface TemplateRow {
  id: string;
  name: string;
  code: string;
  category: string | null;
  rbacCode: string;
  outputFormats: string[];
}

interface DocumentExportMenuProps {
  entityType: ExportEntityType;
  entityId: string;
  label?: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
  /**
   * Endpoint export tuỳ biến (dùng cho CSDL có route bảo mật riêng, vd hồ sơ nhà
   * khoa học / hội đồng). Nếu set: POST { templateId, outputFormat } tới đây và
   * KHÔNG lọc theo template.rbacCode (route tự enforce). Mặc định dùng
   * POST /api/templates/export với { templateId, entityId, entityType, outputFormat }.
   */
  exportEndpoint?: string;
  /** Function code gate hiển thị nút. Mặc định EXPORT_DATA. */
  requiredPermission?: string;
  /**
   * Giới hạn danh sách mẫu hiển thị theo code (vd chỉ mẫu quá trình công tác trên
   * trang cá nhân). Không set → hiển thị mọi mẫu của module tương ứng entityType.
   */
  templateCodes?: string[];
  /**
   * Loại trừ một số mẫu khỏi menu chung (vd mẫu có route/resolver riêng như hồ sơ
   * cán bộ điện tử) để tránh render qua engine chung với dữ liệu thiếu.
   */
  excludeCodes?: string[];
}

export function DocumentExportMenu({
  entityType,
  entityId,
  label = 'Xuất văn bản',
  size = 'sm',
  variant = 'outline',
  exportEndpoint,
  requiredPermission = TEMPLATES.EXPORT_DATA,
  templateCodes,
  excludeCodes,
}: DocumentExportMenuProps) {
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Ẩn nút nếu chắc chắn không có quyền xuất.
  if (!permLoading && !hasPermission(requiredPermission)) return null;

  async function loadTemplates() {
    if (templates) return;
    setLoading(true);
    try {
      const module = MODULE_BY_ENTITY[entityType];
      const res = await fetch(`/api/templates?module=${module}&status=active&limit=100`);
      const json = await res.json();
      const rows: TemplateRow[] = (json.data ?? [])
        // Lọc theo code nếu trang chỉ muốn 1 nhóm mẫu cụ thể.
        .filter((t: TemplateRow) => (templateCodes ? templateCodes.includes(t.code) : true))
        // Loại trừ mẫu có route riêng (vd hồ sơ cán bộ điện tử).
        .filter((t: TemplateRow) => (excludeCodes ? !excludeCodes.includes(t.code) : true))
        // Endpoint riêng tự enforce quyền → không lọc theo rbacCode của template.
        .filter((t: TemplateRow) => (exportEndpoint ? true : hasPermission(t.rbacCode)))
        .map((t: TemplateRow) => ({
          ...t,
          outputFormats: (t.outputFormats ?? []).filter((f) => DOWNLOAD_FORMATS.includes(f)),
        }))
        .filter((t: TemplateRow) => t.outputFormats.length > 0);
      setTemplates(rows);
    } catch {
      toast.error('Lỗi tải danh sách mẫu văn bản');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function doExport(template: TemplateRow, outputFormat: string) {
    setExporting(true);
    try {
      // Endpoint riêng (vd hồ sơ KH/hội đồng): chỉ gửi templateId + outputFormat
      // (route đã biết entity qua [id]). Mặc định: dùng export engine chung.
      const url = exportEndpoint ?? '/api/templates/export';
      const payload = exportEndpoint
        ? { templateId: template.id, outputFormat }
        : { templateId: template.id, entityId, entityType, outputFormat };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi xuất văn bản');
      toast.success(`Đã xuất ${outputFormat}: ${template.name}`);
      if (json.data?.downloadUrl) window.open(json.data.downloadUrl, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xuất văn bản');
    } finally {
      setExporting(false);
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) loadTemplates(); }}>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Chọn mẫu văn bản</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-3 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="px-2 py-3 text-sm text-gray-400">Không có mẫu phù hợp quyền của bạn</div>
        ) : (
          templates.map((t) => (
            <DropdownMenuSub key={t.id}>
              <DropdownMenuSubTrigger>
                <FileText className="h-3.5 w-3.5 mr-2 text-blue-500 shrink-0" />
                <span className="truncate">{t.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {t.outputFormats.map((f) => (
                  <DropdownMenuItem key={f} onClick={() => doExport(t, f)}>
                    Xuất {f}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
