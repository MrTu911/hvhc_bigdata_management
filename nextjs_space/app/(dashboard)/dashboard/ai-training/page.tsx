
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Play, Settings, Database, TrendingUp, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface TrainingJob {
  id: string;
  name: string;
  algorithm: string;
  dataset: string;
  status: 'running' | 'completed' | 'failed';
  progress: number;
  accuracy?: number;
  startTime: string;
  endTime?: string;
}

export default function AITrainingPage() {
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([
    {
      id: '1',
      name: 'Dự báo nhiên liệu - RandomForest',
      algorithm: 'Random Forest',
      dataset: 'Dữ liệu tiêu hao nhiên liệu 2024',
      status: 'completed',
      progress: 100,
      accuracy: 87.5,
      startTime: '2024-10-01 09:00',
      endTime: '2024-10-01 09:45',
    },
    {
      id: '2',
      name: 'Phân loại sự cố - CNN',
      algorithm: 'Convolutional Neural Network',
      dataset: 'Lịch sử bảo dưỡng khí tài',
      status: 'running',
      progress: 65,
      startTime: '2024-10-05 10:30',
    },
  ]);

  const [newTraining, setNewTraining] = useState({
    name: '',
    dataset: '',
    algorithm: '',
    parameters: '',
  });

  const handleStartTraining = () => {
    // In production, this would call the API
    console.log('Starting training:', newTraining);
    alert('Đã khởi động quá trình huấn luyện mô hình!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'Đang chạy';
      case 'completed':
        return 'Hoàn thành';
      case 'failed':
        return 'Lỗi';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Huấn luyện mô hình AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Huấn luyện và quản lý các mô hình Machine Learning trên dữ liệu hậu cần quân sự
        </p>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Tạo mô hình mới</TabsTrigger>
          <TabsTrigger value="jobs">Công việc huấn luyện</TabsTrigger>
          <TabsTrigger value="models">Mô hình đã lưu</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình huấn luyện mô hình</CardTitle>
              <CardDescription>
                Chọn dataset và thuật toán để huấn luyện mô hình AI mới
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="training-name">Tên mô hình</Label>
                <Input
                  id="training-name"
                  placeholder="Ví dụ: Dự báo nhu cầu vật tư Q4/2024"
                  value={newTraining.name}
                  onChange={(e) => setNewTraining({ ...newTraining, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataset">Chọn Dataset</Label>
                <Select
                  value={newTraining.dataset}
                  onValueChange={(value) => setNewTraining({ ...newTraining, dataset: value })}
                >
                  <SelectTrigger id="dataset">
                    <SelectValue placeholder="Chọn dataset để huấn luyện" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuel-2024">Dữ liệu tiêu hao nhiên liệu 2024</SelectItem>
                    <SelectItem value="maintenance">Lịch sử bảo dưỡng khí tài</SelectItem>
                    <SelectItem value="transport">Dữ liệu vận tải chiến dịch</SelectItem>
                    <SelectItem value="inventory">Dữ liệu tồn kho vật tư</SelectItem>
                    <SelectItem value="training-results">
                      Kết quả huấn luyện học viên K60
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="algorithm">Thuật toán</Label>
                <Select
                  value={newTraining.algorithm}
                  onValueChange={(value) => setNewTraining({ ...newTraining, algorithm: value })}
                >
                  <SelectTrigger id="algorithm">
                    <SelectValue placeholder="Chọn thuật toán ML/DL" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear-regression">Linear Regression</SelectItem>
                    <SelectItem value="random-forest">Random Forest</SelectItem>
                    <SelectItem value="gradient-boosting">Gradient Boosting</SelectItem>
                    <SelectItem value="neural-network">Neural Network</SelectItem>
                    <SelectItem value="lstm">LSTM (Time Series)</SelectItem>
                    <SelectItem value="cnn">CNN (Classification)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parameters">Tham số huấn luyện (JSON)</Label>
                <Textarea
                  id="parameters"
                  placeholder='{"epochs": 100, "batch_size": 32, "learning_rate": 0.001}'
                  value={newTraining.parameters}
                  onChange={(e) =>
                    setNewTraining({ ...newTraining, parameters: e.target.value })
                  }
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Nhập tham số dưới dạng JSON. Để trống để sử dụng tham số mặc định.
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Cấu hình mặc định
                </h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• Train/Test split: 80/20</li>
                  <li>• Cross-validation: 5-fold</li>
                  <li>• Early stopping: enabled</li>
                  <li>• GPU acceleration: auto-detect</li>
                </ul>
              </div>

              <Button onClick={handleStartTraining} size="lg" className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Bắt đầu huấn luyện
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hướng dẫn sử dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li>
                  <strong>1. Chọn Dataset:</strong> Lựa chọn dữ liệu phù hợp với bài toán
                  (dự báo, phân loại, clustering).
                </li>
                <li>
                  <strong>2. Chọn thuật toán:</strong> Dựa vào loại bài toán và đặc điểm
                  dữ liệu để chọn thuật toán phù hợp.
                </li>
                <li>
                  <strong>3. Điều chỉnh tham số:</strong> Tùy chỉnh hyperparameters hoặc
                  để mặc định cho lần huấn luyện đầu tiên.
                </li>
                <li>
                  <strong>4. Theo dõi tiến độ:</strong> Xem kết quả trong tab "Công việc
                  huấn luyện".
                </li>
                <li>
                  <strong>5. Đánh giá mô hình:</strong> Kiểm tra độ chính xác và các
                  metrics khác sau khi hoàn thành.
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Đang chạy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {trainingJobs.filter((j) => j.status === 'running').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Hoàn thành
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {trainingJobs.filter((j) => j.status === 'completed').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Độ chính xác TB
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {(
                    trainingJobs
                      .filter((j) => j.accuracy)
                      .reduce((sum, j) => sum + (j.accuracy || 0), 0) /
                      trainingJobs.filter((j) => j.accuracy).length || 0
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {trainingJobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        {job.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {job.algorithm} • {job.dataset}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(job.status)}>
                      {getStatusLabel(job.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Tiến độ</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Bắt đầu</p>
                        <p className="font-medium">{job.startTime}</p>
                      </div>
                      {job.endTime && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Kết thúc</p>
                          <p className="font-medium">{job.endTime}</p>
                        </div>
                      )}
                      {job.accuracy && (
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Độ chính xác</p>
                          <p className="font-medium text-green-600">{job.accuracy}%</p>
                        </div>
                      )}
                    </div>

                    {job.status === 'completed' && (
                      <div className="flex gap-2">
                        <Button size="sm">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Xem kết quả chi tiết
                        </Button>
                        <Button size="sm" variant="outline">
                          Tải mô hình
                        </Button>
                        <Button size="sm" variant="outline">
                          Sử dụng cho dự đoán
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Mô hình đã lưu</CardTitle>
              <CardDescription>
                Danh sách các mô hình đã huấn luyện và sẵn sàng sử dụng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                Tính năng đang được phát triển. Các mô hình đã huấn luyện thành công sẽ được
                hiển thị tại đây.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
