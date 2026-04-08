'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/components/providers/language-provider';
import { Plus, Search, Edit, Trash2, Calendar, Clock, Users, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ExamPlan {
  id: string;
  code: string;
  name: string;
  termId: string;
  examType: string;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
  description?: string;
  rules?: string;
  status: string;
  isPublished: boolean;
  term?: {
    name: string;
    academicYear?: { name: string };
  };
  examSessions?: { id: string; status: string }[];
}

interface Term {
  id: string;
  code: string;
  name: string;
  academicYear?: { name: string };
}

const examTypes = [
  { value: 'MIDTERM', label: 'Giữa kỳ' },
  { value: 'FINAL', label: 'Cuối kỳ' },
  { value: 'SUPPLEMENTARY', label: 'Thi lại/phụ' },
  { value: 'MAKEUP', label: 'Thi bù' },
  { value: 'ENTRANCE', label: 'Tuyển sinh' },
  { value: 'GRADUATION', label: 'Tốt nghiệp' }
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  ONGOING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Nháp',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PUBLISHED: 'Đã công bố',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy bỏ'
};

export default function ExamPlanPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [examPlans, setExamPlans] = useState<ExamPlan[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ExamPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    termId: '',
    examType: 'FINAL',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    description: '',
    rules: ''
  });

  useEffect(() => {
    fetchExamPlans();
    fetchTerms();
  }, [filterStatus, filterType]);

  const fetchExamPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('examType', filterType);

      const res = await fetch(`/api/education/exam-plan?${params}`);
      const data = await res.json();
      if (data.data) setExamPlans(data.data);
    } catch (error) {
      console.error('Error fetching exam plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/education/terms');
      const data = await res.json();
      if (data.data) setTerms(data.data);
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/education/exam-plan';
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { id: editingPlan.id, ...formData } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setDialogOpen(false);
        resetForm();
        fetchExamPlans();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu kế hoạch thi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch thi này?')) return;
    try {
      const res = await fetch(`/api/education/exam-plan?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        fetchExamPlans();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa kế hoạch thi', variant: 'destructive' });
    }
  };

  const openEditDialog = (plan: ExamPlan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      name: plan.name,
      termId: plan.termId,
      examType: plan.examType,
      startDate: plan.startDate.split('T')[0],
      endDate: plan.endDate.split('T')[0],
      registrationDeadline: plan.registrationDeadline?.split('T')[0] || '',
      description: plan.description || '',
      rules: plan.rules || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      code: '',
      name: '',
      termId: '',
      examType: 'FINAL',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      description: '',
      rules: ''
    });
  };

  const filteredPlans = examPlans.filter(plan =>
    plan.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    total: examPlans.length,
    draft: examPlans.filter(p => p.status === 'DRAFT').length,
    published: examPlans.filter(p => p.status === 'PUBLISHED').length,
    ongoing: examPlans.filter(p => p.status === 'ONGOING').length,
    totalSessions: examPlans.reduce((sum, p) => sum + (p.examSessions?.length || 0), 0)
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Kế hoạch thi</h1>
          <p className="text-muted-foreground">Khảo thí & Đảm bảo chất lượng</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Tạo kế hoạch mới</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Chỉnh sửa kế hoạch thi' : 'Tạo kế hoạch thi mới'}</DialogTitle>
              <DialogDescription>Nhập thông tin kế hoạch thi</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Mã kế hoạch *</Label>
                  <Input id="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="VD: KHT-HK1-2025" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Tên kế hoạch *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termId">Học kỳ *</Label>
                  <Select value={formData.termId} onValueChange={(v) => setFormData({ ...formData, termId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                    <SelectContent>
                      {terms.map(term => (
                        <SelectItem key={term.id} value={term.id}>{term.name} - {term.academicYear?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="examType">Loại thi</Label>
                  <Select value={formData.examType} onValueChange={(v) => setFormData({ ...formData, examType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {examTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                  <Input type="date" id="startDate" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Ngày kết thúc *</Label>
                  <Input type="date" id="endDate" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="registrationDeadline">Hạn đăng ký thi</Label>
                  <Input type="date" id="registrationDeadline" value={formData.registrationDeadline} onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rules">Quy định thi</Label>
                <Textarea id="rules" value={formData.rules} onChange={(e) => setFormData({ ...formData, rules: e.target.value })} rows={3} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
                <Button type="submit">{editingPlan ? 'Cập nhật' : 'Tạo mới'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng kế hoạch</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nháp</CardTitle>
            <Edit className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã công bố</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang diễn ra</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ongoing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng ca thi</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Tìm kiếm theo mã hoặc tên..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại thi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {examTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Tên kế hoạch</TableHead>
                <TableHead>Học kỳ</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Ca thi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : filteredPlans.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Không có kế hoạch thi nào</TableCell></TableRow>
              ) : (
                filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.code}</TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.term?.name}</TableCell>
                    <TableCell>{examTypes.find(t => t.value === plan.examType)?.label}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(plan.startDate), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(plan.endDate), 'dd/MM/yyyy', { locale: vi })}
                    </TableCell>
                    <TableCell>{plan.examSessions?.length || 0}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[plan.status]}>{statusLabels[plan.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(plan)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
