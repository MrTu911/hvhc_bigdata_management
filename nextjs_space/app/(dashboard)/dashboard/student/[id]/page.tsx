'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  FileText,
  Download,
  Sparkles,
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { StudentAIInsights } from '@/components/ai';

interface Student {
  id: string;
  maHocVien: string;
  hoTen: string;
  ngaySinh?: string;
  gioiTinh?: string;
  lop?: string;
  khoaHoc?: string;
  nganh?: string;
  email?: string;
  dienThoai?: string;
  diaChi?: string;
  diemTrungBinh: number;
  trangThai: string;
  giangVienHuongDan?: {
    user: {
      name: string;
      email: string;
    };
  };
  ketQuaHocTap: Result[];
  _count: {
    ketQuaHocTap: number;
  };
  createdAt: string;
}

interface Result {
  id: string;
  monHoc: string;
  maMon?: string;
  soTinChi?: number;
  diemChuyenCan?: number;
  diemGiuaKy?: number;
  diemBaiTap?: number;
  diemThi?: number;
  diemQuaTrinh?: number;
  diemTongKet?: number;
  diem?: number;
  hocKy?: string;
  namHoc?: string;
  ketQua?: string;
  xepLoai?: string;
  nhanXet?: string;
  heSoMonHoc?: {
    heSoChuyenCan: number;
    heSoGiuaKy: number;
    heSoBaiTap: number;
    heSoThi: number;
  };
  createdAt: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession() || {};

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<Result | null>(null);

  // Form for adding/editing result
  const [resultForm, setResultForm] = useState({
    monHoc: '',
    maMon: '',
    soTinChi: '3',
    diemChuyenCan: '',
    diemGiuaKy: '',
    diemBaiTap: '',
    diemThi: '',
    hocKy: '',
    namHoc: '',
    nhanXet: '',
  });

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/${params.id}`);
      const data = await res.json();

      if (res.ok) {
        setStudent(data);
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể tải thông tin học viên',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchStudent();
    }
  }, [params.id]);

  const handleOpenResultDialog = (result?: Result) => {
    if (result) {
      setEditingResult(result);
      setResultForm({
        monHoc: result.monHoc,
        maMon: result.maMon || '',
        soTinChi: result.soTinChi?.toString() || '3',
        diemChuyenCan: result.diemChuyenCan?.toString() || '',
        diemGiuaKy: result.diemGiuaKy?.toString() || '',
        diemBaiTap: result.diemBaiTap?.toString() || '',
        diemThi: result.diemThi?.toString() || '',
        hocKy: result.hocKy || '',
        namHoc: result.namHoc || '',
        nhanXet: result.nhanXet || '',
      });
    } else {
      setEditingResult(null);
      setResultForm({
        monHoc: '',
        maMon: '',
        soTinChi: '3',
        diemChuyenCan: '',
        diemGiuaKy: '',
        diemBaiTap: '',
        diemThi: '',
        hocKy: '',
        namHoc: '',
        nhanXet: '',
      });
    }
    setIsResultDialogOpen(true);
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...(editingResult && { id: editingResult.id }),
        hocVienId: params.id,
        monHoc: resultForm.monHoc,
        maMon: resultForm.maMon,
        soTinChi: parseInt(resultForm.soTinChi) || 3,
        diemChuyenCan: parseFloat(resultForm.diemChuyenCan) || undefined,
        diemGiuaKy: parseFloat(resultForm.diemGiuaKy) || undefined,
        diemBaiTap: parseFloat(resultForm.diemBaiTap) || undefined,
        diemThi: parseFloat(resultForm.diemThi) || undefined,
        hocKy: resultForm.hocKy,
        namHoc: resultForm.namHoc,
        nhanXet: resultForm.nhanXet,
      };

      const method = editingResult ? 'PUT' : 'POST';
      const res = await fetch('/api/student/results', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: editingResult ? 'Cập nhật điểm thành công' : 'Thêm điểm thành công',
        });
        setIsResultDialogOpen(false);
        fetchStudent();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể lưu điểm',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving result:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteResult = async (resultId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa kết quả này?')) return;

    try {
      const res = await fetch(`/api/student/results?id=${resultId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: 'Thành công',
          description: 'Xóa kết quả thành công',
        });
        fetchStudent();
      } else {
        toast({
          title: 'Lỗi',
          description: data.error || 'Không thể xóa kết quả',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể kết nối đến server',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    if (!student) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BANG DIEM CHI TIET HOC VIEN', 105, 15, { align: 'center' });
    
    // Student info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ma hoc vien: ${student.maHocVien}`, 14, 30);
    doc.text(`Ho ten: ${student.hoTen}`, 14, 37);
    doc.text(`Lop: ${student.lop || '-'}`, 14, 44);
    doc.text(`Nganh: ${student.nganh || '-'}`, 14, 51);
    doc.text(`GPA: ${student.diemTrungBinh.toFixed(2)}`, 14, 58);
    
    // Results table
    const tableData = student.ketQuaHocTap.map((result, index) => [
      index + 1,
      result.monHoc,
      result.maMon || '-',
      result.diemChuyenCan?.toFixed(1) || '-',
      result.diemGiuaKy?.toFixed(1) || '-',
      result.diemBaiTap?.toFixed(1) || '-',
      result.diemThi?.toFixed(1) || '-',
      result.diemTongKet?.toFixed(1) || result.diem?.toFixed(1) || '-',
      result.xepLoai || '-',
      result.hocKy || '-',
      result.namHoc || '-',
    ]);

    (doc as any).autoTable({
      startY: 65,
      head: [['STT', 'Mon hoc', 'Ma mon', 'CC', 'GK', 'BT', 'Thi', 'Tong ket', 'Xep loai', 'Hoc ky', 'Nam hoc']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 15 },
        3: { cellWidth: 12 },
        4: { cellWidth: 12 },
        5: { cellWidth: 12 },
        6: { cellWidth: 12 },
        7: { cellWidth: 15 },
        8: { cellWidth: 20 },
        9: { cellWidth: 15 },
        10: { cellWidth: 20 },
      },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 65;
    doc.setFontSize(9);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 14, finalY + 10);
    
    doc.save(`BangDiem_${student.maHocVien}_${Date.now()}.pdf`);
    
    toast({
      title: 'Thành công',
      description: 'Đã xuất bảng điểm PDF',
    });
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

  const getGradeColor = (grade: number) => {
    if (grade >= 9) return 'text-green-600 font-semibold';
    if (grade >= 8) return 'text-blue-600 font-semibold';
    if (grade >= 7) return 'text-yellow-600';
    if (grade >= 5) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Không tìm thấy học viên</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{student.hoTen}</h1>
            <Badge variant="outline">{student.maHocVien}</Badge>
            <Badge className={getStatusColor(student.trangThai)}>
              {student.trangThai}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {student.lop || 'Chưa có lớp'} - {student.khoaHoc || 'Chưa có khóa'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGradeColor(student.diemTrungBinh)}`}>
              {student.diemTrungBinh.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Số môn học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student._count.ketQuaHocTap}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Môn đạt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {student.ketQuaHocTap.filter(r => r.ketQua && r.ketQua !== 'Yếu' && (r.diemTongKet || r.diem || 0) >= 5).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Môn chưa đạt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {student.ketQuaHocTap.filter(r => r.ketQua === 'Yếu' || (r.diemTongKet || r.diem || 0) < 5).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-2" />
            Thông tin
          </TabsTrigger>
          <TabsTrigger value="results">
            <BookOpen className="h-4 w-4 mr-2" />
            Kết quả học tập
          </TabsTrigger>
          <TabsTrigger value="ai-insights">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Họ tên</div>
                      <div className="font-medium">{student.hoTen}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Ngày sinh</div>
                      <div className="font-medium">
                        {student.ngaySinh
                          ? new Date(student.ngaySinh).toLocaleDateString('vi-VN')
                          : 'Chưa có'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Lớp - Khóa</div>
                      <div className="font-medium">
                        {student.lop || 'Chưa có'} - {student.khoaHoc || 'Chưa có'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Ngành</div>
                      <div className="font-medium">{student.nganh || 'Chưa có'}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium">{student.email || 'Chưa có'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Điện thoại</div>
                      <div className="font-medium">{student.dienThoai || 'Chưa có'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Địa chỉ</div>
                      <div className="font-medium">{student.diaChi || 'Chưa có'}</div>
                    </div>
                  </div>
                  {student.giangVienHuongDan && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">GVHD</div>
                        <div className="font-medium">
                          {student.giangVienHuongDan.user.name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kết quả học tập</CardTitle>
                  <CardDescription>
                    Danh sách môn học và điểm số ({student.ketQuaHocTap.length} môn)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleExportPDF} disabled={student.ketQuaHocTap.length === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Xuất PDF
                  </Button>
                  <Button onClick={() => handleOpenResultDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm điểm
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {student.ketQuaHocTap.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có kết quả học tập
                </div>
              ) : (
                <div className="space-y-3">
                  {student.ketQuaHocTap.map((result) => (
                    <div
                      key={result.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{result.monHoc}</h4>
                            {result.maMon && (
                              <Badge variant="outline">{result.maMon}</Badge>
                            )}
                            {result.ketQua && (
                              <Badge
                                className={
                                  result.ketQua === 'Đạt'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {result.ketQua}
                              </Badge>
                            )}
                            {result.xepLoai && (
                              <Badge variant="secondary">{result.xepLoai}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-6 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground text-xs">CC: </span>
                              <span className="font-medium">
                                {result.diemChuyenCan?.toFixed(1) || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">GK: </span>
                              <span className="font-medium">
                                {result.diemGiuaKy?.toFixed(1) || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">BT: </span>
                              <span className="font-medium">
                                {result.diemBaiTap?.toFixed(1) || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Thi: </span>
                              <span className="font-medium">
                                {result.diemThi?.toFixed(1) || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Tổng: </span>
                              <span className={`font-bold ${getGradeColor(result.diemTongKet || result.diem || 0)}`}>
                                {result.diemTongKet?.toFixed(1) || result.diem?.toFixed(1) || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs">Học kỳ: </span>
                              <span className="font-medium">
                                {result.hocKy || '-'} / {result.namHoc || '-'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Radar Chart */}
                          {(result.diemChuyenCan || result.diemGiuaKy || result.diemBaiTap || result.diemThi) && (
                            <div className="h-48 mt-2">
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={[
                                  {
                                    subject: 'Chuyên cần',
                                    score: result.diemChuyenCan || 0,
                                    fullMark: 10,
                                  },
                                  {
                                    subject: 'Giữa kỳ',
                                    score: result.diemGiuaKy || 0,
                                    fullMark: 10,
                                  },
                                  {
                                    subject: 'Bài tập',
                                    score: result.diemBaiTap || 0,
                                    fullMark: 10,
                                  },
                                  {
                                    subject: 'Thi cuối kỳ',
                                    score: result.diemThi || 0,
                                    fullMark: 10,
                                  },
                                ]}>
                                  <PolarGrid />
                                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                                  <Radar
                                    name="Điểm"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.6}
                                  />
                                  <Tooltip />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                          {result.nhanXet && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span className="font-medium">Nhận xét: </span>
                              {result.nhanXet}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenResultDialog(result)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteResult(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          {student?.id && <StudentAIInsights studentId={student.id} />}
        </TabsContent>
      </Tabs>

      {/* Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingResult ? 'Chỉnh sửa điểm' : 'Thêm điểm mới'}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin môn học và điểm số
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitResult}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="monHoc">Môn học *</Label>
                <Input
                  id="monHoc"
                  value={resultForm.monHoc}
                  onChange={(e) => setResultForm({ ...resultForm, monHoc: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maMon">Mã môn</Label>
                  <Input
                    id="maMon"
                    value={resultForm.maMon}
                    onChange={(e) => setResultForm({ ...resultForm, maMon: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soTinChi">Số tín chỉ</Label>
                  <Input
                    id="soTinChi"
                    type="number"
                    min="1"
                    max="10"
                    value={resultForm.soTinChi}
                    onChange={(e) => setResultForm({ ...resultForm, soTinChi: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Điểm thành phần (0-10)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="diemChuyenCan" className="text-xs text-muted-foreground">
                      Chuyên cần (CC)
                    </Label>
                    <Input
                      id="diemChuyenCan"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0-10"
                      value={resultForm.diemChuyenCan}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, diemChuyenCan: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="diemGiuaKy" className="text-xs text-muted-foreground">
                      Giữa kỳ (GK)
                    </Label>
                    <Input
                      id="diemGiuaKy"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0-10"
                      value={resultForm.diemGiuaKy}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, diemGiuaKy: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="diemBaiTap" className="text-xs text-muted-foreground">
                      Bài tập (BT)
                    </Label>
                    <Input
                      id="diemBaiTap"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0-10"
                      value={resultForm.diemBaiTap}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, diemBaiTap: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="diemThi" className="text-xs text-muted-foreground">
                      Thi cuối kỳ (Thi)
                    </Label>
                    <Input
                      id="diemThi"
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      placeholder="0-10"
                      value={resultForm.diemThi}
                      onChange={(e) =>
                        setResultForm({ ...resultForm, diemThi: e.target.value })
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Điểm tổng kết sẽ tự động tính theo hệ số môn học (mặc định: CC 10% + GK 20% + BT 20% + Thi 50%)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hocKy">Học kỳ</Label>
                  <Select
                    value={resultForm.hocKy}
                    onValueChange={(v) => setResultForm({ ...resultForm, hocKy: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HK1">HK1</SelectItem>
                      <SelectItem value="HK2">HK2</SelectItem>
                      <SelectItem value="HK3">HK3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="namHoc">Năm học</Label>
                  <Input
                    id="namHoc"
                    placeholder="2024-2025"
                    value={resultForm.namHoc}
                    onChange={(e) =>
                      setResultForm({ ...resultForm, namHoc: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nhanXet">Nhận xét</Label>
                <Input
                  id="nhanXet"
                  value={resultForm.nhanXet}
                  onChange={(e) =>
                    setResultForm({ ...resultForm, nhanXet: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResultDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit">
                {editingResult ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
