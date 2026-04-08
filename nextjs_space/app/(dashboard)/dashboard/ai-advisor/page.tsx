
'use client';

import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TrainingPrediction {
  id: string;
  name: string;
  currentScore: number;
  predictedScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

interface LogisticsPrediction {
  id: string;
  name: string;
  predictedConsumption: number;
  currentStock: number;
  daysUntilReorder: number;
  alertLevel: 'safe' | 'warning' | 'critical';
  confidence: number;
}

export default function AIAdvisorPage() {
  const [trainingPredictions, setTrainingPredictions] = useState<TrainingPrediction[]>([]);
  const [logisticsPredictions, setLogisticsPredictions] = useState<LogisticsPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [mlEngineStatus, setMlEngineStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Check ML Engine health
      const healthResponse = await fetch('/api/ml-engine/health');
      const healthData = await healthResponse.json();
      setMlEngineStatus(healthData);

      // Fetch training predictions
      const trainingResponse = await fetch('/api/demo/predict-training');
      const trainingData = await trainingResponse.json();
      if (trainingData.success) {
        setTrainingPredictions(trainingData.data);
      }

      // Fetch logistics predictions
      const logisticsResponse = await fetch('/api/demo/predict-logistics');
      const logisticsData = await logisticsResponse.json();
      if (logisticsData.success) {
        setLogisticsPredictions(logisticsData.data);
      }
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      safe: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    
    const labels = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
      safe: 'An toàn',
      warning: 'Cảnh báo',
      critical: 'Khẩn cấp',
    };
    
    return (
      <Badge className={colors[level as keyof typeof colors] || ''}>
        {labels[level as keyof typeof labels] || level}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Brain className="h-16 w-16 mx-auto mb-4 animate-pulse text-purple-600" />
          <p className="text-muted-foreground">Đang tải dự báo AI...</p>
        </div>
      </div>
    );
  }

  const trainingStats = {
    total: trainingPredictions.length,
    high: trainingPredictions.filter(p => p.riskLevel === 'high').length,
    medium: trainingPredictions.filter(p => p.riskLevel === 'medium').length,
    low: trainingPredictions.filter(p => p.riskLevel === 'low').length,
  };

  const logisticsStats = {
    total: logisticsPredictions.length,
    critical: logisticsPredictions.filter(p => p.alertLevel === 'critical').length,
    warning: logisticsPredictions.filter(p => p.alertLevel === 'warning').length,
    safe: logisticsPredictions.filter(p => p.alertLevel === 'safe').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Trí Tuệ Chỉ Huy AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Hệ thống dự báo và cảnh báo thông minh cho đào tạo và hậu cần
          </p>
        </div>
        
        <div className="flex gap-2">
          <Card className="w-64">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">ML Engine</CardTitle>
                {mlEngineStatus?.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                {mlEngineStatus?.success ? (
                  <span className="text-green-600 font-medium">● Hoạt động bình thường</span>
                ) : (
                  <span className="text-red-600 font-medium">● Không khả dụng</span>
                )}
              </div>
              {mlEngineStatus?.status && (
                <div className="text-xs text-muted-foreground mt-1">
                  Version: {mlEngineStatus.version}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="training" className="space-y-4">
        <TabsList>
          <TabsTrigger value="training" className="gap-2">
            <Users className="h-4 w-4" />
            Dự báo Đào tạo
          </TabsTrigger>
          <TabsTrigger value="logistics" className="gap-2">
            <Package className="h-4 w-4" />
            Dự báo Hậu cần
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Tổng học viên</CardDescription>
                <CardTitle className="text-3xl">{trainingStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rủi ro cao</CardDescription>
                <CardTitle className="text-3xl text-red-600">{trainingStats.high}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rủi ro trung bình</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{trainingStats.medium}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Rủi ro thấp</CardDescription>
                <CardTitle className="text-3xl text-green-600">{trainingStats.low}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dự báo kết quả học viên</CardTitle>
              <CardDescription>
                AI dự đoán điểm số và đánh giá rủi ro dựa trên dữ liệu lịch sử
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học viên</TableHead>
                    <TableHead>Điểm hiện tại</TableHead>
                    <TableHead>Điểm dự báo</TableHead>
                    <TableHead>Xu hướng</TableHead>
                    <TableHead>Rủi ro</TableHead>
                    <TableHead>Độ tin cậy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingPredictions.map((pred) => {
                    const trend = pred.predictedScore - pred.currentScore;
                    return (
                      <TableRow key={pred.id}>
                        <TableCell className="font-medium">{pred.name}</TableCell>
                        <TableCell>{pred.currentScore.toFixed(1)}</TableCell>
                        <TableCell className="font-bold">
                          {pred.predictedScore.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp 
                              className={`h-4 w-4 ${trend >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'}`} 
                            />
                            <span className={trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {trend >= 0 ? '+' : ''}{trend.toFixed(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getRiskBadge(pred.riskLevel)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={pred.confidence} className="w-16" />
                            <span className="text-xs text-muted-foreground">
                              {pred.confidence}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Tổng mặt hàng</CardDescription>
                <CardTitle className="text-3xl">{logisticsStats.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Khẩn cấp</CardDescription>
                <CardTitle className="text-3xl text-red-600">{logisticsStats.critical}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cảnh báo</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">{logisticsStats.warning}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>An toàn</CardDescription>
                <CardTitle className="text-3xl text-green-600">{logisticsStats.safe}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dự báo tiêu hao vật tư</CardTitle>
              <CardDescription>
                AI dự đoán lượng tiêu thụ và thời điểm đặt hàng tối ưu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vật tư</TableHead>
                    <TableHead>Dự báo tiêu hao</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Thời gian còn lại</TableHead>
                    <TableHead>Mức cảnh báo</TableHead>
                    <TableHead>Độ tin cậy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logisticsPredictions.map((pred) => (
                    <TableRow key={pred.id}>
                      <TableCell className="font-medium">{pred.name}</TableCell>
                      <TableCell>{pred.predictedConsumption.toLocaleString()} đơn vị</TableCell>
                      <TableCell>{pred.currentStock.toLocaleString()} đơn vị</TableCell>
                      <TableCell>
                        <span className={
                          pred.daysUntilReorder > 30 ? 'text-green-600' :
                          pred.daysUntilReorder > 15 ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {pred.daysUntilReorder} ngày
                        </span>
                      </TableCell>
                      <TableCell>{getRiskBadge(pred.alertLevel)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pred.confidence} className="w-16" />
                          <span className="text-xs text-muted-foreground">
                            {pred.confidence}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Thông tin hệ thống AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Model Đào tạo</p>
              <p className="text-xs text-muted-foreground">Student Performance Predictor v1.2</p>
              <p className="text-xs text-muted-foreground">Độ chính xác: 87.4%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Model Hậu cần</p>
              <p className="text-xs text-muted-foreground">Supply Consumption Forecaster v2.0</p>
              <p className="text-xs text-muted-foreground">Độ chính xác: 89.1%</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cập nhật lần cuối</p>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleString('vi-VN')}</p>
              <p className="text-xs text-muted-foreground">Tự động làm mới mỗi 30 giây</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
