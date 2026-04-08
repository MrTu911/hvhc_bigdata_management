
/**
 * Instructor Dashboard: Feedback Analysis với NLP
 * Phân tích cảm xúc và từ khóa phản hồi học viên
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SentimentPieChart, SentimentBarChart, SentimentSummaryCards } from '@/components/analytics/sentiment-chart';
import { WordCloud, KeywordTable } from '@/components/analytics/word-cloud';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Download, MessageCircle, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SentimentTrendChart from '@/components/instructor/SentimentTrendChart';
import AISuggestions from '@/components/instructor/AISuggestions';
import RecentFeedbackList from '@/components/instructor/RecentFeedbackList';

interface SentimentData {
  sentiment: 'positive' | 'negative' | 'neutral' | 'constructive';
  count: number;
}

interface KeywordData {
  keyword: string;
  count: number;
}

interface AnalysisData {
  stats: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    constructive: number;
    average_confidence: number;
  };
  topKeywords: KeywordData[];
  recentAnalyses: any[];
}

export default function FeedbackAnalysisPage() {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [sentimentData, setSentimentData] = useState<any>(null);

  // Fetch instructor's courses
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/dashboard/instructor/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          if (data.courses?.length > 0) {
            setSelectedCourse(data.courses[0].id.toString());
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        toast.error('Không thể tải danh sách khóa học');
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchCourses();
    }
  }, [session]);

  // Fetch analysis data when course changes
  useEffect(() => {
    async function fetchAnalysis() {
      if (!selectedCourse) return;

      setLoading(true);
      try {
        // Fetch NLP sentiment data
        const sentimentRes = await fetch(`/api/nlp/feedback-sentiment?courseId=${selectedCourse}`);
        if (sentimentRes.ok) {
          const newSentimentData = await sentimentRes.json();
          setSentimentData(newSentimentData);
        }

        // Fetch original analysis data
        const res = await fetch(`/api/ai/nlp/analyze-feedback?course_id=${selectedCourse}`);
        if (res.ok) {
          const data = await res.json();
          setAnalysisData(data);
        } else {
          toast.error('Không thể tải dữ liệu phân tích');
        }
      } catch (error) {
        console.error('Failed to fetch analysis:', error);
        toast.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [selectedCourse]);

  // Trigger new analysis
  const handleAnalyze = async () => {
    if (!selectedCourse) return;

    setAnalyzing(true);
    try {
      // Fetch all feedback for the course
      const feedbackRes = await fetch(`/api/dashboard/instructor/feedback?course_id=${selectedCourse}`);
      if (!feedbackRes.ok) throw new Error('Failed to fetch feedback');
      
      const feedbackData = await feedbackRes.json();
      const feedbacks = feedbackData.feedback || [];

      if (feedbacks.length === 0) {
        toast.error('Chưa có phản hồi nào để phân tích');
        setAnalyzing(false);
        return;
      }

      // Analyze all feedback texts
      const texts = feedbacks.map((f: any) => f.feedback_text || f.comments || '').filter(Boolean);
      
      const analyzeRes = await fetch('/api/ai/nlp/analyze-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          texts,
          course_id: selectedCourse 
        })
      });

      if (analyzeRes.ok) {
        toast.success('Phân tích hoàn thành!');
        // Refresh analysis data
        const refreshRes = await fetch(`/api/ai/nlp/analyze-feedback?course_id=${selectedCourse}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setAnalysisData(data);
        }
      } else {
        toast.error('Phân tích thất bại');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Lỗi khi phân tích');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!analysisData) return;

    const csvContent = [
      ['Cảm xúc', 'Số lượng', 'Phần trăm'],
      ['Tích cực', analysisData.stats.positive, `${((analysisData.stats.positive / analysisData.stats.total) * 100).toFixed(1)}%`],
      ['Tiêu cực', analysisData.stats.negative, `${((analysisData.stats.negative / analysisData.stats.total) * 100).toFixed(1)}%`],
      ['Trung tính', analysisData.stats.neutral, `${((analysisData.stats.neutral / analysisData.stats.total) * 100).toFixed(1)}%`],
      ['Góp ý', analysisData.stats.constructive, `${((analysisData.stats.constructive / analysisData.stats.total) * 100).toFixed(1)}%`],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `phan-tich-phan-hoi-${selectedCourse}-${Date.now()}.csv`;
    link.click();

    toast.success('Đã xuất báo cáo');
  };

  if (loading && !analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sentimentChartData: SentimentData[] = analysisData ? [
    { sentiment: 'positive', count: analysisData.stats.positive },
    { sentiment: 'negative', count: analysisData.stats.negative },
    { sentiment: 'neutral', count: analysisData.stats.neutral },
    { sentiment: 'constructive', count: analysisData.stats.constructive }
  ] : [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8" />
            Phân tích phản hồi học viên
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân tích cảm xúc tự động bằng AI
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleAnalyze}
            disabled={analyzing || !selectedCourse}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Phân tích lại
              </>
            )}
          </Button>
          <Button
            onClick={handleExport}
            disabled={!analysisData}
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Course Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Chọn khóa học..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!analysisData?.stats?.total && (
        <Alert>
          <AlertDescription>
            Chưa có dữ liệu phân tích. Nhấn "Phân tích lại" để bắt đầu phân tích phản hồi.
          </AlertDescription>
        </Alert>
      )}

      {analysisData && analysisData.stats && analysisData.stats.total > 0 && (
        <>
          {/* Summary Cards */}
          <SentimentSummaryCards 
            data={sentimentChartData}
            total={analysisData.stats.total}
          />

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <SentimentPieChart 
              data={sentimentChartData}
              total={analysisData?.stats?.total || 0}
            />
            <SentimentBarChart data={sentimentChartData} />
          </div>

          {/* Keywords */}
          <div className="grid gap-6 md:grid-cols-2">
            <WordCloud keywords={analysisData?.topKeywords || []} />
            <KeywordTable keywords={analysisData?.topKeywords || []} title="Top 10 từ khóa" />
          </div>

          {/* Sentiment Trend Chart */}
          {sentimentData?.sentimentTrend && (
            <SentimentTrendChart data={sentimentData.sentimentTrend} />
          )}

          {/* AI Suggestions and Recent Feedback */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* AI Suggestions */}
            {sentimentData?.aiSuggestions && (
              <AISuggestions suggestions={sentimentData.aiSuggestions} />
            )}

            {/* Top Keywords by Sentiment */}
            {sentimentData?.topKeywords && (
              <Card>
                <CardHeader>
                  <CardTitle>Từ khóa theo cảm xúc</CardTitle>
                  <CardDescription>Từ khóa phổ biến nhất trong mỗi nhóm cảm xúc</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Positive Keywords */}
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">Tích cực</h4>
                      <div className="flex flex-wrap gap-2">
                        {sentimentData.topKeywords.positive?.map((kw: any, i: number) => (
                          <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {kw.word} ({kw.count})
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Neutral Keywords */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Trung tính</h4>
                      <div className="flex flex-wrap gap-2">
                        {sentimentData.topKeywords.neutral?.map((kw: any, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            {kw.word} ({kw.count})
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Negative Keywords */}
                    <div>
                      <h4 className="text-sm font-medium text-red-600 mb-2">Tiêu cực</h4>
                      <div className="flex flex-wrap gap-2">
                        {sentimentData.topKeywords.negative?.map((kw: any, i: number) => (
                          <span key={i} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            {kw.word} ({kw.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Feedback */}
          {sentimentData?.recentFeedback && sentimentData.recentFeedback.length > 0 && (
            <RecentFeedbackList feedback={sentimentData.recentFeedback} />
          )}

          {/* Legacy Recent Analyses (fallback) */}
          {!sentimentData?.recentFeedback && analysisData && analysisData.recentAnalyses?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Phản hồi gần đây</CardTitle>
                <CardDescription>10 phản hồi mới nhất đã được phân tích</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisData?.recentAnalyses.slice(0, 5).map((analysis: any, index: number) => (
                    <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          analysis.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          analysis.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          analysis.sentiment === 'constructive' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {analysis.sentiment}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(analysis.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm">{analysis.feedback_text?.substring(0, 150)}...</p>
                      {analysis.keywords?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {analysis.keywords.slice(0, 5).map((kw: string, i: number) => (
                            <span key={i} className="text-xs bg-primary/10 px-2 py-0.5 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
