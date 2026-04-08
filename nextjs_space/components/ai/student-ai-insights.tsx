'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';

interface StudentAIInsightsProps {
  studentId: string;
}

interface TrendData {
  gpaHistory: any[];
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  prediction: number | null;
  confidence: number;
  recommendations: string[];
  analysis: any;
  message?: string;
}

interface RiskData {
  riskLevel: 'high' | 'medium' | 'low';
  riskLabelVi: string;
  riskScore: number;
  factors: Array<{ factor: string; severity: string; description: string }>;
  interventions: Array<{ action: string; priority: string }>;
  metrics: any;
}

export function StudentAIInsights({ studentId }: StudentAIInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [riskData, setRiskData] = useState<RiskData | null>(null);

  // Fetch AI insights
  const fetchInsights = async () => {
    try {
      setLoading(true);

      // Fetch trend analysis
      const trendResponse = await fetch('/api/ai/student-trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, semesterCount: 6 }),
      });
      const trendResult = await trendResponse.json();
      if (trendResult.success) {
        setTrendData(trendResult);
      }

      // Fetch risk prediction
      const riskResponse = await fetch('/api/ai/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      const riskResult = await riskResponse.json();
      if (riskResult.success) {
        setRiskData(riskResult);
      }

      toast.success('Đã tải AI Insights');
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      toast.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchInsights();
    }
  }, [studentId]);

  // Get trend icon
  const getTrendIcon = () => {
    if (!trendData) return null;
    if (trendData.trend === 'improving')
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trendData.trend === 'declining')
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    if (trendData.trend === 'stable') return <Minus className="w-5 h-5 text-blue-600" />;
    return <AlertCircle className="w-5 h-5 text-gray-600" />;
  };

  // Get trend label
  const getTrendLabel = () => {
    if (!trendData) return 'Chưa có dữ liệu';
    if (trendData.trend === 'improving') return 'Đang cải thiện';
    if (trendData.trend === 'declining') return 'Đang suy giảm';
    if (trendData.trend === 'stable') return 'Ổn định';
    return 'Không đủ dữ liệu';
  };

  // Get risk color
  const getRiskColor = () => {
    if (!riskData) return 'gray';
    if (riskData.riskLevel === 'high') return 'red';
    if (riskData.riskLevel === 'medium') return 'yellow';
    return 'green';
  };

  // Get risk icon
  const getRiskIcon = () => {
    if (!riskData) return <AlertCircle className="w-6 h-6" />;
    if (riskData.riskLevel === 'high')
      return <AlertTriangle className="w-6 h-6 text-red-600" />;
    if (riskData.riskLevel === 'medium')
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    return <CheckCircle2 className="w-6 h-6 text-green-600" />;
  };

  // Prepare chart data
  const chartData =
    trendData?.gpaHistory.map((item) => ({
      name: `${item.hocKy} ${item.namHoc}`,
      GPA: item.gpa,
    })) || [];

  // Add prediction point if available
  if (trendData?.prediction && chartData.length > 0) {
    chartData.push({
      name: 'Dự đoán',
      GPA: trendData.prediction,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Insights</h2>
            <p className="text-sm text-muted-foreground">
              Phân tích xu hướng & dự báo rủi ro học tập
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInsights}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Đang phân tích dữ liệu...</p>
        </div>
      )}

      {!loading && trendData && riskData && (
        <div className="grid gap-6">
          {/* Risk Level Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRiskIcon()}
                  <div>
                    <CardTitle className="text-xl">Đánh giá Rủi ro</CardTitle>
                    <CardDescription>Mức độ rủi ro học tập hiện tại</CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-lg px-4 py-2 bg-${getRiskColor()}-50 text-${getRiskColor()}-700 border-${getRiskColor()}-200`}
                >
                  {riskData.riskLabelVi}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Điểm rủi ro</p>
                  <p className="text-3xl font-bold">{riskData.riskScore}/100</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">GPA hiện tại</p>
                  <p className="text-3xl font-bold">{riskData.metrics.currentGPA.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Tỷ lệ trượt</p>
                  <p className="text-3xl font-bold">{riskData.metrics.failRate.toFixed(1)}%</p>
                </div>
              </div>

              {/* Risk Factors */}
              {riskData.factors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Yếu tố rủi ro ({riskData.factors.length})
                  </h4>
                  <div className="space-y-2">
                    {riskData.factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-100 dark:border-red-900"
                      >
                        <Badge
                          variant={factor.severity === 'high' ? 'destructive' : 'secondary'}
                          className="mt-0.5"
                        >
                          {factor.severity === 'high' ? 'Cao' : factor.severity === 'medium' ? 'TB' : 'Thấp'}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{factor.factor}</p>
                          <p className="text-sm text-muted-foreground">{factor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interventions */}
              {riskData.interventions.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Biện pháp can thiệp ({riskData.interventions.length})
                  </h4>
                  <div className="space-y-2">
                    {riskData.interventions.map((intervention, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-100 dark:border-blue-900"
                      >
                        <Badge
                          variant={intervention.priority === 'urgent' || intervention.priority === 'high' ? 'default' : 'secondary'}
                          className="mt-0.5"
                        >
                          {intervention.priority === 'urgent' ? 'Khẩn' : intervention.priority === 'high' ? 'Cao' : intervention.priority === 'medium' ? 'TB' : 'Thấp'}
                        </Badge>
                        <p className="flex-1">{intervention.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trend Analysis Card */}
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTrendIcon()}
                  <div>
                    <CardTitle className="text-xl">Xu hướng GPA</CardTitle>
                    <CardDescription>Phân tích xu hướng học tập qua các học kỳ</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-base px-3 py-1">
                  {getTrendLabel()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendData.trend !== 'insufficient_data' && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">GPA TB</p>
                      <p className="text-2xl font-bold">
                        {trendData.analysis?.averageGPA.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Cao nhất</p>
                      <p className="text-2xl font-bold">
                        {trendData.analysis?.highestGPA.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Thấp nhất</p>
                      <p className="text-2xl font-bold">
                        {trendData.analysis?.lowestGPA.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Dự đoán</p>
                      <p className="text-2xl font-bold">{trendData.prediction?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        Độ tin cậy: {(trendData.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} />
                        <Tooltip />
                        <Legend />
                        <ReferenceLine y={2.0} stroke="#ef4444" strokeDasharray="3 3" label="Đạt" />
                        <Line
                          type="monotone"
                          dataKey="GPA"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recommendations */}
                  {trendData.recommendations && trendData.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Đề xuất cải thiện
                      </h4>
                      <ul className="space-y-2">
                        {trendData.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg"
                          >
                            <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {trendData.trend === 'insufficient_data' && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">{trendData.message}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cần ít nhất 2 học kỳ để phân tích xu hướng
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
