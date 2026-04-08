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
import { Loader2, BookOpen, Plus, Edit, Trash2, Search, GraduationCap } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

interface TeachingSubject {
  id: string;
  facultyId: string;
  subjectName: string;
  subjectCode?: string;
  credits: number;
  semester?: string;
  academicYear?: string;
  department?: string;
  description?: string;
  syllabus?: string;
  studentCount: number;
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

export default function TeachingSubjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<TeachingSubject[]>([]);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<TeachingSubject | null>(null);
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    credits: 0,
    semester: '',
    academicYear: '',
    department: '',
    description: '',
    syllabus: '',
    studentCount: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get faculty profile
      const profileRes = await fetch('/api/faculty/profile');
      if (!profileRes.ok) {
        throw new Error('Failed to load profile');
      }
      const profileData = await profileRes.json();
      setFacultyProfile(profileData.profile);

      // Get teaching subjects
      if (profileData.profile?.id) {
        const subjectsRes = await fetch(`/api/faculty/subjects?facultyId=${profileData.profile.id}`);
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData.subjects || []);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject?: TeachingSubject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode || '',
        credits: subject.credits,
        semester: subject.semester || '',
        academicYear: subject.academicYear || '',
        department: subject.department || '',
        description: subject.description || '',
        syllabus: subject.syllabus || '',
        studentCount: subject.studentCount
      });
    } else {
      setEditingSubject(null);
      setFormData({
        subjectName: '',
        subjectCode: '',
        credits: 0,
        semester: '',
        academicYear: '',
        department: facultyProfile?.department?.name || '',
        description: '',
        syllabus: '',
        studentCount: 0
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!facultyProfile?.id) {
      alert('Không tìm thấy hồ sơ giảng viên');
      return;
    }

    try {
      const url = editingSubject ? '/api/faculty/subjects' : '/api/faculty/subjects';
      const method = editingSubject ? 'PUT' : 'POST';

      const payload = editingSubject
        ? { id: editingSubject.id, ...formData }
        : { facultyId: facultyProfile.id, ...formData };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save subject');
      }

      handleCloseDialog();
      loadData();
    } catch (err) {
      console.error('Error saving subject:', err);
      alert('Lỗi khi lưu môn học');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa môn học này?')) return;

    try {
      const res = await fetch(`/api/faculty/subjects?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to delete subject');
      }
      loadData();
    } catch (err) {
      console.error('Error deleting subject:', err);
      alert('Lỗi khi xóa môn học');
    }
  };

  // Filter subjects
  const filteredSubjects = subjects.filter(subject => {
    const matchSearch = subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       subject.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSemester = selectedSemester === 'all' || subject.semester === selectedSemester;
    const matchYear = selectedYear === 'all' || subject.academicYear === selectedYear;
    return matchSearch && matchSemester && matchYear;
  });

  // Get unique semesters and years
  const semesters = Array.from(new Set(subjects.map(s => s.semester).filter(Boolean)));
  const years = Array.from(new Set(subjects.map(s => s.academicYear).filter(Boolean)));

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
            <BookOpen className="h-8 w-8 text-primary" />
            Quản lý Môn giảng dạy
          </h1>
          <p className="text-muted-foreground mt-1">
            {facultyProfile?.user?.name} - Tổng số: {subjects.length} môn
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Thêm môn học
        </Button>
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
                  placeholder="Tên môn hoặc mã môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Học kỳ</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Tất cả học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả học kỳ</SelectItem>
                  {semesters.map(sem => (
                    <SelectItem key={sem} value={sem!}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Năm học</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year">
                  <SelectValue placeholder="Tất cả năm học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả năm học</SelectItem>
                  {years.map(year => (
                    <SelectItem key={year} value={year!}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subject.subjectName}</CardTitle>
                  <CardDescription>
                    {subject.subjectCode && (
                      <span className="font-mono text-xs">{subject.subjectCode}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(subject)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(subject.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{subject.credits} tín chỉ</Badge>
                  {subject.semester && <Badge variant="outline">{subject.semester}</Badge>}
                </div>
                {subject.academicYear && (
                  <p className="text-sm text-muted-foreground">Năm học: {subject.academicYear}</p>
                )}
                {subject.studentCount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span>{subject.studentCount} sinh viên</span>
                  </div>
                )}
                {subject.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {subjects.length === 0
                ? 'Chưa có môn giảng dạy nào. Nhấn "Thêm môn học" để bắt đầu.'
                : 'Không tìm thấy môn học phù hợp với bộ lọc.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}
            </DialogTitle>
            <DialogDescription>
              Điền đầy đủ thông tin môn giảng dạy
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subjectName">Tên môn học *</Label>
                <Input
                  id="subjectName"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  required
                  placeholder="Ví dụ: Cấu trúc dữ liệu"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subjectCode">Mã môn học</Label>
                <Input
                  id="subjectCode"
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  placeholder="Ví dụ: CS201"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Số tín chỉ *</Label>
                <Input
                  id="credits"
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                  max="10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Học kỳ</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Chọn học kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HK1">Học kỳ 1</SelectItem>
                    <SelectItem value="HK2">Học kỳ 2</SelectItem>
                    <SelectItem value="HK3">Học kỳ 3 (Hè)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Năm học</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="Ví dụ: 2024-2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentCount">Số sinh viên</Label>
                <Input
                  id="studentCount"
                  type="number"
                  value={formData.studentCount}
                  onChange={(e) => setFormData({ ...formData, studentCount: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Khoa/Phòng</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Ví dụ: Khoa Công nghệ Thông tin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả ngắn gọn về môn học..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="syllabus">Link đề cương (URL)</Label>
              <Input
                id="syllabus"
                type="url"
                value={formData.syllabus}
                onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Hủy
              </Button>
              <Button type="submit">
                {editingSubject ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
