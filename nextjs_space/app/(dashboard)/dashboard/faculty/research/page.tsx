'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, FlaskConical, Plus, Edit, Trash2, Search, TrendingUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { toast } from 'sonner';

interface ResearchProject {
  id: string;
  facultyId: string;
  projectName: string;
  projectCode?: string;
  field?: string;
  level?: string;
  fundingAmount: number;
  startYear?: string;
  endYear?: string;
  status: string;
  workflowStatus: string;
  description?: string;
  outcomes?: string;
  publications: number;
  nckhProjectId?: string | null;  // Liên kết với NckhProject chính thức
  createdAt: string;
  updatedAt: string;
}

interface FacultyProfile {
  id: string;
  user: {
    name: string;
    email: string;
  };
  department?: {
    name: string;
  };
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang xét duyệt',
  PENDING_REVIEW: 'Chờ xét duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

const WORKFLOW_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  PENDING_REVIEW: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export default function ResearchProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [nckhFilter, setNckhFilter] = useState<'all' | 'official' | 'self'>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    projectCode: '',
    field: '',
    level: '',
    fundingAmount: 0,
    startYear: '',
    endYear: '',
    status: 'Đang thực hiện',
    description: '',
    outcomes: '',
    publications: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    try {
      const profileRes = await fetch('/api/faculty/profile');
      if (!profileRes.ok) throw new Error('Failed to load profile');
      const profileData = await profileRes.json();
      setFacultyProfile(profileData.profile);
      if (profileData.profile?.id) {
        await loadProjects(profileData.profile.id, 1);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error('Không thể tải hồ sơ giảng viên');
      setLoading(false);
    }
  };

  const loadProjects = async (facultyId: string, page: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/faculty/research?facultyId=${facultyId}&page=${page}&pageSize=20`);
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data.projects || []);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      toast.error('Không thể tải danh sách đề tài');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!facultyProfile?.id) return;
    loadProjects(facultyProfile.id, newPage);
  };

  const handleOpenDialog = (project?: ResearchProject) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        projectName: project.projectName,
        projectCode: project.projectCode || '',
        field: project.field || '',
        level: project.level || '',
        fundingAmount: project.fundingAmount,
        startYear: project.startYear || '',
        endYear: project.endYear || '',
        status: project.status,
        description: project.description || '',
        outcomes: project.outcomes || '',
        publications: project.publications
      });
    } else {
      setEditingProject(null);
      setFormData({
        projectName: '',
        projectCode: '',
        field: '',
        level: '',
        fundingAmount: 0,
        startYear: new Date().getFullYear().toString(),
        endYear: '',
        status: 'Đang thực hiện',
        description: '',
        outcomes: '',
        publications: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facultyProfile?.id) {
      toast.error('Không tìm thấy hồ sơ giảng viên');
      return;
    }

    setSubmitting(true);
    try {
      const url = '/api/faculty/research';
      const method = editingProject ? 'PUT' : 'POST';
      const payload = editingProject
        ? { id: editingProject.id, ...formData }
        : { facultyId: facultyProfile.id, ...formData };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save project');
      }

      toast.success(editingProject ? 'Cập nhật đề tài thành công' : 'Thêm đề tài thành công');
      handleCloseDialog();
      await loadProjects(facultyProfile.id, pagination.page);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi lưu đề tài');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đề tài này?')) return;

    try {
      const res = await fetch(`/api/faculty/research?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete project');
      }
      toast.success('Đã xóa đề tài');
      if (facultyProfile?.id) await loadProjects(facultyProfile.id, pagination.page);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa đề tài');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.projectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.field?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = selectedLevel === 'all' || project.level === selectedLevel;
    const matchStatus = selectedStatus === 'all' || project.status === selectedStatus;
    const matchNckh = nckhFilter === 'all'
      || (nckhFilter === 'official' && !!project.nckhProjectId)
      || (nckhFilter === 'self' && !project.nckhProjectId);
    return matchSearch && matchLevel && matchStatus && matchNckh;
  });

  const levels = Array.from(new Set(projects.map(p => p.level).filter(Boolean)));
  const statuses = Array.from(new Set(projects.map(p => p.status).filter(Boolean)));

  const totalFunding = projects.reduce((sum, p) => sum + p.fundingAmount, 0);
  const totalPublications = projects.reduce((sum, p) => sum + p.publications, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hoàn thành': return 'bg-green-100 text-green-800';
      case 'Đang thực hiện': return 'bg-blue-100 text-blue-800';
      case 'Tạm dừng': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            Quản lý Đề tài Nghiên cứu
          </h1>
          <p className="text-muted-foreground mt-1">
            {facultyProfile?.user?.name} — Tổng số: {pagination.total} đề tài
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm đề tài
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng kinh phí (trang này)</CardDescription>
            <CardTitle className="text-2xl">
              {totalFunding.toLocaleString('vi-VN')} VNĐ
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Công bố khoa học (trang này)</CardDescription>
            <CardTitle className="text-2xl">{totalPublications}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Đang thực hiện</CardDescription>
            <CardTitle className="text-2xl">
              {projects.filter(p => p.status === 'Đang thực hiện').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tên đề tài, mã, lĩnh vực..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Cấp quản lý</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger id="level">
                  <SelectValue placeholder="Tất cả cấp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cấp</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level!}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s!}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Filter nguồn gốc */}
          <div className="flex gap-2 pt-2 border-t">
            {([['all', 'Tất cả'], ['official', 'NCKH chính thức'], ['self', 'Tự khai']] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setNckhFilter(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  nckhFilter === v ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.projectName}</CardTitle>
                  <CardDescription>
                    {project.projectCode && (
                      <span className="font-mono text-xs">{project.projectCode}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(project.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                  {project.workflowStatus && project.workflowStatus !== 'DRAFT' && (
                    <Badge className={WORKFLOW_STATUS_COLORS[project.workflowStatus] ?? 'bg-gray-100 text-gray-700'}>
                      {WORKFLOW_STATUS_LABELS[project.workflowStatus] ?? project.workflowStatus}
                    </Badge>
                  )}
                  {project.nckhProjectId && (
                    <a
                      href={`/dashboard/science/projects/${project.nckhProjectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      NCKH chính thức
                    </a>
                  )}
                  {project.level && <Badge variant="outline">{project.level}</Badge>}
                  {project.field && <Badge variant="secondary">{project.field}</Badge>}
                </div>

                {(project.startYear || project.endYear) && (
                  <p className="text-sm text-muted-foreground">
                    Thời gian: {project.startYear} {project.endYear && `- ${project.endYear}`}
                  </p>
                )}

                {project.fundingAmount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">
                      {project.fundingAmount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                )}

                {project.publications > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold">{project.publications}</span> công bố khoa học
                  </p>
                )}

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {pagination.total === 0
                ? 'Chưa có đề tài nghiên cứu nào. Nhấn "Thêm đề tài" để bắt đầu.'
                : 'Không tìm thấy đề tài phù hợp với bộ lọc.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Trang {pagination.page}/{pagination.totalPages} — {pagination.total} đề tài
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Tiếp
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Chỉnh sửa đề tài' : 'Thêm đề tài mới'}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin đề tài nghiên cứu
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="projectName">Tên đề tài *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                  placeholder="Ví dụ: Nghiên cứu ứng dụng AI trong hậu cần quân sự"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectCode">Mã đề tài</Label>
                <Input
                  id="projectCode"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="Ví dụ: NC2024-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="field">Lĩnh vực</Label>
                <Input
                  id="field"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="Ví dụ: Công nghệ thông tin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Cấp quản lý</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Chọn cấp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HVHC">Cấp HVHC</SelectItem>
                    <SelectItem value="BQP">Cấp Bộ Quốc phòng</SelectItem>
                    <SelectItem value="Bộ">Cấp Bộ</SelectItem>
                    <SelectItem value="Nhà nước">Cấp Nhà nước</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingAmount">Kinh phí (VNĐ)</Label>
                <Input
                  id="fundingAmount"
                  type="number"
                  value={formData.fundingAmount}
                  onChange={(e) => setFormData({ ...formData, fundingAmount: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="1000000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startYear">Năm bắt đầu</Label>
                <Input
                  id="startYear"
                  value={formData.startYear}
                  onChange={(e) => setFormData({ ...formData, startYear: e.target.value })}
                  placeholder="2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endYear">Năm kết thúc</Label>
                <Input
                  id="endYear"
                  value={formData.endYear}
                  onChange={(e) => setFormData({ ...formData, endYear: e.target.value })}
                  placeholder="2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đang thực hiện">Đang thực hiện</SelectItem>
                    <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
                    <SelectItem value="Tạm dừng">Tạm dừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publications">Số công bố</Label>
                <Input
                  id="publications"
                  type="number"
                  value={formData.publications}
                  onChange={(e) => setFormData({ ...formData, publications: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả đề tài</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mục tiêu, phạm vi, ý nghĩa của đề tài..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcomes">Kết quả nghiên cứu</Label>
              <textarea
                id="outcomes"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.outcomes}
                onChange={(e) => setFormData({ ...formData, outcomes: e.target.value })}
                placeholder="Các kết quả đạt được, sản phẩm nghiên cứu..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProject ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
