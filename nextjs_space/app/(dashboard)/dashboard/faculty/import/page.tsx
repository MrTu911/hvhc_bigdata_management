'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface ImportDetail {
  row: number;
  name: string;
  email: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: string[];
  details: ImportDetail[];
}

export default function FacultyImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (validTypes.includes(selectedFile.type) || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Vui lòng chọn file');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/faculty/import', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Import failed');
      }

      const data: ImportResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Import error:', err);
      alert(`Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a simple template
    const link = document.createElement('a');
    link.href = '/templates/faculty-import-template.xlsx'; // You would need to create this file
    link.download = 'mau-import-giang-vien.xlsx';
    // For now, just alert the user
    alert('Chức năng tải mẫu sẽ được cập nhật sớm');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'skipped':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'skipped':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Upload className="h-8 w-8 text-primary" />
          Import Giảng viên Hàng loạt
        </h1>
        <p className="text-muted-foreground mt-1">
          Tải lên file Excel để import nhiều giảng viên cùng lúc
        </p>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn Import</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Tải file mẫu Excel (nếu cần) và điền thông tin giảng viên</li>
                <li>Các cột bắt buộc: <strong>Họ tên, Email</strong></li>
                <li>Các cột khác (tùy chọn): Mã số, Mật khẩu, Khoa/Phòng, Học hàm, Học vị, Chuyên ngành, Kinh nghiệm giảng dạy, Kinh nghiệm thực tiễn, Số đề tài NC, Số công bố, Số trích dẫn</li>
                <li>Mật khẩu mặc định (nếu không điền): <strong>password123</strong></li>
                <li>Email không được trùng với giảng viên đã có trong hệ thống</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn file Excel</CardTitle>
          <CardDescription>
            Hỗ trợ file .xlsx và .xls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Tải file mẫu
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Chọn file</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
            {file && (
              <p className="text-sm text-muted-foreground">
                Đã chọn: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tổng số</p>
                <p className="text-2xl font-bold">{result.total}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Thành công</p>
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Bỏ qua</p>
                <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Lỗi</p>
                <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
              </div>
            </div>

            {/* Details Table */}
            <div>
              <h3 className="font-semibold mb-3">Chi tiết</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-semibold">Dòng</th>
                        <th className="text-left p-3 font-semibold">Họ tên</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-center p-3 font-semibold">Trạng thái</th>
                        <th className="text-left p-3 font-semibold">Thông báo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.details.map((detail, index) => (
                        <tr key={index} className="border-t hover:bg-muted/50">
                          <td className="p-3">{detail.row}</td>
                          <td className="p-3">{detail.name}</td>
                          <td className="p-3 text-muted-foreground">{detail.email}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {getStatusIcon(detail.status)}
                              <Badge variant={getStatusBadgeVariant(detail.status)}>
                                {detail.status === 'success' && 'Thành công'}
                                {detail.status === 'error' && 'Lỗi'}
                                {detail.status === 'skipped' && 'Bỏ qua'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{detail.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
