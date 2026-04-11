'use client';

/**
 * M21 — Science Resources: Experts
 * Danh sách chuyên gia được đề xuất, sắp xếp theo chỉ số chuyên môn.
 * Baseline cho M23 council composition suggestion.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FlaskConical, Star, BookOpen, Trophy, ExternalLink } from 'lucide-react';

const DEGREE_COLORS: Record<string, string> = {
  TSKH: 'bg-purple-100 text-purple-700',
  TS:   'bg-blue-100 text-blue-700',
  ThS:  'bg-teal-100 text-teal-700',
};

interface Expert {
  id: string;
  hIndex?: number;
  totalPublications?: number;
  totalCitations?: number;
  projectLeadCount?: number;
  primaryField?: string;
  specialization?: string;
  degree?: string;
  _expertScore?: number;
  user: {
    id: string;
    name: string;
    rank?: string;
    academicTitle?: string;
    unitRelation?: { id: string; name: string };
  };
}

export default function ExpertsPage() {
  const router = useRouter();
  const [experts, setExperts] = useState<Expert[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [field, setField] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchExperts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (field) params.set('field', field);

      const res = await fetch(`/api/science/experts?${params}`).then(r => r.json());
      if (!res.success) throw new Error('Lỗi tải dữ liệu');
      setExperts(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword, field, page]);

  useEffect(() => { fetchExperts(); }, [fetchExperts]);

  const totalPages = Math.ceil(total / pageSize);
  const rank = (idx: number) => (page - 1) * pageSize + idx + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chuyên gia Khoa học</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Danh sách chuyên gia xếp hạng theo H-index, công trình và đề tài. Dùng cho đề xuất hội đồng M23.
          </p>
        </div>
        {total > 0 && <span className="text-sm text-gray-500">{total} chuyên gia</span>}
      </div>

      <ResourcesNav active="experts" />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <div className="relative">
          <FlaskConical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Lĩnh vực..."
            value={field}
            onChange={(e) => { setField(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm w-48"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : experts.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không tìm thấy chuyên gia phù hợp.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {experts.map((e, idx) => (
              <Card key={e.id} className="hover:border-violet-300 hover:shadow-sm transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank badge */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      rank(idx) <= 3
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {rank(idx)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        {e.degree && DEGREE_COLORS[e.degree] && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${DEGREE_COLORS[e.degree]}`}>
                            {e.degree}
                          </span>
                        )}
                        <p className="text-sm font-semibold text-gray-900">
                          {e.user.rank ? `${e.user.rank} ` : ''}{e.user.name}
                        </p>
                        {e.user.academicTitle && (
                          <span className="text-xs text-gray-500">{e.user.academicTitle}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        {e.user.unitRelation && <span>{e.user.unitRelation.name}</span>}
                        {e.primaryField && (
                          <span className="flex items-center gap-0.5 text-violet-600">
                            <FlaskConical className="h-3 w-3" />{e.primaryField}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                      <div className="text-center">
                        <p className="text-base font-bold text-violet-700">{e.hIndex ?? 0}</p>
                        <p className="text-xs text-gray-400">H-index</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-blue-700">{e.totalPublications ?? 0}</p>
                        <p className="text-xs text-gray-400">CT</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-teal-700">{e.totalCitations ?? 0}</p>
                        <p className="text-xs text-gray-400">TC</p>
                      </div>
                      <div className="text-center">
                        <p className="text-base font-bold text-amber-700">{e.projectLeadCount ?? 0}</p>
                        <p className="text-xs text-gray-400">CN đề tài</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/science/resources/scientists/${e.id}`)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Hồ sơ
                      </Button>
                      {/* M23 hook — đề xuất cho hội đồng */}
                      <Button
                        variant="outline" size="sm"
                        onClick={() => router.push(`/dashboard/science/activities/councils/new?expertUserId=${e.user.id}`)}
                        className="gap-1 text-violet-600 border-violet-200 hover:bg-violet-50"
                        title="Đề xuất vào hội đồng khoa học (M23)"
                      >
                        <Trophy className="h-3.5 w-3.5" /> Đề xuất HĐ
                      </Button>
                    </div>
                  </div>

                  {/* Mobile metrics */}
                  <div className="sm:hidden mt-2 flex gap-4 text-xs text-gray-500 border-t pt-2">
                    <span>H: <strong>{e.hIndex ?? 0}</strong></span>
                    <span>CT: <strong>{e.totalPublications ?? 0}</strong></span>
                    <span>TC: <strong>{e.totalCitations ?? 0}</strong></span>
                    <span>CN: <strong>{e.projectLeadCount ?? 0}</strong></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
              <span className="text-sm text-gray-500">Trang {page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Sau</Button>
            </div>
          )}

          <p className="text-xs text-center text-gray-400">
            Xếp hạng theo: H-index × 2 + số đề tài chủ nhiệm + số công trình ÷ 10
          </p>
        </>
      )}
    </div>
  );
}

function ResourcesNav({ active }: { active: 'scientists' | 'units' | 'experts' | 'capacity' }) {
  const items = [
    { key: 'scientists', label: 'Nhà Khoa học', href: '/dashboard/science/resources/scientists' },
    { key: 'units',      label: 'Năng lực ĐV',  href: '/dashboard/science/resources/units' },
    { key: 'experts',    label: 'Chuyên gia',    href: '/dashboard/science/resources/experts' },
    { key: 'capacity',   label: 'Tổng quan',     href: '/dashboard/science/resources/capacity' },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-gray-200 pb-1">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-4 py-1.5 text-sm rounded-t-md font-medium transition-colors ${
            active === item.key
              ? 'bg-violet-600 text-white'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
