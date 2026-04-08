/**
 * Policy Requests List Page
 * Danh sách yêu cầu chính sách
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  FileText, Plus, Search, MoreHorizontal, Eye, Edit, Trash2,
  CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';

interface PolicyRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  priority: string;
  requestedAmount: number;
  createdAt: string;
  category: { id: string; name: string };
  requester: { id: string; name: string };
}

interface Category { id: string; name: string; }

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-800' },
  SUBMITTED: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800' },
  UNDER_REVIEW: { label: 'Đang xét duyệt', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Hủy', color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Trung bình', color: 'bg-blue-100 text-blue-600' },
  HIGH: { label: 'Cao', color: 'bg-orange-100 text-orange-600' },
  URGENT: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-600' },
};

export default function PolicyRequestsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [requests, setRequests] = useState<PolicyRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchRequests(); }, [page, statusFilter, categoryFilter]);

  async function fetchCategories() {
    try {
      const res = await fetch('/api/policy/categories');
      if (res.ok) { const data = await res.json(); setCategories(data.data || []); }
    } catch (error) { console.error(error); }
  }

  async function fetchRequests() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      const res = await fetch(`/api/policy/requests?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Xóa yêu cầu này?')) return;
    const res = await fetch(`/api/policy/requests/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Xóa thành công'); fetchRequests(); }
    else { const d = await res.json(); toast.error(d.error); }
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
  const formatDate = (s: string) => new Date(s).toLocaleDateString('vi-VN');
  const filteredRequests = requests.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()));

  if (status === 'loading') return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Danh sách Yêu cầu Chính sách"
        description="Quản lý và theo dõi các yêu cầu chính sách"
        icon={<FileText className="h-6 w-6" />}
        actions={<Button onClick={() => router.push('/dashboard/policy/requests/new')}><Plus className="h-4 w-4 mr-2" />Tạo yêu cầu</Button>}
      />

      <Card><CardContent className="pt-6"><div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem>{Object.entries(statusConfig).map(([k, { label }]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}</SelectContent></Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder="Danh mục" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả</SelectItem>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
      </div></CardContent></Card>

      <Card><CardContent className="p-0">
        {loading ? <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>
        : filteredRequests.length === 0 ? <EmptyState title="Chưa có yêu cầu" description="Tạo yêu cầu mới" action={{ label: 'Tạo', onClick: () => router.push('/dashboard/policy/requests/new') }} />
        : <Table><TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Tiêu đề</TableHead><TableHead>Danh mục</TableHead><TableHead>Số tiền</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ưu tiên</TableHead><TableHead>Ngày</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>{filteredRequests.map(r => {
            const st = statusConfig[r.status] || statusConfig.DRAFT;
            const pr = priorityConfig[r.priority] || priorityConfig.MEDIUM;
            return <TableRow key={r.id}><TableCell className="font-mono text-sm">{r.requestNumber}</TableCell><TableCell><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.requester?.name}</p></TableCell><TableCell>{r.category?.name}</TableCell><TableCell className="font-medium">{formatCurrency(r.requestedAmount || 0)}</TableCell><TableCell><Badge className={st.color}>{st.label}</Badge></TableCell><TableCell><Badge className={pr.color}>{pr.label}</Badge></TableCell><TableCell>{formatDate(r.createdAt)}</TableCell>
              <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/dashboard/policy/requests/${r.id}`)}><Eye className="h-4 w-4 mr-2" />Xem</DropdownMenuItem>
                {r.status === 'DRAFT' && <><DropdownMenuItem onClick={() => router.push(`/dashboard/policy/requests/${r.id}/edit`)}><Edit className="h-4 w-4 mr-2" />Sửa</DropdownMenuItem><DropdownMenuItem className="text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4 mr-2" />Xóa</DropdownMenuItem></>}
              </DropdownMenuContent></DropdownMenu></TableCell></TableRow>;
          })}</TableBody></Table>}
      </CardContent></Card>

      {totalPages > 1 && <div className="flex items-center justify-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</Button><span className="text-sm">Trang {page}/{totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button></div>}
    </div>
  );
}
