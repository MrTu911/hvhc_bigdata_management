
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  RefreshCw, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataPreview {
  dataset: any;
  schema: any[];
  quality: any;
  processing: any;
  rows: any[];
}

export default function DataPreviewPage() {
  const searchParams = useSearchParams();
  const datasetId = searchParams?.get('id');
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DataPreview | null>(null);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    if (datasetId) {
      loadPreview();
    }
  }, [datasetId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/data/preview?datasetId=${datasetId}&rows=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load preview');

      const result = await response.json();
      setData(result);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClean = async () => {
    setCleaning(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/data/clean', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          datasetId,
          operations: ['remove_nulls', 'remove_duplicates', 'trim_whitespace']
        })
      });

      if (!response.ok) throw new Error('Failed to clean data');

      const result = await response.json();
      toast({
        title: 'Thành công',
        description: `Đã làm sạch dữ liệu. Xóa ${result.results.rowsRemoved} dòng, ${result.results.duplicatesRemoved} bản sao.`
      });

      // Reload preview
      loadPreview();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setCleaning(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Không tìm thấy dataset</CardTitle>
            <CardDescription>Vui lòng chọn dataset từ danh sách.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {data.dataset.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            Xem trước và xử lý dữ liệu
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPreview} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleClean} disabled={cleaning}>
            <Sparkles className="h-4 w-4 mr-2" />
            {cleaning ? 'Đang xử lý...' : 'Làm sạch dữ liệu'}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Tải xuống
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Tổng số dòng
            </CardDescription>
            <CardTitle className="text-3xl text-blue-900 dark:text-blue-100">
              {data.dataset.rowCount?.toLocaleString() || '0'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700 dark:text-green-300">
              Số cột
            </CardDescription>
            <CardTitle className="text-3xl text-green-900 dark:text-green-100">
              {data.dataset.columnCount || '0'}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-purple-700 dark:text-purple-300">
              Chất lượng
            </CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2 text-purple-900 dark:text-purple-100">
              {data.dataset.qualityScore || '85'}%
              {(data.dataset.qualityScore || 85) > 80 ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700 dark:text-orange-300">
              Kích thước
            </CardDescription>
            <CardTitle className="text-3xl text-orange-900 dark:text-orange-100">
              {(data.dataset.size / 1024 / 1024).toFixed(2)} MB
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="preview">
            <FileText className="h-4 w-4 mr-2" />
            Xem trước
          </TabsTrigger>
          <TabsTrigger value="schema">
            <BarChart3 className="h-4 w-4 mr-2" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="quality">
            <TrendingUp className="h-4 w-4 mr-2" />
            Chất lượng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dữ liệu mẫu (100 dòng đầu)</CardTitle>
              <CardDescription>
                Hiển thị {data.rows.length} dòng từ tổng số {data.dataset.rowCount} dòng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto max-h-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      {data.schema.map((col: any, idx: number) => (
                        <TableHead key={idx}>
                          {col.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {col.type}
                          </Badge>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.rows.map((row: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{row._rowId}</TableCell>
                        {data.schema.map((col: any, colIdx: number) => (
                          <TableCell key={colIdx}>
                            {row[col.name] !== null && row[col.name] !== undefined 
                              ? String(row[col.name]) 
                              : <span className="text-muted-foreground italic">null</span>
                            }
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Schema</CardTitle>
              <CardDescription>
                Chi tiết về cấu trúc và kiểu dữ liệu của các cột
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.schema.map((col: any, idx: number) => (
                  <Card key={idx} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-semibold text-lg">{col.name}</h4>
                        <div className="flex gap-2">
                          <Badge>{col.type}</Badge>
                          <Badge variant="outline">
                            {col.nullCount} nulls ({((col.nullCount / (data.dataset.rowCount || 1)) * 100).toFixed(1)}%)
                          </Badge>
                          <Badge variant="outline">
                            {col.uniqueCount} unique
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {col.minValue && <div>Min: {col.minValue}</div>}
                        {col.maxValue && <div>Max: {col.maxValue}</div>}
                      </div>
                    </div>
                    {col.sampleValues && col.sampleValues.length > 0 && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        <span className="font-medium">Mẫu: </span>
                        {col.sampleValues.slice(0, 5).join(', ')}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Đánh giá chất lượng dữ liệu</CardTitle>
              <CardDescription>
                Phân tích và đánh giá độ hoàn chỉnh của dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.quality ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tổng số dòng</p>
                      <p className="text-2xl font-bold">{data.quality.totalRows?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Tổng số cột</p>
                      <p className="text-2xl font-bold">{data.quality.totalColumns}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">% giá trị null</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {data.quality.nullPercentage}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Dòng trùng lặp</p>
                      <p className="text-2xl font-bold text-red-600">
                        {data.quality.duplicateRows}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Điểm chất lượng tổng thể</span>
                      <span className="text-2xl font-bold text-primary">
                        {data.quality.qualityScore}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all"
                        style={{ width: `${data.quality.qualityScore}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có thông tin chất lượng. Vui lòng chạy phân tích.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
