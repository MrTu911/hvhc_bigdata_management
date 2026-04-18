'use client';

/**
 * Danh sách đánh giá giữa kỳ — quản lý viên/hội đồng view
 * Hiển thị đề tài đang ACTIVE chưa có midterm review + đề tài đã có review
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { RefreshCw, Search, ClipboardCheck, Plus } from 'lucide-react';

const RECOMMENDATION_LABELS: Record<string, string> = {
  CONTINUE: 'Tiếp tục', ADJUST: 'Điều chỉnh', TERMINATE: 'Dừng',
};
const RECOMMENDATION_COLORS: Record<string, string> = {
  CONTINUE: 'bg-emerald-100 text-emerald-700',
  ADJUST: 'bg-yellow-100 text-yellow-700',
  TERMINATE: 'bg-red-100 text-red-700',
};

interface ProjectWithMidterm {
  id: string; projectCode: string; title: string; status: string;
  midtermReview?: {
    id: string; reviewDate: string; overallScore?: number; recommendation: string;
    council?: { name: string };
  };
}

export default function MidtermPage() {
  const [projects, setProjects] = useState<ProjectWithMidterm[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'pending' | 'done'>('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/science/projects?status=ACTIVE&pageSize=100');
      const json = await res.json();
      if (!json.success) { toast.error('Lỗi tải dữ liệu'); return; }
      const items: ProjectWithMidterm[] = json.data?.items ?? json.data ?? [];

      // Load midterm review cho từng project
      const withMidterm = await Promise.all(
        items.map(async (p) => {
          const r = await fetch(`/api/science/projects/${p.id}/midterm`);
          const j = await r.json();
          return { ...p, midtermReview: j.success ? j.data : undefined };
        })
      );
      setProjects(withMidterm);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = projects.filter((p) => {
    const hasReview = !!p.midtermReview;
    if (tab === 'pending' && hasReview) return false;
    if (tab === 'done' && !hasReview) return false;
    if (keyword) {
      return p.projectCode.toLowerCase().includes(keyword.toLowerCase()) ||
             p.title.toLowerCase().includes(keyword.toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Đánh giá Giữa kỳ</h1>
          <p className="text-sm text-muted-foreground">Quản lý đánh giá giữa kỳ các đề tài đang thực hiện</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex border rounded-lg overflow-hidden">
          {(['pending', 'done'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-violet-600 text-white' : 'text-muted-foreground hover:bg-gray-50'
              }`}>
              {t === 'pending' ? `Chưa đánh giá (${projects.filter(p => !p.midtermReview).length})` : `Đã đánh giá (${projects.filter(p => !!p.midtermReview).length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Tìm mã, tên đề tài..." value={keyword}
            onChange={(e) => setKeyword(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đề tài</TableHead>
                <TableHead>Tên đề tài</TableHead>
                {tab === 'done' && (
                  <>
                    <TableHead>Ngày đánh giá</TableHead>
                    <TableHead>Hội đồng</TableHead>
                    <TableHead className="text-center">Điểm tổng</TableHead>
                    <TableHead>Kết luận</TableHead>
                  </>
                )}
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {tab === 'pending' ? 'Không có đề tài chờ đánh giá' : 'Chưa có đánh giá giữa kỳ'}
                </TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm font-medium">
                    <Link href={`/dashboard/science/projects/${p.id}`} className="text-blue-600 hover:underline">
                      {p.projectCode}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">{p.title}</TableCell>
                  {tab === 'done' && p.midtermReview && (
                    <>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.midtermReview.reviewDate).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-sm">{p.midtermReview.council?.name ?? '—'}</TableCell>
                      <TableCell className="text-center font-medium">
                        {p.midtermReview.overallScore?.toFixed(1) ?? '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${RECOMMENDATION_COLORS[p.midtermReview.recommendation] ?? 'bg-gray-100'}`}>
                          {RECOMMENDATION_LABELS[p.midtermReview.recommendation] ?? p.midtermReview.recommendation}
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    {tab === 'pending' ? (
                      <Link href={`/dashboard/science/projects/${p.id}`}>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3.5 w-3.5 mr-1" />Tạo đánh giá
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/dashboard/science/projects/${p.id}`}>
                        <Button size="sm" variant="ghost">
                          <ClipboardCheck className="h-3.5 w-3.5 mr-1" />Xem
                        </Button>
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
