/**
 * Trang quản lý Hệ đào tạo
 * /dashboard/education/training-systems
 *
 * Hiển thị 4 Hệ đào tạo với thống kê học viên, cảnh báo, Tiểu đoàn trực thuộc.
 * Dành cho: CHI_HUY_HOC_VIEN, CHI_HUY_HE, ADMIN
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Building2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Battalion {
  id: string;
  code: string;
  name: string;
  studentCount: number;
  commander?: { id: string; name: string } | null;
}

interface TrainingSystem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  commander?: { id: string; name: string; rank: string } | null;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  warningCount: number;
  battalions: Battalion[];
}

const SYSTEM_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  'HE-SDH':  { border: 'border-purple-500', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  'HE-CHTS': { border: 'border-blue-500',   bg: 'bg-blue-50',   badge: 'bg-blue-100 text-blue-800' },
  'HE-CN':   { border: 'border-green-500',  bg: 'bg-green-50',  badge: 'bg-green-100 text-green-800' },
  'HE-QT':   { border: 'border-orange-500', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
};

const DEFAULT_COLOR = { border: 'border-gray-400', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' };

export default function TrainingSystemsPage() {
  const router = useRouter();
  const [systems, setSystems] = useState<TrainingSystem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSystems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/education/training-systems');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi tải dữ liệu');
      setSystems(json.data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSystems(); }, [fetchSystems]);

  const totalStudents = systems.reduce((s, sys) => s + sys.totalStudents, 0);
  const totalWarnings = systems.reduce((s, sys) => s + sys.warningCount, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Quản lý Hệ đào tạo
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng quan 4 Hệ đào tạo — {totalStudents} học viên toàn Học viện
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSystems}>
            <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-indigo-700">{systems.length}</p>
            <p className="text-sm text-muted-foreground">Hệ đào tạo</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-green-700">{totalStudents}</p>
            <p className="text-sm text-muted-foreground">Tổng học viên</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-blue-700">
              {systems.reduce((s, sys) => s + sys.activeStudents, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Đang học</p>
          </CardContent>
        </Card>
        <Card className={`text-center ${totalWarnings > 0 ? 'border-red-300 bg-red-50' : ''}`}>
          <CardContent className="pt-4">
            <p className={`text-3xl font-bold ${totalWarnings > 0 ? 'text-red-600' : 'text-gray-700'}`}>
              {totalWarnings}
            </p>
            <p className="text-sm text-muted-foreground">Cảnh báo học vụ</p>
          </CardContent>
        </Card>
      </div>

      {/* Hệ cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systems.map((sys) => {
          const color = SYSTEM_COLORS[sys.code] ?? DEFAULT_COLOR;
          const activePct = sys.totalStudents > 0
            ? Math.round((sys.activeStudents / sys.totalStudents) * 100)
            : 0;

          return (
            <Card
              key={sys.id}
              className={`border-l-4 ${color.border} ${color.bg} hover:shadow-lg transition-shadow cursor-pointer`}
              onClick={() => router.push(`/dashboard/education/training-systems/${sys.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-800">{sys.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{sys.description}</p>
                  </div>
                  <Badge className={`text-xs ${color.badge} border-0`}>{sys.code}</Badge>
                </div>
                {sys.commander && (
                  <p className="text-xs text-gray-600 mt-1">
                    Chỉ huy: <span className="font-medium">{sys.commander.rank} {sys.commander.name}</span>
                  </p>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{sys.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Tổng HV</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-700">{sys.activeStudents}</p>
                    <p className="text-xs text-muted-foreground">Đang học</p>
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${sys.warningCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {sys.warningCount}
                    </p>
                    <p className="text-xs text-muted-foreground">Cảnh báo</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Tỉ lệ đang học</span>
                    <span className="font-medium">{activePct}%</span>
                  </div>
                  <Progress value={activePct} className="h-2" />
                </div>

                {/* Battalions */}
                {sys.battalions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Tiểu đoàn ({sys.battalions.length})
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {sys.battalions.map((bat) => (
                        <div
                          key={bat.id}
                          className="flex items-center justify-between bg-white rounded px-2 py-1 text-xs border cursor-pointer hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/education/battalions/${bat.id}`);
                          }}
                        >
                          <span className="font-medium truncate">{bat.name}</span>
                          <span className="ml-1 text-indigo-600 font-bold shrink-0">
                            {bat.studentCount} HV
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2">
                    {sys.warningCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        {sys.warningCount} cảnh báo
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <Users className="h-3 w-3" /> Chi tiết
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
