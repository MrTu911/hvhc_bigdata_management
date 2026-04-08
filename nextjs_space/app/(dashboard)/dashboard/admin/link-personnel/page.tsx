'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/providers/language-provider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link2, Unlink, Search, Users, UserCheck, UserX, RefreshCw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  personnelId: string | null;
  unit?: { name: string } | null;
  personnelProfile?: {
    id: string;
    fullName: string;
    militaryId?: string;
    rank?: string;
    position?: string;
  } | null;
}

interface Personnel {
  id: string;
  fullName: string;
  militaryId?: string;
  rank?: string;
  position?: string;
  category?: string;
  unit?: { name: string } | null;
}

export default function LinkPersonnelPage() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState('');
  const [searchPersonnel, setSearchPersonnel] = useState('');
  const [filterLinked, setFilterLinked] = useState<'all' | 'linked' | 'unlinked'>('all');
  
  // Dialog states
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    linkedUsers: 0,
    unlinkedUsers: 0
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/link-personnel/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        const linked = data.data.filter((u: User) => u.personnelId).length;
        setStats({
          totalUsers: data.data.length,
          linkedUsers: linked,
          unlinkedUsers: data.data.length - linked
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailablePersonnel = useCallback(async (search: string = '') => {
    try {
      const res = await fetch(`/api/admin/link-personnel/personnel?search=${encodeURIComponent(search)}&available=true`);
      const data = await res.json();
      if (data.success) {
        setAvailablePersonnel(data.data);
      }
    } catch (error) {
      console.error('Error fetching personnel:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAvailablePersonnel();
  }, [fetchUsers, fetchAvailablePersonnel]);

  const handleOpenLinkDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedPersonnelId('');
    setLinkDialogOpen(true);
  };

  const handleLink = async () => {
    if (!selectedUser || !selectedPersonnelId) return;
    
    setProcessing(true);
    try {
      const res = await fetch('/api/admin/link-personnel/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          personnelId: selectedPersonnelId
        })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã liên kết User với Personnel',
        });
        setLinkDialogOpen(false);
        fetchUsers();
        fetchAvailablePersonnel();
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể liên kết',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlink = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn hủy liên kết?')) return;
    
    try {
      const res = await fetch('/api/admin/link-personnel/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Đã hủy liên kết',
        });
        fetchUsers();
        fetchAvailablePersonnel();
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể hủy liên kết',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.email.toLowerCase().includes(searchUser.toLowerCase());
    
    if (filterLinked === 'linked') return matchesSearch && user.personnelId;
    if (filterLinked === 'unlinked') return matchesSearch && !user.personnelId;
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Indigo Banner */}
      <div className="relative rounded-2xl overflow-hidden text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)' }} />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Link2 className="h-24 w-24" /></div>
        <div className="relative px-8 py-6">
          <Link href="/dashboard/admin"
            className="inline-flex items-center gap-1.5 text-indigo-100 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="h-4 w-4" />Quản trị hệ thống
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold">Liên kết User - Personnel</h1>
              <p className="text-indigo-100 text-sm mt-1">Quản lý liên kết giữa tài khoản User và hồ sơ cán bộ (Personnel)</p>
            </div>
            <Button onClick={() => { fetchUsers(); fetchAvailablePersonnel(); }}
              className="border-white/40 bg-white/20 text-white hover:bg-white/30" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Tổng Users', value: stats.totalUsers, icon: Users, color: 'bg-indigo-100 text-indigo-600', sub: 'Trong hệ thống' },
          { label: 'Đã liên kết', value: stats.linkedUsers, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600', sub: `${stats.totalUsers > 0 ? ((stats.linkedUsers / stats.totalUsers) * 100).toFixed(0) : 0}% tổng số` },
          { label: 'Chưa liên kết', value: stats.unlinkedUsers, icon: UserX, color: 'bg-orange-100 text-orange-600', sub: 'Cần xử lý' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="rounded-xl border bg-white p-4 flex items-start gap-3 shadow-sm">
            <div className={`rounded-lg p-2.5 ${color}`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-sm font-medium text-slate-700">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 rounded-xl border p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Tìm kiếm theo tên, email..."
            value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
            className="pl-10 bg-white" />
        </div>
        <div className="w-[180px]">
          <Select value={filterLinked} onValueChange={(v: 'all' | 'linked' | 'unlinked') => setFilterLinked(v)}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Trạng thái liên kết" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="linked">Đã liên kết</SelectItem>
              <SelectItem value="unlinked">Chưa liên kết</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(searchUser || filterLinked !== 'all') && (
          <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-medium">
            {filteredUsers.length} kết quả
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Danh sách Users ({filteredUsers.length})</h3>
          <span className="text-sm text-slate-500">Nhấn "Liên kết" để gán hồ sơ cán bộ</span>
        </div>
        {loading ? (
          <div className="text-center py-10 text-slate-400">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Đang tải...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold text-slate-600">User</TableHead>
                <TableHead className="font-semibold text-slate-600">Role</TableHead>
                <TableHead className="font-semibold text-slate-600">Đơn vị</TableHead>
                <TableHead className="font-semibold text-slate-600">Personnel liên kết</TableHead>
                <TableHead className="font-semibold text-slate-600">Trạng thái</TableHead>
                <TableHead className="font-semibold text-slate-600 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    <p className="font-medium text-slate-900">{user.name || 'N/A'}</p>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs border rounded-full px-2 py-0.5 text-slate-600">{user.role}</span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{user.unit?.name || '-'}</TableCell>
                  <TableCell>
                    {user.personnelProfile ? (
                      <div>
                        <p className="font-medium text-slate-800">{user.personnelProfile.fullName}</p>
                        <p className="text-xs text-slate-400">{user.personnelProfile.rank} - {user.personnelProfile.position}</p>
                      </div>
                    ) : <span className="text-slate-400 text-sm">Chưa liên kết</span>}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.personnelId ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {user.personnelId ? 'Đã liên kết' : 'Chưa liên kết'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {user.personnelId ? (
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50"
                        onClick={() => handleUnlink(user.id)}>
                        <Unlink className="w-4 h-4 mr-1" />Hủy
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => handleOpenLinkDialog(user)}>
                        <Link2 className="w-4 h-4 mr-1" />Liên kết
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Liên kết Personnel cho User</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <span>
                  User: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="Tìm kiếm Personnel theo tên, mã số..."
                value={searchPersonnel}
                onChange={(e) => {
                  setSearchPersonnel(e.target.value);
                  fetchAvailablePersonnel(e.target.value);
                }}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chọn</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Mã quân nhân</TableHead>
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Chức vụ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availablePersonnel.map((p) => (
                    <TableRow
                      key={p.id}
                      className={`cursor-pointer ${selectedPersonnelId === p.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedPersonnelId(p.id)}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          checked={selectedPersonnelId === p.id}
                          onChange={() => setSelectedPersonnelId(p.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{p.fullName}</TableCell>
                      <TableCell>{p.militaryId || '-'}</TableCell>
                      <TableCell>{p.rank || '-'}</TableCell>
                      <TableCell>{p.position || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {availablePersonnel.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        Không tìm thấy Personnel khả dụng
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedPersonnelId || processing}
            >
              {processing ? 'Đang xử lý...' : 'Liên kết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
