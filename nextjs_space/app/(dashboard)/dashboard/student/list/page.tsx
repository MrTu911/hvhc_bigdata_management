'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Mail,
  Phone,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Student {
  id: string;
  maHocVien: string;
  hoTen: string;
  ngaySinh?: string;
  gioiTinh?: string;
  lop?: string;
  khoaHoc?: string;
  nganh?: string;
  cohortId?: string;
  classId?: string;
  majorId?: string;
  email?: string;
  dienThoai?: string;
  diemTrungBinh: number;
  trangThai: string;
  giangVienHuongDan?: {
    user: {
      name: string;
      email: string;
    };
  };
  cohort?: {
    id: string;
    code: string;
    name: string;
  };
  studentClass?: {
    id: string;
    code: string;
    name: string;
  };
  major?: {
    id: string;
    code: string;
    name: string;
  };
  _count: {
    ketQuaHocTap: number;
  };
  createdAt: string;
}

interface Faculty {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
}

interface Cohort {
  id: string;
  code: string;
  name: string;
  startYear: number;
}

interface StudentClass {
  id: string;
  code: string;
  name: string;
  cohortId: string;
}

interface Specialization {
  id: string;
  code: string;
  name: string;
  level?: number;
  parentId?: string | null;
}

export default function StudentListPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [studentClasses, setStudentClasses] = useState<StudentClass[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [khoaHoc, setKhoaHoc] = useState('');
  const [lop, setLop] = useState('');
  const [nganh, setNganh] = useState('');
  const [trangThai, setTrangThai] = useState('');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form data with FK fields
  const [formData, setFormData] = useState({
    maHocVien: '',
    hoTen: '',
    ngaySinh: '',
    gioiTinh: '',
    lop: '',
    khoaHoc: '',
    nganh: '',
    cohortId: '',
    classId: '',
    majorId: '',
    giangVienHuongDanId: '',
    email: '',
    dienThoai: '',
    diaChi: '',
    trangThai: 'Đang học',
  });

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(khoaHoc && { khoaHoc }),
        ...(lop && { lop }),
        ...(nganh && { nganh }),
        ...(trangThai && { trangThai }),
      });

      const res = await fetch(`/api/student?${params}`);
      const data = await res.json();

      if (res.ok) {
        setStudents(data.students);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải danh sách học viên',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch faculties
  const fetchFaculties = async () => {
    try {
      const res = await fetch('/api/faculty/list?limit=1000');
      const data = await res.json();
      if (res.ok) {
        setFaculties(data.faculties || []);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  // Fetch master data (cohorts, classes, specializations)
  const fetchMasterData = async () => {
    try {
      // Fetch cohorts
      const cohortsRes = await fetch('/api/master-data/cohorts');
      if (cohortsRes.ok) {
        const cohortsData = await cohortsRes.json();
        setCohorts(cohortsData.data || []);
      }
      
      // Fetch student classes
      const classesRes = await fetch('/api/master-data/student-classes');
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setStudentClasses(classesData.data || []);
      }
      
      // Fetch specializations (majors)
      const specsRes = await fetch('/api/master-data/specializations');
      if (specsRes.ok) {
        const specsData = await specsRes.json();
        setSpecializations(specsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, khoaHoc, lop, nganh, trangThai]);

  useEffect(() => {
    fetchFaculties();
    fetchMasterData();
  }, []);

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        maHocVien: student.maHocVien,
        hoTen: student.hoTen,
        ngaySinh: student.ngaySinh ? student.ngaySinh.split('T')[0] : '',
        gioiTinh: student.gioiTinh || '',
        lop: student.lop || '',
        khoaHoc: student.khoaHoc || '',
        nganh: student.nganh || '',
        cohortId: student.cohortId || '',
        classId: student.classId || '',
        majorId: student.majorId || '',
        giangVienHuongDanId: student.giangVienHuongDan?.user ? '' : '',
        email: student.email || '',
        dienThoai: student.dienThoai || '',
        diaChi: '',
        trangThai: student.trangThai,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        maHocVien: '',
        hoTen: '',
        ngaySinh: '',
        gioiTinh: '',
        lop: '',
        khoaHoc: '',
        nganh: '',
        cohortId: '',
        classId: '',
        majorId: '',
        giangVienHuongDanId: '',
        email: '',
        dienThoai: '',
        diaChi: '',
        trangThai: 'Đang học',
      });
    }
    setIsDialogOpen(true);
  };
  
  // Filter classes by selected cohort
  const filteredClasses = formData.cohortId
    ? studentClasses.filter(c => c.cohortId === formData.cohortId)
    : studentClasses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingStudent ? `/api/student/${editingStudent.id}` : '/api/student';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: editingStudent
            ? 'Cập nhật học viên thành công'
            : 'Thêm học viên thành công',
        });
        setIsDialogOpen(false);
        fetchStudents();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể lưu học viên',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học viên này?')) return;

    try {
      const res = await fetch(`/api/student/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Xóa học viên thành công',
        });
        fetchStudents();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể xóa học viên',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'xlsx' | 'csv') => {
    try {
      const params = new URLSearchParams({
        format,
        ...(khoaHoc && { khoaHoc }),
        ...(lop && { lop }),
        ...(nganh && { nganh }),
        ...(trangThai && { trangThai }),
      });

      const res = await fetch(`/api/student/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${Date.now()}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Thành công',
          description: `Xuất file ${format.toUpperCase()} thành công`,
        });
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể xuất file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể xuất file',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setKhoaHoc('');
    setLop('');
    setNganh('');
    setTrangThai('');
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang học':
        return 'bg-blue-100 text-blue-800';
      case 'Tốt nghiệp':
        return 'bg-green-100 text-green-800';
      case 'Bảo lưu':
        return 'bg-yellow-100 text-yellow-800';
      case 'Thôi học':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 9) return 'text-green-600 font-semibold';
    if (gpa >= 8) return 'text-blue-600 font-semibold';
    if (gpa >= 7) return 'text-yellow-600';
    if (gpa >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Danh sách Học viên</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin học viên, kết quả học tập
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('xlsx')} variant="outline">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm học viên
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng số học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>Lọc danh sách học viên theo tiêu chí</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select value={khoaHoc} onValueChange={(v) => { setKhoaHoc(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Khóa học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tất cả</SelectItem>
                <SelectItem value="K60">K60</SelectItem>
                <SelectItem value="K61">K61</SelectItem>
                <SelectItem value="K62">K62</SelectItem>
                <SelectItem value="K63">K63</SelectItem>
                <SelectItem value="K64">K64</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Lớp"
              value={lop}
              onChange={(e) => { setLop(e.target.value); setPage(1); }}
            />
            <Input
              placeholder="Ngành"
              value={nganh}
              onChange={(e) => { setNganh(e.target.value); setPage(1); }}
            />
            <Select value={trangThai} onValueChange={(v) => { setTrangThai(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">Tất cả</SelectItem>
                <SelectItem value="Đang học">Đang học</SelectItem>
                <SelectItem value="Tốt nghiệp">Tốt nghiệp</SelectItem>
                <SelectItem value="Bảo lưu">Bảo lưu</SelectItem>
                <SelectItem value="Thôi học">Thôi học</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(search || khoaHoc || lop || nganh || trangThai) && (
            <div className="mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-8">Tải dữ liệu...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy học viên nào
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/dashboard/student/${student.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{student.hoTen}</h3>
                          <Badge variant="outline">{student.maHocVien}</Badge>
                          <Badge className={getStatusColor(student.trangThai)}>
                            {student.trangThai}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>{student.lop || 'Chưa có lớp'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{student.khoaHoc || 'Chưa có'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{student.email || 'Chưa có email'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{student.dienThoai || 'Chưa có sĐT'}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Ngành: </span>
                            <span className="font-medium">{student.nganh || 'Chưa có'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Điểm TB: </span>
                            <span className={getGPAColor(student.diemTrungBinh)}>
                              {student.diemTrungBinh.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Số môn: </span>
                            <span className="font-medium">{student._count.ketQuaHocTap}</span>
                          </div>
                          {student.giangVienHuongDan && (
                            <div>
                              <span className="text-muted-foreground">GVHD: </span>
                              <span className="font-medium">
                                {student.giangVienHuongDan.user.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Hiển thị {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} trong tổng số {total} học viên
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Chỉnh sửa học viên' : 'Thêm học viên mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập đầy đủ thông tin học viên
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maHocVien">Mã học viên *</Label>
                  <Input
                    id="maHocVien"
                    value={formData.maHocVien}
                    onChange={(e) => setFormData({ ...formData, maHocVien: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoTen">Họ tên *</Label>
                  <Input
                    id="hoTen"
                    value={formData.hoTen}
                    onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ngaySinh">Ngày sinh</Label>
                  <Input
                    id="ngaySinh"
                    type="date"
                    value={formData.ngaySinh}
                    onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gioiTinh">Giới tính</Label>
                  <Select
                    value={formData.gioiTinh}
                    onValueChange={(v) => setFormData({ ...formData, gioiTinh: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nam">Nam</SelectItem>
                      <SelectItem value="Nữ">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cohortId">Khóa học *</Label>
                  <Select
                    value={formData.cohortId}
                    onValueChange={(v) => {
                      setFormData({ ...formData, cohortId: v, classId: '' }); // Reset class when cohort changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khóa học" />
                    </SelectTrigger>
                    <SelectContent>
                      {cohorts.map((cohort) => (
                        <SelectItem key={cohort.id} value={cohort.id}>
                          {cohort.code} - {cohort.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classId">Lớp</Label>
                  <Select
                    value={formData.classId}
                    onValueChange={(v) => setFormData({ ...formData, classId: v })}
                    disabled={!formData.cohortId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.cohortId ? "Chọn lớp" : "Chọn khóa trước"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.code} - {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="majorId">Ngành/Chuyên ngành</Label>
                  <Select
                    value={formData.majorId}
                    onValueChange={(v) => setFormData({ ...formData, majorId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngành" />
                    </SelectTrigger>
                    <SelectContent>
                      {specializations.filter(s => !s.parentId || s.level === 1).map((parent) => (
                        <div key={parent.id}>
                          <SelectItem value={parent.id} className="font-semibold text-primary">
                            {parent.name}
                          </SelectItem>
                          {specializations.filter(s => s.parentId === parent.id).map((child) => (
                            <SelectItem key={child.id} value={child.id} className="pl-6">
                              ↳ {child.name}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="giangVienHuongDanId">Giảng viên hướng dẫn</Label>
                <Select
                  value={formData.giangVienHuongDanId}
                  onValueChange={(v) => setFormData({ ...formData, giangVienHuongDanId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giảng viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Không có</SelectItem>
                    {faculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.user.name} ({faculty.user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dienThoai">Điện thoại</Label>
                  <Input
                    id="dienThoai"
                    value={formData.dienThoai}
                    onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diaChi">Địa chỉ</Label>
                <Input
                  id="diaChi"
                  value={formData.diaChi}
                  onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trangThai">Trạng thái</Label>
                <Select
                  value={formData.trangThai}
                  onValueChange={(v) => setFormData({ ...formData, trangThai: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Đang học">Đang học</SelectItem>
                    <SelectItem value="Tốt nghiệp">Tốt nghiệp</SelectItem>
                    <SelectItem value="Bảo lưu">Bảo lưu</SelectItem>
                    <SelectItem value="Thôi học">Thôi học</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">
                {editingStudent ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
