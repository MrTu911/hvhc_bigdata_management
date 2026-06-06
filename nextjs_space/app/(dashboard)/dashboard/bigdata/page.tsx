'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Database,
  Download,
  Plus,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartPanel, DataPanel, ModuleHero } from '@/components/ui/enhanced-data-card';
import { DataKpiCard } from '@/components/bigdata/data-kpi-card';
import { DataLineChart } from '@/components/bigdata/charts/data-line-chart';
import { DataBarChart } from '@/components/bigdata/charts/data-bar-chart';
import { DataDonutChart } from '@/components/bigdata/charts/data-donut-chart';
import { MetricHeatmap } from '@/components/bigdata/metric-heatmap';
import { RealtimeStreamLog } from '@/components/bigdata/realtime-stream-log';
import { StatusTag } from '@/components/bigdata/status-tag';
import { CHART_COLORS } from '@/components/bigdata/charts/chart-theme';
import { formatShort } from '@/components/bigdata/format';
import { cn } from '@/lib/utils';
import type { StreamLine } from '@/components/bigdata/types';
import {
  COMPLIANCE_CHECKLIST,
  DOMAIN_DONUT,
  INGESTION_SERIES,
  INITIAL_STREAM,
  KPI_CARDS,
  RUNNING_PIPELINES,
  SECURITY_TILES,
  SLOW_QUERIES,
  STREAM_MESSAGES,
  TOP_DATASETS,
  UNIT_BARS,
  buildAccessHeatmap,
} from '@/components/bigdata/mock-data';

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface OverviewData {
  kpis: { totalSizeTB: number; totalRecords: number; sourceCount: number; activeSources: number };
  domainBreakdown: { name: string; valueTB: number }[];
  topDatasets: { label: string; valueTB: number }[];
}

const HEATMAP = buildAccessHeatmap();

const pipelineStatusKind = { ok: 'ok', warn: 'warn', err: 'err' } as const;

export default function BigDataOverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [stream, setStream] = useState<StreamLine[]>(INITIAL_STREAM);
  const [overview, setOverview] = useState<OverviewData | null>(null);

  // Chỉ số thật từ catalog DataSource (KPI / donut lĩnh vực / top dataset).
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/bigdata/overview', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setOverview(json.data as OverviewData);
      })
      .catch(() => {
        /* giữ dữ liệu minh họa nếu API lỗi */
      });
    return () => controller.abort();
  }, []);

  // KPI thật khi đã tải, ngược lại dùng dữ liệu minh họa (giữ sparkline trang trí).
  const kpiCards = overview
    ? [
        { label: 'Tổng dung lượng', value: overview.kpis.totalSizeTB.toFixed(1), unit: 'TB', sub: `${overview.kpis.sourceCount} nguồn`, spark: KPI_CARDS[0].spark, accent: 'primary' as const },
        { label: 'Tổng bản ghi', value: formatShort(overview.kpis.totalRecords), unit: 'bản ghi', spark: KPI_CARDS[1].spark, accent: 'info' as const },
        { label: 'Số nguồn dữ liệu', value: String(overview.kpis.sourceCount), unit: 'nguồn', spark: KPI_CARDS[2].spark, accent: 'gold' as const },
        { label: 'Nguồn đang hoạt động', value: String(overview.kpis.activeSources), unit: `/ ${overview.kpis.sourceCount}`, spark: KPI_CARDS[3].spark, accent: 'success' as const },
      ]
    : KPI_CARDS;

  const donutData = overview
    ? overview.domainBreakdown.map((d, i) => ({ name: d.name, value: d.valueTB, color: CHART_COLORS[i % CHART_COLORS.length] }))
    : DOMAIN_DONUT;
  const donutCenter = overview ? `${Math.round(overview.kpis.totalSizeTB)}TB` : '248TB';

  const topDatasetData = overview
    ? overview.topDatasets.map((d) => ({ label: d.label, value: d.valueTB }))
    : TOP_DATASETS;

  // Simulated realtime stream. Runs only after mount (client-side), so using a
  // timestamp here does not cause a hydration mismatch.
  // Phase 4: replace with polling GET /api/monitoring/realtime.
  useEffect(() => {
    let counter = INITIAL_STREAM.length;
    const interval = setInterval(() => {
      counter += 1;
      const pick = STREAM_MESSAGES[counter % STREAM_MESSAGES.length];
      const now = new Date();
      const t = now.toLocaleTimeString('vi-VN', { hour12: false });
      setStream((prev) => [{ id: counter, t, lv: pick.lv, msg: pick.msg }, ...prev].slice(0, 12));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="bigdata"
        supra="KHAI THÁC DỮ LIỆU · KTDL"
        title="Dashboard điều hành dữ liệu"
        subtitle="Tổng quan kho dữ liệu, pipeline và an ninh hệ thống — cập nhật thời gian thực"
        icon={Database}
        controls={
          <div className="flex flex-col items-end gap-3">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={(value) => value && setTimeRange(value as TimeRange)}
              className="rounded-lg bg-white/10 p-1"
            >
              {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((range) => (
                <ToggleGroupItem
                  key={range}
                  value={range}
                  className="h-7 px-3 text-xs text-white data-[state=on]:bg-white data-[state=on]:text-primary"
                >
                  {range}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25">
                <Download className="h-4 w-4" /> Xuất báo cáo
              </Button>
              <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                <Plus className="h-4 w-4" /> Tạo dataset
              </Button>
            </div>
          </div>
        }
      />

      {/* KPI row — chỉ số thật từ catalog DataSource */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpi) => (
          <DataKpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Chart row 1 — ingestion line + domain donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel
          title="Dữ liệu nạp & truy vấn theo ngày"
          subtitle="Đơn vị: GB nạp / nghìn truy vấn (minh họa)"
          className="lg:col-span-2"
        >
          <DataLineChart
            data={INGESTION_SERIES}
            xKey="label"
            series={[
              { key: 'ingest', name: 'Dữ liệu nạp (GB)', color: 'hsl(var(--chart-1))' },
              { key: 'query', name: 'Truy vấn (nghìn)', color: 'hsl(var(--chart-2))' },
            ]}
          />
        </ChartPanel>
        <ChartPanel title="Phân bố dữ liệu theo lĩnh vực" subtitle="Dung lượng theo lĩnh vực (TB)">
          <DataDonutChart data={donutData} centerValue={donutCenter} centerLabel="Tổng dung lượng" />
        </ChartPanel>
      </div>

      {/* Chart row 2 — units bar + top datasets + slow queries */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartPanel title="Phân bố bản ghi theo khối đơn vị" subtitle="Triệu bản ghi (minh họa)">
          <DataBarChart data={UNIT_BARS} layout="vertical" color="hsl(var(--chart-1))" />
        </ChartPanel>
        <ChartPanel
          title="Top dataset theo dung lượng & truy vấn chậm"
          subtitle="TB lưu trữ"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DataBarChart data={topDatasetData} layout="horizontal" color="hsl(var(--chart-3))" height={240} />
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Truy vấn chậm hôm nay</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truy vấn</TableHead>
                    <TableHead className="text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SLOW_QUERIES.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="max-w-[220px] truncate font-mono text-xs" title={q.query}>
                        {q.query}
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-warning">
                        {q.duration}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </ChartPanel>
      </div>

      {/* Heatmap + realtime stream */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartPanel title="Cường độ truy cập theo giờ" subtitle="7 ngày × 24 giờ (minh họa)">
          <MetricHeatmap data={HEATMAP} />
        </ChartPanel>
        <DataPanel
          title="Hoạt động hệ thống — thời gian thực"
          subtitle="Luồng sự kiện gần nhất"
          actions={<Activity className="h-4 w-4 text-success" />}
        >
          <RealtimeStreamLog lines={stream} />
        </DataPanel>
      </div>

      {/* Pipelines + security 24h */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DataPanel title="Pipeline đang chạy" subtitle="Tiến độ các job ETL/đồng bộ (minh họa)">
          <div className="space-y-4">
            {RUNNING_PIPELINES.map((pipeline) => (
              <div key={pipeline.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-foreground">{pipeline.name}</span>
                  <StatusTag
                    status={pipelineStatusKind[pipeline.status]}
                    label={`${pipeline.progress}%`}
                    dot={false}
                  />
                </div>
                <Progress value={pipeline.progress} className="h-2" />
              </div>
            ))}
          </div>
        </DataPanel>

        <DataPanel title="An ninh hệ thống — 24 giờ" subtitle="Tổng hợp sự kiện & tuân thủ (minh họa)">
          <div className="grid grid-cols-2 gap-3">
            {SECURITY_TILES.map((tile) => (
              <div key={tile.label} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">{tile.label}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">{tile.value}</span>
                  <StatusTag status={tile.status} label="" dot />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {COMPLIANCE_CHECKLIST.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-warning" />
                )}
                <span className={cn(item.ok ? 'text-foreground/80' : 'text-foreground')}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </DataPanel>
      </div>
    </div>
  );
}
