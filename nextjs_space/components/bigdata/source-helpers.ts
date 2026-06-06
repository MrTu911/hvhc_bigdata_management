import { Database, Layers, Server, Radio, Archive, type LucideIcon } from 'lucide-react';
import type { StatusTagKind } from './status-tag';
import type { DataSourceStatus, DataSourceType } from './types';

export const SOURCE_TYPE_LABEL: Record<DataSourceType, string> = {
  warehouse: 'Kho dữ liệu',
  datalake: 'Data Lake',
  oltp: 'OLTP',
  stream: 'Luồng dữ liệu',
  cold: 'Lưu trữ lạnh',
};

export const SOURCE_TYPE_ICON: Record<DataSourceType, LucideIcon> = {
  warehouse: Database,
  datalake: Layers,
  oltp: Server,
  stream: Radio,
  cold: Archive,
};

export const SOURCE_STATUS_LABEL: Record<DataSourceStatus, string> = {
  ok: 'Hoạt động',
  warn: 'Cảnh báo',
  err: 'Lỗi',
  syncing: 'Đang đồng bộ',
};

// Maps the catalog status onto a StatusTag kind.
export const SOURCE_STATUS_KIND: Record<DataSourceStatus, StatusTagKind> = {
  ok: 'ok',
  warn: 'warn',
  err: 'err',
  syncing: 'info',
};

export function healthKind(health: number): StatusTagKind {
  if (health >= 90) return 'ok';
  if (health >= 75) return 'warn';
  return 'err';
}
