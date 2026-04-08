'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import {
  FileText,
  Download,
  RefreshCw,
  Plus,
  Calendar,
  FileSpreadsheet,
  Eye,
  Sparkles,
} from 'lucide-react';

interface Report {
  id: string;
  reportType: string;
  month: number;
  year: number;
  pdfPath: string | null;
  excelPath: string | null;
  summary: any;
  generatedAt: string;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReportType, setNewReportType] = useState('student');
  const [newReportMonth, setNewReportMonth] = useState(new Date().getMonth() + 1);
  const [newReportYear, setNewReportYear] = useState(new Date().getFullYear());

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType && filterType !== 'all') {
        params.append('reportType', filterType);
      }
      if (filterYear && filterYear !== 'all') {
        params.append('year', filterYear);
      }

      const response = await fetch(`/api/ai/reports?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Đã xảy ra lỗi khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [filterType, filterYear]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/ai/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: newReportType,
          month: newReportMonth,
          year: newReportYear,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Tạo báo cáo thành công');
        setIsDialogOpen(false);
        loadReports();
      } else {
        toast.error(data.error || 'Đã xảy ra lỗi');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Đã xảy ra lỗi khi tạo báo cáo');
    } finally {
      setGenerating(false);
    }
  };

  const getReportTypeBadge = (type: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      student: { label: 'Học viên', variant: 'default' },
      faculty: { label: 'Giảng viên', variant: 'secondary' },
      department: { label: 'Khoa/Phòng', variant: 'outline' },
      academy: { label: 'Học viện', variant: 'destructive' },
    };
    const badge = badges[type] || { label: type, variant: 'outline' };
    return (
      <Badge variant={badge.variant as any} className="capitalize">
        {badge.label}
      </Badge>
    );
  };

  const getMonthName = (month: number) => {
    const months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    return months[month - 1] || `Tháng ${month}`;
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo AI</h1>
          <p className="text-muted-foreground">
            Báo cáo tự động hàng tháng với AI Insights
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo báo cáo mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Loại báo cáo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="student">Học viên</SelectItem>
                  <SelectItem value="faculty">Giảng viên</SelectItem>
                  <SelectItem value="department">Khoa/Phòng</SelectItem>
                  <SelectItem value="academy">Học viện</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Năm</Label>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={loadReports} disabled={loading} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang tải báo cáo...</p>
        </div>
      )}

      {!loading && reports.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Chưa có báo cáo nào</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Tạo báo cáo đầu tiên
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && reports.length > 0 && (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        {report.summary?.title || 'Báo cáo'}
                      </h3>
                      {getReportTypeBadge(report.reportType)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {getMonthName(report.month)} {report.year}
                      </div>
                      <div>
                        Tạo: {new Date(report.generatedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    {report.summary?.highlights && (
                      <div className="space-y-1 text-sm">
                        {report.summary.highlights.slice(0, 3).map((highlight: string, index: number) => (
                          <p key={index} className="text-muted-foreground">
                            • {highlight}
                          </p>
                        ))}
                      </div>
                    )}
                    {report.summary?.aiInsights && (
                      <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            AI Insights
                          </span>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 line-clamp-2">
                          {report.summary.aiInsights}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {report.pdfPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.pdfPath!, '_blank')}
                        className="gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </Button>
                    )}
                    {report.excelPath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.excelPath!, '_blank')}
                        className="gap-2"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo báo cáo mới</DialogTitle>
            <DialogDescription>
              Tạo báo cáo tự động với AI Insights và xuất file PDF/Excel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loại báo cáo</Label>
              <Select value={newReportType} onValueChange={setNewReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Báo cáo học viên</SelectItem>
                  <SelectItem value="faculty">Báo cáo giảng viên</SelectItem>
                  <SelectItem value="academy">Báo cáo tổng hợp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tháng</Label>
                <Select
                  value={newReportMonth.toString()}
                  onValueChange={(v) => setNewReportMonth(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        Tháng {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Năm</Label>
                <Select
                  value={newReportYear.toString()}
                  onValueChange={(v) => setNewReportYear(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={generateReport} disabled={generating} className="gap-2">
              {generating && <RefreshCw className="w-4 h-4 animate-spin" />}
              Tạo báo cáo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
