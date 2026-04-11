'use client';

/**
 * M21 — Science Resources: Unit Capacity
 * Năng lực khoa học theo đơn vị — tổng hợp từ hồ sơ nhà khoa học.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Building2, Users, GraduationCap, FlaskConical } from 'lucide-react';

interface UnitCapacity {
  unitId: string;
  unitName: string;
  unitCode: string;
  scientistCount: number;
  doctoralCount: number;
  masterCount: number;
  projectLeadCount: number;
  projectMemberCount: number;
  totalCitations: number;
  totalPublications: number;
  topFields: string[];
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitCapacity[]>([]);
  const [filtered, setFiltered] = useState<UnitCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetch('/api/science/units/capacity')
      .then(r => r.json())
      .then((res) => {
        if (!res.success) throw new Error('Lỗi tải dữ liệu');
        setUnits(res.data ?? []);
        setFiltered(res.data ?? []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!keyword.trim()) {
      setFiltered(units);
      return;
    }
    const kw = keyword.toLowerCase();
    setFiltered(units.filter(
      (u) => u.unitName.toLowerCase().includes(kw) || u.unitCode.toLowerCase().includes(kw)
    ));
  }, [keyword, units]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Năng lực Đơn vị</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng hợp tiềm lực khoa học theo đơn vị từ hồ sơ nhà khoa học.</p>
        </div>
        {units.length > 0 && <span className="text-sm text-gray-500">{units.length} đơn vị</span>}
      </div>

      <ResourcesNav active="units" />

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm đơn vị..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-7 w-7 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Không tìm thấy đơn vị nào.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2 text-xs font-semibold text-gray-500 border-b">
            <span>Đơn vị</span>
            <span className="text-right">Nhà KH</span>
            <span className="text-right">Tiến sĩ</span>
            <span className="text-right">Thạc sĩ</span>
            <span className="text-right">Đề tài CN</span>
            <span className="text-right">Công trình</span>
          </div>

          {filtered.map((u) => (
            <Card key={u.unitId} className="hover:border-gray-300 transition-colors">
              <CardContent className="p-4">
                <div className="sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto_auto] sm:gap-4 sm:items-center">
                  {/* Unit info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-900">{u.unitName}</p>
                      {u.unitCode && (
                        <span className="text-xs text-gray-400 font-mono">{u.unitCode}</span>
                      )}
                    </div>
                    {/* Top fields */}
                    {u.topFields.length > 0 && (
                      <div className="mt-1 flex items-center gap-1 flex-wrap ml-6">
                        {u.topFields.slice(0, 3).map((f, i) => (
                          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-600">
                            {f}
                          </span>
                        ))}
                        {u.topFields.length > 3 && (
                          <span className="text-xs text-gray-400">+{u.topFields.length - 3}</span>
                        )}
                      </div>
                    )}
                    {/* Mobile metrics */}
                    <div className="sm:hidden mt-2 flex gap-4 text-xs text-gray-500 ml-6">
                      <span><Users className="h-3 w-3 inline mr-0.5" />{u.scientistCount} NKH</span>
                      <span><GraduationCap className="h-3 w-3 inline mr-0.5" />{u.doctoralCount} TS</span>
                      <span><FlaskConical className="h-3 w-3 inline mr-0.5" />{u.projectLeadCount} đề tài CN</span>
                    </div>
                  </div>

                  {/* Desktop metrics */}
                  <div className="hidden sm:flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-base font-bold text-violet-700">{u.scientistCount}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-base font-bold text-blue-700">{u.doctoralCount}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-base font-bold text-teal-700">{u.masterCount}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-700">{u.projectLeadCount}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center justify-end">
                    <div className="text-right">
                      <p className="text-base font-bold text-amber-700">{u.totalPublications}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
