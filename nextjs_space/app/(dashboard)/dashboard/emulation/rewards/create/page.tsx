/**
 * Create Reward Page
 * Thêm Khen thưởng mới - Load toàn bộ sĩ quan với lọc theo đơn vị
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  ArrowLeft,
  Save,
  Search,
  Building2,
  User,
  Users,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const REWARD_LEVELS = [
  { value: 'NATIONAL', label: 'Cấp Nhà nước' },
  { value: 'MINISTRY', label: 'Cấp Bộ' },
  { value: 'UNIT', label: 'Cấp Học viện' },
  { value: 'DEPARTMENT', label: 'Cấp Khoa/Phòng' },
];

const REWARD_TYPES = [
  { value: 'HUAN_CHUONG', label: 'Huân chương', description: 'Huân chương các hạng' },
  { value: 'BANG_KHEN', label: 'Bằng khen', description: 'Bằng khen cấp trên' },
  { value: 'GIAO_KHEN', label: 'Giấy khen', description: 'Giấy khen cấp đơn vị' },
  { value: 'DANH_HIEU', label: 'Danh hiệu thi đua', description: 'Chiến sĩ thi đua, đơn vị tiên tiến...' },
  { value: 'GIAI_THUONG', label: 'Giải thưởng', description: 'Giải thưởng các loại' },
  { value: 'CHUNG_NHAN', label: 'Chứng nhận', description: 'Chứng nhận thành tích' },
];

interface Personnel {
  id: string;
  name: string;
  email: string;
  rank: string | null;
  position: string | null;
  militaryId: string | null;
  unitId: string | null;
  unitRelation: {
    id: string;
    name: string;
    code: string;
    level: number;
  } | null;
}

interface Unit {
  id: string;
  name: string;
  code: string;
  level: number;
  parentId: string | null;
}

export default function CreateRewardPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  
  // Filters for personnel selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [selectedLevel1, setSelectedLevel1] = useState<string>('all');
  const [selectedLevel2, setSelectedLevel2] = useState<string>('all');
  const [selectedLevel3, setSelectedLevel3] = useState<string>('all');
  
  // Selected personnel
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  
  // Form state
  const [form, setForm] = useState({
    rewardType: '',
    level: '',
    reason: '',
    decisionNumber: '',
    decisionDate: '',
    effectiveDate: '',
    signerName: '',
    signerPosition: '',
    issuingUnit: 'Học viện Hậu cần',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch all personnel (officers)
      const personnelRes = await fetch('/api/personnel?limit=1000');
      if (personnelRes.ok) {
        const data = await personnelRes.json();
        setPersonnel(data.personnel || data.data || []);
      }

      // Fetch all units
      const unitsRes = await fetch('/api/units');
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setUnits(data.units || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  // Filter units by level
  const level1Units = useMemo(() => units.filter(u => u.level === 1), [units]);
  const level2Units = useMemo(() => {
    if (selectedLevel1 === 'all') return units.filter(u => u.level === 2);
    return units.filter(u => u.level === 2 && u.parentId === selectedLevel1);
  }, [units, selectedLevel1]);
  const level3Units = useMemo(() => {
    if (selectedLevel2 === 'all') return units.filter(u => u.level === 3);
    return units.filter(u => u.level === 3 && u.parentId === selectedLevel2);
  }, [units, selectedLevel2]);

  // Filtered personnel based on search and unit filters
  const filteredPersonnel = useMemo(() => {
    return personnel.filter(p => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          p.name?.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.militaryId?.toLowerCase().includes(query) ||
          p.rank?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Unit filter - check all levels
      if (selectedLevel3 !== 'all') {
        return p.unitId === selectedLevel3;
      }
      if (selectedLevel2 !== 'all') {
        // Include personnel in this unit or any child units
        const childUnitIds = units.filter(u => u.parentId === selectedLevel2).map(u => u.id);
        return p.unitId === selectedLevel2 || childUnitIds.includes(p.unitId || '');
      }
      if (selectedLevel1 !== 'all') {
        // Include personnel in this unit or any descendant units
        const level2Ids = units.filter(u => u.parentId === selectedLevel1).map(u => u.id);
        const level3Ids = units.filter(u => level2Ids.includes(u.parentId || '')).map(u => u.id);
        return p.unitId === selectedLevel1 || 
               level2Ids.includes(p.unitId || '') || 
               level3Ids.includes(p.unitId || '');
      }

      return true;
    });
  }, [personnel, searchQuery, selectedLevel1, selectedLevel2, selectedLevel3, units]);

  const togglePersonnel = (id: string) => {
    setSelectedPersonnel(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id) 
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedPersonnel(filteredPersonnel.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedPersonnel([]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.rewardType) {
      toast.error('Vui lòng chọn hình thức khen thưởng');
      return;
    }
    if (!form.level) {
      toast.error('Vui lòng chọn cấp khen thưởng');
      return;
    }
    if (!form.reason) {
      toast.error('Vui lòng nhập lý do khen thưởng');
      return;
    }
    if (selectedPersonnel.length === 0) {
      toast.error('Vui lòng chọn ít nhất một cán bộ');
      return;
    }

    setSubmitting(true);
    try {
      // Create reward for each selected personnel
      const rewardType = REWARD_TYPES.find(t => t.value === form.rewardType);
      
      const promises = selectedPersonnel.map(userId => 
        fetch('/api/policy-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            recordType: 'REWARD',
            title: rewardType?.label || form.rewardType,
            level: form.level,
            reason: form.reason,
            decisionNumber: form.decisionNumber,
            decisionDate: form.decisionDate ? new Date(form.decisionDate).toISOString() : null,
            effectiveDate: form.effectiveDate ? new Date(form.effectiveDate).toISOString() : null,
            signerName: form.signerName,
            signerPosition: form.signerPosition,
            issuingUnit: form.issuingUnit,
            workflowStatus: 'APPROVED', // Auto-approve for admin
            status: 'ACTIVE',
          }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.ok).length;

      if (successCount === selectedPersonnel.length) {
        toast.success(`Đã thêm ${successCount} khen thưởng thành công`);
        router.push('/dashboard/emulation/rewards');
      } else {
        toast.warning(`Đã thêm ${successCount}/${selectedPersonnel.length} khen thưởng`);
      }
    } catch (error) {
      console.error('Error creating rewards:', error);
      toast.error('Có lỗi xảy ra khi thêm khen thưởng');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/emulation/rewards')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Trophy className="h-7 w-7 text-white" />
            </div>
            Thêm Khen thưởng mới
          </h1>
          <p className="text-muted-foreground mt-1">
            Chọn cán bộ và nhập thông tin khen thưởng
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Personnel Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Chọn cán bộ ({selectedPersonnel.length} đã chọn)
            </CardTitle>
            <CardDescription>
              Lọc và chọn cán bộ được khen thưởng
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã quân nhân, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Unit Filters - 3 levels */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Lọc theo đơn vị
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={selectedLevel1} onValueChange={(v) => {
                  setSelectedLevel1(v);
                  setSelectedLevel2('all');
                  setSelectedLevel3('all');
                }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Cấp 1" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {level1Units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLevel2} onValueChange={(v) => {
                  setSelectedLevel2(v);
                  setSelectedLevel3('all');
                }}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Cấp 2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {level2Units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedLevel3} onValueChange={setSelectedLevel3}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Cấp 3" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {level3Units.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Select all / Deselect all */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Hiển thị {filteredPersonnel.length} cán bộ
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Chọn tất cả
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Bỏ chọn
                </Button>
              </div>
            </div>

            {/* Personnel List */}
            <ScrollArea className="h-80 border rounded-md">
              <div className="p-2 space-y-1">
                {filteredPersonnel.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy cán bộ nào
                  </div>
                ) : (
                  filteredPersonnel.map(p => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        selectedPersonnel.includes(p.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                      }`}
                      onClick={() => togglePersonnel(p.id)}
                    >
                      <Checkbox checked={selectedPersonnel.includes(p.id)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {p.rank && <span>{p.rank}</span>}
                          {p.position && <span>- {p.position}</span>}
                        </div>
                        {p.unitRelation && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span>{p.unitRelation.name}</span>
                          </div>
                        )}
                      </div>
                      {selectedPersonnel.includes(p.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right: Reward Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Thông tin Khen thưởng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Reward Type */}
            <div className="space-y-2">
              <Label>Hình thức khen thưởng <span className="text-red-500">*</span></Label>
              <Select value={form.rewardType} onValueChange={(v) => setForm({...form, rewardType: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hình thức" />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label>Cấp khen thưởng <span className="text-red-500">*</span></Label>
              <Select value={form.level} onValueChange={(v) => setForm({...form, level: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cấp" />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Lý do khen thưởng <span className="text-red-500">*</span></Label>
              <Textarea
                placeholder="Nhập lý do khen thưởng..."
                value={form.reason}
                onChange={(e) => setForm({...form, reason: e.target.value})}
                rows={3}
              />
            </div>

            {/* Decision Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số quyết định</Label>
                <Input
                  placeholder="VD: QĐ-125/HVHC"
                  value={form.decisionNumber}
                  onChange={(e) => setForm({...form, decisionNumber: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày quyết định</Label>
                <Input
                  type="date"
                  value={form.decisionDate}
                  onChange={(e) => setForm({...form, decisionDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ngày hiệu lực</Label>
              <Input
                type="date"
                value={form.effectiveDate}
                onChange={(e) => setForm({...form, effectiveDate: e.target.value})}
              />
            </div>

            {/* Signer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Người ký</Label>
                <Input
                  placeholder="Họ tên người ký"
                  value={form.signerName}
                  onChange={(e) => setForm({...form, signerName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Chức vụ người ký</Label>
                <Input
                  placeholder="Chức vụ"
                  value={form.signerPosition}
                  onChange={(e) => setForm({...form, signerPosition: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cơ quan ra quyết định</Label>
              <Input
                value={form.issuingUnit}
                onChange={(e) => setForm({...form, issuingUnit: e.target.value})}
              />
            </div>

            {/* Summary */}
            {selectedPersonnel.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>
                    Sẽ tạo <strong>{selectedPersonnel.length}</strong> khen thưởng cho các cán bộ đã chọn
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/emulation/rewards')} className="flex-1">
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                {submitting ? (
                  <>Đang lưu...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Lưu Khen thưởng
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
