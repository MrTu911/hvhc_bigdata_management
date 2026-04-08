'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Search, Filter, Download, ChevronRight, RefreshCw, User, FileText } from 'lucide-react';
import Link from 'next/link';
import { useMasterData } from '@/hooks/use-master-data';

const WORK_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang công tác',
  TRANSFERRED: 'Đã chuyển',
  RETIRED: 'Nghỉ hưu',
  SUSPENDED: 'Đình chỉ',
  RESIGNED: 'Đã thôi việc',
};

const GENDER_LABELS: Record<string, string> = { MALE: 'Nam', FEMALE: 'Nữ' };

interface Personnel {
  id: string; name: string; militaryId?: string; rank?: string;
  position?: string; gender?: string; dateOfBirth?: string;
  workStatus?: string; isActive?: boolean;
  unitRelation?: { name: string };
  partyMember?: { status: string } | null;
}

interface SearchResult {
  personnel: Personnel[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  facets: {
    rank: { value: string; count: number }[];
    workStatus: { value: string; count: number }[];
    gender: { value: string; count: number }[];
  };
}

export default function AdvancedSearchPage() {
  const { items: rankItems } = useMasterData('MD_RANK');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [page, setPage] = useState(1);

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [rank, setRank] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [gender, setGender] = useState('');
  const [unitId, setUnitId] = useState('');
  const [dobFrom, setDobFrom] = useState('');
  const [dobTo, setDobTo] = useState('');
  const [isPartyMember, setIsPartyMember] = useState<boolean | undefined>(undefined);
  const [hasAwards, setHasAwards] = useState(false);
  const [hasDiscipline, setHasDiscipline] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSearch = async (p = 1) => {
    setLoading(true);
    setPage(p);
    try {
      const res = await fetch('/api/personnel/advanced-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword || undefined,
          rank: rank || undefined,
          workStatus: workStatus || undefined,
          gender: gender || undefined,
          unitId: unitId || undefined,
          dobFrom: dobFrom || undefined,
          dobTo: dobTo || undefined,
          isPartyMember,
          hasAwards: hasAwards || undefined,
          hasDiscipline: hasDiscipline || undefined,
          sortBy, sortOrder,
          page: p, limit: 20,
        }),
      });
      if (!res.ok) throw new Error('Lỗi tìm kiếm');
      setResult(await res.json());
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tìm kiếm', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setKeyword(''); setRank(''); setWorkStatus(''); setGender('');
    setUnitId(''); setDobFrom(''); setDobTo('');
    setIsPartyMember(undefined); setHasAwards(false); setHasDiscipline(false);
    setSortBy('name'); setSortOrder('asc');
    setResult(null);
  };

  const handleExport2A = (userId: string) => {
    window.open(`/api/personnel/export-2a?userId=${userId}`, '_blank');
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6 text-indigo-600" />
          Tìm kiếm nhân sự nâng cao
        </h1>
        <p className="text-muted-foreground mt-1">Lọc đa chiều: cấp bậc, đơn vị, ngày sinh, trạng thái, Đảng viên...</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" /> Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Từ khóa</Label>
              <Input placeholder="Tên, số quân, email..." value={keyword}
                onChange={e => setKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            </div>

            <div>
              <Label className="text-xs">Cấp bậc</Label>
              <Select value={rank || 'ALL'} onValueChange={v => setRank(v === 'ALL' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả cấp bậc</SelectItem>
                  {rankItems.length > 0
                    ? rankItems.map(r => <SelectItem key={r.code} value={r.nameVi}>{r.nameVi}</SelectItem>)
                    : ['Đại tướng','Thượng tướng','Trung tướng','Thiếu tướng','Đại tá','Thượng tá','Trung tá','Thiếu tá','Đại úy','Thượng úy','Trung úy','Thiếu úy','Thượng sĩ','Trung sĩ','Hạ sĩ','Binh nhất','Binh nhì'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Trạng thái</Label>
              <Select value={workStatus || 'ALL'} onValueChange={v => setWorkStatus(v === 'ALL' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  {Object.entries(WORK_STATUS_LABELS).map(([k, v]) =>
                    <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Giới tính</Label>
              <Select value={gender || 'ALL'} onValueChange={v => setGender(v === 'ALL' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Ngày sinh từ</Label>
              <Input type="date" value={dobFrom} onChange={e => setDobFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Ngày sinh đến</Label>
              <Input type="date" value={dobTo} onChange={e => setDobTo(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Điều kiện đặc biệt</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="party" checked={isPartyMember === true}
                  onCheckedChange={c => setIsPartyMember(c ? true : undefined)} />
                <label htmlFor="party" className="text-sm cursor-pointer">Đảng viên</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="awards" checked={hasAwards}
                  onCheckedChange={c => setHasAwards(!!c)} />
                <label htmlFor="awards" className="text-sm cursor-pointer">Có khen thưởng</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="discipline" checked={hasDiscipline}
                  onCheckedChange={c => setHasDiscipline(!!c)} />
                <label htmlFor="discipline" className="text-sm cursor-pointer">Có kỷ luật</label>
              </div>
            </div>

            <div>
              <Label className="text-xs">Sắp xếp theo</Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Họ tên</SelectItem>
                    <SelectItem value="rank">Cấp bậc</SelectItem>
                    <SelectItem value="dateOfBirth">Ngày sinh</SelectItem>
                    <SelectItem value="militaryId">Số quân</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">A→Z</SelectItem>
                    <SelectItem value="desc">Z→A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => handleSearch(1)} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" /> {loading ? 'Đang tìm...' : 'Tìm kiếm'}
              </Button>
              <Button variant="outline" onClick={handleReset} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" /> Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Tìm thấy <strong>{result.pagination.total}</strong> kết quả
                </p>
                {result.facets.rank.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {result.facets.workStatus.map(f => (
                      <Badge key={f.value} variant="outline" className="text-xs">
                        {WORK_STATUS_LABELS[f.value] || f.value}: {f.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="p-0">
                  {result.personnel.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">Không có kết quả</div>
                  ) : (
                    <div className="divide-y">
                      {result.personnel.map(p => (
                        <div key={p.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/40">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-full">
                              <User className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{p.name}</span>
                                {p.rank && <Badge variant="outline" className="text-xs">{p.rank}</Badge>}
                                {p.partyMember && <Badge className="text-xs bg-red-100 text-red-700">ĐV</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {p.militaryId && `SQ: ${p.militaryId} · `}
                                {p.position && `${p.position} · `}
                                {p.unitRelation?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {p.workStatus && (
                              <Badge className={`text-xs ${p.workStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {WORK_STATUS_LABELS[p.workStatus] || p.workStatus}
                              </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleExport2A(p.id)} title="Xuất 2A-LLDV">
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Link href={`/dashboard/personnel/${p.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {result.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handleSearch(page - 1)}>Trước</Button>
                  <span className="flex items-center text-sm px-2">Trang {page} / {result.pagination.totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= result.pagination.totalPages} onClick={() => handleSearch(page + 1)}>Sau</Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nhập điều kiện tìm kiếm và bấm <strong>Tìm kiếm</strong></p>
                <p className="text-xs mt-1">Hỗ trợ lọc theo cấp bậc, đơn vị, ngày sinh, Đảng viên, khen thưởng...</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
