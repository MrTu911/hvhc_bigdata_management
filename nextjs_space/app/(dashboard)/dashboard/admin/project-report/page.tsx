'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  FileText,
  RefreshCw,
  Monitor,
} from 'lucide-react';

export default function ProjectReportPage() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const reportUrl = '/baocao.html';

  const openInNewTab = () => window.open(reportUrl, '_blank', 'noopener,noreferrer');
  const reload = () => setIframeKey(k => k + 1);

  return (
    // Thoát khỏi padding của dashboard layout container để iframe chiếm full width/height
    <div className={`flex flex-col ${isExpanded ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900' : '-mx-4 md:-mx-6 lg:-mx-8 -my-4 md:-my-6 lg:-my-8 h-[calc(100vh-4rem)]'} p-0`}>

      {/* ── Toolbar ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
              Báo cáo Sáng kiến — HVHC BigData
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Thuyết minh Sáng kiến v19.0 · Học viện Hậu cần · 2026
            </p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[10px] font-bold gap-1 hidden sm:flex">
            <Monitor className="h-3 w-3" /> Interactive Report
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reload}
            className="gap-1.5 text-xs h-8"
            title="Tải lại báo cáo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tải lại</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(v => !v)}
            className="gap-1.5 text-xs h-8"
            title={isExpanded ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isExpanded
              ? <><Minimize2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Thu nhỏ</span></>
              : <><Maximize2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Toàn màn hình</span></>}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={openInNewTab}
            className="gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
            title="Mở trong tab mới"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mở tab mới</span>
          </Button>
        </div>
      </div>

      {/* ── Iframe ──────────────────────────────── */}
      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
        <iframe
          key={iframeKey}
          src={reportUrl}
          title="Báo cáo Sáng kiến HVHC BigData"
          className="w-full h-full border-0"
          allow="autoplay"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
}
