'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLanguage } from '@/components/providers/language-provider';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  UserCheck,
  TrendingUp,
  Mail,
  Phone,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  maHocVien: string;
  hoTen: string;
  lop: string | null;
  khoaHoc: string | null;
  nganh: string | null;
  email: string | null;
  dienThoai: string | null;
  trangThai: string;
  avgGrade: number | null;
  totalSubjects: number;
  giangVienHuongDan: {
    id: string;
    user: { name: string; email: string };
  } | null;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
  academicDegree: string | null;
  academicRank: string | null;
}

export default function StudentGuidancePage() {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [filters, setFilters] = useState<{ classes: string[]; courses: string[] }>({ classes: [], courses: [] });
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search, selectedClass, selectedCourse]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedClass) params.append('lop', selectedClass);
      if (selectedCourse) params.append('khoaHoc', selectedCourse);

      const res = await fetch(`/api/faculty/student-guidance?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students);
        setFilters(data.filters);
        setFacultyList(data.facultyList);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedStudent) return;

    try {
      const res = await fetch('/api/faculty/student-guidance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          facultyId: selectedFaculty || null
        })
      });

      if (res.ok) {
        toast.success('Cập nhật thành công!');
        setDialogOpen(false);
        fetchData();
      } else {
        toast.error('Lỗi khi cập nhật');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    if (grade >= 8.5) return 'bg-green-100 text-green-700';
    if (grade >= 7.0) return 'bg-blue-100 text-blue-700';
    if (grade >= 5.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const stats = {
    total: students.length,
    withAdvisor: students.filter(s => s.giangVienHuongDan).length,
    withoutAdvisor: students.filter(s => !s.giangVienHuongDan).length,
    avgGrade: students.filter(s => s.avgGrade).length > 0
      ? (students.reduce((sum, s) => sum + (s.avgGrade || 0), 0) / students.filter(s => s.avgGrade).length).toFixed(2)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
          Hướng dẫn Học viên
        </h1>
        <p className="text-muted-foreground mt-1">
          Quản lý phân công giảng viên hướng dẫn học viên
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng HV</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã có GVHD</p>
                <p className="text-2xl font-bold text-green-600">{stats.withAdvisor}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chưa có GVHD</p>
                <p className="text-2xl font-bold text-orange-600">{stats.withoutAdvisor}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Điểm TB</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgGrade}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã HV, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedClass || '__ALL__'} onValueChange={(v) => setSelectedClass(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả lớp</SelectItem>
                {filters.classes.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCourse || '__ALL__'} onValueChange={(v) => setSelectedCourse(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo khóa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả khóa</SelectItem>
                {filters.courses.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map(student => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{student.hoTen}</h3>
                  <p className="text-sm text-muted-foreground">{student.maHocVien}</p>
                </div>
                <Badge className={getGradeColor(student.avgGrade)}>
                  {student.avgGrade ? student.avgGrade.toFixed(2) : 'N/A'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span>{student.lop || 'Chưa xác định'}</span>
                  {student.khoaHoc && <Badge variant="outline">{student.khoaHoc}</Badge>}
                </div>
                {student.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{student.email}</span>
                  </div>
                )}
                {student.dienThoai && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.dienThoai}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">GV Hướng dẫn</p>
                    <p className="font-medium text-sm">
                      {student.giangVienHuongDan?.user.name || (
                        <span className="text-orange-600">Chưa phân công</span>
                      )}
                    </p>
                  </div>
                  <Dialog open={dialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (open) {
                      setSelectedStudent(student);
                      setSelectedFaculty(student.giangVienHuongDan?.id || '');
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-1" />
                        Phân công
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Phân công GV hướng dẫn</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Học viên</p>
                          <p className="font-semibold">{selectedStudent?.hoTen}</p>
                          <p className="text-sm text-muted-foreground">{selectedStudent?.maHocVien}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Chọn Giảng viên hướng dẫn</p>
                          <Select value={selectedFaculty || '__NONE__'} onValueChange={(v) => setSelectedFaculty(v === '__NONE__' ? '' : v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn giảng viên" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__NONE__">Không phân công</SelectItem>
                              {facultyList.map(f => (
                                <SelectItem key={f.id} value={f.id}>
                                  {f.name} {f.academicDegree && `(${f.academicDegree})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAssignFaculty} className="w-full">
                          Xác nhận
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Không tìm thấy học viên nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
