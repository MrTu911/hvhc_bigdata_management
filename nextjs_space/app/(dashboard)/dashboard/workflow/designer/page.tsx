'use client';

/**
 * M13 – Workflow Designer Page
 * Route: /dashboard/workflow/designer
 *
 * Cho phép người có quyền WF.DESIGN:
 *  - Xem danh sách workflow templates
 *  - Tạo template mới
 *  - Vào edit version (steps + transitions)
 *
 * Layout:
 *  - Header + nút tạo mới
 *  - Bảng templates + actions (xem version, publish, archive)
 *  - Modal: tạo template mới
 *  - Drawer/Modal: quản lý version của template
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Plus,
  RefreshCw,
  FolderKanban,
  ChevronRight,
  CheckCircle2,
  Archive,
  FileEdit,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkflowTemplate {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  /** Chỉ có 1 published version từ listTemplates — dùng để hiện badge */
  versions?: Array<{ id: string; versionNo: number; publishedAt: string | null }>;
}

interface TemplateVersionSummary {
  id: string;
  versionNo: number;
  status: string; // DRAFT | PUBLISHED | ARCHIVED
  publishedAt: string | null;
  createdAt: string;
}

interface CreateTemplateForm {
  code: string;
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const VERSION_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Bản nháp',  className: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: 'Đang dùng', className: 'bg-green-100 text-green-700' },
  ARCHIVED:  { label: 'Lưu trữ',   className: 'bg-muted text-muted-foreground' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CreateTemplateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (templateId: string) => void;
}) {
  const [form, setForm] = useState<CreateTemplateForm>({ code: '', name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CreateTemplateForm>>({});

  const validate = () => {
    const errs: Partial<CreateTemplateForm> = {};
    if (!form.code.trim()) errs.code = 'Bắt buộc';
    else if (!/^[A-Z0-9_]{2,50}$/.test(form.code)) errs.code = 'Chỉ dùng A-Z, 0-9, _ (2-50 ký tự)';
    if (!form.name.trim()) errs.name = 'Bắt buộc';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/workflow-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Tạo template thất bại', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã tạo template thành công' });
      setForm({ code: '', name: '', description: '' });
      setErrors({});
      onCreated(json.data.id);
      onClose();
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo workflow template mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-code">Mã template <span className="text-red-500">*</span></Label>
            <Input
              id="t-code"
              placeholder="VD: APPROVE_SANCTION, POLICY_REVIEW"
              value={form.code}
              onChange={(e) => { setForm(f => ({ ...f, code: e.target.value.toUpperCase() })); setErrors(er => ({ ...er, code: undefined })); }}
              className={cn(errors.code && 'border-red-400')}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Tên template <span className="text-red-500">*</span></Label>
            <Input
              id="t-name"
              placeholder="VD: Quy trình phê duyệt biện pháp kỷ luật"
              value={form.name}
              onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: undefined })); }}
              className={cn(errors.name && 'border-red-400')}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Mô tả</Label>
            <Textarea
              id="t-desc"
              placeholder="Mô tả ngắn về mục đích quy trình..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="resize-none text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang tạo…' : 'Tạo template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Version list for a template (inline expand)
// ---------------------------------------------------------------------------

function TemplateVersionRows({
  templateId,
  onRefresh,
}: {
  templateId: string;
  onRefresh: () => void;
}) {
  const [versions, setVersions] = useState<TemplateVersionSummary[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [creatingVersion, setCreatingVersion] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/workflow-templates/${templateId}/versions`);
      const json = await res.json();
      if (json.success) setVersions(json.data ?? []);
    } catch {
      // non-blocking
    } finally {
      setLoadingVersions(false);
    }
  }, [templateId]);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const refreshAll = useCallback(() => {
    fetchVersions();
    onRefresh();
  }, [fetchVersions, onRefresh]);

  const handleCreateVersion = async () => {
    setCreatingVersion(true);
    try {
      const res = await fetch(`/api/workflow-templates/${templateId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Tạo version thất bại', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã tạo version mới (DRAFT)' });
      refreshAll();
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setCreatingVersion(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    setPublishing(versionId);
    try {
      const res = await fetch(
        `/api/workflow-templates/${templateId}/versions/${versionId}/publish`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Publish thất bại', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã publish version thành công' });
      refreshAll();
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setPublishing(null);
    }
  };

  const handleArchive = async (versionId: string) => {
    setArchiving(versionId);
    try {
      const res = await fetch(
        `/api/workflow-templates/${templateId}/versions/${versionId}/archive`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Archive thất bại', variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã archive version' });
      refreshAll();
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setArchiving(null);
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" />
          Versions ({versions.length})
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleCreateVersion}
          disabled={creatingVersion}
        >
          <Plus className="h-3 w-3" />
          {creatingVersion ? 'Đang tạo…' : 'Version mới'}
        </Button>
      </div>

      {loadingVersions ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          Chưa có version. Tạo version để bắt đầu thiết kế.
        </p>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => {
            const cfg = VERSION_STATUS_CONFIG[v.status] ?? VERSION_STATUS_CONFIG['DRAFT'];
            return (
              <div
                key={v.id}
                className="flex items-center justify-between bg-background rounded border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">v{v.versionNo}</span>
                  <Badge className={cn('text-xs font-normal', cfg.className)}>{cfg.label}</Badge>
                  {v.publishedAt && (
                    <span className="text-xs text-muted-foreground">
                      Published: {new Date(v.publishedAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {/* Edit steps / transitions */}
                  {v.status === 'DRAFT' && (
                    <Button asChild variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Link href={`/dashboard/workflow/designer/${templateId}/versions/${v.id}`}>
                        <FileEdit className="h-3 w-3" />
                        Sửa
                      </Link>
                    </Button>
                  )}
                  {/* Validate + publish */}
                  {v.status === 'DRAFT' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1 border-green-400 text-green-700 hover:bg-green-50"
                      onClick={() => handlePublish(v.id)}
                      disabled={publishing === v.id}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {publishing === v.id ? 'Đang publish…' : 'Publish'}
                    </Button>
                  )}
                  {/* Archive PUBLISHED */}
                  {v.status === 'PUBLISHED' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground"
                      onClick={() => handleArchive(v.id)}
                      disabled={archiving === v.id}
                    >
                      <Archive className="h-3 w-3" />
                      {archiving === v.id ? 'Đang lưu trữ…' : 'Archive'}
                    </Button>
                  )}
                  {/* View-only for ARCHIVED */}
                  {v.status === 'ARCHIVED' && (
                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground">
                      <Link href={`/dashboard/workflow/designer/${templateId}/versions/${v.id}`}>
                        Xem
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WorkflowDesignerPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/workflow-templates?pageSize=50');
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success) setTemplates(json.data.items ?? json.data);
    } catch {
      toast({ title: 'Không thể tải danh sách template', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  }, [fetchTemplates]);

  const handleCreated = useCallback((templateId: string) => {
    fetchTemplates();
    setExpandedId(templateId);
  }, [fetchTemplates]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-6 w-6" />
            Workflow Designer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết kế và quản lý các mẫu quy trình phê duyệt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Tạo template
          </Button>
        </div>
      </div>

      {/* Templates table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {loading ? 'Đang tải…' : `${templates.length} template`}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              title="Chưa có workflow template"
              description="Tạo template đầu tiên để bắt đầu thiết kế quy trình."
              className="py-10"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Mã template</TableHead>
                  <TableHead className="w-[35%]">Tên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tmpl) => {
                  const isExpanded = expandedId === tmpl.id;
                  // versions từ listTemplates chỉ có 1 published version (nếu có)
                  const publishedVersion = tmpl.versions?.[0];
                  return (
                    <Fragment key={tmpl.id}>
                      <TableRow
                        key={tmpl.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : tmpl.id)}
                      >
                        <TableCell>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 text-muted-foreground transition-transform',
                              isExpanded && 'rotate-90'
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                            {tmpl.code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{tmpl.name}</div>
                          {tmpl.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {tmpl.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              'text-xs font-normal',
                              tmpl.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            )}
                          >
                            {tmpl.isActive ? 'Hoạt động' : 'Tắt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {publishedVersion ? (
                              <Badge className="bg-green-100 text-green-700 font-normal">
                                v{publishedVersion.versionNo} published
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Mở rộng để xem</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(tmpl.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </TableCell>
                      </TableRow>

                      {/* Expanded version rows */}
                      {isExpanded && (
                        <TableRow key={`${tmpl.id}-versions`}>
                          <TableCell colSpan={6} className="bg-muted/20 py-3 px-6">
                            <TemplateVersionRows
                              templateId={tmpl.id}
                              onRefresh={fetchTemplates}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Note: Step/Transition editor is a separate route (per version) */}
      <div className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
        Để chỉnh sửa các bước và quy tắc chuyển trạng thái, nhấn <strong>Sửa</strong> trên version ở trạng thái DRAFT.
        Khi hoàn tất, nhấn <strong>Publish</strong> để kích hoạt.
      </div>

      {/* Create dialog */}
      <CreateTemplateDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
