'use client';

import { useMemo, useState } from 'react';
import { Layers, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataPanel, ModuleHero } from '@/components/ui/enhanced-data-card';
import {
  WarehouseSchemaTree,
  type SchemaSelection,
} from '@/components/bigdata/warehouse-schema-tree';
import {
  SAMPLE_COLUMNS,
  SAMPLE_ROWS,
  WAREHOUSE_SCHEMAS,
} from '@/components/bigdata/mock-data';

const FIRST = WAREHOUSE_SCHEMAS[0];
const INITIAL_SELECTION: SchemaSelection = {
  schema: FIRST.schema,
  table: FIRST.tables[0].name,
};

export default function WarehouseBrowserPage() {
  const [selected, setSelected] = useState<SchemaSelection>(INITIAL_SELECTION);

  const tableMeta = useMemo(() => {
    const schema = WAREHOUSE_SCHEMAS.find((s) => s.schema === selected.schema);
    return schema?.tables.find((t) => t.name === selected.table) ?? null;
  }, [selected]);

  const columnNames = SAMPLE_COLUMNS.map((c) => c.name);

  return (
    <div className="space-y-6">
      <ModuleHero
        moduleId="bigdata"
        supra="KHAI THÁC DỮ LIỆU · KHO DỮ LIỆU"
        title="Trình duyệt kho dữ liệu"
        subtitle="Khám phá schema, cấu trúc bảng, thống kê và truy vấn mẫu"
        icon={Layers}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Schema tree */}
        <DataPanel title="Schema & Bảng" subtitle={`${WAREHOUSE_SCHEMAS.length} schema`}>
          <WarehouseSchemaTree
            schemas={WAREHOUSE_SCHEMAS}
            selected={selected}
            onSelect={setSelected}
          />
        </DataPanel>

        {/* Content */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {selected.schema}.{selected.table}
                </p>
                {tableMeta && (
                  <p className="text-xs text-muted-foreground">
                    {tableMeta.rows} dòng · {tableMeta.size} · cập nhật {tableMeta.updated}
                  </p>
                )}
              </div>
              <Button size="sm" variant="outline">
                <Play className="h-4 w-4" /> Chạy truy vấn mẫu
              </Button>
            </div>
          </div>

          <Tabs defaultValue="preview">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="preview">Xem trước</TabsTrigger>
              <TabsTrigger value="columns">Cấu trúc</TabsTrigger>
              <TabsTrigger value="stats">Thống kê</TabsTrigger>
              <TabsTrigger value="query">Truy vấn</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnNames.map((name) => (
                        <TableHead key={name} className="font-mono text-xs">
                          {name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SAMPLE_ROWS.map((row, i) => (
                      <TableRow key={i}>
                        {columnNames.map((name) => (
                          <TableCell key={name} className="font-mono text-xs">
                            {String(row[name] ?? '')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Hiển thị {SAMPLE_ROWS.length} dòng mẫu. Giai đoạn sau lấy dữ liệu thực qua
                <span className="font-mono"> /api/data/preview/[id]</span>.
              </p>
            </TabsContent>

            <TabsContent value="columns" className="mt-4">
              <div className="rounded-xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cột</TableHead>
                      <TableHead>Kiểu dữ liệu</TableHead>
                      <TableHead>Nullable</TableHead>
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
              </div>
            </TabsContent>

            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Số dòng', value: tableMeta?.rows ?? '—' },
                  { label: 'Dung lượng', value: tableMeta?.size ?? '—' },
                  { label: 'Số cột', value: String(SAMPLE_COLUMNS.length) },
                  { label: 'Cập nhật', value: tableMeta?.updated ?? '—' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="query" className="mt-4">
              <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs text-foreground">
{`SELECT ${columnNames.join(', ')}
FROM ${selected.schema}.${selected.table}
WHERE don_vi LIKE 'K1%'
ORDER BY ngay_sinh DESC
LIMIT 100;`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                Truy vấn mẫu chỉ để minh họa. Thực thi truy vấn thật phải qua lớp service có kiểm
                soát quyền (M01) và scope đơn vị.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
