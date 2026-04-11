'use client';

/**
 * M21 — Science Resources: Scientists
 * Danh sách hồ sơ nhà khoa học với filter theo lĩnh vực và tìm kiếm.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, GraduationCap, BookOpen, FlaskConical,
  ExternalLink, Users, Award,
} from 'lucide-react';

const DEGREE_LABELS: Record<string, string> = {
  TSKH: 'TSKH', TS: 'TS', ThS: 'ThS', CN: 'CN', KS: 'KS', CK1: 'CK1', CK2: 'CK2',
};

const DEGREE_COLORS: Record<string, string> = {
  TSKH: 'bg-purple-100 text-purple-700',
  TS:   'bg-blue-100 text-blue-700',
  ThS:  'bg-teal-100 text-teal-700',
  CN:   'bg-gray-100 text-gray-600',
  KS:   'bg-gray-100 text-gray-600',
  CK1:  'bg-orange-100 text-orange-700',
  CK2:  'bg-amber-100 text-amber-700',
};

interface Scientist {
  id: string;
  userId: string;
  hIndex?: number;
  i10Index?: number;
  totalCitations?: number;
  totalPublications?: number;
  primaryField?: string;
  specialization?: string;
  degree?: string;
  academicRank?: string;
  projectLeadCount?: number;
  projectMemberCount?: number;
  orcidId?: string;
  sensitivityLevel: string;
  user: {
    id: string;
    name: string;
    rank?: string;
    militaryId?: string;
    email?: string;
    academicTitle?: string;
    unitRelation?: { id: string; name: string; code: string };
  };
}

export default function ScientistsPage() {
  const router = useRouter();
  const [scientists, setScientists] = useState<Scientist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [primaryField, setPrimaryField] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchScientists = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (keyword) params.set('keyword', keyword);
      if (primaryField) params.set('primaryField', primaryField);

      const res = await fetch(`/api/science/scientists?${params}`).then(r => r.json());
      if (!res.success) throw new Error('Lỗi tải dữ liệu');
      setScientists(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (err: any) {
      toast.error(err.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [keyword, primaryField, page]);

  useEffect(() => { fetchScientists(); }, [fetchScientists]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhà Khoa học</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hồ sơ chuyên gia và nhà khoa học trong hệ thống.</p>
        </div>
        {total > 0 && <span className="text-sm text-gray-500">{total} hồ sơ</span>}
      </div>

      <ResourcesNav active="scientists" />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm theo tên, mã số..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Input
          placeholder="Lĩnh vực nghiên cứu..."
          value={primaryField}
          onChange={(e) => { setPrimaryField(e.target.value); setPage(1); }}
          className="h-9 text-sm w-48"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : scientists.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không tìm thấy nhà khoa học nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scientists.map((s) => (
              <Card
                key={s.id}
                className="hover:border-violet-300 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/science/resources/scientists/${s.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {s.degree && (
                          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${DEGREE_COLORS[s.degree] ?? 'bg-gray-100 text-gray-600'}`}>
                            {DEGREE_LABELS[s.degree] ?? s.degree}
                          </span>
                        )}
                        {s.sensitivityLevel === 'CONFIDENTIAL' && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">Mật</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {s.user.rank ? `${s.user.rank} ` : ''}{s.user.name}
                      </p>
                      {s.user.academicTitle && (
                        <p className="text-xs text-gray-500">{s.user.academicTitle}</p>
                      )}
                      {s.user.unitRelation && (
                        <p className="text-xs text-gray-400 truncate">{s.user.unitRelation.name}</p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  </div>

                  {s.primaryField && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-violet-600">
                      <FlaskConical className="h-3 w-3" />
                      <span className="truncate">{s.primaryField}</span>
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-base font-bold text-gray-800">{s.hIndex ?? 0}</p>
                      <p className="text-xs text-gray-400">H-index</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">{s.totalPublications ?? 0}</p>
                      <p className="text-xs text-gray-400">Công trình</p>
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-800">{s.projectLeadCount ?? 0}</p>
                      <p className="text-xs text-gray-400">Chủ nhiệm</p>
                    </div>
                  </div>

                  {s.orcidId && (
                    <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      ORCID: {s.orcidId}
                    </div>
                  )}
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
        </>
      )}
    </div>
  );
}

// ─── ResourcesNav ──────────────────────────────────────────────────────────────

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
