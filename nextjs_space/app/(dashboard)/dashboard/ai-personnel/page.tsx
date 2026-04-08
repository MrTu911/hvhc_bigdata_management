'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain, TrendingUp, AlertTriangle, Users, Activity,
  RefreshCw, Download, ChevronRight, Target, Shield, Heart
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  score: number;
  riskLevel: string;
  recommendations: string[];
}

export default function AIPersonnelPage() {
  const [loading, setLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Demo data for stability index
  const stabilityData = [
    { month: 'T1', index: 85, target: 90 },
    { month: 'T2', index: 87, target: 90 },
    { month: 'T3', index: 82, target: 90 },
    { month: 'T4', index: 88, target: 90 },
    { month: 'T5', index: 91, target: 90 },
    { month: 'T6', index: 89, target: 90 },
  ];

  // Risk distribution
  const riskDistribution = [
    { name: 'Thấp', value: 180, color: '#22c55e' },
    { name: 'Trung bình', value: 65, color: '#eab308' },
    { name: 'Cao', value: 35, color: '#f97316' },
    { name: 'Rất cao', value: 6, color: '#ef4444' },
  ];

  // Promotion forecast
  const promotionForecast = [
    { unit: 'Khoa CNTT', predicted: 12, actual: 10 },
    { unit: 'Khoa KTVT', predicted: 8, actual: 7 },
    { unit: 'Phòng ĐT', predicted: 5, actual: 6 },
    { unit: 'Phòng KHCN', predicted: 4, actual: 4 },
    { unit: 'Phòng CTCT', predicted: 3, actual: 2 },
  ];

  // Personnel radar
  const personnelRadar = [
    { subject: 'Chuyên môn', A: 85, fullMark: 100 },
    { subject: 'Kỷ luật', A: 92, fullMark: 100 },
    { subject: 'Sức khỏe', A: 78, fullMark: 100 },
    { subject: 'Thâm niên', A: 88, fullMark: 100 },
    { subject: 'Đào tạo', A: 75, fullMark: 100 },
    { subject: 'Phẩm chất', A: 95, fullMark: 100 },
  ];

  // High risk personnel
  const highRiskPersonnel = [
    { id: '1', name: 'Nguyễn Văn X', unit: 'Khoa CNTT', riskScore: 78, reason: 'Sẩp đến tuổi nghỉ hưu, chưa có người kế nhiệm' },
    { id: '2', name: 'Trần Thị Y', unit: 'Phòng ĐT', riskScore: 72, reason: 'Bệnh dài ngày, hiệu suất giảm' },
    { id: '3', name: 'Lê Văn Z', unit: 'Khoa KTVT', riskScore: 68, reason: 'Nhiều lần vi phạm kỷ luật nhỏ' },
  ];

  const runAnalysis = async () => {
    setLoading(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const getRiskBadge = (level: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI Phân tích Nhân sự
          </h1>
          <p className="text-gray-500">Phân tích và dự báo thông minh cho quản lý nhân sự</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn đơn vị" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toàn học viện</SelectItem>
              <SelectItem value="CNTT">Khoa CNTT</SelectItem>
              <SelectItem value="KTVT">Khoa KTVT</SelectItem>
              <SelectItem value="DT">Phòng ĐT</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={runAnalysis} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Phân tích lại
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chỉ số ổn định</p>
                <p className="text-3xl font-bold text-green-600">89%</p>
              </div>
              <Activity className="h-10 w-10 text-green-100" />
            </div>
            <Progress value={89} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Nguy cơ cao</p>
                <p className="text-3xl font-bold text-red-600">6</p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-100" />
            </div>
            <p className="text-sm text-gray-500 mt-2">cán bộ cần chú ý</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dự báo thăng tiến</p>
                <p className="text-3xl font-bold text-blue-600">32</p>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-100" />
            </div>
            <p className="text-sm text-gray-500 mt-2">cán bộ tiềm năng</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Độ chính xác AI</p>
                <p className="text-3xl font-bold text-purple-600">94%</p>
              </div>
              <Brain className="h-10 w-10 text-purple-200" />
            </div>
            <p className="text-sm text-gray-500 mt-2">dựa trên lịch sử</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="stability" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stability">Chỉ số ổn định</TabsTrigger>
          <TabsTrigger value="risk">Phân tích rủi ro</TabsTrigger>
          <TabsTrigger value="promotion">Dự báo thăng tiến</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Stability Tab */}
        <TabsContent value="stability">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng chỉ số ổn định</CardTitle>
                <CardDescription>6 tháng gần nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stabilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="index" stroke="#8b5cf6" strokeWidth={2} name="Chỉ số" />
                    <Line type="monotone" dataKey="target" stroke="#22c55e" strokeDasharray="5 5" name="Mục tiêu" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá tổng hợp</CardTitle>
                <CardDescription>Radar chất lượng nhân sự</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={personnelRadar}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Đánh giá" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Tab */}
        <TabsContent value="risk">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Phân bố mức độ rủi ro</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Cán bộ cần chú ý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {highRiskPersonnel.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{person.name}</p>
                        <p className="text-sm text-gray-500">{person.unit}</p>
                        <p className="text-sm text-red-600 mt-1">{person.reason}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-red-100 text-red-800">
                          Rủi ro: {person.riskScore}%
                        </Badge>
                        <Button variant="ghost" size="sm" className="mt-2">
                          Chi tiết <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Promotion Tab */}
        <TabsContent value="promotion">
          <Card>
            <CardHeader>
              <CardTitle>Dự báo thăng tiến theo đơn vị</CardTitle>
              <CardDescription>So sánh dự báo AI và thực tế</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={promotionForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="unit" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="predicted" fill="#8b5cf6" name="Dự báo" />
                  <Bar dataKey="actual" fill="#22c55e" name="Thực tế" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Target className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Tỷ lệ giữ chân tốt</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      98% cán bộ có thâm niên trên 5 năm vẫn gắn bó với đơn vị.
                      Đề xuất tiếp tục chính sách phúc lợi hiện tại.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-yellow-500" />
                  <div>
                    <h4 className="font-semibold">Cần bổ sung nhân sự</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Khoa CNTT dự kiến thiếu 3 giảng viên trong 6 tháng tới
                      do nghỉ hưu. Đề xuất tuyển dụng sớm.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Heart className="h-6 w-6 text-blue-500" />
                  <div>
                    <h4 className="font-semibold">Sức khỏe cần quan tâm</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      12% cán bộ có biểu hiện sức khỏe giảm sút.
                      Đề xuất tăng cường khám sức khỏe định kỳ.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
