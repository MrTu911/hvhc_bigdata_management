
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, FileText, Upload, Search, Filter, Download, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Dataset {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  records: number;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  department: string;
  uploadedBy: string;
  uploadedAt: string;
  description: string;
}

export default function DataLakePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClassification, setSelectedClassification] = useState<string>('all');

  // Mock data - trong thực tế sẽ fetch từ API
  useEffect(() => {
    const mockDatasets: Dataset[] = [
      {
        id: '1',
        name: 'Dữ liệu tiêu hao nhiên liệu 2024',
        category: 'logistics',
        type: 'CSV',
        size: '15.2 MB',
        records: 45230,
        classification: 'INTERNAL',
        department: 'Khoa Hậu cần',
        uploadedBy: 'Thiếu tá Nguyễn Văn A',
        uploadedAt: '2024-10-01',
        description: 'Dữ liệu tiêu hao nhiên liệu các đơn vị quý 3/2024',
      },
      {
        id: '2',
        name: 'Lịch sử bảo dưỡng khí tài',
        category: 'maintenance',
        type: 'JSON',
        size: '8.7 MB',
        records: 12450,
        classification: 'CONFIDENTIAL',
        department: 'Khoa Kỹ thuật',
        uploadedBy: 'Đại úy Trần Văn B',
        uploadedAt: '2024-09-28',
        description: 'Lịch sử bảo dưỡng định kỳ các loại khí tài',
      },
      {
        id: '3',
        name: 'Dữ liệu vận tải chiến dịch',
        category: 'logistics',
        type: 'Parquet',
        size: '32.5 MB',
        records: 89120,
        classification: 'INTERNAL',
        department: 'Khoa Hậu cần',
        uploadedBy: 'Trung tá Lê Văn C',
        uploadedAt: '2024-09-25',
        description: 'Dữ liệu vận chuyển hậu cần các chiến dịch huấn luyện',
      },
      {
        id: '4',
        name: 'Kết quả huấn luyện học viên K60',
        category: 'training',
        type: 'Excel',
        size: '5.3 MB',
        records: 2340,
        classification: 'PUBLIC',
        department: 'Phòng Đào tạo',
        uploadedBy: 'Thiếu tá Phạm Văn D',
        uploadedAt: '2024-09-20',
        description: 'Kết quả huấn luyện và đánh giá học viên khóa 60',
      },
      {
        id: '5',
        name: 'Dữ liệu tồn kho vật tư',
        category: 'inventory',
        type: 'CSV',
        size: '12.1 MB',
        records: 34560,
        classification: 'INTERNAL',
        department: 'Khoa Hậu cần',
        uploadedBy: 'Đại úy Hoàng Văn E',
        uploadedAt: '2024-09-15',
        description: 'Dữ liệu tồn kho vật tư, thiết bị, đạn dược',
      },
    ];

    setDatasets(mockDatasets);
    setFilteredDatasets(mockDatasets);
  }, []);

  // Filter datasets
  useEffect(() => {
    let filtered = datasets;

    if (searchTerm) {
      filtered = filtered.filter(
        (ds) =>
          ds.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ds.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ds) => ds.category === selectedCategory);
    }

    if (selectedClassification !== 'all') {
      filtered = filtered.filter((ds) => ds.classification === selectedClassification);
    }

    setFilteredDatasets(filtered);
  }, [searchTerm, selectedCategory, selectedClassification, datasets]);

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'PUBLIC':
        return 'bg-green-500';
      case 'INTERNAL':
        return 'bg-yellow-500';
      case 'CONFIDENTIAL':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      logistics: 'Hậu cần',
      maintenance: 'Bảo dưỡng',
      training: 'Huấn luyện',
      inventory: 'Tồn kho',
      research: 'Nghiên cứu',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Kho dữ liệu huấn luyện & nghiên cứu HVHC
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Quản lý và truy cập dữ liệu phục vụ huấn luyện, nghiên cứu khoa học quân sự
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng số Dataset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{datasets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng dung lượng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">73.8 MB</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng số bản ghi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">183.7K</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Dataset mới (tháng này)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">12</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Tìm kiếm và lọc dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm dataset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="logistics">Hậu cần</SelectItem>
                <SelectItem value="maintenance">Bảo dưỡng</SelectItem>
                <SelectItem value="training">Huấn luyện</SelectItem>
                <SelectItem value="inventory">Tồn kho</SelectItem>
                <SelectItem value="research">Nghiên cứu</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedClassification} onValueChange={setSelectedClassification}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn mức độ bảo mật" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="PUBLIC">Công khai</SelectItem>
                <SelectItem value="INTERNAL">Nội bộ</SelectItem>
                <SelectItem value="CONFIDENTIAL">Mật</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Dataset List */}
      <div className="space-y-4">
        {filteredDatasets.map((dataset) => (
          <Card key={dataset.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    {dataset.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{dataset.description}</CardDescription>
                </div>
                <Badge className={getClassificationColor(dataset.classification)}>
                  {dataset.classification}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Danh mục</p>
                  <p className="font-medium">{getCategoryLabel(dataset.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Định dạng</p>
                  <p className="font-medium">{dataset.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dung lượng</p>
                  <p className="font-medium">{dataset.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Số bản ghi</p>
                  <p className="font-medium">{dataset.records.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Đơn vị</p>
                  <p className="font-medium">{dataset.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Người tải lên</p>
                  <p className="font-medium">{dataset.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ngày tải lên</p>
                  <p className="font-medium">{dataset.uploadedAt}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Tải xuống
                </Button>
                <Button size="sm" variant="default">
                  <FileText className="h-4 w-4 mr-2" />
                  Sử dụng cho huấn luyện
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDatasets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Không tìm thấy dataset phù hợp với bộ lọc
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
