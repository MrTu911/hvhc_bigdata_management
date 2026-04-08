'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  GraduationCap, 
  BookOpen, 
  Award, 
  Briefcase,
  Loader2,
  Save,
  Edit,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FacultyRadarChart } from '@/components/ai';

interface FacultyProfile {
  id: string;
  academicRank?: string;
  academicDegree?: string;
  specialization?: string;
  teachingSubjects?: any[];
  researchInterests?: string;
  researchProjects: number;
  publications: number;
  citations: number;
  teachingExperience: number;
  industryExperience: number;
  biography?: string;
  linkedinUrl?: string;
  googleScholarUrl?: string;
  isPublic: boolean;
}

export default function FacultyProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [formData, setFormData] = useState<Partial<FacultyProfile>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadProfile();
    }
  }, [status, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/faculty/profile');
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData(data.profile || {});
      } else {
        toast.error('Không thể tải profile');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Lỗi khi tải profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/faculty/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Cập nhật profile thành công!');
        await loadProfile();
        setEditing(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Không thể cập nhật profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Lỗi khi lưu profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            Hồ Sơ Giảng Viên
          </h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin học thuật và nghiên cứu
          </p>
        </div>
        
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh Sửa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(false); setFormData(profile || {}); }}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="academic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            Học Thuật
          </TabsTrigger>
          <TabsTrigger value="research">
            <BookOpen className="h-4 w-4 mr-2" />
            Nghiên Cứu
          </TabsTrigger>
          <TabsTrigger value="experience">
            <Briefcase className="h-4 w-4 mr-2" />
            Kinh Nghiệm
          </TabsTrigger>
          <TabsTrigger value="ai-analytics">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Analytics
          </TabsTrigger>
        </TabsList>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Học Thuật</CardTitle>
              <CardDescription>
                Học hàm, học vị và chuyên môn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Học Hàm</Label>
                  {editing ? (
                    <Select 
                      value={formData.academicRank || ''} 
                      onValueChange={(val) => handleChange('academicRank', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn học hàm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Giáo sư">Giáo sư (GS)</SelectItem>
                        <SelectItem value="Phó Giáo sư">Phó Giáo sư (PGS)</SelectItem>
                        <SelectItem value="Không có">Không có</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded">
                      {profile?.academicRank || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Học Vị</Label>
                  {editing ? (
                    <Select 
                      value={formData.academicDegree || ''} 
                      onValueChange={(val) => handleChange('academicDegree', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn học vị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiến sĩ">Tiến sĩ (TS)</SelectItem>
                        <SelectItem value="Thạc sĩ">Thạc sĩ (ThS)</SelectItem>
                        <SelectItem value="Kỹ sư">Kỹ sư (KS)</SelectItem>
                        <SelectItem value="Cử nhân">Cử nhân (CN)</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded">
                      {profile?.academicDegree || 'Chưa cập nhật'}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chuyên Môn</Label>
                {editing ? (
                  <Input
                    value={formData.specialization || ''}
                    onChange={(e) => handleChange('specialization', e.target.value)}
                    placeholder="Ví dụ: Hệ thống thông tin, Mạng máy tính..."
                  />
                ) : (
                  <div className="p-2 border rounded">
                    {profile?.specialization || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Research Tab */}
        <TabsContent value="research" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nghiên Cứu Khoa Học</CardTitle>
              <CardDescription>
                Các đề tài, bài báo và trích dẫn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Số Đề Tài</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.researchProjects || 0}
                      onChange={(e) => handleChange('researchProjects', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-3 border rounded bg-blue-50">
                      <div className="text-2xl font-bold text-blue-600">
                        {profile?.researchProjects || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">đề tài</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Số Bài Báo</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.publications || 0}
                      onChange={(e) => handleChange('publications', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-3 border rounded bg-green-50">
                      <div className="text-2xl font-bold text-green-600">
                        {profile?.publications || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">bài báo</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Số Trích Dẫn</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.citations || 0}
                      onChange={(e) => handleChange('citations', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-3 border rounded bg-purple-50">
                      <div className="text-2xl font-bold text-purple-600">
                        {profile?.citations || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">trích dẫn</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lĩnh Vực Nghiên Cứu</Label>
                {editing ? (
                  <Textarea
                    value={formData.researchInterests || ''}
                    onChange={(e) => handleChange('researchInterests', e.target.value)}
                    placeholder="Mô tả các lĩnh vực nghiên cứu quan tâm..."
                    rows={3}
                  />
                ) : (
                  <div className="p-2 border rounded">
                    {profile?.researchInterests || 'Chưa cập nhật'}
                  </div>
                )}
              </div>

              {editing && (
                <div className="space-y-2">
                  <Label>Google Scholar URL</Label>
                  <Input
                    type="url"
                    value={formData.googleScholarUrl || ''}
                    onChange={(e) => handleChange('googleScholarUrl', e.target.value)}
                    placeholder="https://scholar.google.com/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kinh Nghiệm</CardTitle>
              <CardDescription>
                Kinh nghiệm giảng dạy và làm việc thực tế
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kinh Nghiệm Giảng Dạy (năm)</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.teachingExperience || 0}
                      onChange={(e) => handleChange('teachingExperience', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {profile?.teachingExperience || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">năm giảng dạy</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Kinh Nghiệm Thực Tế (năm)</Label>
                  {editing ? (
                    <Input
                      type="number"
                      min="0"
                      value={formData.industryExperience || 0}
                      onChange={(e) => handleChange('industryExperience', parseInt(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-3 border rounded">
                      <div className="text-2xl font-bold">
                        {profile?.industryExperience || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">năm thực tế</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tiểu Sử</Label>
                {editing ? (
                  <Textarea
                    value={formData.biography || ''}
                    onChange={(e) => handleChange('biography', e.target.value)}
                    placeholder="Giới thiệu về quá trình công tác, đào tạo..."
                    rows={5}
                  />
                ) : (
                  <div className="p-2 border rounded min-h-[100px]">
                    {profile?.biography || 'Chưa cập nhật'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analytics Tab */}
        <TabsContent value="ai-analytics" className="space-y-6">
          {profile?.id && <FacultyRadarChart facultyId={profile.id} />}
          
          <Card>
            <CardHeader>
              <CardTitle>Về EIS Score</CardTitle>
              <CardDescription>
                Educational Impact Score - Chỉ số đánh giá tác động giáo dục
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold mb-2">EIS Score được tính dựa trên 6 yếu tố:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Chất lượng giảng dạy (30 điểm):</strong> Dựa trên tỷ lệ đạt của học viên</li>
                    <li>• <strong>Nghiên cứu khoa học (25 điểm):</strong> Số lượng và chất lượng công trình nghiên cứu</li>
                    <li>• <strong>Hướng dẫn học viên (20 điểm):</strong> GPA trung bình của học viên được hướng dẫn</li>
                    <li>• <strong>Đổi mới phương pháp (10 điểm):</strong> Số môn giảng dạy và phương pháp sáng tạo</li>
                    <li>• <strong>Lãnh đạo học thuật (10 điểm):</strong> Vai trò lãnh đạo trong khoa/bộ môn</li>
                    <li>• <strong>Hợp tác nghiên cứu (5 điểm):</strong> Mức độ hợp tác với đồng nghiệp</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold mb-2">Cách sử dụng EIS Score:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• EIS Score được cập nhật tự động dựa trên dữ liệu thực tế</li>
                    <li>• Điểm số từ 80-100: Xuất sắc | 60-79: Giỏi | 40-59: Khá | Dưới 40: Cần cải thiện</li>
                    <li>• Biểu đồ Radar giúp nhận diện điểm mạnh và điểm cần phát triển</li>
                    <li>• Lịch sử EIS theo thời gian giúp theo dõi xu hướng phát triển</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
