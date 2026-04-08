'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, User, GraduationCap, Briefcase, BookOpen, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { PersonalInfoTab } from '@/components/scientific-profile/personal-info-tab';
import { EducationTab } from '@/components/scientific-profile/education-tab';
import { WorkExperienceTab } from '@/components/scientific-profile/work-experience-tab';
import { PublicationsTab } from '@/components/scientific-profile/publications-tab';
import { ResearchTab } from '@/components/scientific-profile/research-tab';
import { AwardsTab } from '@/components/scientific-profile/awards-tab';

export default function ScientificProfilePage() {
  const { data: session } = useSession() || {};
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfileData();
    }
  }, [session]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/scientific-profile?userId=${session?.user?.id}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfileData(data);
    } catch (error: any) {
      toast.error('Lỗi tải dữ liệu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Đang xuất PDF...');
      const res = await fetch('/api/scientific-profile/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session?.user?.id }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ly_lich_khoa_hoc_${profileData?.user?.name || 'user'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success('Xuất PDF thành công!');
    } catch (error: any) {
      toast.dismiss();
      toast.error('Lỗi xuất PDF: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lý lịch Khoa học</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý hồ sơ khoa học cá nhân theo chuẩn Bộ Quốc phòng
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProfileData}>
            <FileText className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handleExportPDF} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <Download className="mr-2 h-4 w-4" />
            Xuất PDF
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đào tạo</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileData?.education?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công tác</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileData?.workExperience?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công trình</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileData?.publications?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đề tài</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileData?.research?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Khen thưởng</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profileData?.awards?.filter((a: any) => a.type === 'KHEN_THUONG')?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Quản lý Thông tin</CardTitle>
          <CardDescription>
            Cập nhật đầy đủ thông tin lý lịch khoa học của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="personal">
                <User className="mr-2 h-4 w-4" />
                Cá nhân
              </TabsTrigger>
              <TabsTrigger value="education">
                <GraduationCap className="mr-2 h-4 w-4" />
                Đào tạo
              </TabsTrigger>
              <TabsTrigger value="work">
                <Briefcase className="mr-2 h-4 w-4" />
                Công tác
              </TabsTrigger>
              <TabsTrigger value="publications">
                <BookOpen className="mr-2 h-4 w-4" />
                Công trình
              </TabsTrigger>
              <TabsTrigger value="research">
                <FileText className="mr-2 h-4 w-4" />
                Đề tài
              </TabsTrigger>
              <TabsTrigger value="awards">
                <Award className="mr-2 h-4 w-4" />
                Khen thưởng
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="personal" className="space-y-4">
                <PersonalInfoTab data={profileData?.user} onUpdate={fetchProfileData} />
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                <EducationTab 
                  data={profileData?.education || []} 
                  userId={session?.user?.id || ''} 
                  onUpdate={fetchProfileData} 
                />
              </TabsContent>

              <TabsContent value="work" className="space-y-4">
                <WorkExperienceTab 
                  data={profileData?.workExperience || []} 
                  userId={session?.user?.id || ''} 
                  onUpdate={fetchProfileData} 
                />
              </TabsContent>

              <TabsContent value="publications" className="space-y-4">
                <PublicationsTab 
                  data={profileData?.publications || []} 
                  userId={session?.user?.id || ''} 
                  onUpdate={fetchProfileData} 
                />
              </TabsContent>

              <TabsContent value="research" className="space-y-4">
                <ResearchTab 
                  data={profileData?.research || []} 
                  userId={session?.user?.id || ''} 
                  onUpdate={fetchProfileData} 
                />
              </TabsContent>

              <TabsContent value="awards" className="space-y-4">
                <AwardsTab 
                  data={profileData?.awards || []} 
                  userId={session?.user?.id || ''} 
                  onUpdate={fetchProfileData} 
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
