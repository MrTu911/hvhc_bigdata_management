'use client';

/**
 * Knowledge Base — Bài học kinh nghiệm từ tất cả đề tài
 * Phục vụ PI mới tham khảo khi lập kế hoạch
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Search, Lightbulb, AlertTriangle, Info } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  MANAGEMENT: 'Quản lý', TECHNICAL: 'Kỹ thuật', FINANCIAL: 'Tài chính',
  COLLABORATION: 'Hợp tác', OTHER: 'Khác',
};
const IMPACT_ICONS: Record<string, React.ElementType> = {
  HIGH: AlertTriangle, MEDIUM: Lightbulb, LOW: Info,
};
const IMPACT_COLORS: Record<string, string> = {
  HIGH: 'text-red-600', MEDIUM: 'text-amber-600', LOW: 'text-blue-500',
};
const IMPACT_LABELS: Record<string, string> = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' };

interface Lesson {
  id: string; title: string; description: string; category: string;
  impact: string; recommendation?: string; createdAt: string;
  project?: { id: string; projectCode: string; title: string };
  addedBy?: { id: string; fullName: string };
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [impactFilter, setImpactFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all completed projects, then their lessons
      const res = await fetch('/api/science/projects?status=COMPLETED&pageSize=100');
      const json = await res.json();
      if (!json.success) { toast.error('Lỗi tải dữ liệu'); return; }
      const projects: Array<{ id: string; projectCode: string; title: string }> =
        json.data?.items ?? json.data ?? [];

      const allLessons: Lesson[] = [];
      await Promise.all(
        projects.map(async (p) => {
          const r = await fetch(`/api/science/projects/${p.id}/lessons`);
          const j = await r.json();
          if (j.success && j.data.length > 0) {
            j.data.forEach((l: Lesson) => allLessons.push({ ...l, project: p }));
          }
        })
      );
      setLessons(allLessons.sort((a, b) => {
        const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return (order[a.impact] ?? 3) - (order[b.impact] ?? 3);
      }));
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = lessons.filter((l) => {
    if (categoryFilter && l.category !== categoryFilter) return false;
    if (impactFilter && l.impact !== impactFilter) return false;
    if (keyword) {
      return l.title.toLowerCase().includes(keyword.toLowerCase()) ||
             l.description.toLowerCase().includes(keyword.toLowerCase());
    }
    return true;
  });

  const highImpactCount = lessons.filter((l) => l.impact === 'HIGH').length;

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bài học Kinh nghiệm</h1>
          <p className="text-sm text-muted-foreground">
            Knowledge base từ {lessons.length} bài học — {highImpactCount} mức tác động cao
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm bài học..." value={keyword}
            onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <Select value={categoryFilter || 'ALL'} onValueChange={(v) => setCategoryFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả danh mục</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={impactFilter || 'ALL'} onValueChange={(v) => setImpactFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Mức tác động" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả</SelectItem>
            {Object.entries(IMPACT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="h-32 animate-pulse bg-gray-100 rounded m-4" /></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {lessons.length === 0 ? 'Chưa có bài học kinh nghiệm nào' : 'Không tìm thấy bài học phù hợp'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((lesson) => {
            const ImpactIcon = IMPACT_ICONS[lesson.impact] ?? Info;
            return (
              <Card key={lesson.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImpactIcon className={`h-4 w-4 shrink-0 ${IMPACT_COLORS[lesson.impact] ?? ''}`} />
                      <h3 className="font-medium text-sm leading-tight truncate">{lesson.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                      {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{lesson.description}</p>
                  {lesson.recommendation && (
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs font-medium text-blue-700 mb-0.5">Khuyến nghị:</p>
                      <p className="text-xs text-blue-600">{lesson.recommendation}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      {lesson.project?.projectCode ?? '—'} • {lesson.addedBy?.fullName ?? '—'}
                    </span>
                    <span className={`text-xs font-medium ${IMPACT_COLORS[lesson.impact] ?? ''}`}>
                      Tác động: {IMPACT_LABELS[lesson.impact] ?? lesson.impact}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
