'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  User,
  Building2,
  GraduationCap,
  Briefcase,
  Award,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileUser,
  Edit,
  Shield,
  BookOpen,
  FlaskConical,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Personnel {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  militaryId: string | null;
  rank: string | null;
  position: string | null;
  phone: string | null;
  avatar: string | null;
  address: string | null;
  workStatus: string;
  personnelType: string | null;
  educationLevel: string | null;
  specialization: string | null;
  placeOfOrigin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  joinDate: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  unitRelation: {
    id: string;
    name: string;
    code: string;
    type: string;
    level: number;
    parent: { id: string; name: string; code: string } | null;
  } | null;
  scientificProfile: {
    id: string;
    summary: string | null;
    isPublic: boolean;
  } | null;
  facultyProfile: {
    id: string;
    academicRank: string | null;
    academicDegree: string | null;
    specialization: string | null;
    publications: number;
    researchProjects: number;
    citations: number;
  } | null;
  educationHistory: Array<{
    id: string;
    level: string;
    institution: string;
    major: string | null;
    startDate: string | null;
    endDate: string | null;
    thesisTitle: string | null;
  }>;
  workExperience: Array<{
    id: string;
    organization: string;
    position: string;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  awardsRecords: Array<{
    id: string;
    type: string;
    category: string;
    description: string;
    year: number;
    awardedBy: string | null;
  }>;
  personnelAttachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
  }>;
  scientificPublications: Array<{
    id: string;
    type: string;
    title: string;
    year: number;
    role: string;
    publisher: string | null;
    organization: string | null;
    coAuthors: string | null;
  }>;
  scientificResearch: Array<{
    id: string;
    title: string;
    year: number;
    role: string;
    level: string;
    type: string;
    result: string | null;
  }>;
  partyMember: {
    id: string;
    partyCardNumber: string | null;
    joinDate: string | null;
    officialDate: string | null;
    partyCell: string | null;
    status: string;
    currentPosition: string | null;
    organization: { id: string; name: string } | null;
  } | null;
}

const WORK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Đang công tác', color: 'bg-green-100 text-green-800' },
  TRANSFERRED: { label: 'Chuyển công tác', color: 'bg-blue-100 text-blue-800' },
  RETIRED: { label: 'Nghỉ hưu', color: 'bg-gray-100 text-gray-800' },
  SUSPENDED: { label: 'Tạm đình chỉ', color: 'bg-orange-100 text-orange-800' },
  RESIGNED: { label: 'Nghỉ việc', color: 'bg-red-100 text-red-800' },
};

const PERSONNEL_TYPE_MAP: Record<string, string> = {
  CAN_BO_CHI_HUY: 'Cán bộ chỉ huy',
  GIANG_VIEN: 'Giảng viên',
  NGHIEN_CUU_VIEN: 'Nghiên cứu viên',
  CONG_NHAN_VIEN: 'Công nhân viên',
  HOC_VIEN_QUAN_SU: 'Học viên quân sự',
  SINH_VIEN_DAN_SU: 'Sinh viên dân sự',
};

const ATTACHMENT_TYPE_MAP: Record<string, string> = {
  SO_YEU_LY_LICH: 'Sơ yếu lý lịch',
  ANH_THE: 'Ảnh thẻ 4x6',
  QUYET_DINH_BO_NHIEM: 'QĐ bổ nhiệm',
  BANG_CAP: 'Bằng cấp',
  HO_SO_KHAC: 'Hồ sơ khác',
};

export default function PersonnelDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPersonnel() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/personnel/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPersonnel(data.data);
        } else {
          const err = await res.json();
          setError(err.error || 'Không thể tải hồ sơ');
        }
      } catch (err) {
        setError('Lỗi kết nối');
      } finally {
        setLoading(false);
      }
    }
    if (status === 'authenticated') {
      fetchPersonnel();
    }
  }, [id, status]);

  if (status === 'loading' || loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (error || !personnel) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Không thể truy cập</h3>
            <p className="text-muted-foreground mb-4">{error || 'Không tìm thấy hồ sơ cán bộ'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi });
    } catch {
      return '-';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Hồ sơ cán bộ</h1>
            <p className="text-muted-foreground">{personnel.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {personnel.scientificProfile && (
            <Link href={`/dashboard/faculty/scientific-profile?userId=${personnel.id}`}>
              <Button variant="outline">
                <FileUser className="h-4 w-4 mr-2" />
                Lý lịch khoa học
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                {personnel.name?.charAt(0) || '?'}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-xl font-bold">{personnel.name}</h2>
                <p className="text-muted-foreground">{personnel.position || 'Chưa có chức vụ'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={WORK_STATUS_MAP[personnel.workStatus]?.color}>
                    {WORK_STATUS_MAP[personnel.workStatus]?.label}
                  </Badge>
                  {personnel.personnelType && (
                    <Badge variant="outline">
                      {PERSONNEL_TYPE_MAP[personnel.personnelType]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden md:block h-auto" />

            {/* Info Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoItem icon={<User />} label="Mã cán bộ" value={personnel.employeeId || personnel.militaryId || '-'} />
              <InfoItem icon={<Shield />} label="Cấp bậc" value={personnel.rank || '-'} />
              <InfoItem icon={<Mail />} label="Email" value={personnel.email} />
              <InfoItem icon={<Phone />} label="SĐT" value={personnel.phone || '-'} />
              <InfoItem icon={<Building2 />} label="Đơn vị" value={personnel.unitRelation?.name || '-'} />
              <InfoItem icon={<GraduationCap />} label="Trình độ" value={personnel.educationLevel || '-'} />
              <InfoItem icon={<Calendar />} label="Ngày sinh" value={formatDate(personnel.dateOfBirth)} />
              <InfoItem icon={<MapPin />} label="Quê quán" value={personnel.placeOfOrigin || '-'} />
              <InfoItem icon={<Calendar />} label="Ngày vào ngành" value={formatDate(personnel.joinDate || personnel.startDate)} />
              <InfoItem icon={<Briefcase />} label="Chuyên ngành" value={personnel.specialization || '-'} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="education" className="space-y-4">
        <TabsList>
          <TabsTrigger value="education">
            <GraduationCap className="h-4 w-4 mr-2" />
            Học vấn
          </TabsTrigger>
          <TabsTrigger value="work">
            <Briefcase className="h-4 w-4 mr-2" />
            Quá trình công tác
          </TabsTrigger>
          <TabsTrigger value="awards">
            <Award className="h-4 w-4 mr-2" />
            Khen thưởng
          </TabsTrigger>
          <TabsTrigger value="attachments">
            <FileText className="h-4 w-4 mr-2" />
            Tài liệu
          </TabsTrigger>
          {personnel.partyMember && (
            <TabsTrigger value="party">
              <Star className="h-4 w-4 mr-2" />
              Đảng viên
            </TabsTrigger>
          )}
          {(personnel.scientificPublications?.length > 0 || personnel.scientificResearch?.length > 0 || personnel.scientificProfile || personnel.facultyProfile) && (
            <TabsTrigger value="scientific">
              <FlaskConical className="h-4 w-4 mr-2" />
              Khoa học
            </TabsTrigger>
          )}
        </TabsList>

        {/* Education History */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Quá trình học tập</CardTitle>
              <CardDescription>Lịch sử đào tạo và bằng cấp</CardDescription>
            </CardHeader>
            <CardContent>
              {personnel.educationHistory.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Chưa có thông tin học vấn</p>
              ) : (
                <div className="space-y-4">
                  {personnel.educationHistory.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{edu.level}</h4>
                          <p className="text-muted-foreground">{edu.institution}</p>
                          {edu.major && <p className="text-sm">Chuyên ngành: {edu.major}</p>}
                          {edu.thesisTitle && <p className="text-sm italic mt-1">Luận văn: {edu.thesisTitle}</p>}
                        </div>
                        <Badge variant="outline">
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'nay'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Experience */}
        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle>Quá trình công tác</CardTitle>
              <CardDescription>Lịch sử làm việc và chức vụ</CardDescription>
            </CardHeader>
            <CardContent>
              {personnel.workExperience.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Chưa có thông tin công tác</p>
              ) : (
                <div className="space-y-4">
                  {personnel.workExperience.map((work) => (
                    <div key={work.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{work.position}</h4>
                          <p className="text-muted-foreground">{work.organization}</p>
                          {work.description && <p className="text-sm mt-2">{work.description}</p>}
                        </div>
                        <Badge variant="outline">
                          {formatDate(work.startDate)} - {work.endDate ? formatDate(work.endDate) : 'nay'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards */}
        <TabsContent value="awards">
          <Card>
            <CardHeader>
              <CardTitle>Khen thưởng - Kỷ luật</CardTitle>
              <CardDescription>Danh hiệu, huân chương và hình thức kỷ luật</CardDescription>
            </CardHeader>
            <CardContent>
              {personnel.awardsRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Chưa có thông tin khen thưởng</p>
              ) : (
                <div className="space-y-4">
                  {personnel.awardsRecords.map((award) => (
                    <div key={award.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{award.category}</h4>
                            <Badge variant={award.type === 'KHEN_THUONG' ? 'default' : 'destructive'}>
                              {award.type === 'KHEN_THUONG' ? 'Khen thưởng' : 'Kỷ luật'}
                            </Badge>
                          </div>
                          {award.awardedBy && <p className="text-muted-foreground">{award.awardedBy}</p>}
                          {award.description && <p className="text-sm mt-2">{award.description}</p>}
                        </div>
                        <Badge variant="outline">Năm {award.year}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attachments */}
        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Tài liệu đính kèm</CardTitle>
              <CardDescription>Sơ yếu lý lịch, ảnh thẻ, quyết định...</CardDescription>
            </CardHeader>
            <CardContent>
              {personnel.personnelAttachments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Chưa có tài liệu đính kèm</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {personnel.personnelAttachments.map((att) => (
                    <div key={att.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{att.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {ATTACHMENT_TYPE_MAP[att.fileType] || att.fileType}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDate(att.uploadedAt)}
                        </span>
                        <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">Tải về</Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Party Membership */}
        {personnel.partyMember && (
          <TabsContent value="party">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin Đảng viên</CardTitle>
                <CardDescription>Thông tin tổ chức Đảng</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={<Star />} label="Số thẻ Đảng" value={personnel.partyMember.partyCardNumber || '-'} />
                  <InfoItem icon={<Calendar />} label="Ngày vào Đảng" value={formatDate(personnel.partyMember.joinDate)} />
                  <InfoItem icon={<Calendar />} label="Ngày chính thức" value={formatDate(personnel.partyMember.officialDate)} />
                  <InfoItem icon={<Building2 />} label="Chi bộ" value={personnel.partyMember.partyCell || '-'} />
                  <InfoItem icon={<Shield />} label="Chức vụ Đảng" value={personnel.partyMember.currentPosition || 'Đảng viên'} />
                  <InfoItem icon={<Building2 />} label="Tổ chức Đảng" value={personnel.partyMember.organization?.name || '-'} />
                  <div className="col-span-2">
                    <Badge className={personnel.partyMember.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {personnel.partyMember.status === 'ACTIVE' ? 'Đang hoạt động' : personnel.partyMember.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Scientific Profile */}
        {(personnel.scientificPublications?.length > 0 || personnel.scientificResearch?.length > 0 || personnel.scientificProfile || personnel.facultyProfile) && (
          <TabsContent value="scientific">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin khoa học</CardTitle>
                <CardDescription>Tóm tắt lý lịch khoa học</CardDescription>
              </CardHeader>
              <CardContent>
                {personnel.facultyProfile && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {personnel.facultyProfile.publications}
                      </p>
                      <p className="text-sm text-muted-foreground">Công bố</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">
                        {personnel.facultyProfile.researchProjects}
                      </p>
                      <p className="text-sm text-muted-foreground">Đề tài</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {personnel.facultyProfile.citations}
                      </p>
                      <p className="text-sm text-muted-foreground">Trích dẫn</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-lg font-semibold">
                        {personnel.facultyProfile.academicRank || '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">Học hàm</p>
                    </div>
                  </div>
                )}
                {/* Publications list */}
                {personnel.scientificPublications?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Công trình khoa học ({personnel.scientificPublications.length})
                    </h4>
                    <div className="space-y-2">
                      {personnel.scientificPublications.map((pub) => (
                        <div key={pub.id} className="border rounded p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{pub.title}</p>
                              {pub.publisher && <p className="text-xs text-muted-foreground">{pub.publisher}</p>}
                              {pub.coAuthors && <p className="text-xs text-gray-500">Đồng tác giả: {pub.coAuthors}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-xs">{pub.year}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{pub.role === 'CHU_BIEN' ? 'Chủ biên' : pub.role === 'DONG_TAC_GIA' ? 'Đồng tác giả' : 'Tham gia'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Research projects */}
                {personnel.scientificResearch?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-green-500" />
                      Đề tài nghiên cứu ({personnel.scientificResearch.length})
                    </h4>
                    <div className="space-y-2">
                      {personnel.scientificResearch.map((r) => (
                        <div key={r.id} className="border rounded p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{r.title}</p>
                              <p className="text-xs text-muted-foreground">{r.level} • {r.type}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <Badge variant="outline" className="text-xs">{r.year}</Badge>
                              {r.result && <p className="text-xs text-green-600 mt-1">{r.result}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Link href={`/dashboard/faculty/scientific-profile?userId=${personnel.id}`}>
                    <Button className="w-full">
                      <FileUser className="h-4 w-4 mr-2" />
                      Xem chi tiết lý lịch khoa học
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Info Item Component
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-muted rounded-lg text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
