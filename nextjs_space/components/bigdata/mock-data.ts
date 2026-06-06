// Deterministic, seeded mock data for the BigData section (Phase 1 UI-first).
//
// IMPORTANT: values are generated with a seeded LCG (no Math.random / Date.now at
// module scope) so server and client render identically — avoids React hydration
// mismatches in the 'use client' overview page. Real APIs are wired in Phase 4:
//   - ingestion/query series   → GET /api/bigdata/overview (or /api/metrics)
//   - running pipelines        → GET /api/etl/workflows
//   - security 24h             → GET /api/audit/suspicious
//   - data sources catalog     → GET /api/bigdata/sources (new DataSource model)
//   - warehouse schemas        → GET /api/bigdata/warehouse/schemas

import type { DonutDatum } from './charts/data-donut-chart';
import type { BarDatum } from './charts/data-bar-chart';
import type {
  DataSourceVM,
  PipelineNode,
  SchemaNode,
  StreamLine,
  WarehouseColumnVM,
} from './types';

// ─── Seeded random (LCG) ─────────────────────────────────────────────────────
function makeSeededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function generateSeries(count: number, base: number, volatility: number, seed: number): number[] {
  const rand = makeSeededRandom(seed);
  const out: number[] = [];
  let current = base;
  for (let i = 0; i < count; i += 1) {
    current += (rand() - 0.5) * volatility;
    out.push(Math.max(0, Math.round(current)));
  }
  return out;
}

// ─── KPI cards ───────────────────────────────────────────────────────────────
export interface KpiSeed {
  label: string;
  value: string;
  unit: string;
  delta: string;
  deltaDir: 'up' | 'down';
  sub: string;
  spark: number[];
  accent: 'primary' | 'gold' | 'info' | 'success';
}

export const KPI_CARDS: KpiSeed[] = [
  { label: 'Tổng dung lượng', value: '248.4', unit: 'TB', delta: '+4.2 TB', deltaDir: 'up', sub: 'so với 7 ngày', spark: generateSeries(14, 220, 12, 11), accent: 'primary' },
  { label: 'Bản ghi quản lý', value: '1.18', unit: 'tỷ', delta: '+2.1%', deltaDir: 'up', sub: 'so với 7 ngày', spark: generateSeries(14, 1100, 40, 23), accent: 'info' },
  { label: 'Truy vấn / ngày', value: '58.2', unit: 'nghìn', delta: '+12.4%', deltaDir: 'up', sub: 'trung bình 7 ngày', spark: generateSeries(14, 52, 8, 37), accent: 'gold' },
  { label: 'Người dùng hoạt động', value: '248', unit: 'phiên', delta: '-3.0%', deltaDir: 'down', sub: 'đang trực tuyến', spark: generateSeries(14, 260, 20, 53), accent: 'success' },
];

// ─── Line chart: ingestion vs queries by day ─────────────────────────────────
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const ingestion = generateSeries(7, 8200, 900, 101);
const queries = generateSeries(7, 5400, 700, 202);

export const INGESTION_SERIES = DAY_LABELS.map((label, i) => ({
  label,
  ingest: ingestion[i],
  query: queries[i],
}));

// ─── Donut: data volume by domain ────────────────────────────────────────────
export const DOMAIN_DONUT: DonutDatum[] = [
  { name: 'Quản lý quân nhân', value: 38, color: 'hsl(var(--chart-1))' },
  { name: 'Giáo dục đào tạo', value: 24, color: 'hsl(var(--chart-2))' },
  { name: 'Quản lý cán bộ', value: 18, color: 'hsl(var(--chart-3))' },
  { name: 'Nghiên cứu khoa học', value: 12, color: 'hsl(var(--chart-4))' },
  { name: 'Khác', value: 8, color: 'hsl(var(--chart-5))' },
];

// ─── Bar: records by unit (replaces template VNMap) ──────────────────────────
export const UNIT_BARS: BarDatum[] = [
  { label: 'Khối Cơ quan', value: 218 },
  { label: 'Khối Khoa', value: 184 },
  { label: 'Khối Hệ', value: 142 },
  { label: 'Khối Tiểu đoàn', value: 96 },
  { label: 'Đơn vị trực thuộc', value: 64 },
];

// ─── Bar: top datasets by size ───────────────────────────────────────────────
export const TOP_DATASETS: BarDatum[] = [
  { label: 'wh_quannhan', value: 38 },
  { label: 'wh_canbo', value: 24 },
  { label: 'dl_daotao', value: 19 },
  { label: 'wh_khoahoc', value: 12 },
  { label: 'oltp_hethong', value: 8 },
];

export interface SlowQuery {
  id: string;
  query: string;
  duration: string;
  user: string;
}

export const SLOW_QUERIES: SlowQuery[] = [
  { id: 'q1', query: 'SELECT * FROM wh_quannhan JOIN ...', duration: '14.2s', user: 'analyst.bigdata' },
  { id: 'q2', query: 'AGG don_vi GROUP BY cap_bac', duration: '9.8s', user: 'p.quanluc' },
  { id: 'q3', query: 'JOIN dl_daotao x ket_qua', duration: '7.1s', user: 'p.daotao' },
];

// ─── Heatmap: access intensity 7×24 ──────────────────────────────────────────
export function buildAccessHeatmap(): number[][] {
  const rand = makeSeededRandom(777);
  const rows: number[][] = [];
  for (let day = 0; day < 7; day += 1) {
    const cols: number[] = [];
    const isWeekend = day >= 5;
    for (let hour = 0; hour < 24; hour += 1) {
      const workHours = hour >= 7 && hour <= 18;
      let base = workHours ? 0.6 : 0.12;
      if (isWeekend) base *= 0.4;
      cols.push(Math.min(1, Math.max(0, base + (rand() - 0.5) * 0.3)));
    }
    rows.push(cols);
  }
  return rows;
}

// ─── Realtime stream seed (initial lines) ────────────────────────────────────
export const INITIAL_STREAM: StreamLine[] = [
  { id: 1, t: '14:32:08', lv: 'OK', msg: 'Pipeline etl_quannhan_daily hoàn tất (218.4M bản ghi)' },
  { id: 2, t: '14:31:54', lv: 'I', msg: 'Đồng bộ kho dữ liệu wh_canbo: 24.1M dòng' },
  { id: 3, t: '14:31:40', lv: 'I', msg: 'Truy vấn báo cáo thống kê cán bộ theo cấp bậc' },
  { id: 4, t: '14:31:12', lv: 'W', msg: 'Độ trễ I/O HDFS node-07 tăng nhẹ (820ms)' },
  { id: 5, t: '14:30:48', lv: 'OK', msg: 'Kiểm tra chất lượng dl_daotao đạt 99.2%' },
  { id: 6, t: '14:30:22', lv: 'I', msg: 'Người dùng analyst.bigdata đăng nhập' },
];

export const STREAM_MESSAGES: { lv: StreamLine['lv']; msg: string }[] = [
  { lv: 'OK', msg: 'Job đồng bộ kho dữ liệu hoàn tất' },
  { lv: 'I', msg: 'Truy vấn phân tích dữ liệu đào tạo' },
  { lv: 'I', msg: 'Nạp batch dữ liệu quân nhân mới' },
  { lv: 'W', msg: 'Cảnh báo dung lượng vùng staging > 80%' },
  { lv: 'OK', msg: 'Kiểm tra chất lượng dữ liệu đạt ngưỡng' },
  { lv: 'E', msg: 'Lỗi kết nối nguồn OLTP tạm thời, đang thử lại' },
  { lv: 'I', msg: 'Xuất báo cáo thống kê định kỳ' },
];

// ─── Running pipelines ───────────────────────────────────────────────────────
export interface RunningPipeline {
  id: string;
  name: string;
  progress: number;
  status: 'ok' | 'warn' | 'err';
}

export const RUNNING_PIPELINES: RunningPipeline[] = [
  { id: 'p1', name: 'etl_quannhan_daily', progress: 100, status: 'ok' },
  { id: 'p2', name: 'sync_wh_canbo', progress: 72, status: 'ok' },
  { id: 'p3', name: 'load_dl_daotao', progress: 45, status: 'warn' },
  { id: 'p4', name: 'agg_khoahoc_weekly', progress: 18, status: 'ok' },
];

// ─── Security 24h ────────────────────────────────────────────────────────────
export interface SecurityTile {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'err';
}

export const SECURITY_TILES: SecurityTile[] = [
  { label: 'Đăng nhập thành công', value: '1.24k', status: 'ok' },
  { label: 'Đăng nhập thất bại', value: '38', status: 'warn' },
  { label: 'Truy cập bị từ chối', value: '12', status: 'warn' },
  { label: 'Sự kiện nghi vấn', value: '2', status: 'err' },
];

export const COMPLIANCE_CHECKLIST: { label: string; ok: boolean }[] = [
  { label: 'Mã hóa dữ liệu khi lưu trữ (at-rest)', ok: true },
  { label: 'Bật xác thực 2 lớp cho tài khoản quản trị', ok: true },
  { label: 'Phân loại dữ liệu nhạy cảm theo cấp độ', ok: true },
  { label: 'Rà soát nhật ký truy cập định kỳ', ok: false },
];

// ─── Data sources catalog (Phase 2) ──────────────────────────────────────────
export const DATA_SOURCES: DataSourceVM[] = [
  { id: 'wh_quannhan', name: 'wh_quannhan', title: 'Kho dữ liệu Quân nhân', type: 'warehouse', engine: 'Hive', status: 'ok', recordCount: 218_400_000, size: '38.4 TB', tableCount: 142, owner: 'P. Quân lực', updated: '14:28 hôm nay', health: 96, domain: 'Quản lý quân nhân', description: 'Dữ liệu hồ sơ, biên chế, điều động quân nhân toàn học viện.' },
  { id: 'wh_canbo', name: 'wh_canbo', title: 'Kho dữ liệu Cán bộ', type: 'warehouse', engine: 'Hive', status: 'ok', recordCount: 24_100_000, size: '12.1 TB', tableCount: 88, owner: 'P. Cán bộ', updated: '14:20 hôm nay', health: 94, domain: 'Quản lý cán bộ', description: 'Hồ sơ cán bộ, chính sách, khen thưởng, kỷ luật.' },
  { id: 'dl_daotao', name: 'dl_daotao', title: 'Data Lake Đào tạo', type: 'datalake', engine: 'Iceberg', status: 'warn', recordCount: 86_200_000, size: '19.2 TB', tableCount: 64, owner: 'P. Đào tạo', updated: '13:55 hôm nay', health: 82, domain: 'Giáo dục đào tạo', description: 'Kết quả học tập, chương trình đào tạo, lịch giảng dạy.' },
  { id: 'wh_khoahoc', name: 'wh_khoahoc', title: 'Kho dữ liệu Khoa học', type: 'warehouse', engine: 'Hive', status: 'ok', recordCount: 12_800_000, size: '8.4 TB', tableCount: 52, owner: 'P. KHCN', updated: '12:40 hôm nay', health: 91, domain: 'Nghiên cứu khoa học', description: 'Đề tài, công trình, hội đồng, kinh phí nghiên cứu khoa học.' },
  { id: 'oltp_hethong', name: 'oltp_hethong', title: 'CSDL Vận hành hệ thống', type: 'oltp', engine: 'PostgreSQL', status: 'ok', recordCount: 4_200_000, size: '2.1 TB', tableCount: 210, owner: 'TT. CNTT', updated: 'Thời gian thực', health: 99, domain: 'Khác', description: 'Cơ sở dữ liệu giao dịch trực tuyến của các phân hệ nghiệp vụ.' },
  { id: 'stream_events', name: 'stream_events', title: 'Luồng sự kiện hệ thống', type: 'stream', engine: 'Kafka', status: 'syncing', recordCount: 0, size: '—', tableCount: 18, owner: 'TT. CNTT', updated: 'Thời gian thực', health: 88, domain: 'Khác', description: 'Sự kiện đăng nhập, audit, thao tác người dùng theo thời gian thực.' },
];

// ─── Warehouse schema tree + sample (Phase 2) ────────────────────────────────
export const WAREHOUSE_SCHEMAS: SchemaNode[] = [
  {
    schema: 'wh_quannhan',
    tables: [
      { name: 'tbl_qn_master', rows: '218.4M', size: '14.2 TB', updated: '14:28' },
      { name: 'tbl_qn_bienche', rows: '4.1M', size: '1.2 TB', updated: '14:20' },
      { name: 'tbl_qn_dieudong', rows: '8.9M', size: '2.4 TB', updated: '13:50' },
    ],
  },
  {
    schema: 'wh_canbo',
    tables: [
      { name: 'tbl_cb_hoso', rows: '24.1M', size: '6.1 TB', updated: '14:20' },
      { name: 'tbl_cb_khenthuong', rows: '1.8M', size: '0.4 TB', updated: '12:10' },
    ],
  },
  {
    schema: 'dl_daotao',
    tables: [
      { name: 'tbl_ket_qua_hoc_tap', rows: '52.3M', size: '9.8 TB', updated: '13:55' },
      { name: 'tbl_chuong_trinh', rows: '12.1k', size: '0.1 TB', updated: '09:30' },
    ],
  },
];

export const SAMPLE_COLUMNS: WarehouseColumnVM[] = [
  { name: 'id', type: 'BIGINT', nullable: false, description: 'Khóa chính' },
  { name: 'ma_qn', type: 'VARCHAR(32)', nullable: false, description: 'Mã quân nhân' },
  { name: 'ho_ten', type: 'VARCHAR(128)', nullable: false, description: 'Họ và tên' },
  { name: 'don_vi', type: 'VARCHAR(128)', nullable: true, description: 'Đơn vị công tác' },
  { name: 'cap_bac', type: 'VARCHAR(32)', nullable: true, description: 'Cấp bậc' },
  { name: 'ngay_sinh', type: 'DATE', nullable: true, description: 'Ngày sinh' },
];

export const SAMPLE_ROWS: Record<string, string | number>[] = [
  { id: 100001, ma_qn: 'QN-2024100', ho_ten: 'Nguyễn Văn An', don_vi: 'K1-Đại đội 1', cap_bac: 'Trung úy', ngay_sinh: '1992-03-14' },
  { id: 100002, ma_qn: 'QN-2024101', ho_ten: 'Trần Quốc Bảo', don_vi: 'K1-Đại đội 2', cap_bac: 'Thượng úy', ngay_sinh: '1990-07-22' },
  { id: 100003, ma_qn: 'QN-2024102', ho_ten: 'Lê Minh Cường', don_vi: 'K2-Đại đội 1', cap_bac: 'Đại úy', ngay_sinh: '1988-11-03' },
];

// ─── Pipeline DAG sample (Phase 3 shells) ────────────────────────────────────
export const SAMPLE_DAG: PipelineNode[] = [
  { id: 'n1', label: 'OLTP nguồn', kind: 'source' },
  { id: 'n2', label: 'Trích xuất', kind: 'extract' },
  { id: 'n3', label: 'Chuẩn hóa', kind: 'transform', highlight: true },
  { id: 'n4', label: 'Kiểm tra CL', kind: 'quality' },
  { id: 'n5', label: 'Nạp kho', kind: 'load' },
];
