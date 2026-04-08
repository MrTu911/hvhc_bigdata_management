'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Download, GraduationCap, Award, Languages, BookOpen, Eye } from 'lucide-react';

export default function ScientificCVPage() {
  const { data: session, status } = useSession() || {};
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('education');
  
  const [educations, setEducations] = useState<any[]>([]);
  const [foreignCerts, setForeignCerts] = useState<any[]>([]);
  const [technicalCerts, setTechnicalCerts] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  
  const [showEducationDialog, setShowEducationDialog] = useState(false);
  const [showForeignDialog, setShowForeignDialog] = useState(false);
  const [showTechnicalDialog, setShowTechnicalDialog] = useState(false);
  const [showPublicationDialog, setShowPublicationDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  const [educationForm, setEducationForm] = useState<any>({});
  const [foreignForm, setForeignForm] = useState<any>({});
  const [technicalForm, setTechnicalForm] = useState<any>({});
  const [publicationForm, setPublicationForm] = useState<any>({});

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile/scientific-cv/export?format=json');
      if (res.ok) {
        const data = await res.json();
        setEducations(data.user.educationHistory || []);
        setForeignCerts(data.user.foreignLanguageCerts || []);
        setTechnicalCerts(data.user.technicalCertificates || []);
        setPublications(data.user.scientificPublications || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/profile/scientific-cv/export');
      const html = await res.text();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
      toast({ title: 'Thành công', description: 'Lý lịch khoa học đã được xuất.' });
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xuất lý lịch khoa học', variant: 'destructive' });
    }
  };

  const handleSaveEducation = async () => {
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord ? `/api/profile/education/${editingRecord.id}` : '/api/profile/education';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(educationForm) });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu thông tin đào tạo' });
        setShowEducationDialog(false);
        setEditingRecord(null);
        setEducationForm({});
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu', variant: 'destructive' });
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      const res = await fetch(`/api/profile/education/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã xóa' });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const handleSaveForeign = async () => {
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord ? `/api/profile/foreign-language/${editingRecord.id}` : '/api/profile/foreign-language';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(foreignForm) });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu chứng chỉ ngoại ngữ' });
        setShowForeignDialog(false);
        setEditingRecord(null);
        setForeignForm({});
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu', variant: 'destructive' });
    }
  };

  const handleSaveTechnical = async () => {
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord ? `/api/profile/technical-cert/${editingRecord.id}` : '/api/profile/technical-cert';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(technicalForm) });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu bằng cấp/chứng chỉ' });
        setShowTechnicalDialog(false);
        setEditingRecord(null);
        setTechnicalForm({});
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu', variant: 'destructive' });
    }
  };

  const handleSavePublication = async () => {
    try {
      const method = editingRecord ? 'PUT' : 'POST';
      const url = editingRecord ? `/api/profile/publication/${editingRecord.id}` : '/api/profile/publication';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(publicationForm) });
      if (res.ok) {
        toast({ title: 'Thành công', description: 'Đã lưu công trình khoa học' });
        setShowPublicationDialog(false);
        setEditingRecord(null);
        setPublicationForm({});
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu', variant: 'destructive' });
    }
  };

  const levelMap: Record<string, string> = {
    'DAI_HOC': 'Đại học', 'THAC_SI': 'Thạc sĩ', 'TIEN_SI': 'Tiến sĩ',
    'CU_NHAN_NGOAI_NGU': 'Cử nhân ngoại ngữ', 'KHAC': 'Khác',
  };

  const typeMap: Record<string, string> = {
    'GIAO_TRINH': 'Giáo trình', 'TAI_LIEU': 'Tài liệu', 'BAI_TAP': 'Bài tập',
    'BAI_BAO': 'Bài báo', 'SANG_KIEN': 'Sáng kiến', 'DE_TAI': 'Đề tài',
    'GIAO_TRINH_DT': 'Giáo trình',
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-6">
        <Card><CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lý lịch khoa học</h1>
          <p className="text-muted-foreground">Quản lý thông tin lý lịch khoa học cá nhân</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Eye className="h-4 w-4 mr-2" />Xem trước</Button>
          <Button onClick={handleExport}><Download className="h-4 w-4 mr-2" />Xuất lý lịch</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="education"><GraduationCap className="h-4 w-4 mr-2" />Đào tạo</TabsTrigger>
          <TabsTrigger value="foreign"><Languages className="h-4 w-4 mr-2" />Ngoại ngữ</TabsTrigger>
          <TabsTrigger value="technical"><Award className="h-4 w-4 mr-2" />Bằng cấp</TabsTrigger>
          <TabsTrigger value="publications"><BookOpen className="h-4 w-4 mr-2" />Công trình KH</TabsTrigger>
        </TabsList>

        {/* Tab Đào tạo */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Quá trình đào tạo</CardTitle><CardDescription>Đại học, sau đại học</CardDescription></div>
              <Button onClick={() => { setEducationForm({}); setEditingRecord(null); setShowEducationDialog(true); }}><Plus className="h-4 w-4 mr-2" />Thêm</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cấp độ</TableHead><TableHead>Chuyên ngành</TableHead><TableHead>Nơi học</TableHead>
                  <TableHead>Thời gian</TableHead><TableHead>Xếp loại</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {educations.map((edu) => (
                    <TableRow key={edu.id}>
                      <TableCell className="font-medium">{levelMap[edu.level] || edu.level}</TableCell>
                      <TableCell>{edu.major}</TableCell>
                      <TableCell>{edu.institution}</TableCell>
                      <TableCell>{edu.startDate && new Date(edu.startDate).toLocaleDateString('vi-VN')} - {edu.endDate && new Date(edu.endDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{edu.classification}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setEducationForm(edu); setEditingRecord(edu); setShowEducationDialog(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEducation(edu.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {educations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Ngoại ngữ */}
        <TabsContent value="foreign">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Trình độ ngoại ngữ</CardTitle><CardDescription>Chứng chỉ, bằng cấp</CardDescription></div>
              <Button onClick={() => { setForeignForm({}); setEditingRecord(null); setShowForeignDialog(true); }}><Plus className="h-4 w-4 mr-2" />Thêm</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Ngôn ngữ</TableHead><TableHead>Loại</TableHead><TableHead>Trình độ</TableHead>
                  <TableHead>Khung</TableHead><TableHead>Nơi cấp</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {foreignCerts.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.language}</TableCell>
                      <TableCell>{cert.certType}</TableCell>
                      <TableCell>{cert.certLevel}</TableCell>
                      <TableCell>{cert.framework}</TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setForeignForm(cert); setEditingRecord(cert); setShowForeignDialog(true); }}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {foreignCerts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Bằng cấp */}
        <TabsContent value="technical">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Bằng cấp, chức vụ kỹ thuật</CardTitle><CardDescription>Được chính thức cấp</CardDescription></div>
              <Button onClick={() => { setTechnicalForm({}); setEditingRecord(null); setShowTechnicalDialog(true); }}><Plus className="h-4 w-4 mr-2" />Thêm</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Loại</TableHead><TableHead>Tên</TableHead><TableHead>Số hiệu</TableHead>
                  <TableHead>Xếp loại</TableHead><TableHead>Nơi cấp</TableHead><TableHead>Ngày cấp</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {technicalCerts.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.certType}</TableCell>
                      <TableCell className="font-medium">{cert.certName}</TableCell>
                      <TableCell>{cert.certNumber}</TableCell>
                      <TableCell>{cert.classification}</TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell>{cert.issueDate && new Date(cert.issueDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setTechnicalForm(cert); setEditingRecord(cert); setShowTechnicalDialog(true); }}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {technicalCerts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Công trình KH */}
        <TabsContent value="publications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Công trình khoa học</CardTitle><CardDescription>Giáo trình, sáng kiến, đề tài</CardDescription></div>
              <Button onClick={() => { setPublicationForm({}); setEditingRecord(null); setShowPublicationDialog(true); }}><Plus className="h-4 w-4 mr-2" />Thêm</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>STT</TableHead><TableHead>Loại</TableHead><TableHead>Tên</TableHead>
                  <TableHead>Đơn vị</TableHead><TableHead>Năm</TableHead><TableHead className="text-right">Thao tác</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {publications.map((pub, idx) => (
                    <TableRow key={pub.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{typeMap[pub.type] || pub.type}</TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">{pub.title}</TableCell>
                      <TableCell>{pub.organization}</TableCell>
                      <TableCell>{pub.month ? `${pub.month}/` : ''}{pub.year}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setPublicationForm(pub); setEditingRecord(pub); setShowPublicationDialog(true); }}><Edit className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {publications.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Đào tạo */}
      <Dialog open={showEducationDialog} onOpenChange={setShowEducationDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRecord ? 'Sửa' : 'Thêm'} thông tin đào tạo</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Cấp độ *</Label>
              <Select value={educationForm.level || ''} onValueChange={(v) => setEducationForm({...educationForm, level: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAI_HOC">Đại học</SelectItem>
                  <SelectItem value="THAC_SI">Thạc sĩ</SelectItem>
                  <SelectItem value="TIEN_SI">Tiến sĩ</SelectItem>
                  <SelectItem value="CU_NHAN_NGOAI_NGU">CN Ngoại ngữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Hệ đào tạo</Label><Input value={educationForm.trainingSystem || ''} onChange={(e) => setEducationForm({...educationForm, trainingSystem: e.target.value})} placeholder="Chính quy" /></div>
            <div className="space-y-2 col-span-2"><Label>Nơi học *</Label><Input value={educationForm.institution || ''} onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})} /></div>
            <div className="space-y-2 col-span-2"><Label>Chuyên ngành</Label><Input value={educationForm.major || ''} onChange={(e) => setEducationForm({...educationForm, major: e.target.value})} /></div>
            <div className="space-y-2"><Label>Bắt đầu</Label><Input type="date" value={educationForm.startDate?.toString().split('T')[0] || ''} onChange={(e) => setEducationForm({...educationForm, startDate: e.target.value})} /></div>
            <div className="space-y-2"><Label>Kết thúc</Label><Input type="date" value={educationForm.endDate?.toString().split('T')[0] || ''} onChange={(e) => setEducationForm({...educationForm, endDate: e.target.value})} /></div>
            <div className="space-y-2 col-span-2"><Label>Luận văn/án</Label><Textarea value={educationForm.thesisTitle || ''} onChange={(e) => setEducationForm({...educationForm, thesisTitle: e.target.value})} /></div>
            <div className="space-y-2"><Label>Người hướng dẫn</Label><Input value={educationForm.supervisor || ''} onChange={(e) => setEducationForm({...educationForm, supervisor: e.target.value})} /></div>
            <div className="space-y-2"><Label>Xếp loại</Label>
              <Select value={educationForm.classification || ''} onValueChange={(v) => setEducationForm({...educationForm, classification: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent><SelectItem value="Xuất sắc">Xuất sắc</SelectItem><SelectItem value="Giỏi">Giỏi</SelectItem><SelectItem value="Khá">Khá</SelectItem><SelectItem value="Trung bình">Trung bình</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Ngày bảo vệ</Label><Input type="date" value={educationForm.defenseDate?.toString().split('T')[0] || ''} onChange={(e) => setEducationForm({...educationForm, defenseDate: e.target.value})} /></div>
            <div className="space-y-2"><Label>Nơi bảo vệ</Label><Input value={educationForm.defenseLocation || ''} onChange={(e) => setEducationForm({...educationForm, defenseLocation: e.target.value})} /></div>
            <div className="space-y-2"><Label>Số hiệu bằng</Label><Input value={educationForm.certificateCode || ''} onChange={(e) => setEducationForm({...educationForm, certificateCode: e.target.value})} /></div>
            <div className="space-y-2"><Label>Ngày cấp bằng</Label><Input type="date" value={educationForm.certificateDate?.toString().split('T')[0] || ''} onChange={(e) => setEducationForm({...educationForm, certificateDate: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEducationDialog(false)}>Hủy</Button><Button onClick={handleSaveEducation}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Ngoại ngữ */}
      <Dialog open={showForeignDialog} onOpenChange={setShowForeignDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRecord ? 'Sửa' : 'Thêm'} chứng chỉ ngoại ngữ</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Ngôn ngữ *</Label>
              <Select value={foreignForm.language || ''} onValueChange={(v) => setForeignForm({...foreignForm, language: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent><SelectItem value="Tiếng Anh">Tiếng Anh</SelectItem><SelectItem value="Tiếng Pháp">Tiếng Pháp</SelectItem><SelectItem value="Tiếng Trung">Tiếng Trung</SelectItem><SelectItem value="Tiếng Nga">Tiếng Nga</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Loại chứng chỉ *</Label><Input value={foreignForm.certType || ''} onChange={(e) => setForeignForm({...foreignForm, certType: e.target.value})} placeholder="B1, IELTS..." /></div>
            <div className="space-y-2"><Label>Trình độ/Điểm</Label><Input value={foreignForm.certLevel || ''} onChange={(e) => setForeignForm({...foreignForm, certLevel: e.target.value})} /></div>
            <div className="space-y-2"><Label>Khung tham chiếu</Label><Input value={foreignForm.framework || ''} onChange={(e) => setForeignForm({...foreignForm, framework: e.target.value})} placeholder="Châu Âu..." /></div>
            <div className="space-y-2"><Label>Nơi cấp</Label><Input value={foreignForm.issuer || ''} onChange={(e) => setForeignForm({...foreignForm, issuer: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForeignDialog(false)}>Hủy</Button><Button onClick={handleSaveForeign}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Bằng cấp */}
      <Dialog open={showTechnicalDialog} onOpenChange={setShowTechnicalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRecord ? 'Sửa' : 'Thêm'} bằng cấp</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Loại *</Label>
              <Select value={technicalForm.certType || ''} onValueChange={(v) => setTechnicalForm({...technicalForm, certType: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent><SelectItem value="Cử nhân">Cử nhân</SelectItem><SelectItem value="Giáo viên">Giáo viên</SelectItem><SelectItem value="Giảng viên">Giảng viên</SelectItem><SelectItem value="Giảng viên chính">GV chính</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tên *</Label><Input value={technicalForm.certName || ''} onChange={(e) => setTechnicalForm({...technicalForm, certName: e.target.value})} /></div>
            <div className="space-y-2"><Label>Số hiệu</Label><Input value={technicalForm.certNumber || ''} onChange={(e) => setTechnicalForm({...technicalForm, certNumber: e.target.value})} /></div>
            <div className="space-y-2"><Label>Xếp loại</Label>
              <Select value={technicalForm.classification || ''} onValueChange={(v) => setTechnicalForm({...technicalForm, classification: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent><SelectItem value="Xuất sắc">Xuất sắc</SelectItem><SelectItem value="Giỏi">Giỏi</SelectItem><SelectItem value="Khá">Khá</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Nơi cấp</Label><Input value={technicalForm.issuer || ''} onChange={(e) => setTechnicalForm({...technicalForm, issuer: e.target.value})} /></div>
            <div className="space-y-2"><Label>Ngày cấp</Label><Input type="date" value={technicalForm.issueDate?.toString().split('T')[0] || ''} onChange={(e) => setTechnicalForm({...technicalForm, issueDate: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowTechnicalDialog(false)}>Hủy</Button><Button onClick={handleSaveTechnical}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Công trình */}
      <Dialog open={showPublicationDialog} onOpenChange={setShowPublicationDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingRecord ? 'Sửa' : 'Thêm'} công trình KH</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Loại *</Label>
              <Select value={publicationForm.type || ''} onValueChange={(v) => setPublicationForm({...publicationForm, type: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SANG_KIEN">Sáng kiến</SelectItem>
                  <SelectItem value="GIAO_TRINH">Giáo trình</SelectItem>
                  <SelectItem value="GIAO_TRINH_DT">Giáo trình ĐT</SelectItem>
                  <SelectItem value="DE_TAI">Đề tài NCKH</SelectItem>
                  <SelectItem value="BAI_TAP">Bài tập</SelectItem>
                  <SelectItem value="TAI_LIEU">Tài liệu</SelectItem>
                  <SelectItem value="BAI_BAO">Bài báo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Tên *</Label><Textarea value={publicationForm.title || ''} onChange={(e) => setPublicationForm({...publicationForm, title: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tháng</Label>
                <Select value={publicationForm.month?.toString() || ''} onValueChange={(v) => setPublicationForm({...publicationForm, month: parseInt(v)})}>
                  <SelectTrigger><SelectValue placeholder="Tháng" /></SelectTrigger>
                  <SelectContent>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <SelectItem key={m} value={m.toString()}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Năm *</Label><Input type="number" value={publicationForm.year || ''} onChange={(e) => setPublicationForm({...publicationForm, year: parseInt(e.target.value)})} /></div>
            </div>
            <div className="space-y-2"><Label>Vai trò *</Label>
              <Select value={publicationForm.role || ''} onValueChange={(v) => setPublicationForm({...publicationForm, role: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                <SelectContent><SelectItem value="CHU_BIEN">Chủ biên</SelectItem><SelectItem value="THAM_GIA">Tham gia</SelectItem><SelectItem value="DONG_TAC_GIA">Đồng tác giả</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Đơn vị</Label><Input value={publicationForm.organization || ''} onChange={(e) => setPublicationForm({...publicationForm, organization: e.target.value})} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowPublicationDialog(false)}>Hủy</Button><Button onClick={handleSavePublication}>Lưu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
