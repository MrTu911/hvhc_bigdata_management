'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { RefreshCw, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface FacultyRadarChartProps {
  facultyId: string;
}

interface EISData {
  eisScore: number;
  breakdown: {
    teachingQuality: number;
    researchOutput: number;
    studentMentorship: number;
    innovation: number;
    leadership: number;
    collaboration: number;
  };
  metrics: any;
  confidence: number;
}

export function FacultyRadarChart({ facultyId }: FacultyRadarChartProps) {
  const [loading, setLoading] = useState(false);
  const [eisData, setEisData] = useState<EISData | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [trend, setTrend] = useState<'improving' | 'declining' | 'stable'>('stable');

  // Fetch EIS data
  const fetchEISData = async () => {
    try {
      setLoading(true);

      // Get history
      const historyResponse = await fetch(`/api/faculty/eis-history?facultyId=${facultyId}&months=6`);
      const historyData = await historyResponse.json();

      if (historyData.success && historyData.history.length > 0) {
        setHistory(historyData.history);
        setTrend(historyData.statistics.trend);
        // Use latest EIS data
        const latestEIS = historyData.history[historyData.history.length - 1];
        setEisData(latestEIS.details);
      } else {
        // Calculate new EIS if no history
        await calculateNewEIS();
      }
    } catch (error) {
      console.error('Error fetching EIS data:', error);
      toast.error('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Calculate new EIS
  const calculateNewEIS = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faculty/eis-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facultyId }),
      });

      const data = await response.json();
      if (data.success) {
        setEisData(data);
        toast.success('Tính toán EIS thành công');
        // Refresh history
        fetchEISData();
      }
    } catch (error) {
      console.error('Error calculating EIS:', error);
      toast.error('Đã xảy ra lỗi khi tính toán EIS');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facultyId) {
      fetchEISData();
    }
  }, [facultyId]);

  // Prepare radar chart data
  const radarData = eisData
    ? [
        {
          dimension: 'Chất lượng\nGiảng dạy',
          value: eisData.breakdown.teachingQuality,
          fullMark: 30,
        },
        {
          dimension: 'Nghiên cứu\nKhoa học',
          value: eisData.breakdown.researchOutput,
          fullMark: 25,
        },
        {
          dimension: 'Hướng dẫn\nHọc viên',
          value: eisData.breakdown.studentMentorship,
          fullMark: 20,
        },
        {
          dimension: 'Đổi mới\nPhương pháp',
          value: eisData.breakdown.innovation,
          fullMark: 10,
        },
        {
          dimension: 'Lãnh đạo\nHọc thuật',
          value: eisData.breakdown.leadership,
          fullMark: 10,
        },
        {
          dimension: 'Hợp tác\nNghiên cứu',
          value: eisData.breakdown.collaboration,
          fullMark: 5,
        },
      ]
    : [];

  // Get EIS color
  const getEISColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trend icon
  const getTrendIcon = () => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  return (
    <Card className="shadow-lg border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">EIS Score - Năng lực Giảng viên</CardTitle>
              <CardDescription>Educational Impact Score - Phân tích AI</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={calculateNewEIS}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Tính toán lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!eisData && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Chưa có dữ liệu EIS</p>
            <Button onClick={calculateNewEIS} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Tính toán EIS
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-muted-foreground">Đang tính toán...</p>
          </div>
        )}

        {eisData && !loading && (
          <div className="space-y-6">
            {/* EIS Score Summary */}
            <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Tổng điểm EIS</span>
                  {getTrendIcon()}
                </div>
                <div className={`text-5xl font-bold ${getEISColor(eisData.eisScore)}`}>
                  {eisData.eisScore}
                </div>
                <p className="text-sm text-muted-foreground mt-1">/100 điểm</p>
                <Badge variant="outline" className="mt-2">
                  Độ tin cậy: {(eisData.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    style={{ whiteSpace: 'pre-line' }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 30]} tick={{ fill: '#9ca3af' }} />
                  <Radar
                    name="Năng lực"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                            <p className="font-medium">{data.dimension.replace('\n', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value.toFixed(1)}/{data.fullMark} điểm
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Breakdown Details */}
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: 'Chất lượng giảng dạy',
                  value: eisData.breakdown.teachingQuality,
                  max: 30,
                },
                {
                  label: 'Nghiên cứu khoa học',
                  value: eisData.breakdown.researchOutput,
                  max: 25,
                },
                {
                  label: 'Hướng dẫn học viên',
                  value: eisData.breakdown.studentMentorship,
                  max: 20,
                },
                { label: 'Đổi mới phương pháp', value: eisData.breakdown.innovation, max: 10 },
                { label: 'Lãnh đạo học thuật', value: eisData.breakdown.leadership, max: 10 },
                { label: 'Hợp tác nghiên cứu', value: eisData.breakdown.collaboration, max: 5 },
              ].map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{item.value.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/{item.max}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(item.value / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics Summary */}
            {eisData.metrics && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{eisData.metrics.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Học viên hướng dẫn</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {eisData.metrics.passRate?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Tỷ lệ đạt</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {eisData.metrics.publishedResearch}
                  </p>
                  <p className="text-sm text-muted-foreground">Nghiên cứu hoàn thành</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
