'use client';

/**
 * M13 – Step/Transition Editor
 * Route: /dashboard/workflow/designer/[templateId]/versions/[vId]
 *
 * Layout (3 zones):
 *  - Top bar:  breadcrumb + Save + Validate + Publish buttons
 *  - Left (w-64): StepFormPanel — danh sách + thêm/sửa bước
 *  - Center:       WorkflowCanvas — React Flow visualization
 *  - Bottom panel: TransitionTable — quản lý transitions
 *
 * State:
 *  - steps: StepDraft[]      — danh sách bước (source of truth cho cả Canvas + form)
 *  - transitions: TransitionDraft[] — danh sách transitions
 *  - dirty: bool              — có thay đổi chưa lưu
 *  - validationErrors: string[] — kết quả validate từ backend
 */

import { useState, useEffect, useCallback, useId } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

import { StepFormPanel, type StepDraft, type StepType } from '@/components/workflow/designer/StepFormPanel';
import { TransitionTable, type TransitionDraft } from '@/components/workflow/designer/TransitionTable';

// React Flow cannot be SSR'd — load dynamically
const WorkflowCanvas = dynamic(
  () => import('@/components/workflow/designer/WorkflowCanvas').then(m => m.WorkflowCanvas),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded" /> }
);

// ---------------------------------------------------------------------------
// Types from API
// ---------------------------------------------------------------------------

interface VersionDetail {
  id: string;
  templateId: string;
  versionNo: number;
  status: string; // DRAFT | PUBLISHED | ARCHIVED
  steps: ApiStep[];
  transitions: ApiTransition[];
}

interface ApiStep {
  id: string;
  code: string;
  name: string;
  stepType: StepType;
  orderIndex: number;
  slaHours: number | null;
  requiresSignature: boolean;
  isParallel: boolean;
}

interface ApiTransition {
  id: string;
  fromStepCode: string;
  actionCode: string;
  toStepCode: string;
  priority: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function apiStepsToState(apiSteps: ApiStep[]): StepDraft[] {
  return [...apiSteps]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => ({
      code: s.code,
      name: s.name,
      stepType: s.stepType,
      orderIndex: s.orderIndex,
      slaHours: s.slaHours ?? undefined,
      requiresSignature: s.requiresSignature,
      isParallel: s.isParallel,
    }));
}

function apiTransitionsToState(apiTrans: ApiTransition[]): TransitionDraft[] {
  return apiTrans.map((t) => ({
    id: t.id,
    fromStepCode: t.fromStepCode,
    actionCode: t.actionCode,
    toStepCode: t.toStepCode,
    priority: t.priority,
  }));
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VersionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const vId = params.vId as string;
  const localIdPrefix = useId();

  const [version, setVersion] = useState<VersionDetail | null>(null);
  const [steps, setSteps] = useState<StepDraft[]>([]);
  const [transitions, setTransitions] = useState<TransitionDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationOk, setValidationOk] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedStepCode, setSelectedStepCode] = useState<string | null>(null);
  const [pendingConnect, setPendingConnect] = useState<{ fromCode: string; toCode: string } | null>(null);

  const isReadonly = version?.status !== 'DRAFT';

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow-templates/${templateId}/versions/${vId}`);
      if (!res.ok) { router.replace(`/dashboard/workflow/designer`); return; }
      const json = await res.json();
      if (!json.success) return;
      const v: VersionDetail = json.data;
      setVersion(v);
      setSteps(apiStepsToState(v.steps));
      setTransitions(apiTransitionsToState(v.transitions));
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, [templateId, vId, router]);

  useEffect(() => { load(); }, [load]);

  // ---------------------------------------------------------------------------
  // Step mutations
  // ---------------------------------------------------------------------------

  const handleAddStep = useCallback((step: StepDraft) => {
    setSteps(prev => [...prev, { ...step, orderIndex: prev.length }]);
    setDirty(true);
    setValidationOk(false);
  }, []);

  const handleUpdateStep = useCallback((code: string, updates: Partial<StepDraft>) => {
    setSteps(prev => prev.map(s => s.code === code ? { ...s, ...updates } : s));
    setDirty(true);
    setValidationOk(false);
  }, []);

  const handleDeleteStep = useCallback((code: string) => {
    setSteps(prev => prev.filter(s => s.code !== code).map((s, i) => ({ ...s, orderIndex: i })));
    // Remove transitions that reference the deleted step
    setTransitions(prev => prev.filter(t => t.fromStepCode !== code && t.toStepCode !== code));
    setDirty(true);
    setValidationOk(false);
  }, []);

  const handleMoveUp = useCallback((code: string) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.code === code);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((s, i) => ({ ...s, orderIndex: i }));
    });
    setDirty(true);
  }, []);

  const handleMoveDown = useCallback((code: string) => {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.code === code);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next.map((s, i) => ({ ...s, orderIndex: i }));
    });
    setDirty(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Transition mutations
  // ---------------------------------------------------------------------------

  const handleAddTransition = useCallback((t: Omit<TransitionDraft, 'id'>) => {
    const id = `${localIdPrefix}-${Date.now()}`;
    setTransitions(prev => [...prev, { ...t, id }]);
    setDirty(true);
    setValidationOk(false);
  }, [localIdPrefix]);

  const handleDeleteTransition = useCallback((id: string) => {
    setTransitions(prev => prev.filter(t => t.id !== id));
    setDirty(true);
    setValidationOk(false);
  }, []);

  const handleConnectNodes = useCallback((fromCode: string, toCode: string) => {
    setPendingConnect({ fromCode, toCode });
  }, []);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    setSaving(true);
    setValidationErrors([]);
    try {
      const body = {
        steps: steps.map((s) => ({
          code: s.code,
          name: s.name,
          stepType: s.stepType,
          orderIndex: s.orderIndex,
          slaHours: s.slaHours,
          requiresSignature: s.requiresSignature ?? false,
          isParallel: s.isParallel ?? false,
        })),
        transitions: transitions.map((t) => ({
          fromStepCode: t.fromStepCode,
          actionCode: t.actionCode,
          toStepCode: t.toStepCode,
          priority: t.priority,
        })),
      };

      const res = await fetch(`/api/workflow-templates/${templateId}/versions/${vId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast({ title: json.error ?? 'Lưu thất bại', variant: 'destructive' });
        return;
      }
      setDirty(false);
      toast({ title: 'Đã lưu definition thành công' });
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [templateId, vId, steps, transitions]);

  // ---------------------------------------------------------------------------
  // Validate
  // ---------------------------------------------------------------------------

  const handleValidate = useCallback(async () => {
    if (dirty) {
      toast({ title: 'Vui lòng lưu trước khi validate', variant: 'destructive' });
      return;
    }
    setValidating(true);
    setValidationErrors([]);
    setValidationOk(false);
    try {
      const res = await fetch(
        `/api/workflow-templates/${templateId}/versions/${vId}/validate`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        const errs: string[] = json.data?.errors ?? [json.error ?? 'Validation lỗi'];
        setValidationErrors(errs);
        toast({ title: `Validation thất bại: ${errs.length} lỗi`, variant: 'destructive' });
        return;
      }
      setValidationOk(true);
      toast({ title: 'Validation thành công — sẵn sàng publish' });
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  }, [templateId, vId, dirty]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (!version) return null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-background flex-shrink-0 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => router.push(`/dashboard/workflow/designer`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-semibold truncate">
            Version v{version.versionNo}
          </span>
          <Badge
            className={cn(
              'text-xs font-normal',
              version.status === 'DRAFT' && 'bg-gray-100 text-gray-600',
              version.status === 'PUBLISHED' && 'bg-green-100 text-green-700',
              version.status === 'ARCHIVED' && 'bg-muted text-muted-foreground',
            )}
          >
            {version.status}
          </Badge>
          {dirty && (
            <Badge className="text-xs bg-amber-100 text-amber-700 font-normal">
              Chưa lưu
            </Badge>
          )}
        </div>

        {/* Validation banner inline */}
        {validationErrors.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 max-w-xs">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{validationErrors.length} lỗi validation</span>
          </div>
        )}
        {validationOk && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Hợp lệ
          </div>
        )}

        {/* Actions */}
        {!isReadonly && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              onClick={handleValidate}
              disabled={validating || dirty}
            >
              {validating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCheck className="h-3.5 w-3.5" />
              )}
              Validate
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-8"
              onClick={handleSave}
              disabled={saving || !dirty}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Lưu
            </Button>
          </>
        )}
        {isReadonly && (
          <span className="text-xs text-muted-foreground italic">Chế độ xem (không thể sửa)</span>
        )}
      </div>

      {/* Validation errors list */}
      {validationErrors.length > 0 && (
        <div className="px-4 py-2 border-b bg-red-50 flex-shrink-0">
          <ul className="text-xs text-red-700 space-y-0.5">
            {validationErrors.map((e, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Step panel */}
        <div className="w-64 flex-shrink-0 border-r overflow-hidden flex flex-col bg-background">
          <StepFormPanel
            steps={steps}
            selectedCode={selectedStepCode}
            readonly={isReadonly}
            onAdd={handleAddStep}
            onUpdate={handleUpdateStep}
            onDelete={handleDeleteStep}
            onSelect={setSelectedStepCode}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </div>

        {/* Center + Bottom */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 min-h-0 relative">
            <WorkflowCanvas
              steps={steps}
              transitions={transitions}
              selectedStepCode={selectedStepCode}
              onSelectStep={setSelectedStepCode}
              onConnectNodes={handleConnectNodes}
              readonly={isReadonly}
            />
          </div>

          <Separator />

          {/* Bottom: Transition table */}
          <div className="h-56 overflow-y-auto px-4 py-3 bg-background flex-shrink-0">
            <TransitionTable
              transitions={transitions}
              steps={steps}
              readonly={isReadonly}
              onAdd={handleAddTransition}
              onDelete={handleDeleteTransition}
              pendingConnect={pendingConnect}
              onClearPendingConnect={() => setPendingConnect(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
