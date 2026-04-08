'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Eye,
  Search,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  File,
  FileSpreadsheet,
  FileJson,
  Archive,
  HardDrive,
  FolderOpen,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { KPICard, PageHeader, DataPanel, StatusBadge, FilterBar } from '@/components/ui/enhanced-data-card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Dataset {
  id: string;
  filename: string;
  originalName: string;
  title: string;
  description: string | null;
  fileSize: number;
  fileType: string;
  mimeType: string;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
  status: string;
  tags: string[];
  objectKey: string;
  downloadCount: number;
  viewCount: number;
}

export default function DataManagePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (session) {
      loadDatasets();
    }
  }, [session, page, typeFilter, statusFilter]);

  const loadDatasets = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(typeFilter && typeFilter !== 'ALL' && { fileType: typeFilter }),
        ...(statusFilter && statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/data/list?${params}`);
      const result = await response.json();

      if (result.success) {
        setDatasets(result.datasets || []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        toast.error('Không thể tải danh sách dữ liệu');
      }
    } catch (error: any) {
      toast.error(error.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDatasets();
  };

  const handleDownload = async (dataset: Dataset) => {
    try {
      // Get presigned URL from S3
      const response = await fetch(`/api/data/download?id=${dataset.id}`);
      const result = await response.json();

      if (result.success && result.url) {
        // Create download link
        const a = document.createElement('a');
        a.href = result.url;
        a.download = dataset.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success('Đang tải xuống...');
      } else {
        toast.error('Không thể tải file');
      }
    } catch (error) {
      toast.error('Lỗi khi tải file');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa file này?')) return;

    try {
      const response = await fetch(`/api/data/delete?id=${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast.success('Đã xóa file');
        loadDatasets();
      } else {
        toast.error(result.error || 'Không thể xóa file');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('csv') || fileType === 'DATASET') {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    if (mimeType?.includes('json') || fileType === 'MODEL') {
      return <FileJson className="w-5 h-5 text-yellow-600" />;
    }
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) {
      return <Archive className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType?.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-blue-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <StatusBadge status="success" label="Hoàn thành" />;
      case 'PROCESSING':
        return <StatusBadge status="warning" label="Đang xử lý" />;
      case 'UPLOADING':
        return <StatusBadge status="info" label="Đang tải" />;
      case 'ERROR':
        return <StatusBadge status="danger" label="Lỗi" />;
      default:
        return <StatusBadge status="neutral" label={status} />;
    }
  };

  // Calculate stats
  const totalSize = datasets.reduce((sum, d) => sum + d.fileSize, 0);
  const completedCount = datasets.filter(d => d.status === 'COMPLETED').length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quản lý Dữ liệu"
        subtitle="Quản lý các file dữ liệu, dataset nghiên cứu đã tải lên"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadDatasets()}
              className="border-slate-300 dark:border-slate-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
            <Link href="/dashboard/data/upload">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Upload className="w-4 h-4 mr-2" />
                Tải lên mới
              </Button>
            </Link>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <KPICard
          title="Tổng số file"
          value={total}
          subtitle="Files đã tải lên"
          icon={Database}
          variant="info"
        />
        <KPICard
          title="Dung lượng"
          value={formatFileSize(totalSize)}
          subtitle="Tổng dung lượng"
          icon={HardDrive}
          variant="default"
        />
        <KPICard
          title="Hoàn thành"
          value={completedCount}
          subtitle="Files hoàn tất"
          icon={CheckCircle2}
          variant="success"
        />
        <KPICard
          title="Datasets"
          value={datasets.filter(d => d.fileType === 'DATASET').length}
          subtitle="Dữ liệu nghiên cứu"
          icon={FolderOpen}
          variant="warning"
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm theo tên, tiêu đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
        <div className="w-[160px]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-900">
              <SelectValue placeholder="Loại file" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="DATASET">Dataset</SelectItem>
              <SelectItem value="RESEARCH_PAPER">Nghiên cứu</SelectItem>
              <SelectItem value="REPORT">Báo cáo</SelectItem>
              <SelectItem value="MODEL">Model</SelectItem>
              <SelectItem value="OTHER">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-slate-900">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
              <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
              <SelectItem value="UPLOADING">Đang tải</SelectItem>
              <SelectItem value="ERROR">Lỗi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} variant="outline">
          <Search className="w-4 h-4 mr-2" />
          Tìm
        </Button>
      </FilterBar>

      {/* Data Table */}
      <DataPanel title="Danh sách File" subtitle={`Hiển thị ${datasets.length} / ${total} files`}>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="text-left">Tên file</th>
                <th className="text-left">Loại</th>
                <th className="text-left">Kích thước</th>
                <th className="text-left">Người tải</th>
                <th className="text-left">Ngày tải</th>
                <th className="text-left">Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      <span className="text-slate-500">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : datasets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Database className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                      <span className="text-slate-500 dark:text-slate-400">Chưa có dữ liệu nào</span>
                      <Link href="/dashboard/data/upload">
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Tải lên file đầu tiên
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                datasets.map((dataset) => (
                  <tr key={dataset.id} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        {getFileIcon(dataset.fileType, dataset.mimeType)}
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                            {dataset.title || dataset.originalName}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {dataset.originalName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        status="neutral"
                        label={dataset.fileType?.replace('_', ' ')}
                      />
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">
                      {formatFileSize(dataset.fileSize)}
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">
                      {dataset.uploaderName}
                    </td>
                    <td className="text-slate-600 dark:text-slate-400">
                      {new Date(dataset.uploadedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>{getStatusBadge(dataset.status)}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(dataset)}
                          className="hover:bg-green-100 dark:hover:bg-green-900/30"
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/data/preview/${dataset.id}`)}
                          className="hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="Xem trước"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(dataset.id)}
                          className="hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Trang <span className="font-semibold text-slate-800 dark:text-slate-200">{page}</span> / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
