'use client';

/**
 * Lý lịch khoa học — LĂNG KÍNH CHỈ ĐỌC + xuất CV.
 *
 * Sau hợp nhất hồ sơ: mọi chỉnh sửa đào tạo/ngoại ngữ/bằng cấp/công trình được thực hiện ở
 * trang hồ sơ điện tử canonical (/dashboard/profile). Trang này chỉ tổng hợp & xuất CV khoa học
 * (qua M18) để tránh hai cửa ghi cho cùng một dữ liệu.
 */
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, GraduationCap, Award, Languages, BookOpen, Eye, Pencil, Info } from 'lucide-react';

const LEVEL_MAP: Record<string, string> = {
  DAI_HOC: 'Đại học', THAC_SI: 'Thạc sĩ', TIEN_SI: 'Tiến sĩ',
  CU_NHAN_NGOAI_NGU: 'Cử nhân ngoại ngữ', KHAC: 'Khác',
};

const TYPE_MAP: Record<string, string> = {
  GIAO_TRINH: 'Giáo trình', TAI_LIEU: 'Tài liệu', BAI_TAP: 'Bài tập',
  BAI_BAO: 'Bài báo', SANG_KIEN: 'Sáng kiến', DE_TAI: 'Đề tài', GIAO_TRINH_DT: 'Giáo trình',
};

function fmtDate(value: unknown): string {
  if (!value) return '';
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN');
}

export default function ScientificCVPage() {
  const { status } = useSession() || {};
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('education');
  const [educations, setEducations] = useState<any[]>([]);
  const [foreignCerts, setForeignCerts] = useState<any[]>([]);
  const [technicalCerts, setTechnicalCerts] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
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
      console.error('Error fetching scientific CV:', error);
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

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-6">
        <Card><CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lý lịch khoa học</h1>
          <p className="text-muted-foreground">Tổng hợp & xuất CV khoa học cá nhân</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Eye className="mr-2 h-4 w-4" />Xem trước</Button>
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Xuất lý lịch</Button>
        </div>
      </div>

      {/* Read-only notice — chỉnh sửa dồn về trang hồ sơ điện tử canonical */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/20">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="flex-1 text-sm text-blue-800 dark:text-blue-200">
          Đây là bản tổng hợp <strong>chỉ đọc</strong>. Để thêm/sửa đào tạo, ngoại ngữ, bằng cấp, công trình khoa học,
          hãy chỉnh tại <strong>Hồ sơ điện tử</strong> — dữ liệu sẽ tự cập nhật về đây.
        </div>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href="/dashboard/profile?tab=education"><Pencil className="mr-1.5 h-3.5 w-3.5" />Sửa tại Hồ sơ điện tử</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="education"><GraduationCap className="mr-2 h-4 w-4" />Đào tạo</TabsTrigger>
          <TabsTrigger value="foreign"><Languages className="mr-2 h-4 w-4" />Ngoại ngữ</TabsTrigger>
          <TabsTrigger value="technical"><Award className="mr-2 h-4 w-4" />Bằng cấp</TabsTrigger>
          <TabsTrigger value="publications"><BookOpen className="mr-2 h-4 w-4" />Công trình KH</TabsTrigger>
        </TabsList>

        {/* Đào tạo */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Quá trình đào tạo</CardTitle>
              <CardDescription>Đại học, sau đại học</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Cấp độ</TableHead><TableHead>Chuyên ngành</TableHead><TableHead>Nơi học</TableHead>
                  <TableHead>Thời gian</TableHead><TableHead>Xếp loại</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {educations.map((edu) => (
                    <TableRow key={edu.id}>
                      <TableCell className="font-medium">{LEVEL_MAP[edu.level] || edu.level}</TableCell>
                      <TableCell>{edu.major}</TableCell>
                      <TableCell>{edu.institution}</TableCell>
                      <TableCell>{fmtDate(edu.startDate)} - {fmtDate(edu.endDate)}</TableCell>
                      <TableCell>{edu.classification}</TableCell>
                    </TableRow>
                  ))}
                  {educations.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ngoại ngữ */}
        <TabsContent value="foreign">
          <Card>
            <CardHeader>
              <CardTitle>Trình độ ngoại ngữ</CardTitle>
              <CardDescription>Chứng chỉ, bằng cấp</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Ngôn ngữ</TableHead><TableHead>Loại</TableHead><TableHead>Trình độ</TableHead>
                  <TableHead>Khung</TableHead><TableHead>Nơi cấp</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {foreignCerts.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.language}</TableCell>
                      <TableCell>{cert.certType}</TableCell>
                      <TableCell>{cert.certLevel}</TableCell>
                      <TableCell>{cert.framework}</TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                    </TableRow>
                  ))}
                  {foreignCerts.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bằng cấp */}
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Bằng cấp, chức danh kỹ thuật</CardTitle>
              <CardDescription>Được chính thức cấp</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Loại</TableHead><TableHead>Tên</TableHead><TableHead>Số hiệu</TableHead>
                  <TableHead>Xếp loại</TableHead><TableHead>Nơi cấp</TableHead><TableHead>Ngày cấp</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {technicalCerts.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell>{cert.certType}</TableCell>
                      <TableCell className="font-medium">{cert.certName}</TableCell>
                      <TableCell>{cert.certNumber}</TableCell>
                      <TableCell>{cert.classification}</TableCell>
                      <TableCell>{cert.issuer}</TableCell>
                      <TableCell>{fmtDate(cert.issueDate)}</TableCell>
                    </TableRow>
                  ))}
                  {technicalCerts.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Công trình KH */}
        <TabsContent value="publications">
          <Card>
            <CardHeader>
              <CardTitle>Công trình khoa học</CardTitle>
              <CardDescription>Giáo trình, sáng kiến, đề tài</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>STT</TableHead><TableHead>Loại</TableHead><TableHead>Tên</TableHead>
                  <TableHead>Đơn vị</TableHead><TableHead>Năm</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {publications.map((pub, idx) => (
                    <TableRow key={pub.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{TYPE_MAP[pub.type] || pub.type}</TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium">{pub.title}</TableCell>
                      <TableCell>{pub.organization}</TableCell>
                      <TableCell>{pub.month ? `${pub.month}/` : ''}{pub.year}</TableCell>
                    </TableRow>
                  ))}
                  {publications.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Chưa có dữ liệu</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
