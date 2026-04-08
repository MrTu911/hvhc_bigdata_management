/**
 * Insurance List Page - Danh sách thông tin BHXH
 * RBAC: INSURANCE.VIEW
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Shield, Search, Plus, Filter, ChevronLeft, ChevronRight,
  Eye, Edit, MoreHorizontal, RefreshCw, Users, Heart, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

interface InsuranceRecord {
  id: string;
  insuranceNumber?: string;
  insuranceStartDate?: string;
  healthInsuranceNumber?: string;
  healthInsuranceHospital?: string;
  user: {
    id: string;
    name: string;
    militaryId?: string;
    rank?: string;
    dateOfBirth?: string;
    unitRelation?: { name: string };
  };
}

export default function InsuranceListPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [records, setRecords] = useState<InsuranceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasInsurance, setHasInsurance] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ totalUsers: 0, withBHXH: 0, withBHYT: 0 });
  const pageSize = 20;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, hasInsurance]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(hasInsurance && hasInsurance !== 'ALL' && { hasInsurance }),
      });
      const res = await fetch(`/api/insurance?${params}`);
      const data = await res.json();
      if (data.success !== false) {
        setRecords(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || data.data?.length || 0);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching insurance records:', error);
      toast.error('Lỗi tải dữ liệu');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Shield className="h-6 w-6 text-white" />
            Danh sách Bảo hiểm Xã hội
          </h1>
          <p className="text-cyan-100">Quản lý thông tin BHXH, BHYT của cán bộ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRecords} className="bg-white/20 border-white/40 text-white hover:bg-white/30">
            <RefreshCw className="h-4 w-4 mr-2" />Làm mới
          </Button>
          <Link href="/dashboard/insurance/create">
            <Button className="bg-white text-cyan-700 hover:bg-white/90">
              <Plus className="h-4 w-4 mr-2" />Thêm thông tin BHXH
            </Button>
          </Link>
        </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Tổng cán bộ</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg"><Shield className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.withBHXH}</p>
                <p className="text-sm text-muted-foreground">Có BHXH</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg"><Heart className="h-5 w-5 text-teal-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.withBHYT}</p>
                <p className="text-sm text-muted-foreground">Có BHYT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><AlertCircle className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers - stats.withBHXH}</p>
                <p className="text-sm text-muted-foreground">Chưa có BHXH</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Tìm theo tên, mã quân nhân, số BHXH..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-md"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={hasInsurance} onValueChange={(v) => { setHasInsurance(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-44">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Lọc theo BHXH" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="true">Có BHXH/BHYT</SelectItem>
                  <SelectItem value="false">Chưa có BHXH/BHYT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Không có bản ghi nào</p>
              <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc thêm thông tin BHXH mới</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cán bộ</TableHead>
                  <TableHead>Mã quân nhân</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Số BHXH</TableHead>
                  <TableHead>Số BHYT</TableHead>
                  <TableHead>Nơi khám BHYT</TableHead>
                  <TableHead>Ngày bắt đầu BH</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{record.user?.rank}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.user?.militaryId || '-'}</TableCell>
                    <TableCell>{record.user?.unitRelation?.name || '-'}</TableCell>
                    <TableCell>
                      {record.insuranceNumber ? (
                        <Badge variant="default" className="bg-green-100 text-green-700">
                          {record.insuranceNumber}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Chưa có</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.healthInsuranceNumber ? (
                        <Badge variant="default" className="bg-teal-100 text-teal-700">
                          {record.healthInsuranceNumber}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Chưa có</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{record.healthInsuranceHospital || '-'}</TableCell>
                    <TableCell>{formatDate(record.insuranceStartDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/insurance/${record.id}`}>
                              <Eye className="h-4 w-4 mr-2" />Xem chi tiết
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/insurance/create?userId=${record.user?.id}`}>
                              <Edit className="h-4 w-4 mr-2" />Cập nhật
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalCount)} / {totalCount} bản ghi
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
