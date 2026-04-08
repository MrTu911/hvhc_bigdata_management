/**
 * Thêm mới Đảng viên – Modern UI
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, Shield, User, Calendar, Users, Hash, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  rank?: string;
  position?: string;
  militaryId?: string;
}

export default function CreatePartyMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    userId: '',
    partyCardNumber: '',
    joinDate: '',
    officialDate: '',
    partyCell: '',
    partyCommittee: '',
    recommender1: '',
    recommender2: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchNonPartyMembers();
  }, []);

  const fetchNonPartyMembers = async () => {
    try {
      const res = await fetch('/api/personnel/non-party-members');
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error fetching non-party members:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    const user = users.find((u) => u.id === userId) || null;
    setSelectedUser(user);
    setFormData((f) => ({ ...f, userId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      toast.error('Vui lòng chọn cán bộ');
      return;
    }
    if (!formData.joinDate) {
      toast.error('Vui lòng nhập ngày vào Đảng');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/party-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Kết nạp Đảng viên thành công');
        router.push('/dashboard/party/list');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Không thể kết nạp Đảng viên');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/party/list">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Kết nạp Đảng viên mới</h1>
              <p className="text-sm text-muted-foreground">Nhập thông tin theo quy trình kết nạp Đảng</p>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Info className="h-3 w-3 mr-1" />
          {users.length} cán bộ chưa vào Đảng
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Step 1: Chọn cán bộ */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Bước 1 – Chọn cán bộ
            </CardTitle>
            <CardDescription>Chỉ hiển thị cán bộ chưa là Đảng viên</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.userId}
              onValueChange={handleUserSelect}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder={loadingUsers ? 'Đang tải danh sách...' : 'Tìm và chọn cán bộ...'} />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.rank && <Badge variant="secondary" className="text-xs">{user.rank}</Badge>}
                      <span className="text-muted-foreground text-xs">({user.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedUser && (
              <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Họ tên: </span>
                  <span className="font-medium">{selectedUser.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cấp bậc: </span>
                  <span>{selectedUser.rank || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Chức vụ: </span>
                  <span>{selectedUser.position || '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mã QN: </span>
                  <span>{selectedUser.militaryId || '—'}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Thông tin Đảng */}
        <Card className="border-l-4 border-l-red-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Bước 2 – Thông tin Đảng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  Số thẻ Đảng
                </Label>
                <Input
                  value={formData.partyCardNumber}
                  onChange={(e) => setFormData({ ...formData, partyCardNumber: e.target.value })}
                  placeholder="VD: DV-2025-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                        Đang sinh hoạt
                      </span>
                    </SelectItem>
                    <SelectItem value="TRANSFERRED">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
                        Chuyển sinh hoạt
                      </span>
                    </SelectItem>
                    <SelectItem value="SUSPENDED">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        Tạm dừng
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày kết nạp (dự bị) <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Ngày chính thức (nếu đã có)
                </Label>
                <Input
                  type="date"
                  value={formData.officialDate}
                  onChange={(e) => setFormData({ ...formData, officialDate: e.target.value })}
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Chi bộ sinh hoạt</Label>
                <Input
                  value={formData.partyCell}
                  onChange={(e) => setFormData({ ...formData, partyCell: e.target.value })}
                  placeholder="VD: Chi bộ Khoa CNTT"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Đảng ủy trực thuộc</Label>
                <Input
                  value={formData.partyCommittee}
                  onChange={(e) => setFormData({ ...formData, partyCommittee: e.target.value })}
                  placeholder="VD: Đảng ủy Học viện"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Người giới thiệu */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Bước 3 – Người giới thiệu
            </CardTitle>
            <CardDescription>Cần 2 đảng viên chính thức giới thiệu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Người giới thiệu thứ nhất</Label>
                <Input
                  value={formData.recommender1}
                  onChange={(e) => setFormData({ ...formData, recommender1: e.target.value })}
                  placeholder="Họ và tên đảng viên giới thiệu"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Người giới thiệu thứ hai</Label>
                <Input
                  value={formData.recommender2}
                  onChange={(e) => setFormData({ ...formData, recommender2: e.target.value })}
                  placeholder="Họ và tên đảng viên giới thiệu"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/dashboard/party/list">
            <Button type="button" variant="outline">
              Hủy
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !formData.userId}
            className="bg-red-600 hover:bg-red-700 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kết nạp Đảng viên
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
