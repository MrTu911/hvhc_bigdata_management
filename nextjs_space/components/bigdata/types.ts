// Shared view-model types for the "Khai thác dữ liệu / BigData Platform" section.
// These are presentation-only shapes consumed by the UI layer. Real persistence
// (DataSource catalog model, warehouse schema metadata) is wired in a later phase.

export type DataSourceStatus = 'ok' | 'warn' | 'err' | 'syncing';

export type DataSourceType = 'warehouse' | 'datalake' | 'oltp' | 'stream' | 'cold';

export interface DataSourceVM {
  id: string;
  name: string;
  title: string;
  type: DataSourceType;
  engine: string;
  status: DataSourceStatus;
  recordCount: number;
  size: string;
  tableCount: number;
  owner: string;
  updated: string;
  health: number; // 0..100
  domain: string;
  description: string;
}

export interface WarehouseTableVM {
  name: string;
  rows: string;
  size: string;
  updated: string;
}

export interface SchemaNode {
  schema: string;
  tables: WarehouseTableVM[];
}

export interface WarehouseColumnVM {
  name: string;
  type: string; // BIGINT, VARCHAR(64), DATE...
  nullable: boolean;
  description?: string;
}

export type StreamLevel = 'OK' | 'I' | 'W' | 'E';

export interface StreamLine {
  id: number | string;
  t: string; // HH:mm:ss
  lv: StreamLevel;
  msg: string;
}

export interface PipelineNode {
  id: string;
  label: string;
  kind: 'source' | 'extract' | 'stream' | 'transform' | 'quality' | 'load';
  highlight?: boolean;
}

export interface PipelineEdge {
  from: string;
  to: string;
}
