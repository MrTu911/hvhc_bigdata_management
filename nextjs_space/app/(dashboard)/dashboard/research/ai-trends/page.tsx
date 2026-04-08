'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Sparkles,
  UserSquare2,
  BarChart3,
  FlaskConical,
  BookOpen,
  Quote,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TrendsData {
  stats: {
    totalProjects: number;
    totalPublications: number;
    totalScientists: number;
    totalCitations: number;
  };
  fieldDistribution: Array<{
    field: string; label: string; projects: number; publications: number; total: number;
  }>;
  yearlyTrend: Array<{ year: number; projects: number; publications: number }>;
  risingFields: Array<{
    field: string; label: string; recent: number; prior: number; growth: number; pct: number;
  }>;
  topResearchers: Array<{
    id: string; name: string; rank: string; degree: string; specialization: string;
    unit: string; publications: number; hIndex: number; fields: string[]; href: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AIResearchTrendsPage() {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/research/ai/trends')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error ?? 'Lỗi tải dữ liệu');
      })
      .catch(() => setError('Không thể kết nối máy chủ'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Đang tải dữ liệu xu hướng...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive gap-2">
        <span>{error || 'Không có dữ liệu'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6 text-pink-500" />
          Phân tích Xu hướng NCKH
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tổng hợp từ cơ sở dữ liệu NCKH thực tế
        </p>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tổng đề tài"        value={data.stats.totalProjects}     icon={FlaskConical}  color="bg-violet-500" />
        <StatCard label="Công bố khoa học"    value={data.stats.totalPublications} icon={BookOpen}      color="bg-blue-500"   />
        <StatCard label="Nhà khoa học"        value={data.stats.totalScientists}   icon={UserSquare2}   color="bg-emerald-500" />
        <StatCard label="Lượt trích dẫn"      value={data.stats.totalCitations}    icon={Quote}         color="bg-amber-500"  />
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Xu hướng theo năm</TabsTrigger>
          <TabsTrigger value="fields">Phân bố lĩnh vực</TabsTrigger>
          <TabsTrigger value="rising">Lĩnh vực tăng trưởng</TabsTrigger>
          <TabsTrigger value="researchers">Nhà khoa học nổi bật</TabsTrigger>
        </TabsList>

        {/* Tab 1: Yearly trend */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Số đề tài và công bố theo năm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.yearlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="projects"     stroke="#7c3aed" strokeWidth={2} name="Đề tài"    dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="publications" stroke="#2563eb" strokeWidth={2} name="Công bố"   dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Field distribution */}
        <TabsContent value="fields" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Đề tài theo lĩnh vực
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.fieldDistribution} layout="vertical" margin={{ left: 80, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={78} />
                    <Tooltip />
                    <Bar dataKey="projects" fill="#7c3aed" name="Đề tài" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-violet-500" />
                  Tỷ trọng theo lĩnh vực
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {data.fieldDistribution.map((f) => {
                  const maxTotal = Math.max(...data.fieldDistribution.map((x) => x.total), 1);
                  return (
                    <div key={f.field} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate">{f.label}</span>
                        <span className="text-muted-foreground text-xs ml-2 shrink-0">
                          {f.projects} đề tài · {f.publications} công bố
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                          style={{ width: `${Math.round((f.total / maxTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Rising fields */}
        <TabsContent value="rising" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Lĩnh vực tăng trưởng mạnh nhất
                <span className="text-xs font-normal text-muted-foreground">
                  (so sánh 2 năm gần nhất vs 2 năm trước)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.risingFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Chưa đủ dữ liệu nhiều năm để phân tích tăng trưởng.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.risingFields.map((f, i) => (
                    <div key={f.field} className="flex items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                        i === 0 ? 'bg-pink-500' : i === 1 ? 'bg-violet-500' : 'bg-blue-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{f.label}</span>
                          <Badge className={`text-xs ml-2 shrink-0 ${
                            f.growth > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {f.growth > 0 ? '+' : ''}{f.growth}%
                          </Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                            style={{ width: `${f.pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {f.recent} đề tài gần đây · {f.prior} giai đoạn trước
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Top researchers */}
        <TabsContent value="researchers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserSquare2 className="h-4 w-4 text-emerald-500" />
                Nhà khoa học nổi bật theo công bố
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.topResearchers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Chưa có dữ liệu.</p>
              ) : (
                <div className="divide-y">
                  {data.topResearchers.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-sm text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{r.name}</span>
                          {r.rank && <span className="text-xs text-muted-foreground">{r.rank}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.degree && `${r.degree} · `}{r.unit}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {r.fields.slice(0, 3).map((f) => (
                            <span key={f} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 space-y-0.5">
                        <p className="text-sm font-bold text-blue-600">{r.publications}</p>
                        <p className="text-[10px] text-muted-foreground">công bố</p>
                        <p className="text-xs text-emerald-600 font-medium">H={r.hIndex}</p>
                      </div>
                      <Link href={r.href}>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
