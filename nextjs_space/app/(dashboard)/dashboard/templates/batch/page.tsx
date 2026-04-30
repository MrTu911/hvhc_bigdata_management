'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, Loader2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { BatchExportCenter } from '@/components/templates/export/batch-export-center';

type EntityType = 'personnel' | 'student' | 'party_member' | 'faculty';

interface EntityRow {
  id: string;
  label: string;
  sub?: string;
}

interface TemplateOption {
  id: string;
  name: string;
  code: string;
  category?: string;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  personnel: 'Cán bộ nhân viên',
  student: 'Học viên',
  party_member: 'Đảng viên',
  faculty: 'Giảng viên',
};

const ENTITY_API_MAP: Record<EntityType, string> = {
  personnel: '/api/personnel',
  student: '/api/education/students',
  party_member: '/api/party/members',
  faculty: '/api/faculty',
};

export default function BatchExportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entityType, setEntityType] = useState<EntityType>('personnel');
  const [templateId, setTemplateId] = useState(searchParams.get('templateId') ?? '');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState(false);

  // Load templates
  useEffect(() => {
    async function fetchTemplates() {
      setLoadingTemplates(true);
      try {
        const res = await fetch('/api/templates?limit=100');
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Lỗi tải template');
        setTemplates(json.data ?? []);
      } catch {
        toast.error('Không thể tải danh sách template');
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  // Load entities based on type + keyword
  const fetchEntities = useCallback(async () => {
    setLoadingEntities(true);
    setSelectedIds(new Set());
    try {
      const url = `${ENTITY_API_MAP[entityType]}?limit=100${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error('Lỗi tải danh sách');
      const rows = (json.data ?? json) as Record<string, unknown>[];
      setEntities(
        rows.map((r) => ({
          id: String(r.id ?? ''),
          label: String(r.hoTen ?? r.fullName ?? r.name ?? r.id ?? ''),
          sub: String(r.capBac ?? r.mssv ?? r.code ?? ''),
        })),
      );
    } catch {
      toast.error('Không thể tải danh sách đối tượng');
    } finally {
      setLoadingEntities(false);
    }
  }, [entityType, keyword]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === entities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entities.map((e) => e.id)));
    }
  }

  const allSelected = entities.length > 0 && selectedIds.size === entities.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < entities.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Xuất hàng loạt</h1>
          <p className="text-sm text-muted-foreground">Chọn template, đối tượng và bắt đầu export</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left – chọn template và loại đối tượng */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cấu hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Loại đối tượng</label>
                <Select
                  value={entityType}
                  onValueChange={(v) => {
                    setEntityType(v as EntityType);
                    setSelectedIds(new Set());
                    setKeyword('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ENTITY_TYPE_LABELS) as [EntityType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Template</label>
                {loadingTemplates ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          <span className="text-xs text-muted-foreground ml-1">({t.code})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Batch config + start */}
          {templateId && selectedIds.size > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Xuất hàng loạt</CardTitle>
              </CardHeader>
              <CardContent>
                <BatchExportCenter
                  templateId={templateId}
                  entityIds={Array.from(selectedIds)}
                  entityType={entityType}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right – danh sách đối tượng */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Tìm kiếm..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <Badge variant="outline" className="px-3 py-2 text-sm">
              <Users className="h-3 w-3 mr-1" />
              {selectedIds.size}/{entities.length} đã chọn
            </Badge>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Chọn tất cả"
                      data-state={someSelected ? 'indeterminate' : undefined}
                    />
                  </TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Mã / Cấp bậc</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEntities ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : entities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-10">
                      {keyword ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                    </TableCell>
                  </TableRow>
                ) : (
                  entities.map((entity) => (
                    <TableRow
                      key={entity.id}
                      className="cursor-pointer"
                      onClick={() => toggleSelect(entity.id)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(entity.id)}
                          onCheckedChange={() => toggleSelect(entity.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{entity.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entity.sub}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
