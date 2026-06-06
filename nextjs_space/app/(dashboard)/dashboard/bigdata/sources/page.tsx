'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, LayoutGrid, Loader2, Plus, Search, Table as TableIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  EmptyState,
  FilterBar,
  ModuleHero,
} from '@/components/ui/enhanced-data-card';
import { cn } from '@/lib/utils';
import { DataSourceCard } from '@/components/bigdata/data-source-card';
import { DataSourceDetailDialog } from '@/components/bigdata/data-source-detail-dialog';
import { StatusTag } from '@/components/bigdata/status-tag';
import { formatShort } from '@/components/bigdata/format';
import {
  SOURCE_STATUS_KIND,
  SOURCE_STATUS_LABEL,
  SOURCE_TYPE_LABEL,
} from '@/components/bigdata/source-helpers';
import type { DataSourceType, DataSourceVM } from '@/components/bigdata/types';

type ViewMode = 'grid' | 'table';
type TypeFilter = 'all' | DataSourceType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'warehouse', label: 'Kho dữ liệu' },
  { value: 'datalake', label: 'Data Lake' },
  { value: 'oltp', label: 'OLTP' },
  { value: 'stream', label: 'Luồng' },
];

export default function DataSourcesPage() {
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [active, setActive] = useState<DataSourceVM | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sources, setSources] = useState<DataSourceVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    fetch('/api/bigdata/sources', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSources(json.data as DataSourceVM[]);
        } else {
          setLoadError(true);
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') setLoadError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return sources.filter((s) => {
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      const matchKw =
        !kw ||
        s.title.toLowerCase().includes(kw) ||
        s.name.toLowerCase().includes(kw) ||
        s.domain.toLowerCase().includes(kw);
      return matchType && matchKw;
    });
  }, [keyword, typeFilter, sources]);

  const openDetail = (source: DataSourceVM) => {
    setActive(source);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="bigdata"
        supra="KHAI THÁC DỮ LIỆU · NGUỒN DỮ LIỆU"
        title="Danh mục nguồn dữ liệu"
        subtitle="Kho dữ liệu, data lake, CSDL vận hành và luồng dữ liệu toàn hệ thống"
        icon={Database}
        stats={[
          { label: 'Nguồn', value: sources.length },
          { label: 'Đang hoạt động', value: sources.filter((s) => s.status === 'ok').length },
        ]}
        actions={
          <Button size="sm" className="bg-white text-primary hover:bg-white/90">
            <Plus className="h-4 w-4" /> Đăng ký nguồn
          </Button>
        }
      />

      <FilterBar>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên, mã hoặc lĩnh vực…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setTypeFilter(filter.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                typeFilter === filter.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setView('grid')}
            className={cn('rounded p-1.5', view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            aria-label="Dạng thẻ"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('table')}
            className={cn('rounded p-1.5', view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
            aria-label="Dạng bảng"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải danh mục nguồn dữ liệu…
        </div>
      ) : loadError ? (
        <EmptyState
          icon={Database}
          title="Không tải được danh mục nguồn dữ liệu"
          description="Đã xảy ra lỗi khi gọi API. Vui lòng thử lại."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Database}
          title="Không tìm thấy nguồn dữ liệu"
          description="Thử thay đổi từ khóa hoặc bộ lọc loại nguồn."
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((source) => (
            <DataSourceCard key={source.id} source={source} onOpen={openDetail} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nguồn dữ liệu</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead className="text-right">Bản ghi</TableHead>
                <TableHead className="text-right">Dung lượng</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((source) => (
                <TableRow
                  key={source.id}
                  className="cursor-pointer"
                  onClick={() => openDetail(source)}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{source.title}</p>
                    <p className="font-mono text-xs text-muted-foreground">{source.name}</p>
                  </TableCell>
                  <TableCell className="text-sm">{SOURCE_TYPE_LABEL[source.type]}</TableCell>
                  <TableCell className="text-right text-sm">
                    {source.recordCount > 0 ? formatShort(source.recordCount) : '—'}
                  </TableCell>
                  <TableCell className="text-right text-sm">{source.size}</TableCell>
                  <TableCell className="text-sm">{source.owner}</TableCell>
                  <TableCell>
                    <StatusTag status={SOURCE_STATUS_KIND[source.status]} label={SOURCE_STATUS_LABEL[source.status]} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DataSourceDetailDialog source={active} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
