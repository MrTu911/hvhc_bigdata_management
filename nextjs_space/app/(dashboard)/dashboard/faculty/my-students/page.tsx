'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import {
  Users,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Search,
  ExternalLink,
  Mail,
  Phone,
  Award,
  Filter,
  Download,
  X,
  FileSpreadsheet,
  FileText,
  Send,
  CheckSquare,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV } from '@/lib/export-utils';
import { ACADEMIC_STANDING_COLORS } from '@/lib/constants/academic-standing';

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
  gpa: number;
  hocLuc: string;
  soMonHoc: number;
}

interface Statistics {
  total: number;
  avgGPA: number;
  xuatSac: number;
  gioi: number;
  kha: number;
  trungBinh: number;
  yeu: number;
  chuaXepLoai: number;
}

interface Distribution {
  name: string;
  value: number;
  color: string;
}

export default function MyStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    avgGPA: 0,
    xuatSac: 0,
    gioi: 0,
    kha: 0,
    trungBinh: 0,
    yeu: 0,
    chuaXepLoai: 0,
  });
  const [distribution, setDistribution] = useState<Distribution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters
  const [filterKhoa, setFilterKhoa] = useState<string>('all');
  const [filterHocLuc, setFilterHocLuc] = useState<string>('all');
  const [gpaRange, setGpaRange] = useState<[number, number]>([0, 10]);
  const [availableKhoa, setAvailableKhoa] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Bulk Selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Active filters count
  const activeFiltersCount = [
    filterKhoa !== 'all',
    filterHocLuc !== 'all',
    gpaRange[0] !== 0 || gpaRange[1] !== 10,
  ].filter(Boolean).length;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchMyStudents();
  }, []);

  useEffect(() => {
    // Extract available khoa from students
    const khoaSet = new Set<string>();
    students.forEach((s) => {
      if (s.khoaHoc) khoaSet.add(s.khoaHoc);
    });
    setAvailableKhoa(Array.from(khoaSet).sort());
  }, [students]);

  useEffect(() => {
    // Apply all filters
    let filtered = students;

    // Search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.hoTen.toLowerCase().includes(query) ||
          student.maHocVien.toLowerCase().includes(query) ||
          (student.lop && student.lop.toLowerCase().includes(query)) ||
          (student.email && student.email.toLowerCase().includes(query))
      );
    }

    // Filter by Khoa
    if (filterKhoa !== 'all') {
      filtered = filtered.filter((s) => s.khoaHoc === filterKhoa);
    }

    // Filter by Hoc Luc
    if (filterHocLuc !== 'all') {
      filtered = filtered.filter((s) => s.hocLuc === filterHocLuc);
    }

    // Filter by GPA range
    filtered = filtered.filter((s) => s.gpa >= gpaRange[0] && s.gpa <= gpaRange[1]);

    setFilteredStudents(filtered);
  }, [searchQuery, students, filterKhoa, filterHocLuc, gpaRange]);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faculty/my-students');
      const data = await response.json();

      if (data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
        setStatistics(data.statistics);
        setDistribution(data.distribution);
      } else {
        toast.error(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const getHocLucBadge = (hocLuc: string) => {
    const colorMap: { [key: string]: string } = {
      'Xuất sắc': 'bg-green-100 text-green-800 border-green-300',
      'Giỏi': 'bg-blue-100 text-blue-800 border-blue-300',
      'Khá': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Trung bình': 'bg-orange-100 text-orange-800 border-orange-300',
      'Yếu': 'bg-red-100 text-red-800 border-red-300',
    };

    return (
      <Badge variant="outline" className={colorMap[hocLuc] || 'bg-gray-100 text-gray-800'}>
        {hocLuc}
      </Badge>
    );
  };

  const clearFilters = () => {
    setFilterKhoa('all');
    setFilterHocLuc('all');
    setGpaRange([0, 10]);
    setSearchQuery('');
    toast.success('Đã xóa tất cả bộ lọc');
  };

  const toggleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handleExportExcel = () => {
    try {
      const dataToExport = selectionMode && selectedStudents.size > 0
        ? filteredStudents.filter((s) => selectedStudents.has(s.id))
        : filteredStudents;

      if (dataToExport.length === 0) {
        toast.error('Không có dữ liệu để xuất');
        return;
      }

      const exportData = dataToExport.map((s) => ({
        'Mã học viên': s.maHocVien,
        'Họ tên': s.hoTen,
        'Lớp': s.lop || '',
        'Khóa học': s.khoaHoc || '',
        'Ngành': s.nganh || '',
        'Email': s.email || '',
        'Điện thoại': s.dienThoai || '',
        'GPA': s.gpa,
        'Học lực': s.hocLuc,
        'Số môn': s.soMonHoc,
        'Trạng thái': s.trangThai,
      }));

      exportToExcel({
        filename: `hoc-vien-huong-dan-${new Date().toISOString().split('T')[0]}.xlsx`,
        sheets: [
          {
            name: 'Danh sách học viên',
            data: exportData,
          },
        ],
      });

      toast.success(`Đã xuất ${dataToExport.length} học viên`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu');
    }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = selectionMode && selectedStudents.size > 0
        ? filteredStudents.filter((s) => selectedStudents.has(s.id))
        : filteredStudents;

      if (dataToExport.length === 0) {
        toast.error('Không có dữ liệu để xuất');
        return;
      }

      const headers = [
        'Mã học viên',
        'Họ tên',
        'Lớp',
        'Khóa học',
        'Ngành',
        'Email',
        'Điện thoại',
        'GPA',
        'Học lực',
        'Số môn',
        'Trạng thái',
      ];

      const data = dataToExport.map((s) => [
        s.maHocVien,
        s.hoTen,
        s.lop || '',
        s.khoaHoc || '',
        s.nganh || '',
        s.email || '',
        s.dienThoai || '',
        s.gpa,
        s.hocLuc,
        s.soMonHoc,
        s.trangThai,
      ]);

      exportToCSV({
        headers,
        data,
        filename: `hoc-vien-huong-dan-${new Date().toISOString().split('T')[0]}.csv`,
      });

      toast.success(`Đã xuất ${dataToExport.length} học viên`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu');
    }
  };

  const handleExportPDF = () => {
    try {
      const dataToExport = selectionMode && selectedStudents.size > 0
        ? filteredStudents.filter((s) => selectedStudents.has(s.id))
        : filteredStudents;

      if (dataToExport.length === 0) {
        toast.error('Không có dữ liệu để xuất');
        return;
      }

      const headers = [
        'Ma HV',
        'Ho ten',
        'Lop',
        'Khoa',
        'GPA',
        'Hoc luc',
        'Trang thai',
      ];

      const data = dataToExport.map((s) => [
        s.maHocVien,
        s.hoTen,
        s.lop || '',
        s.khoaHoc || '',
        s.gpa.toFixed(2),
        s.hocLuc,
        s.trangThai,
      ]);

      exportToPDF({
        title: 'DANH SACH HOC VIEN HUONG DAN',
        subtitle: 'He thong quan ly hoc vien HVHC',
        headers,
        data,
        filename: `hoc-vien-huong-dan-${new Date().toISOString().split('T')[0]}.pdf`,
        summary: [
          { label: 'Tong so hoc vien', value: dataToExport.length },
          { label: 'GPA trung binh', value: (dataToExport.reduce((sum, s) => sum + s.gpa, 0) / dataToExport.length).toFixed(2) },
        ],
      });

      toast.success(`Đã xuất ${dataToExport.length} học viên`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu');
    }
  };

  const handleSendNotification = () => {
    const count = selectionMode ? selectedStudents.size : filteredStudents.length;
    if (count === 0) {
      toast.error('Vui lòng chọn học viên');
      return;
    }
    toast.success(`Tính năng gửi thông báo đến ${count} học viên đang được phát triển`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Học viên hướng dẫn</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý và theo dõi kết quả học tập của học viên
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchMyStudents} variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
              className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Bộ lọc
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white">{activeFiltersCount}</Badge>
              )}
            </Button>
            <Button 
              onClick={() => setSelectionMode(!selectionMode)} 
              variant="outline" 
              size="sm"
              className={selectionMode ? 'bg-purple-50 border-purple-300' : ''}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectionMode ? `Đã chọn (${selectedStudents.size})` : 'Chế độ chọn'}
            </Button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Bộ lọc nâng cao</CardTitle>
                {activeFiltersCount > 0 && (
                  <Button onClick={clearFilters} variant="ghost" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    Xóa tất cả
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Khoa Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khóa học</label>
                  <Select value={filterKhoa} onValueChange={setFilterKhoa}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả khóa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả khóa</SelectItem>
                      {availableKhoa.map((khoa) => (
                        <SelectItem key={khoa} value={khoa}>
                          {khoa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Hoc Luc Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Học lực</label>
                  <Select value={filterHocLuc} onValueChange={setFilterHocLuc}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Xuất sắc">Xuất sắc (≥9.0)</SelectItem>
                      <SelectItem value="Giỏi">Giỏi (8.0-8.9)</SelectItem>
                      <SelectItem value="Khá">Khá (6.5-7.9)</SelectItem>
                      <SelectItem value="Trung bình">Trung bình (5.0-6.4)</SelectItem>
                      <SelectItem value="Yếu">Yếu (&lt;5.0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* GPA Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    GPA: {gpaRange[0].toFixed(1)} - {gpaRange[1].toFixed(1)}
                  </label>
                  <Slider
                    min={0}
                    max={10}
                    step={0.5}
                    value={gpaRange}
                    onValueChange={(value) => setGpaRange(value as [number, number])}
                    className="mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions Bar */}
        {selectionMode && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Đã chọn {selectedStudents.size} / {filteredStudents.length} học viên
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleExportExcel} size="sm" variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button onClick={handleExportCSV} size="sm" variant="outline">
                    <FileText className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button onClick={handleExportPDF} size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button onClick={handleSendNotification} size="sm" variant="default">
                    <Send className="h-4 w-4 mr-1" />
                    Gửi thông báo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Học viên hướng dẫn</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA Trung bình</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.avgGPA.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Điểm trung bình chung</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học viên xuất sắc</CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{statistics.xuatSac}</div>
            <p className="text-xs text-muted-foreground mt-1">
              GPA ≥ 9.0 ({statistics.total > 0 ? ((statistics.xuatSac / statistics.total) * 100).toFixed(1) : 0}%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần hỗ trợ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.yeu}</div>
            <p className="text-xs text-muted-foreground mt-1">
              GPA &lt; 5.0 cần tăng cường hỗ trợ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart & Search */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố học lực</CardTitle>
            <CardDescription>Tỷ lệ phần trăm theo xếp loại</CardDescription>
          </CardHeader>
          <CardContent>
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribution as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Chưa có dữ liệu thống kê
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm học viên</CardTitle>
            <CardDescription>Tìm theo tên, mã học viên, lớp, email</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Nhập từ khóa tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Kết quả:</strong> {filteredStudents.length} / {students.length} học viên
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-50">
                  Xuất sắc: {statistics.xuatSac}
                </Badge>
                <Badge variant="outline" className="bg-blue-50">
                  Giỏi: {statistics.gioi}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50">
                  Khá: {statistics.kha}
                </Badge>
                <Badge variant="outline" className="bg-orange-50">
                  Trung bình: {statistics.trungBinh}
                </Badge>
                <Badge variant="outline" className="bg-red-50">
                  Yếu: {statistics.yeu}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách học viên ({filteredStudents.length})</CardTitle>
          <CardDescription>
            Click vào học viên để xem chi tiết kết quả học tập
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((student) => (
                <Card
                  key={student.id}
                  className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${
                    selectionMode && selectedStudents.has(student.id) ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  }`}
                  style={{
                    borderLeftColor: ACADEMIC_STANDING_COLORS[student.hocLuc] ?? '#9ca3af',
                  }}
                  onClick={(e) => {
                    if (selectionMode) {
                      e.stopPropagation();
                      toggleStudentSelection(student.id);
                    } else {
                      router.push(`/dashboard/student/${student.id}`);
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2 flex-1">
                        {selectionMode && (
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold">
                            {student.hoTen}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {student.maHocVien}
                          </CardDescription>
                        </div>
                      </div>
                      {!selectionMode && <ExternalLink className="h-4 w-4 text-gray-400" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">GPA:</span>
                      <span className="text-lg font-bold">{student.gpa.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Học lực:</span>
                      {getHocLucBadge(student.hocLuc)}
                    </div>
                    {student.lop && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Lớp:</span>
                        <span className="text-sm font-medium">{student.lop}</span>
                      </div>
                    )}
                    {student.khoaHoc && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Khóa:</span>
                        <span className="text-sm font-medium">{student.khoaHoc}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Số môn:</span>
                      <span className="text-sm font-medium">{student.soMonHoc}</span>
                    </div>
                    {student.email && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600 truncate">
                          {student.email}
                        </span>
                      </div>
                    )}
                    {student.dienThoai && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{student.dienThoai}</span>
                      </div>
                    )}
                    <div className="pt-2">
                      <Badge
                        variant="outline"
                        className={
                          student.trangThai === 'Đang học'
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-gray-50 text-gray-700 border-gray-300'
                        }
                      >
                        {student.trangThai}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Users className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Không tìm thấy học viên</p>
              <p className="text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
