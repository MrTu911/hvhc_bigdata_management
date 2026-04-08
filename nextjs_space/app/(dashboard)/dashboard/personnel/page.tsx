/**
 * Personnel Management Dashboard - Phase 2
 * Quản lý Hồ sơ Cán bộ theo chuẩn BQP
 * 
 * Features:
 * - Danh sách cán bộ với search/filter
 * - CRUD UI cho 4 CSDL (Career, Party, Insurance, Family)
 * - Scope-based access control
 * - Export Excel/PDF
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Users,
  Briefcase,
  Shield,
  Heart,
  Users2,
  Search,
  Plus,
  FileText,
  Download,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CareerHistoryForm } from '@/components/personnel/career-history-form';
import { FamilyForm } from '@/components/personnel/family-form';
import { PartyMemberForm } from '@/components/personnel/party-member-form';
import { InsuranceForm } from '@/components/personnel/insurance-form';
import { CareerEventTypeLabels, FamilyRelationTypeLabels, PartyMemberStatusLabels } from '@/lib/validations/personnel';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface User {
  id: string;
  fullName: string;
  email: string;
  rank?: string;
  position?: string;
  unit?: { name: string };
}

interface CareerHistory {
  id: string;
  userId: string;
  eventType: string;
  eventDate: string;
  newPosition?: string;
  newRank?: string;
  newUnit?: string;
  decisionNumber?: string;
  notes?: string;
}

interface FamilyRelation {
  id: string;
  userId: string;
  relation: string;
  fullName: string;
  dateOfBirth?: string;
  occupation?: string;
  isDeceased: boolean;
}

interface PartyMember {
  id: string;
  userId: string;
  partyCardNumber?: string | null;
  joinDate?: string | null;
  officialDate?: string | null;
  partyCell?: string | null;
  partyCommittee?: string | null;
  recommender1?: string | null;
  recommender2?: string | null;
  status: string;
  statusChangeDate?: string | null;
  statusChangeReason?: string | null;
}

interface InsuranceInfo {
  id: string;
  userId: string;
  insuranceNumber?: string | null;
  insuranceStartDate?: string | null;
  insuranceEndDate?: string | null;
  healthInsuranceNumber?: string | null;
  healthInsuranceStartDate?: string | null;
  healthInsuranceEndDate?: string | null;
  healthInsuranceHospital?: string | null;
  beneficiaryName?: string | null;
  beneficiaryRelation?: string | null;
  beneficiaryPhone?: string | null;
  notes?: string | null;
}

export default function PersonnelDashboard() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    searchParams.get('userId') || null
  );
  
  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [careerHistory, setCareerHistory] = useState<CareerHistory[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyRelation[]>([]);
  const [partyMember, setPartyMember] = useState<PartyMember | null>(null);
  const [insuranceInfo, setInsuranceInfo] = useState<InsuranceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  
  // Form states
  const [careerFormOpen, setCareerFormOpen] = useState(false);
  const [familyFormOpen, setFamilyFormOpen] = useState(false);
  const [partyFormOpen, setPartyFormOpen] = useState(false);
  const [insuranceFormOpen, setInsuranceFormOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<CareerHistory | null>(null);
  const [editingFamily, setEditingFamily] = useState<FamilyRelation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: string; id: string } | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalPersonnel: 0,
    totalPartyMembers: 0,
    totalInsured: 0,
    totalFamilyMembers: 0,
  });

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(searchQuery && { q: searchQuery }),
      });
      
      const res = await fetch(`/api/admin/rbac/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(p => ({ ...p, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery]);

  // Fetch career history for selected user
  const fetchCareerHistory = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/personnel/career-history?userId=${selectedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setCareerHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching career history:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Fetch family members for selected user
  const fetchFamilyMembers = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/personnel/family?userId=${selectedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Fetch party member for selected user
  const fetchPartyMember = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/personnel/party-member?userId=${selectedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setPartyMember(data.data?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching party member:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Fetch insurance info for selected user
  const fetchInsuranceInfo = useCallback(async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/personnel/insurance?userId=${selectedUserId}`);
      if (res.ok) {
        const data = await res.json();
        setInsuranceInfo(data.data?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching insurance:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    if (selectedUserId && activeTab === 'career') {
      fetchCareerHistory();
    }
  }, [selectedUserId, activeTab, fetchCareerHistory]);

  useEffect(() => {
    if (selectedUserId && activeTab === 'family') {
      fetchFamilyMembers();
    }
  }, [selectedUserId, activeTab, fetchFamilyMembers]);

  useEffect(() => {
    if (selectedUserId && activeTab === 'party') {
      fetchPartyMember();
    }
  }, [selectedUserId, activeTab, fetchPartyMember]);

  useEffect(() => {
    if (selectedUserId && activeTab === 'insurance') {
      fetchInsuranceInfo();
    }
  }, [selectedUserId, activeTab, fetchInsuranceInfo]);

  // Select user and switch tab
  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    setActiveTab('career');
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingItem) return;
    
    try {
      let endpoint = '';
      switch (deletingItem.type) {
        case 'career':
          endpoint = `/api/personnel/career-history?id=${deletingItem.id}`;
          break;
        case 'family':
          endpoint = `/api/personnel/family?id=${deletingItem.id}`;
          break;
        case 'party':
          endpoint = `/api/personnel/party-member?id=${deletingItem.id}`;
          break;
        case 'insurance':
          endpoint = `/api/personnel/insurance?id=${deletingItem.id}`;
          break;
        default:
          throw new Error('Loại dữ liệu không hợp lệ');
      }
        
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Lỗi khi xóa');
      }
      
      toast.success('Xóa thành công');
      
      switch (deletingItem.type) {
        case 'career':
          fetchCareerHistory();
          break;
        case 'family':
          fetchFamilyMembers();
          break;
        case 'party':
          setPartyMember(null);
          break;
        case 'insurance':
          setInsuranceInfo(null);
          break;
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setDeletingItem(null);
    }
  };

  // Get selected user info
  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Hồ sơ Cán bộ
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            CSDL cán bộ theo QĐ 144/BQP - Phase 2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Cán bộ</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPersonnel}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đảng viên</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPartyMembers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">BHXH/BHYT</CardTitle>
            <Heart className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInsured}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thân nhân</CardTitle>
            <Users2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFamilyMembers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Selected User Info */}
      {selectedUser && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {selectedUser.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-500">
                    {selectedUser.rank} - {selectedUser.position} - {selectedUser.unit?.name}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedUserId(null);
                  setActiveTab('list');
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2">
            <Users className="h-4 w-4" />
            Danh sách
          </TabsTrigger>
          <TabsTrigger value="career" className="gap-2" disabled={!selectedUserId}>
            <Briefcase className="h-4 w-4" />
            Quá trình CT
          </TabsTrigger>
          <TabsTrigger value="party" className="gap-2" disabled={!selectedUserId}>
            <Shield className="h-4 w-4" />
            Đảng viên
          </TabsTrigger>
          <TabsTrigger value="insurance" className="gap-2" disabled={!selectedUserId}>
            <Heart className="h-4 w-4" />
            BHXH/BHYT
          </TabsTrigger>
          <TabsTrigger value="family" className="gap-2" disabled={!selectedUserId}>
            <Users2 className="h-4 w-4" />
            Gia đình
          </TabsTrigger>
        </TabsList>

        {/* Users List Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách Cán bộ</CardTitle>
                  <CardDescription>Chọn cán bộ để xem chi tiết hồ sơ</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Tìm theo tên, email..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchUsers}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Cấp bậc</TableHead>
                    <TableHead>Chức vụ</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Không tìm thấy cán bộ
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer hover:bg-slate-50/60 transition-colors dark:hover:bg-gray-800"
                        onClick={() => handleSelectUser(user.id)}
                      >
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{user.rank || '-'}</TableCell>
                        <TableCell>{user.position || '-'}</TableCell>
                        <TableCell>{user.unit?.name || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-1" />
                            Xem hồ sơ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Hiển thị {users.length} / {pagination.total} cán bộ
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">Trang {pagination.page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Career History Tab */}
        <TabsContent value="career" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quá trình Công tác</CardTitle>
                  <CardDescription>Lịch sử bổ nhiệm, điều động, thăng cấp</CardDescription>
                </div>
                <Button onClick={() => { setEditingCareer(null); setCareerFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại sự kiện</TableHead>
                    <TableHead>Nội dung</TableHead>
                    <TableHead>Số QĐ</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : careerHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Chưa có dữ liệu quá trình công tác
                      </TableCell>
                    </TableRow>
                  ) : (
                    careerHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(new Date(item.eventDate), 'dd/MM/yyyy', { locale: vi })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CareerEventTypeLabels[item.eventType] || item.eventType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.newPosition || item.newRank || item.newUnit || item.notes || '-'}
                        </TableCell>
                        <TableCell>{item.decisionNumber || '-'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingCareer(item);
                                  setCareerFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingItem({ type: 'career', id: item.id });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Party Member Tab */}
        <TabsContent value="party" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    Hồ sơ Đảng viên
                  </CardTitle>
                  <CardDescription>Thông tin đảng viên và hoạt động Đảng</CardDescription>
                </div>
                {!partyMember && (
                  <Button onClick={() => setPartyFormOpen(true)} className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm hồ sơ
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-red-500" />
                </div>
              ) : partyMember ? (
                <div className="space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-lg ${partyMember.status === 'ACTIVE' ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={partyMember.status === 'ACTIVE' ? 'default' : 'secondary'} className={partyMember.status === 'ACTIVE' ? 'bg-green-600' : ''}>
                          {PartyMemberStatusLabels?.[partyMember.status] || partyMember.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          Số thẻ: <strong>{partyMember.partyCardNumber || 'Chưa cập nhật'}</strong>
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPartyFormOpen(true)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => {
                          setDeletingItem({ type: 'party', id: partyMember.id });
                          setDeleteDialogOpen(true);
                        }}>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Party Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày vào Đảng</p>
                      <p className="font-medium mt-1">
                        {partyMember.joinDate ? format(new Date(partyMember.joinDate), 'dd/MM/yyyy') : '---'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày chính thức</p>
                      <p className="font-medium mt-1">
                        {partyMember.officialDate ? format(new Date(partyMember.officialDate), 'dd/MM/yyyy') : '---'}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Chi bộ</p>
                      <p className="font-medium mt-1">{partyMember.partyCell || '---'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Đảng ủy</p>
                      <p className="font-medium mt-1">{partyMember.partyCommittee || '---'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Người giới thiệu 1</p>
                      <p className="font-medium mt-1">{partyMember.recommender1 || '---'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Người giới thiệu 2</p>
                      <p className="font-medium mt-1">{partyMember.recommender2 || '---'}</p>
                    </div>
                  </div>

                  {partyMember.statusChangeReason && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <p className="text-xs text-orange-600 uppercase tracking-wide">Lý do thay đổi trạng thái</p>
                      <p className="mt-1">{partyMember.statusChangeReason}</p>
                      {partyMember.statusChangeDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Ngày thay đổi: {format(new Date(partyMember.statusChangeDate), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Chưa có hồ sơ Đảng viên</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm hồ sơ&quot; để tạo mới</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-600" />
                    Thông tin BHXH/BHYT
                  </CardTitle>
                  <CardDescription>Bảo hiểm xã hội và bảo hiểm y tế</CardDescription>
                </div>
                {!insuranceInfo && (
                  <Button onClick={() => setInsuranceFormOpen(true)} className="bg-pink-600 hover:bg-pink-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm thông tin
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-500" />
                </div>
              ) : insuranceInfo ? (
                <div className="space-y-6">
                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setInsuranceFormOpen(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => {
                      setDeletingItem({ type: 'insurance', id: insuranceInfo.id });
                      setDeleteDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>

                  {/* BHXH Section */}
                  <div className="border rounded-lg p-4 bg-blue-50/50">
                    <h4 className="font-medium mb-4 text-blue-700 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Bảo hiểm Xã hội (BHXH)
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Số sổ BHXH</p>
                        <p className="font-medium mt-1">{insuranceInfo.insuranceNumber || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày tham gia</p>
                        <p className="font-medium mt-1">
                          {insuranceInfo.insuranceStartDate ? format(new Date(insuranceInfo.insuranceStartDate), 'dd/MM/yyyy') : '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày kết thúc</p>
                        <p className="font-medium mt-1">
                          {insuranceInfo.insuranceEndDate ? format(new Date(insuranceInfo.insuranceEndDate), 'dd/MM/yyyy') : '---'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BHYT Section */}
                  <div className="border rounded-lg p-4 bg-green-50/50">
                    <h4 className="font-medium mb-4 text-green-700 flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Bảo hiểm Y tế (BHYT)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Số thẻ BHYT</p>
                        <p className="font-medium mt-1">{insuranceInfo.healthInsuranceNumber || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Nơi KCB ban đầu</p>
                        <p className="font-medium mt-1">{insuranceInfo.healthInsuranceHospital || '---'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày bắt đầu</p>
                        <p className="font-medium mt-1">
                          {insuranceInfo.healthInsuranceStartDate ? format(new Date(insuranceInfo.healthInsuranceStartDate), 'dd/MM/yyyy') : '---'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Ngày hết hạn</p>
                        <p className="font-medium mt-1">
                          {insuranceInfo.healthInsuranceEndDate ? format(new Date(insuranceInfo.healthInsuranceEndDate), 'dd/MM/yyyy') : '---'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Beneficiary Section */}
                  {(insuranceInfo.beneficiaryName || insuranceInfo.beneficiaryRelation || insuranceInfo.beneficiaryPhone) && (
                    <div className="border rounded-lg p-4 bg-orange-50/50">
                      <h4 className="font-medium mb-4 text-orange-700">Người thụ hưởng</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Họ tên</p>
                          <p className="font-medium mt-1">{insuranceInfo.beneficiaryName || '---'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Quan hệ</p>
                          <p className="font-medium mt-1">{insuranceInfo.beneficiaryRelation || '---'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Số điện thoại</p>
                          <p className="font-medium mt-1">{insuranceInfo.beneficiaryPhone || '---'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {insuranceInfo.notes && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Ghi chú</p>
                      <p className="mt-1">{insuranceInfo.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Heart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Chưa có thông tin BHXH/BHYT</p>
                  <p className="text-sm mt-1">Nhấn &quot;Thêm thông tin&quot; để tạo mới</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Family Tab */}
        <TabsContent value="family" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quan hệ Gia đình</CardTitle>
                  <CardDescription>Thông tin thân nhân của cán bộ</CardDescription>
                </div>
                <Button onClick={() => { setEditingFamily(null); setFamilyFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm thân nhân
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quan hệ</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Năm sinh</TableHead>
                    <TableHead>Nghề nghiệp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : familyMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Chưa có thông tin thân nhân
                      </TableCell>
                    </TableRow>
                  ) : (
                    familyMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {FamilyRelationTypeLabels[member.relation] || member.relation}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{member.fullName}</TableCell>
                        <TableCell>
                          {member.dateOfBirth 
                            ? format(new Date(member.dateOfBirth), 'yyyy')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{member.occupation || '-'}</TableCell>
                        <TableCell>
                          {member.isDeceased ? (
                            <Badge variant="secondary">Đã mất</Badge>
                          ) : (
                            <Badge variant="default" className="bg-green-500">Còn sống</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingFamily(member);
                                  setFamilyFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setDeletingItem({ type: 'family', id: member.id });
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Career History Form */}
      {selectedUserId && (
        <CareerHistoryForm
          open={careerFormOpen}
          onOpenChange={setCareerFormOpen}
          userId={selectedUserId}
          initialData={editingCareer}
          onSuccess={fetchCareerHistory}
        />
      )}

      {/* Family Form */}
      {selectedUserId && (
        <FamilyForm
          open={familyFormOpen}
          onOpenChange={setFamilyFormOpen}
          userId={selectedUserId}
          initialData={editingFamily}
          onSuccess={fetchFamilyMembers}
        />
      )}

      {/* Party Member Form */}
      {selectedUserId && (
        <PartyMemberForm
          open={partyFormOpen}
          onOpenChange={setPartyFormOpen}
          userId={selectedUserId}
          initialData={partyMember}
          onSuccess={fetchPartyMember}
        />
      )}

      {/* Insurance Form */}
      {selectedUserId && (
        <InsuranceForm
          open={insuranceFormOpen}
          onOpenChange={setInsuranceFormOpen}
          userId={selectedUserId}
          initialData={insuranceInfo}
          onSuccess={fetchInsuranceInfo}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bản ghi này? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
