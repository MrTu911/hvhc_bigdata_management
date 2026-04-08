'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMasterData } from '@/hooks/use-master-data';
import { User, Shield, MapPin, GraduationCap, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface ProfileData {
  // Thông tin cơ bản
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  citizenId: string;
  // Thông tin quân nhân
  militaryId: string;
  rank: string;
  position: string;
  unitId: string;
  enlistmentDate: string;
  // Địa chỉ
  birthPlace: string;
  placeOfOrigin: string;
  permanentAddress: string;
  // Học vấn
  educationLevel: string;
  specialization: string;
  academicDegree: string;
  // Bổ sung
  ethnicity: string;
  religion: string;
  bloodType: string;
  maritalStatus: string;
}

interface MasterItem { id: string; name: string; }
interface RankItem { id: string; name: string; category: string; }

export default function CompleteProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { items: bloodTypeItems } = useMasterData('MD_BLOOD_TYPE');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [educationLevels, setEducationLevels] = useState<MasterItem[]>([]);
  const [academicTitles, setAcademicTitles] = useState<MasterItem[]>([]);
  const [ethnicities, setEthnicities] = useState<MasterItem[]>([]);
  const [religions, setReligions] = useState<MasterItem[]>([]);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    citizenId: '',
    militaryId: '',
    rank: '',
    position: '',
    unitId: '',
    enlistmentDate: '',
    birthPlace: '',
    placeOfOrigin: '',
    permanentAddress: '',
    educationLevel: '',
    specialization: '',
    academicDegree: '',
    ethnicity: '',
    religion: '',
    bloodType: '',
    maritalStatus: ''
  });

  // Load existing data
  const fetchProfileData = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/complete');
      const data = await res.json();
      if (data.success && data.data) {
        setFormData(prev => ({ ...prev, ...data.data }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load units
  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/units');
      const data = await res.json();
      if (data.data) {
        const flattenUnits = (items: any[]): Unit[] => {
          let result: Unit[] = [];
          for (const unit of items) {
            result.push({ id: unit.id, name: unit.name, code: unit.code });
            if (unit.children?.length) {
              result = result.concat(flattenUnits(unit.children));
            }
          }
          return result;
        };
        setUnits(flattenUnits(data.data));
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
    fetchUnits();
    // Fetch master data in parallel
    fetch('/api/master-data/ranks').then(r => r.json()).then(d => { if (d.success) setRanks(d.data); }).catch(() => {});
    fetch('/api/master-data/education-levels').then(r => r.json()).then(d => { if (d.success) setEducationLevels(d.data); }).catch(() => {});
    fetch('/api/master-data/academic-titles').then(r => r.json()).then(d => { if (d.success) setAcademicTitles(d.data); }).catch(() => {});
    fetch('/api/master-data/ethnicities').then(r => r.json()).then(d => { if (d.success) setEthnicities(d.data); }).catch(() => {});
    fetch('/api/master-data/religions').then(r => r.json()).then(d => { if (d.success) setReligions(d.data); }).catch(() => {});
  }, [fetchProfileData, fetchUnits]);

  // Calculate completion progress
  useEffect(() => {
    const requiredFields = ['fullName', 'email', 'phone', 'gender', 'dateOfBirth', 'citizenId', 'unitId'];
    const optionalFields = ['militaryId', 'rank', 'position', 'enlistmentDate', 'birthPlace', 
      'placeOfOrigin', 'permanentAddress', 'educationLevel', 'specialization', 'ethnicity', 'religion', 'bloodType'];
    
    const allFields = [...requiredFields, ...optionalFields];
    const filledFields = allFields.filter(field => formData[field as keyof ProfileData]);
    setCompletionProgress(Math.round((filledFields.length / allFields.length) * 100));
  }, [formData]);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập đầy đủ họ tên và email',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: 'Thành công',
          description: 'Hồ sơ đã được cập nhật',
        });
        router.push('/dashboard');
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể lưu hồ sơ',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Hoàn thiện hồ sơ cá nhân</h1>
        <p className="text-muted-foreground">
          Vui lòng cung cấp đầy đủ thông tin để sử dụng hệ thống
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Progress value={completionProgress} className="flex-1" />
            <Badge variant={completionProgress >= 80 ? 'default' : 'secondary'}>
              {completionProgress}% hoàn thành
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Cơ bản
          </TabsTrigger>
          <TabsTrigger value="military" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Quân nhân
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Địa chỉ
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Học vấn
          </TabsTrigger>
        </TabsList>

        {/* Basic Info */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin cá nhân bắt buộc</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Họ và tên <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="email@hvhc.edu.vn"
                />
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="0912345678"
                />
              </div>
              <div>
                <Label>Ngày sinh</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div>
                <Label>Giới tính</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NAM">Nam</SelectItem>
                    <SelectItem value="NU">Nữ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Số CCCD/CMND</Label>
                <Input
                  value={formData.citizenId}
                  onChange={(e) => handleChange('citizenId', e.target.value)}
                  placeholder="001234567890"
                />
              </div>
              <div>
                <Label>Dân tộc</Label>
                <Select value={formData.ethnicity} onValueChange={(v) => handleChange('ethnicity', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn dân tộc" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {ethnicities.map(e => (
                      <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tôn giáo</Label>
                <Select value={formData.religion} onValueChange={(v) => handleChange('religion', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn tôn giáo" /></SelectTrigger>
                  <SelectContent>
                    {religions.map(r => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nhóm máu</Label>
                <Select value={formData.bloodType} onValueChange={(v) => handleChange('bloodType', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn nhóm máu" /></SelectTrigger>
                  <SelectContent>
                    {bloodTypeItems.map(b => (
                      <SelectItem key={b.code} value={b.code}>{b.nameVi}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tình trạng hôn nhân</Label>
                <Select value={formData.maritalStatus} onValueChange={(v) => handleChange('maritalStatus', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOC_THAN">Độc thân</SelectItem>
                    <SelectItem value="DA_KET_HON">Đã kết hôn</SelectItem>
                    <SelectItem value="LY_HON">Ly hôn</SelectItem>
                    <SelectItem value="GOA">Góa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Military Info */}
        <TabsContent value="military">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Quân nhân</CardTitle>
              <CardDescription>Thông tin theo QĐ 144/BQP</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mã định danh quân nhân</Label>
                <Input
                  value={formData.militaryId}
                  onChange={(e) => handleChange('militaryId', e.target.value)}
                  placeholder="10 số"
                />
              </div>
              <div>
                <Label>Quân hàm</Label>
                <Select value={formData.rank} onValueChange={(v) => handleChange('rank', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ranks.map((r, idx) => {
                      const prev = ranks[idx - 1];
                      const showCat = !prev || prev.category !== r.category;
                      return (
                        <div key={r.id}>
                          {showCat && <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">{r.category}</div>}
                          <SelectItem value={r.name}>{r.name}</SelectItem>
                        </div>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Chức vụ</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="Trưởng phòng, Phó khoa..."
                />
              </div>
              <div>
                <Label>Đơn vị công tác</Label>
                <Select value={formData.unitId} onValueChange={(v) => handleChange('unitId', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ngày nhập ngũ</Label>
                <Input
                  type="date"
                  value={formData.enlistmentDate}
                  onChange={(e) => handleChange('enlistmentDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ</CardTitle>
              <CardDescription>Thông tin nơi cư trú</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nơi sinh</Label>
                <Input
                  value={formData.birthPlace}
                  onChange={(e) => handleChange('birthPlace', e.target.value)}
                  placeholder="Xã, Huyện, Tỉnh"
                />
              </div>
              <div>
                <Label>Quê quán</Label>
                <Input
                  value={formData.placeOfOrigin}
                  onChange={(e) => handleChange('placeOfOrigin', e.target.value)}
                  placeholder="Xã, Huyện, Tỉnh"
                />
              </div>
              <div className="col-span-2">
                <Label>Địa chỉ thường trú</Label>
                <Input
                  value={formData.permanentAddress}
                  onChange={(e) => handleChange('permanentAddress', e.target.value)}
                  placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Học vấn & Chuyên môn</CardTitle>
              <CardDescription>Trình độ học vấn và chuyên môn</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trình độ học vấn</Label>
                <Select value={formData.educationLevel} onValueChange={(v) => handleChange('educationLevel', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {educationLevels.map(e => (
                      <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Học hàm/Học vị</Label>
                <Select value={formData.academicDegree} onValueChange={(v) => handleChange('academicDegree', v)}>
                  <SelectTrigger><SelectValue placeholder="Chọn học hàm/học vị" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {academicTitles.map(a => (
                      <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Chuyên ngành</Label>
                <Input
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder="Công nghệ thông tin, Kinh tế..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <Card>
        <CardFooter className="flex justify-between pt-6">
          <Button variant="outline" onClick={() => router.back()}>
            Quay lại
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const tabs = ['basic', 'military', 'address', 'education'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                }
              }}
              disabled={activeTab === 'education'}
            >
              Tiếp theo
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <><span className="animate-spin mr-2">⏳</span> Đang lưu...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Lưu hồ sơ</>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
