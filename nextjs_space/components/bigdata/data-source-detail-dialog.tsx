'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusTag } from './status-tag';
import { PipelineDag } from './pipeline-dag';
import { formatShort } from './format';
import {
  SOURCE_STATUS_KIND,
  SOURCE_STATUS_LABEL,
  SOURCE_TYPE_LABEL,
} from './source-helpers';
import { SAMPLE_COLUMNS, SAMPLE_DAG } from './mock-data';
import type { DataSourceVM } from './types';

interface DataSourceDetailDialogProps {
  source: DataSourceVM | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

/** Data source detail dialog with overview/schema/usage/access/lineage tabs. */
export function DataSourceDetailDialog({ source, open, onOpenChange }: DataSourceDetailDialogProps) {
  if (!source) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{source.title}</DialogTitle>
              <DialogDescription className="font-mono">{source.name}</DialogDescription>
            </div>
            <StatusTag status={SOURCE_STATUS_KIND[source.status]} label={SOURCE_STATUS_LABEL[source.status]} />
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="schema">Cấu trúc</TabsTrigger>
            <TabsTrigger value="usage">Sử dụng</TabsTrigger>
            <TabsTrigger value="access">Truy cập</TabsTrigger>
            <TabsTrigger value="lineage">Dòng dữ liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">{source.description}</p>
            <MetaRow label="Loại nguồn" value={SOURCE_TYPE_LABEL[source.type]} />
            <MetaRow label="Engine" value={source.engine} />
            <MetaRow label="Lĩnh vực" value={source.domain} />
            <MetaRow label="Đơn vị quản lý" value={source.owner} />
            <MetaRow label="Số bản ghi" value={source.recordCount > 0 ? formatShort(source.recordCount) : '—'} />
            <MetaRow label="Dung lượng" value={source.size} />
            <MetaRow label="Số bảng" value={String(source.tableCount)} />
            <MetaRow label="Sức khỏe" value={`${source.health}%`} />
            <MetaRow label="Cập nhật" value={source.updated} />
          </TabsContent>

          <TabsContent value="schema" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cột</TableHead>
                  <TableHead>Kiểu</TableHead>
                  <TableHead>Null</TableHead>
                  <TableHead>Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_COLUMNS.map((col) => (
                  <TableRow key={col.name}>
                    <TableCell className="font-mono text-xs">{col.name}</TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {col.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{col.nullable ? 'YES' : 'NO'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{col.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="usage" className="mt-4 space-y-2">
            <MetaRow label="Truy vấn / ngày (TB)" value="~12.4k" />
            <MetaRow label="Người dùng truy cập" value="38" />
            <MetaRow label="Truy vấn chậm 24h" value="3" />
            <MetaRow label="Job đồng bộ gần nhất" value={source.updated} />
            <p className="pt-2 text-xs text-muted-foreground">
              Số liệu sử dụng minh họa. Giai đoạn sau lấy từ nhật ký truy vấn thực tế.
            </p>
          </TabsContent>

          <TabsContent value="access" className="mt-4 space-y-2">
            <MetaRow label="Cấp độ phân loại" value="MẬT" />
            <MetaRow label="Chính sách truy cập" value="Theo phạm vi đơn vị (UNIT)" />
            <MetaRow label="Yêu cầu MFA" value="Có" />
            <MetaRow label="Mã hóa khi lưu" value="AES-256" />
            <p className="pt-2 text-xs text-muted-foreground">
              Quyền truy cập thực thi tại backend qua M01 (RBAC + scope). Đây là thông tin hiển thị.
            </p>
          </TabsContent>

          <TabsContent value="lineage" className="mt-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Luồng dữ liệu từ nguồn đến kho (minh họa):
            </p>
            <PipelineDag nodes={SAMPLE_DAG} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
