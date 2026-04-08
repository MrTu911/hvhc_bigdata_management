'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/providers/language-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User, Shield, MapPin, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useMasterData } from '@/hooks/use-master-data';

interface Unit {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Position {
  id: string;
  code: string;
  name: string;
}

interface Ethnicity {
  id: string;
  code: string;
  name: string;
}

interface Religion {
  id: string;
  code: string;
  name: string;
}

interface Specialization {
  id: string;
  code: string;
  name: string;
  level: number;
  parentId: string | null;
}

interface AdministrativeUnit {
  id: string;
  code: string;
  name: string;
  fullName: string | null;
}

interface MilitaryRank {
  id: string;
  name: string;
  shortCode: string;
  category: string;
  orderNo: number;
}

interface EducationLevel {
  id: string;
  name: string;
  shortName: string | null;
  level: number;
}

export default function CreatePersonnelPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { t } = useLanguage();
  const { items: bloodTypeItems } = useMasterData('MD_BLOOD_TYPE');
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [ethnicities, setEthnicities] = useState<Ethnicity[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [provinces, setProvinces] = useState<AdministrativeUnit[]>([]);
  const [ranks, setRanks] = useState<MilitaryRank[]>([]);
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    militaryIdNumber: '',
    officerIdCard: '',
    citizenId: '',
    rank: '',
    position: '',      // Giữ để hiển thị
    positionId: '',    // ID chuẩn - FK
    unitId: '',
    unit: '',
    birthPlace: '',
    birthPlaceId: '',  // ID chuẩn - FK
    placeOfOrigin: '',
    placeOfOriginId: '', // ID chuẩn - FK
    permanentAddress: '',
    temporaryAddress: '',
    ethnicity: '',
    ethnicityId: '',   // ID chuẩn - FK
    religion: '',
    religionId: '',    // ID chuẩn - FK
    bloodType: '',
    educationLevel: '',
    specialization: '',
    specializationId: '', // ID chuẩn - FK
    enlistmentDate: '',
    joinDate: '',
    managementCategory: '',  // Diện cán bộ quản lý / Diện quân lực quản lý
    managementLevel: '',     // Trung ương, Bộ Quốc phòng, Học viện, Đơn vị
  });

  // Kiểm tra quyền truy cập
  const canCreate = session?.user?.role === 'QUAN_TRI_HE_THONG' || 
                    session?.user?.role === 'CHI_HUY_HOC_VIEN' ||
                    session?.user?.role === 'CHI_HUY_KHOA';

  // Fetch units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch('/api/admin/units');
        const data = await res.json();
        if (data.data) {
          const flattenUnits = (units: any[]): Unit[] => {
            let result: Unit[] = [];
            for (const unit of units) {
              result.push({ id: unit.id, name: unit.name, code: unit.code, type: unit.type });
              if (unit.children?.length > 0) {
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
    };

    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/admin/positions');
        const data = await res.json();
        if (data.data) {
          setPositions(data.data);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
      }
    };

    const fetchMasterData = async () => {
      try {
        // Fetch ethnicities
        const ethRes = await fetch('/api/master-data/ethnicities');
        const ethData = await ethRes.json();
        if (ethData.data) setEthnicities(ethData.data);

        // Fetch religions
        const relRes = await fetch('/api/master-data/religions');
        const relData = await relRes.json();
        if (relData.data) setReligions(relData.data);

        // Fetch specializations
        const specRes = await fetch('/api/master-data/specializations');
        const specData = await specRes.json();
        if (specData.data) setSpecializations(specData.data);

        // Fetch provinces
        const provRes = await fetch('/api/master-data/administrative-units?level=PROVINCE');
        const provData = await provRes.json();
        if (provData.data) setProvinces(provData.data);

        // Fetch military ranks
        const rankRes = await fetch('/api/master-data/ranks');
        const rankData = await rankRes.json();
        if (rankData.data) setRanks(rankData.data);

        // Fetch education levels
        const eduRes = await fetch('/api/master-data/education-levels');
        const eduData = await eduRes.json();
        if (eduData.data) setEducationLevels(eduData.data);
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };

    fetchUnits();
    fetchPositions();
    fetchMasterData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Kiểm tra các trường bắt buộc (dùng positionId thay vì position string)
  const requiredFields = ['name', 'email', 'rank', 'positionId', 'unitId', 'managementCategory', 'managementLevel'];
  const isFormValid = requiredFields.every(field => formData[field as keyof typeof formData]?.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Tạo hồ sơ cán bộ thành công');
        router.push('/dashboard/personnel/list');
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tạo hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Nếu không có quyền, hiển thị thông báo
  if (status === 'authenticated' && !canCreate) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-800">Không có quyền truy cập</h3>
                <p className="text-amber-700">Bạn không có quyền thêm mới cán bộ, quân nhân.</p>
              </div>
            </div>
            <Link href="/dashboard/personnel/list">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/personnel/list">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Thêm mới Cán bộ, Quân nhân
          </h1>
          <p className="text-muted-foreground">Nhập thông tin hồ sơ theo QĐ 144/BQP</p>
        </div>
        {isFormValid && (
          <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />Đủ điều kiện lưu
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
            <TabsTrigger value="military">Quân nhân</TabsTrigger>
            <TabsTrigger value="address">Địa chỉ</TabsTrigger>
            <TabsTrigger value="other">Bổ sung</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />Thông tin cá nhân
                </CardTitle>
                <CardDescription>Thông tin cơ bản của cán bộ</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Họ và tên <span className="text-red-500">*</span></Label>
                  <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Nguyễn Văn A" required />
                </div>
                <div>
                  <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="email@hvhc.edu.vn" required />
                </div>
                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="0912345678" />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="gender">Giới tính</Label>
                  <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn giới tính" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAM">Nam</SelectItem>
                      <SelectItem value="NU">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="citizenId">Số CCCD/CMND</Label>
                  <Input id="citizenId" value={formData.citizenId} onChange={(e) => handleChange('citizenId', e.target.value)} placeholder="001234567890" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="military">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />Thông tin Quân nhân
                </CardTitle>
                <CardDescription>Thông tin theo QĐ 144/BQP</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="militaryIdNumber">Mã định danh quân nhân</Label>
                  <Input id="militaryIdNumber" value={formData.militaryIdNumber} onChange={(e) => handleChange('militaryIdNumber', e.target.value)} placeholder="10 số" />
                </div>
                <div>
                  <Label htmlFor="officerIdCard">Số CMTSQ</Label>
                  <Input id="officerIdCard" value={formData.officerIdCard} onChange={(e) => handleChange('officerIdCard', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="rank">Quân hàm <span className="text-red-500">*</span></Label>
                  <Select value={formData.rank} onValueChange={(v) => handleChange('rank', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn quân hàm" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {ranks.map((rank, idx) => {
                        const prevRank = ranks[idx - 1];
                        const showGroup = !prevRank || prevRank.category !== rank.category;
                        return (
                          <div key={rank.id}>
                            {showGroup && (
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                                {rank.category}
                              </div>
                            )}
                            <SelectItem value={rank.name}>{rank.name}</SelectItem>
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Chức vụ <span className="text-red-500">*</span></Label>
                  <Select value={formData.positionId} onValueChange={(v) => {
                    const pos = positions.find(p => p.id === v);
                    handleChange('positionId', v);
                    handleChange('position', pos?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id}>{pos.name} ({pos.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="unitId">Đơn vị công tác <span className="text-red-500">*</span></Label>
                  <Select value={formData.unitId} onValueChange={(v) => handleChange('unitId', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="enlistmentDate">Ngày nhập ngũ</Label>
                  <Input id="enlistmentDate" type="date" value={formData.enlistmentDate} onChange={(e) => handleChange('enlistmentDate', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="joinDate">Ngày vào ngành</Label>
                  <Input id="joinDate" type="date" value={formData.joinDate} onChange={(e) => handleChange('joinDate', e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="managementCategory">Diện quản lý <span className="text-red-500">*</span></Label>
                  <Select value={formData.managementCategory} onValueChange={(v) => handleChange('managementCategory', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn diện quản lý" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAN_BO">Diện Cán bộ quản lý (Sĩ quan)</SelectItem>
                      <SelectItem value="QUAN_LUC">Diện Quân lực quản lý (QNCN/CCQP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="managementLevel">Cấp quản lý <span className="text-red-500">*</span></Label>
                  <Select value={formData.managementLevel} onValueChange={(v) => handleChange('managementLevel', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn cấp quản lý" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRUNG_UONG">Trung ương</SelectItem>
                      <SelectItem value="QUAN_CHUNG">Bộ Quốc phòng</SelectItem>
                      <SelectItem value="HOC_VIEN">Học viện</SelectItem>
                      <SelectItem value="DON_VI">Đơn vị</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />Địa chỉ
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birthPlace">Nơi sinh (Tỉnh/TP)</Label>
                  <Select value={formData.birthPlaceId} onValueChange={(v) => {
                    const prov = provinces.find(p => p.id === v);
                    handleChange('birthPlaceId', v);
                    handleChange('birthPlace', prov?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn tỉnh/thành phố" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {provinces.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="placeOfOrigin">Quê quán (Tỉnh/TP)</Label>
                  <Select value={formData.placeOfOriginId} onValueChange={(v) => {
                    const prov = provinces.find(p => p.id === v);
                    handleChange('placeOfOriginId', v);
                    handleChange('placeOfOrigin', prov?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn tỉnh/thành phố" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {provinces.map((prov) => (
                        <SelectItem key={prov.id} value={prov.id}>{prov.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="permanentAddress">Địa chỉ thường trú</Label>
                  <Input id="permanentAddress" value={formData.permanentAddress} onChange={(e) => handleChange('permanentAddress', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="temporaryAddress">Địa chỉ tạm trú</Label>
                  <Input id="temporaryAddress" value={formData.temporaryAddress} onChange={(e) => handleChange('temporaryAddress', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="other">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin bổ sung</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ethnicity">Dân tộc</Label>
                  <Select value={formData.ethnicityId} onValueChange={(v) => {
                    const eth = ethnicities.find(e => e.id === v);
                    handleChange('ethnicityId', v);
                    handleChange('ethnicity', eth?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn dân tộc" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {ethnicities.map((eth) => (
                        <SelectItem key={eth.id} value={eth.id}>{eth.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="religion">Tôn giáo</Label>
                  <Select value={formData.religionId} onValueChange={(v) => {
                    const rel = religions.find(r => r.id === v);
                    handleChange('religionId', v);
                    handleChange('religion', rel?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn tôn giáo" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {religions.map((rel) => (
                        <SelectItem key={rel.id} value={rel.id}>{rel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bloodType">Nhóm máu</Label>
                  <Select value={formData.bloodType} onValueChange={(v) => handleChange('bloodType', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn nhóm máu" /></SelectTrigger>
                    <SelectContent>
                      {bloodTypeItems.map((bt) => (
                        <SelectItem key={bt.code} value={bt.code}>{bt.nameVi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="educationLevel">Trình độ học vấn</Label>
                  <Select value={formData.educationLevel} onValueChange={(v) => handleChange('educationLevel', v)}>
                    <SelectTrigger><SelectValue placeholder="Chọn trình độ" /></SelectTrigger>
                    <SelectContent className="max-h-[260px]">
                      {educationLevels.map((edu) => (
                        <SelectItem key={edu.id} value={edu.name}>{edu.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="specialization">Chuyên ngành</Label>
                  <Select value={formData.specializationId} onValueChange={(v) => {
                    const spec = specializations.find(s => s.id === v);
                    handleChange('specializationId', v);
                    handleChange('specialization', spec?.name || '');
                  }}>
                    <SelectTrigger><SelectValue placeholder="Chọn chuyên ngành" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {specializations.filter(s => s.level === 1).map((parent) => (
                        <div key={parent.id}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                            {parent.name}
                          </div>
                          {specializations.filter(s => s.parentId === parent.id).map((child) => (
                            <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center gap-3 mt-6">
          <div className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Các trường bắt buộc
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/personnel/list">
              <Button variant="outline" type="button">Hủy</Button>
            </Link>
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" />Lưu hồ sơ</>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
