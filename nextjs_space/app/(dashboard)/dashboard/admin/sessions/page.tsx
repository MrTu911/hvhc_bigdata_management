/**
 * M01 – UC-06: Admin Session Management
 * Trang quản lý phiên đăng nhập toàn hệ thống
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Monitor,
  Search,
  RefreshCw,
  ShieldOff,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AuthSession {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
  isActive: boolean;
  loginAt: string;
  lastActivityAt: string;
  expiresAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

interface SessionsResponse {
  sessions: AuthSession[];
  total: number;
  page: number;
  pageSize: number;
}

const REVOKE_REASONS = [
  { value: 'ADMIN_REVOKE', label: 'Thu hồi bởi Admin' },
  { value: 'SUSPICIOUS', label: 'Hoạt động đáng ngờ' },
];

function getDeviceLabel(userAgent: string | null, deviceName: string | null): string {
  if (deviceName) return deviceName;
  if (!userAgent) return 'Thiết bị không xác định';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) return 'Thiết bị di động';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Mac/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Trình duyệt web';
}

export default function AdminSessionsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<SessionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);

  const [revokeTarget, setRevokeTarget] = useState<AuthSession | null>(null);
  const [revokeReason, setRevokeReason] = useState<'ADMIN_REVOKE' | 'SUSPICIOUS'>('ADMIN_REVOKE');
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (filterActive !== 'all') params.set('isActive', filterActive);

      const res = await fetch(`/api/admin/sessions?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      toast({ title: 'Lỗi tải dữ liệu', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [page, filterActive, toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      const res = await fetch(`/api/admin/sessions/${revokeTarget.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Đã thu hồi phiên đăng nhập' });
        setRevokeTarget(null);
        fetchSessions();
      } else {
        toast({ title: json.error || 'Lỗi thu hồi', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Lỗi kết nối', variant: 'destructive' });
    } finally {
      setIsRevoking(false);
    }
  };

  // Filter tại client theo search (email/name)
  const filtered =
    data?.sessions.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.user.email.toLowerCase().includes(q) ||
        s.user.name.toLowerCase().includes(q) ||
        (s.ipAddress ?? '').includes(q)
      );
    }) ?? [];

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            Quản lý Phiên Đăng Nhập
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Xem và thu hồi phiên đăng nhập toàn hệ thống (UC-06)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Tổng phiên',
            value: data?.total ?? '—',
            icon: <Monitor className="w-4 h-4" />,
            color: 'text-blue-600',
          },
          {
            label: 'Đang active',
            value: filtered.filter((s) => s.isActive).length,
            icon: <CheckCircle className="w-4 h-4" />,
            color: 'text-green-600',
          },
          {
            label: 'Đã revoke',
            value: filtered.filter((s) => !s.isActive && s.revokedReason !== 'EXPIRED').length,
            icon: <ShieldOff className="w-4 h-4" />,
            color: 'text-red-600',
          },
          {
            label: 'Đáng ngờ',
            value: filtered.filter((s) => s.revokedReason === 'SUSPICIOUS').length,
            icon: <ShieldAlert className="w-4 h-4" />,
            color: 'text-amber-600',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <div className={`flex items-center gap-2 ${stat.color} mb-1`}>
                {stat.icon}
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo email, tên, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterActive}
              onValueChange={(v) => {
                setFilterActive(v as typeof filterActive);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Đang active</SelectItem>
                <SelectItem value="false">Đã kết thúc</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSessions} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Đăng nhập</TableHead>
                  <TableHead>Hoạt động gần nhất</TableHead>
                  <TableHead>Hết hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Không tìm thấy phiên nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate max-w-[140px]">
                              {session.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                              {session.user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getDeviceLabel(session.userAgent, session.deviceName)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {session.ipAddress ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(session.loginAt), 'dd/MM/yy HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(session.lastActivityAt), {
                            addSuffix: true,
                            locale: vi,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(session.expiresAt), 'dd/MM HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <SessionStatusBadge session={session} />
                      </TableCell>
                      <TableCell className="text-right">
                        {session.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setRevokeTarget(session);
                              setRevokeReason('ADMIN_REVOKE');
                            }}
                          >
                            <ShieldOff className="w-4 h-4 mr-1" />
                            Thu hồi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages} ({data?.total ?? 0} phiên)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-red-600" />
              Thu hồi phiên đăng nhập
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>
                Bạn đang thu hồi phiên của{' '}
                <strong>{revokeTarget?.user.name}</strong> ({revokeTarget?.user.email}).
                User sẽ bị đăng xuất khỏi thiết bị này ngay lập tức.
              </span>

              <div className="pt-2">
                <label className="text-sm font-medium text-foreground block mb-1">
                  Lý do thu hồi
                </label>
                <Select
                  value={revokeReason}
                  onValueChange={(v) => setRevokeReason(v as typeof revokeReason)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVOKE_REASONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRevoking ? 'Đang thu hồi...' : 'Thu hồi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SessionStatusBadge({ session }: { session: AuthSession }) {
  if (session.isActive) {
    const isExpiringSoon =
      new Date(session.expiresAt).getTime() - Date.now() < 60 * 60 * 1000; // < 1h
    return (
      <Badge
        variant={isExpiringSoon ? 'secondary' : 'default'}
        className={isExpiringSoon ? '' : 'bg-green-100 text-green-800 border-green-200'}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        {isExpiringSoon ? 'Sắp hết hạn' : 'Active'}
      </Badge>
    );
  }

  if (session.revokedReason === 'SUSPICIOUS') {
    return (
      <Badge variant="destructive">
        <ShieldAlert className="w-3 h-3 mr-1" />
        Đáng ngờ
      </Badge>
    );
  }

  if (session.revokedReason === 'ADMIN_REVOKE') {
    return (
      <Badge variant="secondary" className="text-orange-700 border-orange-200 bg-orange-50">
        <ShieldOff className="w-3 h-3 mr-1" />
        Đã thu hồi
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <XCircle className="w-3 h-3 mr-1" />
      {session.revokedReason === 'EXPIRED' ? 'Hết hạn' : 'Đã kết thúc'}
    </Badge>
  );
}
