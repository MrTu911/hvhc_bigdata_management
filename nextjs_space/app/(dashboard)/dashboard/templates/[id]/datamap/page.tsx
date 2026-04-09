'use client';

/**
 * M18 – Data Map Editor (UC-T03)
 * Visual editor: ánh xạ placeholder ↔ field nguồn dữ liệu.
 *
 * Layout:
 *  - Trái (2/3): bảng placeholder → field selector
 *  - Phải (1/3): field browser có thể tìm kiếm
 *  - Bottom: preview với entity thật
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldEntry {
  key: string;
  label: string;
  group: string;
  example: string;
  type: 'text' | 'date' | 'list';
}

type FieldCatalog = Record<string, FieldEntry[]>;

interface MappingRow {
  placeholder: string;    // raw key, không có {}
  fieldKey: string;       // field từ catalog, hoặc rỗng nếu chưa ánh xạ
  isManual?: boolean;     // placeholder thêm tay (không có trong file scan)
}

interface TemplateInfo {
  id: string;
  name: string;
  code: string;
  version: number;
  category?: string;
  moduleSource: string[];
  isActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_TYPE_LABELS: Record<string, string> = {
  personnel: 'Nhân sự (M02)',
  student: 'Học viên (M10)',
  party_member: 'Đảng viên (M03)',
  faculty: 'Giảng viên (M02)',
};

const TYPE_BADGE: Record<string, string> = {
  text: 'bg-gray-100 text-gray-600',
  date: 'bg-blue-100 text-blue-600',
  list: 'bg-purple-100 text-purple-600',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripBraces(s: string): string {
  return s.replace(/[{}]/g, '').trim();
}

function groupFields(fields: FieldEntry[]): Record<string, FieldEntry[]> {
  return fields.reduce<Record<string, FieldEntry[]>>((acc, f) => {
    if (!acc[f.group]) acc[f.group] = [];
    acc[f.group].push(f);
    return acc;
  }, {});
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DataMapPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // Template meta
  const [template, setTemplate] = useState<TemplateInfo | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  // Mapping rows
  const [rows, setRows] = useState<MappingRow[]>([]);
  const [loadingMap, setLoadingMap] = useState(true);

  // Field catalog
  const [catalog, setCatalog] = useState<FieldCatalog>({});
  const [activeEntityType, setActiveEntityType] = useState('personnel');
  const [fieldSearch, setFieldSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Save
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Add row
  const [newPlaceholder, setNewPlaceholder] = useState('');

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEntityId, setPreviewEntityId] = useState('');
  const [previewEntityType, setPreviewEntityType] = useState('personnel');
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // ─── Load template meta ─────────────────────────────────────────────────────

  const fetchTemplate = useCallback(async () => {
    setLoadingTemplate(true);
    try {
      const res = await fetch(`/api/templates/${id}`);
      if (!res.ok) throw new Error('Không tìm thấy template');
      const json = await res.json();
      const t = json.data;
      setTemplate({
        id: t.id,
        name: t.name,
        code: t.code,
        version: t.version,
        category: t.category,
        moduleSource: t.moduleSource,
        isActive: t.isActive,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải template');
    } finally {
      setLoadingTemplate(false);
    }
  }, [id]);

  // ─── Load datamap + placeholders ───────────────────────────────────────────

  const fetchDataMap = useCallback(async () => {
    setLoadingMap(true);
    try {
      const res = await fetch(`/api/templates/${id}/datamap`);
      if (!res.ok) throw new Error('Lỗi tải data map');
      const json = await res.json();
      const { dataMap, placeholders } = json.data as {
        dataMap: Record<string, unknown>;
        placeholders: string[];
        unmappedPlaceholders: string[];
      };

      // Build rows: ưu tiên placeholders từ file scan, sau đó merge với dataMap keys còn lại
      const scannedKeys = (placeholders || []).map(stripBraces);
      const existingMappedKeys = Object.keys(dataMap || {});
      const manualKeys = existingMappedKeys.filter(k => !scannedKeys.includes(k));

      const allRows: MappingRow[] = [
        ...scannedKeys.map(key => ({
          placeholder: key,
          fieldKey: typeof dataMap[key] === 'string' ? (dataMap[key] as string) : '',
        })),
        ...manualKeys.map(key => ({
          placeholder: key,
          fieldKey: typeof dataMap[key] === 'string' ? (dataMap[key] as string) : '',
          isManual: true,
        })),
      ];

      setRows(allRows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải data map');
    } finally {
      setLoadingMap(false);
      setIsDirty(false);
    }
  }, [id]);

  // ─── Load field catalog ─────────────────────────────────────────────────────

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/templates/fields');
      if (!res.ok) return;
      const json = await res.json();
      const data: FieldCatalog = json.data || {};
      setCatalog(data);
      // Expand first group by default for each entity
      const firstEntityFields = data[activeEntityType] || [];
      const firstGroup = firstEntityFields[0]?.group;
      if (firstGroup) {
        setExpandedGroups(prev => ({ ...prev, [firstGroup]: true }));
      }
    } catch {
      // catalog không critical — không block UI
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTemplate();
    fetchDataMap();
    fetchCatalog();
  }, [fetchTemplate, fetchDataMap, fetchCatalog]);

  // Auto-expand first group when entity type changes
  useEffect(() => {
    const fields = catalog[activeEntityType] || [];
    const firstGroup = fields[0]?.group;
    if (firstGroup && !(firstGroup in expandedGroups)) {
      setExpandedGroups(prev => ({ ...prev, [firstGroup]: true }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityType, catalog]);

  // ─── Derived state ─────────────────────────────────────────────────────────

  const unmappedCount = rows.filter(r => !r.fieldKey).length;

  const filteredFields = useMemo(() => {
    const fields = catalog[activeEntityType] || [];
    if (!fieldSearch.trim()) return fields;
    const q = fieldSearch.toLowerCase();
    return fields.filter(f =>
      f.key.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      f.group.toLowerCase().includes(q)
    );
  }, [catalog, activeEntityType, fieldSearch]);

  const groupedFilteredFields = useMemo(() => groupFields(filteredFields), [filteredFields]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function updateFieldKey(index: number, fieldKey: string) {
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], fieldKey };
      return next;
    });
    setIsDirty(true);
  }

  function removeRow(index: number) {
    setRows(prev => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }

  function addManualRow() {
    const key = stripBraces(newPlaceholder.trim());
    if (!key) { toast.error('Nhập tên placeholder'); return; }
    if (rows.some(r => r.placeholder === key)) {
      toast.error(`Placeholder {${key}} đã tồn tại`);
      return;
    }
    setRows(prev => [...prev, { placeholder: key, fieldKey: '', isManual: true }]);
    setNewPlaceholder('');
    setIsDirty(true);
  }

  function applyFieldFromBrowser(fieldKey: string) {
    // Điền vào row đầu tiên chưa có mapping, hoặc thông báo
    const firstEmpty = rows.findIndex(r => !r.fieldKey);
    if (firstEmpty >= 0) {
      updateFieldKey(firstEmpty, fieldKey);
      toast.success(`Đã ánh xạ {${rows[firstEmpty].placeholder}} → ${fieldKey}`);
    } else {
      toast.info('Tất cả placeholder đã có ánh xạ. Chọn trực tiếp trong bảng.');
    }
  }

  function toggleGroup(group: string) {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      // Build dataMap: { [placeholder]: fieldKey } — chỉ lưu row có fieldKey
      const dataMap: Record<string, string> = {};
      for (const row of rows) {
        if (row.fieldKey) dataMap[row.placeholder] = row.fieldKey;
      }

      const res = await fetch(`/api/templates/${id}/datamap`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataMap }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi lưu data map');

      toast.success('Đã lưu data map');
      if (json.warnings?.length > 0) {
        toast.warning(`${json.warnings.length} cảnh báo: ${json.warnings[0]}`);
      }
      setIsDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  // ─── Preview ──────────────────────────────────────────────────────────────

  async function handlePreview() {
    if (!previewEntityId.trim()) { toast.error('Nhập Entity ID'); return; }
    setPreviewing(true);
    setPreviewUrl('');
    try {
      const res = await fetch(`/api/templates/${id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: previewEntityId.trim(),
          entityType: previewEntityType,
          outputFormat: 'HTML',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi preview');
      setPreviewUrl(json.data.previewUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi preview');
    } finally {
      setPreviewing(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loadingTemplate || loadingMap) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/dashboard/templates/${id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Data Map Editor</h1>
                {isDirty && (
                  <Badge variant="outline" className="text-orange-600 border-orange-400 text-xs">
                    Chưa lưu
                  </Badge>
                )}
              </div>
              {template && (
                <p className="text-sm text-gray-500 mt-0.5">
                  <span className="font-medium text-gray-700">{template.name}</span>
                  <span className="mx-1">·</span>
                  <span className="font-mono text-xs">{template.code}</span>
                  <span className="mx-1">·</span>
                  v{template.version}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? 'Đang lưu...' : 'Lưu Data Map'}
            </Button>
          </div>
        </div>

        {/* ── Warning banner ── */}
        {unmappedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>{unmappedCount} placeholder</strong> chưa được ánh xạ.
              Template sẽ render trống tại các vị trí này.
            </span>
          </div>
        )}

        {rows.length === 0 && !loadingMap && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              Template chưa upload file hoặc chưa có placeholder nào được phát hiện.
              Upload file DOCX/HTML trước, sau đó quay lại trang này để ánh xạ.
            </span>
          </div>
        )}

        {/* ── Main content: Mapping table + Field browser ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT: Placeholder mapping table (2/3) ── */}
          <div className="lg:col-span-2 space-y-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    Ánh xạ Placeholder ({rows.length})
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Info className="h-4 w-4 text-gray-400" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Placeholder là các biến trong file mẫu (ví dụ: &#123;hoTen&#125;).</p>
                      <p className="mt-1">Chọn field để hệ thống biết lấy dữ liệu từ đâu khi render.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Placeholder</TableHead>
                      <TableHead>Ánh xạ đến Field</TableHead>
                      <TableHead className="w-40 hidden md:table-cell">Ví dụ giá trị</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-400 text-sm">
                          Chưa có placeholder nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row, idx) => {
                        const matchedField = Object.values(catalog)
                          .flat()
                          .find(f => f.key === row.fieldKey);

                        return (
                          <TableRow key={row.placeholder} className={!row.fieldKey ? 'bg-amber-50/40' : ''}>
                            {/* Placeholder */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                  &#123;{row.placeholder}&#125;
                                </code>
                                {row.isManual && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-xs px-1 py-0">thủ công</Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Thêm thủ công, không phát hiện từ file</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>

                            {/* Field selector */}
                            <TableCell>
                              <FieldSelector
                                value={row.fieldKey}
                                catalog={catalog}
                                onChange={val => updateFieldKey(idx, val)}
                              />
                            </TableCell>

                            {/* Example */}
                            <TableCell className="hidden md:table-cell">
                              {matchedField ? (
                                <span className="text-xs text-gray-500 truncate block max-w-[150px]">
                                  {matchedField.example}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-500">– chưa ánh xạ</span>
                              )}
                            </TableCell>

                            {/* Delete */}
                            <TableCell>
                              {row.isManual && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                                  onClick={() => removeRow(idx)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Add manual row */}
                <div className="flex items-center gap-2 p-3 border-t bg-gray-50/60">
                  <code className="text-sm text-gray-500">&#123;</code>
                  <Input
                    placeholder="tên placeholder"
                    value={newPlaceholder}
                    onChange={e => setNewPlaceholder(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addManualRow()}
                    className="h-8 text-sm font-mono flex-1 max-w-[200px]"
                  />
                  <code className="text-sm text-gray-500">&#125;</code>
                  <Button variant="outline" size="sm" className="h-8" onClick={addManualRow}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm thủ công
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats summary */}
            <div className="flex gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                {rows.filter(r => r.fieldKey).length} đã ánh xạ
              </span>
              {unmappedCount > 0 && (
                <span className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {unmappedCount} chưa ánh xạ
                </span>
              )}
            </div>
          </div>

          {/* ── RIGHT: Field Browser (1/3) ── */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Field Browser</CardTitle>
                <p className="text-xs text-gray-500">
                  Click vào field để điền vào placeholder trống đầu tiên
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Entity type selector */}
                <Select value={activeEntityType} onValueChange={setActiveEntityType}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Field search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Tìm field..."
                    value={fieldSearch}
                    onChange={e => setFieldSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>

                {/* Grouped field list */}
                <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
                  {Object.entries(groupedFilteredFields).map(([group, fields]) => (
                    <div key={group}>
                      <button
                        className="flex items-center gap-1.5 w-full text-left py-1 px-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        onClick={() => toggleGroup(group)}
                      >
                        {expandedGroups[group]
                          ? <ChevronDown className="h-3 w-3" />
                          : <ChevronRight className="h-3 w-3" />}
                        {group}
                        <span className="ml-auto text-gray-400 font-normal">{fields.length}</span>
                      </button>

                      {expandedGroups[group] && (
                        <div className="ml-2 space-y-0.5">
                          {fields.map(field => {
                            const isUsed = rows.some(r => r.fieldKey === field.key);
                            return (
                              <button
                                key={field.key}
                                onClick={() => applyFieldFromBrowser(field.key)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm hover:bg-blue-50 transition-colors group ${
                                  isUsed ? 'opacity-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs text-gray-700 truncate">
                                    {field.key}
                                  </span>
                                  <span className={`text-xs px-1 py-0.5 rounded shrink-0 ${TYPE_BADGE[field.type]}`}>
                                    {field.type}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                  {field.label}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {Object.keys(groupedFilteredFields).length === 0 && (
                    <p className="text-xs text-center text-gray-400 py-4">
                      Không tìm thấy field nào
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Preview Dialog ── */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Preview với dữ liệu thực</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Loại entity</Label>
                <Select value={previewEntityType} onValueChange={setPreviewEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Entity ID</Label>
                <Input
                  placeholder="Nhập ID nhân sự / học viên / đảng viên..."
                  value={previewEntityId}
                  onChange={e => setPreviewEntityId(e.target.value)}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-400">
                  Lấy ID từ trang danh sách nhân sự hoặc học viên
                </p>
              </div>

              {previewUrl && (
                <div className="border rounded-lg p-3 bg-green-50">
                  <p className="text-sm text-green-800 font-medium mb-2">
                    Preview đã sẵn sàng (hết hạn sau 60 giây)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(previewUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Mở Preview trong tab mới
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Đóng</Button>
              <Button onClick={handlePreview} disabled={previewing}>
                <Eye className="h-4 w-4 mr-1" />
                {previewing ? 'Đang render...' : 'Render Preview'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  );
}

// ─── FieldSelector component ──────────────────────────────────────────────────

/**
 * Select dropdown gộp tất cả fields từ catalog vào một danh sách phẳng.
 * Grouped by entity type label.
 */
function FieldSelector({
  value,
  catalog,
  onChange,
}: {
  value: string;
  catalog: FieldCatalog;
  onChange: (val: string) => void;
}) {
  const allFields = Object.entries(catalog).flatMap(([entityType, fields]) =>
    fields.map(f => ({ ...f, entityType }))
  );

  // Deduplicate by key (faculty shares nhiều keys với personnel)
  const seen = new Set<string>();
  const deduped = allFields.filter(f => {
    if (seen.has(f.key)) return false;
    seen.add(f.key);
    return true;
  });

  return (
    <Select value={value} onValueChange={val => onChange(val === '__clear__' ? '' : val)}>
      <SelectTrigger className="h-8 text-sm w-full max-w-[260px]">
        <SelectValue placeholder="Chọn field..." />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="__clear__" className="text-gray-400 text-xs">
          — Xóa ánh xạ —
        </SelectItem>
        {deduped.map(f => (
          <SelectItem key={f.key} value={f.key} className="text-sm">
            <div className="flex flex-col">
              <span className="font-mono text-xs">{f.key}</span>
              <span className="text-gray-500 text-xs">{f.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
