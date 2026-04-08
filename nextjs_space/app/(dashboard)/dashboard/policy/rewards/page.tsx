'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Trophy, AlertCircle, Medal, Star, Plus, Eye, Edit } from 'lucide-react';

interface PolicyRecord {
  id: string;
  recordType: 'REWARD' | 'DISCIPLINE';
  level: string;
  title: string;
  reason: string;
  decisionNumber: string | null;
  decisionDate: string | null;
  status: string;
  user: {
    id: string;
    name: string;
    militaryId: string | null;
    rank: string | null;
    position: string | null;
    unitRelation: { name: string } | null;
  };
}

interface Stats {
  total: number;
  rewards: number;
  disciplines: number;
}

export default function PolicyRewardsPage() {
  const [records, setRecords] = useState<PolicyRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, rewards: 0, disciplines: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recordType, setRecordType] = useState('REWARD');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        recordType,
        ...(search && { search }),
        ...(level && level !== 'ALL' && { level }),
      });

      const res = await fetch(`/api/policy-records?${params}`);
      const data = await res.json();

      setRecords(data.records || []);
      setStats(data.stats || { total: 0, rewards: 0, disciplines: 0 });
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, recordType, level]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const getLevelBadge = (level: string) => {
    const variants: Record<string, { color: string; label: string }> = {
      NATIONAL: { color: 'bg-yellow-500', label: 'Cấp Nhà nước' },
      MINISTRY: { color: 'bg-red-500', label: 'Cấp Bộ' },
      UNIT: { color: 'bg-blue-500', label: 'Cấp đơn vị' },
      DEPARTMENT: { color: 'bg-green-500', label: 'Cấp phòng/khoa' },
    };
    const config = variants[level] || { color: 'bg-gray-500', label: level };
    return (
      <span className={`px-2 py-1 rounded text-white text-xs ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            CSDL Thi đua Khen thưởng
          </h1>
          <p className="text-gray-500 mt-1">Quản lý khen thưởng, kỷ luật theo QĐ 144/BQP</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Plus className="h-4 w-4 mr-2" />
          Thêm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Khen thưởng</p>
                <p className="text-2xl font-bold text-amber-600">{stats.rewards}</p>
              </div>
              <Medal className="h-10 w-10 text-amber-100" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kỷ luật</p>
                <p className="text-2xl font-bold text-red-600">{stats.disciplines}</p>
              </div>
              <AlertCircle className="h-10 w-10 text-red-100" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng cộng</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Star className="h-10 w-10 text-blue-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Type Tabs */}
            <div className="flex gap-2">
              <Button
                variant={recordType === 'REWARD' ? 'default' : 'outline'}
                onClick={() => setRecordType('REWARD')}
                className={recordType === 'REWARD' ? 'bg-amber-600' : ''}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Khen thưởng
              </Button>
              <Button
                variant={recordType === 'DISCIPLINE' ? 'default' : 'outline'}
                onClick={() => setRecordType('DISCIPLINE')}
                className={recordType === 'DISCIPLINE' ? 'bg-red-600' : ''}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Kỷ luật
              </Button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm theo tên, số quyết định..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Level Filter */}
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cấp khen thưởng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                <SelectItem value="NATIONAL">Cấp Nhà nước</SelectItem>
                <SelectItem value="MINISTRY">Cấp Bộ</SelectItem>
                <SelectItem value="UNIT">Cấp đơn vị</SelectItem>
                <SelectItem value="DEPARTMENT">Cấp phòng/khoa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cán bộ</TableHead>
                <TableHead>Hình thức</TableHead>
                <TableHead>Cấp</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Số QĐ</TableHead>
                <TableHead>Ngày QĐ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.user.name}</p>
                        <p className="text-sm text-gray-500">
                          {record.user.rank} - {record.user.unitRelation?.name || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{record.title}</p>
                    </TableCell>
                    <TableCell>{getLevelBadge(record.level)}</TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate" title={record.reason}>
                        {record.reason}
                      </p>
                    </TableCell>
                    <TableCell>{record.decisionNumber || '-'}</TableCell>
                    <TableCell>{formatDate(record.decisionDate)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {page} / {totalPages}
          </span>
          <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
