'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, FileText, Info } from 'lucide-react';

interface ImportResult {
  success: boolean;
  fileName: string;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { row: number; soQuan: string; reason: string }[];
  dryRun?: boolean;
  preview?: any[];
}

export default function PersonnelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setResult(null); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) { setFile(f); setResult(null); }
  };

  const handleUpload = async (isDry: boolean) => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dryRun', String(isDry));

      const res = await fetch('/api/personnel/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi import');
      setResult(data);
      if (!isDry) {
        toast({
          title: 'Import thành công',
          description: `Đã tạo ${data.created} mới, cập nhật ${data.updated} hồ sơ`,
        });
      }
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/personnel/import';
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="h-6 w-6 text-green-600" />
          Nhập dữ liệu cán bộ
        </h1>
        <p className="text-muted-foreground mt-1">Nhập hàng loạt từ file CSV (định dạng chuẩn 2A-LLDV)</p>
      </div>

      {/* Instructions */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-1">
              <p className="font-medium">Hướng dẫn nhập dữ liệu:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Tải file mẫu CSV bên dưới</li>
                <li>Điền dữ liệu vào file mẫu (không xóa dòng tiêu đề)</li>
                <li>Từ Excel: <strong>File → Lưu dưới dạng → CSV UTF-8</strong></li>
                <li>Chạy <strong>Kiểm tra trước</strong> (dry-run) để xem lỗi trước khi import thật</li>
                <li>Nếu không có lỗi, bấm <strong>Import thật</strong></li>
              </ol>
              <p className="text-xs mt-2">
                Trường bắt buộc: <code>hoVaTen</code>, <code>soQuan</code>.
                Nếu số quân đã tồn tại → cập nhật. Nếu mới → tạo mới (mật khẩu mặc định cần đổi).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="h-4 w-4 mr-2" /> Tải file mẫu CSV
        </Button>
      </div>

      {/* Upload area */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Chọn file CSV</CardTitle></CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium text-green-600 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" /> {file.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Kéo thả file CSV vào đây hoặc click để chọn</p>
                <p className="text-xs text-muted-foreground mt-1">Chỉ hỗ trợ *.csv (UTF-8)</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

          {file && (
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => handleUpload(true)} disabled={loading} className="flex-1">
                <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                {loading ? 'Đang kiểm tra...' : 'Kiểm tra trước (dry-run)'}
              </Button>
              <Button onClick={() => handleUpload(false)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Đang import...' : 'Import thật'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {result.dryRun ? (
                <><AlertCircle className="h-4 w-4 text-yellow-500" /> Kết quả kiểm tra (Dry-run)</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 text-green-500" /> Kết quả import</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Tổng dòng', value: result.total, color: 'text-blue-600' },
                { label: 'Tạo mới', value: result.created, color: 'text-green-600' },
                { label: 'Cập nhật', value: result.updated, color: 'text-amber-600' },
                { label: 'Bỏ qua', value: result.skipped, color: 'text-red-600' },
              ].map(s => (
                <div key={s.label} className="text-center p-3 bg-muted/30 rounded">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <XCircle className="h-4 w-4" /> {result.errors.length} lỗi:
                </p>
                <div className="overflow-y-auto max-h-48 text-xs border rounded divide-y">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      <Badge variant="outline" className="text-xs shrink-0">Dòng {e.row}</Badge>
                      <span className="text-muted-foreground">{e.soQuan}</span>
                      <span className="text-red-600">{e.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length === 0 && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Không có lỗi nào được phát hiện
              </p>
            )}

            {result.dryRun && result.errors.length === 0 && (
              <Button onClick={() => handleUpload(false)} className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" /> Tiến hành Import thật
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
