'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link2,
  ExternalLink,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

export default function ResearchIntegrationPage() {
  const integrations = [
    {
      name: 'Hệ thống QLKH Học viện Hậu cần',
      description: 'Kết nối với hệ thống quản lý khoa học tại Học viện',
      status: 'pending',
      lastSync: null,
      url: 'http://qlkh.hvhc.edu.vn'
    },
    {
      name: 'Cổng thông tin NCKH Bộ Quốc phòng',
      description: 'Liên thông dữ liệu nghiên cứu khoa học với Bộ QP',
      status: 'pending',
      lastSync: null,
      url: 'http://nckh.mod.gov.vn'
    },
    {
      name: 'Google Scholar',
      description: 'Lấy dữ liệu trích dẫn, bài báo từ Google Scholar',
      status: 'active',
      lastSync: '2026-02-22 10:00',
      url: 'https://scholar.google.com'
    },
    {
      name: 'ORCID',
      description: 'Liên kết hồ sơ nghiên cứu với ORCID',
      status: 'pending',
      lastSync: null,
      url: 'https://orcid.org'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Kết nối Quản lý Khoa học
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý kết nối với các hệ thống quản lý khoa học bên ngoài
        </p>
      </div>

      {/* Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((integration, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  {integration.name}
                </CardTitle>
                <Badge
                  className={integration.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                  }
                >
                  {integration.status === 'active' ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Đang kết nối</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Chưa kết nối</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {integration.description}
              </p>
              {integration.lastSync && (
                <p className="text-sm text-muted-foreground mb-4">
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Đồng bộ lần cuối: {integration.lastSync}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Cấu hình
                </Button>
                {integration.status === 'active' && (
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Đồng bộ
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <a href={integration.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Truy cập
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn kết nối</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ol className="space-y-3">
            <li>
              <strong>Cấu hình API:</strong> Liên hệ quản trị viên hệ thống để nhận thông tin API key và endpoint.
            </li>
            <li>
              <strong>Xác thực:</strong> Nhập thông tin xác thực vào mục Cấu hình của từng hệ thống.
            </li>
            <li>
              <strong>Kiểm tra kết nối:</strong> Nhấn nút "Đồng bộ" để kiểm tra kết nối và lấy dữ liệu.
            </li>
            <li>
              <strong>Lịch đồng bộ:</strong> Hệ thống sẽ tự động đồng bộ dữ liệu mỗi ngày.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
