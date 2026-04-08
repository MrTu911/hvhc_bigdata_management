/**
 * Insurance Create/Update Page - Thêm/Sửa thông tin BHXH
 * RBAC: INSURANCE.CREATE
 */

'use client';

import { useState, useEffect } from 'react';
import { useMasterData } from '@/hooks/use-master-data';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Shield, ArrowLeft, Save, Loader2, Search } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  militaryId?: string;
  rank?: string;
  unitRelation?: { name: string };
}

export default function InsuranceCreatePage() {
  const { data: session, status } = useSession() || {};
  const { items: insuranceTypeItems } = useMasterData('MD_INSURANCE_TYPE');
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [formData, setFormData] = useState({
    userId: userIdParam || '',
    insuranceNumber: '',
    healthInsuranceNumber: '',
    insuranceType: 'COMPULSORY',
    startDate: '',
    endDate: '',
    monthlyContribution: '',
    employeeContribution: '',
    employerContribution: '',
    hospitalCode: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (userIdParam) {
      fetchUserById(userIdParam);
    }
  }, [userIdParam]);

  const fetchUserById = async (id: string) => {
    try {
      const res = await fetch(`/api/personnel/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setSelectedUser(data.data);
          setFormData(prev => ({ ...prev, userId: id }));
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/personnel?search=${encodeURIComponent(searchTerm)}&limit=10`);
      const data = await res.json();
      if (data.data) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, userId: user.id }));
    setUsers([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      toast.error('Vui lòng chọn cán bộ');
      return;
    }

    if (!formData.insuranceNumber && !formData.healthInsuranceNumber) {
      toast.error('Vui lòng nhập ít nhất số BHXH hoặc số BHYT');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        monthlyContribution: formData.monthlyContribution ? parseFloat(formData.monthlyContribution) : null,
        employeeContribution: formData.employeeContribution ? parseFloat(formData.employeeContribution) : null,
        employerContribution: formData.employerContribution ? parseFloat(formData.employerContribution) : null,
      };

      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success('Lưu thông tin BHXH thành công');
        router.push('/dashboard/insurance/list');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi khi lưu thông tin');
      }
    } catch (error) {
      console.error('Error saving insurance:', error);
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // Insurance types from MDM (MD_INSURANCE_TYPE), fall back to static list if not yet seeded
  const insuranceTypes = insuranceTypeItems.length > 0
    ? insuranceTypeItems.map((it) => ({ value: it.code, label: it.nameVi }))
    : [
        { value: 'COMPULSORY', label: 'Bắt buộc' },
        { value: 'VOLUNTARY', label: 'Tự nguyện' },
        { value: 'MILITARY', label: 'Quân nhân' },
      ];

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/insurance/list" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-teal-500" />
          Thêm/Cập nhật Thông tin BHXH
        </h1>
        <p className="text-muted-foreground">Điền thông tin bảo hiểm xã hội cho cán bộ</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Chọn cán bộ */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin Cán bộ</CardTitle>
            <CardDescription>Tìm và chọn cán bộ cần cập nhật BHXH</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.rank} | Mã QN: {selectedUser.militaryId || '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Đơn vị: {selectedUser.unitRelation?.name || '-'}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                    Đổi cán bộ
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tìm theo tên hoặc mã quân nhân..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchUsers())}
                  />
                  <Button type="button" variant="outline" onClick={handleSearchUsers} disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                {users.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {users.map(user => (
                      <div
                        key={user.id}
                        className="p-3 hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectUser(user)}
                      >
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.rank} | {user.militaryId} | {user.unitRelation?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thông tin BHXH */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Bảo hiểm</CardTitle>
            <CardDescription>Nhập thông tin BHXH và BHYT</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Số BHXH & BHYT */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceNumber">Số BHXH</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuranceNumber: e.target.value }))}
                  placeholder="Nhập số BHXH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="healthInsuranceNumber">Số BHYT</Label>
                <Input
                  id="healthInsuranceNumber"
                  value={formData.healthInsuranceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, healthInsuranceNumber: e.target.value }))}
                  placeholder="Nhập số BHYT"
                />
              </div>
            </div>

            {/* Loại & Ngày */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceType">Loại bảo hiểm</Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, insuranceType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Mức đóng */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Mức đóng/tháng (VNĐ)</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyContribution: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeContribution">Người lao động đóng</Label>
                <Input
                  id="employeeContribution"
                  type="number"
                  value={formData.employeeContribution}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeContribution: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerContribution">Cơ quan đóng</Label>
                <Input
                  id="employerContribution"
                  type="number"
                  value={formData.employerContribution}
                  onChange={(e) => setFormData(prev => ({ ...prev, employerContribution: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Mã bệnh viện & Ghi chú */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hospitalCode">Mã cơ sở KCB</Label>
                <Input
                  id="hospitalCode"
                  value={formData.hospitalCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, hospitalCode: e.target.value }))}
                  placeholder="Nhập mã cơ sở KCB"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú thêm..."
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading || !formData.userId}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang lưu...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Lưu thông tin</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
