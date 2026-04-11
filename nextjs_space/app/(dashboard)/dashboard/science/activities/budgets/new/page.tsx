'use client';

/**
 * M24 — Science Budgets: Lập dự toán mới
 * Actor: cán bộ tài chính / cán bộ KHQL
 * Form gồm 3 section:
 *   1. Thông tin chung (project, năm, nguồn kinh phí, tổng dự toán)
 *   2. Các khoản mục chi tiêu (line items)
 *   3. Review & lưu (DRAFT)
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Trash2, Search, RefreshCw, ChevronLeft,
  Wallet, FileText, AlertCircle,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_CATEGORIES = [
  { value: 'PERSONNEL', label: 'Nhân công' },
  { value: 'EQUIPMENT', label: 'Thiết bị' },
  { value: 'TRAVEL',    label: 'Đi lại' },
  { value: 'OVERHEAD',  label: 'Chi phí chung' },
  { value: 'OTHER',     label: 'Khác' },
] as const;

type LineCategory = typeof LINE_CATEGORIES[number]['value'];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectOption {
  id: string;
  projectCode: string;
  title: string;
  status: string;
  principalInvestigator: { name: string };
}

interface FundSourceOption {
  id: string;
  name: string;
  code: string;
}

interface LineItemForm {
  _key: string;
  category: LineCategory;
  description: string;
  plannedAmount: string;
  period: string;
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[^\d]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatAmount(val: string): string {
  const n = parseAmount(val);
  if (n === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(n);
}

function totalPlanned(items: LineItemForm[]): number {
  return items.reduce((sum, l) => sum + parseAmount(l.plannedAmount), 0);
}

function vnd(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + ' tỷ đ';
  if (n >= 1_000_000)     return (n / 1_000_000).toFixed(0) + ' tr.đ';
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewBudgetPage() {
  const router = useRouter();

  // General info
  const [projectSearch, setProjectSearch]     = useState('');
  const [projects, setProjects]               = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [projectSearching, setProjectSearching] = useState(false);

  const [fundSources, setFundSources]         = useState<FundSourceOption[]>([]);
  const [fundSourceId, setFundSourceId]       = useState('');
  const [year, setYear]                       = useState(String(CURRENT_YEAR));
  const [totalApproved, setTotalApproved]     = useState('');

  // Line items
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { _key: makeKey(), category: 'PERSONNEL', description: '', plannedAmount: '', period: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);

  // Load fund sources on mount
  useEffect(() => {
    fetch('/api/science/catalogs?type=FUND_SOURCE&pageSize=50')
      .then(r => r.json())
      .then(d => {
        if (d.success) setFundSources(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  // Search projects
  const searchProjects = useCallback(async () => {
    if (!projectSearch.trim()) return;
    setProjectSearching(true);
    try {
      const params = new URLSearchParams({ keyword: projectSearch, pageSize: '20' });
      const res = await fetch(`/api/science/projects?${params}`);
      const data = await res.json();
      if (data.success) setProjects(data.data ?? []);
    } catch {
      toast.error('Lỗi tìm kiếm đề tài');
    } finally {
      setProjectSearching(false);
    }
  }, [projectSearch]);

  // Line item handlers
  const addLine = () => {
    setLineItems(prev => [
      ...prev,
      { _key: makeKey(), category: 'OTHER', description: '', plannedAmount: '', period: '' },
    ]);
  };

  const removeLine = (key: string) => {
    setLineItems(prev => prev.filter(l => l._key !== key));
  };

  const updateLine = (key: string, field: keyof Omit<LineItemForm, '_key'>, value: string) => {
    setLineItems(prev =>
      prev.map(l => l._key === key ? { ...l, [field]: value } : l)
    );
  };

  // Validate
  const errors: string[] = [];
  if (!selectedProject) errors.push('Chưa chọn đề tài');
  if (!fundSourceId)    errors.push('Chưa chọn nguồn kinh phí');
  if (!year || isNaN(Number(year))) errors.push('Năm không hợp lệ');
  if (parseAmount(totalApproved) <= 0) errors.push('Tổng dự toán phải > 0');
  if (lineItems.length === 0) errors.push('Cần ít nhất 1 khoản mục');
  lineItems.forEach((l, i) => {
    if (!l.description.trim()) errors.push(`Khoản mục ${i + 1}: thiếu mô tả`);
    if (parseAmount(l.plannedAmount) <= 0) errors.push(`Khoản mục ${i + 1}: số tiền phải > 0`);
  });

  const handleSubmit = async () => {
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        projectId:     selectedProject!.id,
        fundSourceId,
        year:          Number(year),
        totalApproved: parseAmount(totalApproved),
        lineItems: lineItems.map(l => ({
          category:      l.category,
          description:   l.description.trim(),
          plannedAmount: parseAmount(l.plannedAmount),
          period:        l.period.trim() || undefined,
        })),
      };
      const res = await fetch('/api/science/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(typeof data.error === 'string' ? data.error : 'Lưu thất bại');
      toast.success('Đã tạo dự toán ngân sách');
      router.push(`/dashboard/science/activities/budgets/${data.data.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const planned = totalPlanned(lineItems);
  const approved = parseAmount(totalApproved);
  const overBudget = planned > approved && approved > 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/science/activities/budgets">
          <Button variant="ghost" size="sm" className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lập dự toán ngân sách</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tạo dự toán kinh phí cho đề tài nghiên cứu.</p>
        </div>
      </div>

      {/* Section 1 — Thông tin chung */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-violet-500" />
            Thông tin chung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Project picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đề tài <span className="text-red-500">*</span>
            </label>
            {selectedProject ? (
              <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-200 rounded-md">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-violet-600 font-semibold">{selectedProject.projectCode}</div>
                  <div className="text-sm font-medium text-gray-900 truncate">{selectedProject.title}</div>
                  <div className="text-xs text-gray-500">{selectedProject.principalInvestigator.name}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedProject(null); setProjects([]); setProjectSearch(''); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Đổi
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Tìm theo tên hoặc mã đề tài..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchProjects()}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={searchProjects} disabled={projectSearching}>
                    {projectSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Tìm'}
                  </Button>
                </div>
                {projects.length > 0 && (
                  <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left px-3 py-2 hover:bg-violet-50 transition-colors"
                        onClick={() => { setSelectedProject(p); setProjects([]); }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-violet-600 font-semibold shrink-0">{p.projectCode}</span>
                          <span className="text-sm text-gray-900 truncate">{p.title}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.principalInvestigator.name} · {p.status}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Year + Fund source + Total */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Năm ngân sách <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={2000}
                max={2100}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nguồn kinh phí <span className="text-red-500">*</span>
              </label>
              <select
                value={fundSourceId}
                onChange={(e) => setFundSourceId(e.target.value)}
                className="w-full h-9 text-sm border rounded-md px-3 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">-- Chọn nguồn --</option>
                {fundSources.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tổng kinh phí duyệt (đồng) <span className="text-red-500">*</span>
            </label>
            <Input
              value={totalApproved}
              onChange={(e) => setTotalApproved(e.target.value.replace(/[^\d]/g, ''))}
              onBlur={(e) => setTotalApproved(parseAmount(e.target.value) > 0 ? String(parseAmount(e.target.value)) : '')}
              placeholder="VD: 500000000"
              className="h-9 text-sm font-mono"
            />
            {approved > 0 && (
              <p className="text-xs text-gray-500 mt-1">{vnd(approved)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Line items */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-500" />
            Khoản mục chi tiêu
          </CardTitle>
          <Button size="sm" variant="outline" onClick={addLine} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Thêm khoản
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {lineItems.map((line, idx) => (
            <div key={line._key} className="p-3 border rounded-lg bg-gray-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Khoản {idx + 1}</span>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeLine(line._key)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Danh mục</label>
                  <select
                    value={line.category}
                    onChange={(e) => updateLine(line._key, 'category', e.target.value)}
                    className="w-full h-8 text-sm border rounded-md px-2 bg-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    {LINE_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Số tiền (đồng)</label>
                  <Input
                    value={line.plannedAmount}
                    onChange={(e) => updateLine(line._key, 'plannedAmount', e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="0"
                    className="h-8 text-sm font-mono"
                  />
                  {parseAmount(line.plannedAmount) > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">{vnd(parseAmount(line.plannedAmount))}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mô tả <span className="text-red-500">*</span></label>
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(line._key, 'description', e.target.value)}
                  placeholder="Nội dung chi tiêu..."
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kỳ (tuỳ chọn, VD: Q1-2026)</label>
                <Input
                  value={line.period}
                  onChange={(e) => updateLine(line._key, 'period', e.target.value)}
                  placeholder="Q1-2026"
                  maxLength={20}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ))}

          {/* Summary row */}
          <div className="flex items-center justify-between pt-2 border-t text-sm">
            <span className="text-gray-500">{lineItems.length} khoản mục — tổng dự trù:</span>
            <span className={`font-semibold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>
              {vnd(planned)}
            </span>
          </div>
          {overBudget && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Tổng khoản mục ({vnd(planned)}) vượt tổng duyệt ({vnd(approved)}).
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={submitting || errors.length > 0}
          className="gap-2"
        >
          {submitting
            ? <RefreshCw className="h-4 w-4 animate-spin" />
            : <Wallet className="h-4 w-4" />
          }
          Lưu dự toán (Nháp)
        </Button>
        <Link href="/dashboard/science/activities/budgets">
          <Button variant="outline">Hủy</Button>
        </Link>
        {errors.length > 0 && (
          <span className="text-xs text-red-500">{errors[0]}</span>
        )}
      </div>
    </div>
  );
}
