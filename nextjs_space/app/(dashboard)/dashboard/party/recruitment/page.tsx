'use client';

/**
 * UC-65 – Pipeline theo dõi ứng viên kết nạp Đảng
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RecruitmentPipelineBoard,
  RecruitmentFunnel,
  STEPS,
  STEP_META,
  type RecruitmentStep,
} from '@/components/party/recruitment/recruitment-pipeline-board';
import { RecruitmentStepForm } from '@/components/party/recruitment/recruitment-step-form';
import { toast } from '@/components/ui/use-toast';
import {
  Users, UserPlus, RefreshCw, Plus,
  ArrowRight, AlertTriangle, GitBranch,
} from 'lucide-react';

export default function PartyRecruitmentPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterStep, setFilterStep] = useState('ALL');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/party/recruitment?limit=200');
      if (!res.ok) throw new Error('Không thể tải dữ liệu pipeline');
      const json = await res.json();
      setItems(json.data?.items ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async (payload: Record<string, string>) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/party/recruitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Lỗi tạo pipeline');
      }
      toast({ title: 'Đã thêm ứng viên', description: 'Hồ sơ pipeline đã được lưu.' });
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvance = async (id: string, _userId: string, _orgId: string, nextStep: RecruitmentStep) => {
    setAdvancing(true);
    try {
      const res = await fetch(`/api/party/recruitment/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStep: nextStep }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Lỗi cập nhật bước');
      }
      toast({
        title: 'Đã chuyển bước',
        description: `Ứng viên chuyển sang: ${STEP_META[nextStep].label}`,
      });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.message, variant: 'destructive' });
    } finally {
      setAdvancing(false);
    }
  };

  // Derived stats
  const total = items.length;
  const activeCount = items.filter(i => i.currentStep !== 'DA_KET_NAP').length;
  const completedCount = items.filter(i => i.currentStep === 'DA_KET_NAP').length;
  const readyCount = items.filter(i =>
    i.currentStep === 'CHI_BO_XET' || i.currentStep === 'CAP_TREN_DUYET',
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">

        {/* ── Hero banner ─────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-violet-600 to-purple-500 p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-8 top-10 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GitBranch className="h-4 w-4 text-violet-200" />
                <span className="text-violet-200 text-xs font-semibold uppercase tracking-widest">
                  M03 · UC-65 · Pipeline Kết nạp Đảng
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Theo dõi ứng viên Đảng viên</h1>
              <p className="text-violet-200 text-sm mt-1">
                Quản lý hành trình từ Quần chúng ưu tú đến Đảng viên chính thức
              </p>
            </div>

            {/* Hero stat pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Tổng ứng viên', value: total, icon: Users },
                { label: 'Đang theo dõi', value: activeCount, icon: GitBranch },
                { label: 'Sắp kết nạp', value: readyCount, icon: AlertTriangle },
                { label: 'Đã kết nạp', value: completedCount, icon: UserPlus },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-white/10 px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Icon className="h-3.5 w-3.5 text-violet-200" />
                  </div>
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-[10px] text-violet-200">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action row */}
          <div className="relative mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-white text-violet-700 hover:bg-violet-50 gap-1.5 font-semibold"
            >
              <Plus className="h-4 w-4" /> Thêm ứng viên
            </Button>
            <Link href="/dashboard/party/admissions">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5">
                <ArrowRight className="h-4 w-4" /> Biên bản kết nạp
              </Button>
            </Link>
            <Link href="/dashboard/party/members">
              <Button size="sm" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5">
                <Users className="h-4 w-4" /> Hồ sơ Đảng viên
              </Button>
            </Link>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={loadData}
              disabled={loading}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 gap-1.5 ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3 text-red-700">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <Button type="button" size="sm" variant="ghost" className="text-red-700 h-7" onClick={loadData}>
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Funnel stats ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : (
          <RecruitmentFunnel items={items} />
        )}

        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Lọc theo bước:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterStep('ALL')}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                filterStep === 'ALL'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              Tất cả
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{total}</Badge>
            </button>
            {STEPS.map(step => {
              const meta = STEP_META[step];
              const count = items.filter(i => i.currentStep === step).length;
              const Icon = meta.icon;
              return (
                <button
                  type="button"
                  key={step}
                  onClick={() => setFilterStep(step === filterStep ? 'ALL' : step)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    filterStep === step
                      ? `${meta.bg} ${meta.color} ${meta.border} shadow-sm`
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {meta.labelShort}
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${filterStep === step ? meta.badgeCls : 'bg-slate-100 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Kanban board ─────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GitBranch className="h-14 w-14 text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">Chưa có ứng viên nào trong pipeline</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Thêm ứng viên đầu tiên để bắt đầu theo dõi hành trình kết nạp
            </p>
            <Button type="button" onClick={() => setShowForm(true)} className="gap-1.5">
              <Plus className="h-4 w-4" /> Thêm ứng viên
            </Button>
          </div>
        ) : (
          <RecruitmentPipelineBoard
            items={items}
            onAdvance={handleAdvance}
            advancing={advancing}
            filterStep={filterStep}
          />
        )}

        {/* ── Add candidate modal ───────────────────────────────────────── */}
        <RecruitmentStepForm
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={handleAdd}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
