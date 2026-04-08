
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Shield,
  FileCheck,
  Clock,
} from 'lucide-react';

interface ComplianceReport {
  generatedAt: string;
  totalDatasets: number;
  compliantCount: number;
  nonCompliantCount: number;
  warningCount: number;
  criticalIssues: number;
  byClassification: Record<string, number>;
  issues: Array<{
    id: string;
    name: string;
    status: string;
    message: string;
    severity: string;
    datasetName: string;
  }>;
}

export default function CompliancePage() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/compliance');
      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching compliance report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return <div>No data available</div>;
  }

  const complianceRate = report.totalDatasets > 0
    ? Math.round((report.compliantCount / report.totalDatasets) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kiểm tra tuân thủ</h1>
          <p className="text-muted-foreground mt-2">
            Đánh giá tuân thủ chính sách dữ liệu trong hệ thống
          </p>
        </div>
        <Button onClick={fetchCompliance} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tổng số dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{report.totalDatasets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(report.generatedAt).toLocaleString('vi-VN')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tuân thủ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{report.compliantCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              {complianceRate}% tỷ lệ tuân thủ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cảnh báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{report.warningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Cần xem xét
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vấn đề nghiêm trọng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{report.criticalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <XCircle className="w-3 h-3 inline mr-1" />
              Cần xử lý ngay
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Phân loại theo mức độ bảo mật</CardTitle>
          <CardDescription>
            Số lượng datasets theo mức độ phân loại
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(report.byClassification).map(([classification, count]) => (
              <div key={classification} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">{classification}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {report.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vấn đề cần xử lý</CardTitle>
            <CardDescription>
              Danh sách các vấn đề tuân thủ được phát hiện
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {report.issues.map((issue, index) => (
                <div
                  key={`${issue.id}-${index}`}
                  className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {issue.status === 'failed' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                        <h4 className="font-semibold">{issue.name}</h4>
                        <Badge variant="outline">{issue.severity}</Badge>
                      </div>
                      <p className="text-sm mb-2">{issue.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Dataset: {issue.datasetName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
