'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Calendar, Plus, Search, MapPin, CheckCircle, Clock, BookOpen, Heart, Users, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  MEETING: 'Sinh hoạt Đảng',
  STUDY: 'Học tập nghị quyết',
  CRITICISM: 'Phê bình và tự phê bình',
  VOLUNTEER: 'Hoạt động tình nguyện',
  OTHER: 'Hoạt động khác',
};

const ACTIVITY_TYPE_COLORS: Record<string, string> = {
  MEETING: 'bg-red-100 text-red-800',
  STUDY: 'bg-blue-100 text-blue-800',
  CRITICISM: 'bg-orange-100 text-orange-800',
  VOLUNTEER: 'bg-green-100 text-green-800',
  OTHER: 'bg-gray-100 text-gray-700',
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  MEETING: <Users className="h-4 w-4" />,
  STUDY: <BookOpen className="h-4 w-4" />,
  CRITICISM: <FileText className="h-4 w-4" />,
  VOLUNTEER: <Heart className="h-4 w-4" />,
  OTHER: <Calendar className="h-4 w-4" />,
};

interface Activity {
  id: string;
  activityType: string;
  activityDate: string;
  description: string;
  location?: string;
  result?: string;
  partyMember: {
    user: { name: string; militaryId?: string; rank?: string; unitRelation?: { name: string } };
  };
}

export default function PartyActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [activityType, setActivityType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    partyMemberId: '',
    activityType: 'MEETING',
    activityDate: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
    result: '',
  });

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), limit: '20',
        ...(activityType && { activityType }),
        ...(search && { search }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
      });
      const res = await fetch(`/api/party/activities?${params}`);
      const data = await res.json();
      setActivities(data.activities || []);
      setStats(data.stats?.byType || {});
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải dữ liệu', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, [activityType, page, fromDate, toDate]);

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/party/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast({ title: 'Thành công', description: 'Đã ghi nhận hoạt động' });
      setShowForm(false);
      setForm({ partyMemberId: '', activityType: 'MEETING', activityDate: new Date().toISOString().split('T')[0], description: '', location: '', result: '' });
      fetchActivities();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const chartData = Object.entries(ACTIVITY_TYPE_LABELS).map(([key, name]) => ({
    name: name.split(' ')[0],
    count: stats[key] || 0,
    fill: key === 'MEETING' ? '#EF4444' : key === 'STUDY' ? '#3B82F6' : key === 'CRITICISM' ? '#F97316' : key === 'VOLUNTEER' ? '#10B981' : '#6B7280',
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-red-600" />
            Sinh hoạt Đảng
          </h1>
          <p className="text-muted-foreground mt-1">Quản lý các buổi sinh hoạt và hoạt động Đảng</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" /> Ghi nhận hoạt động
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ghi nhận hoạt động Đảng</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div><Label>ID Đảng viên *</Label><Input value={form.partyMemberId} onChange={e => setForm(f => ({ ...f, partyMemberId: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Loại hoạt động *</Label>
                  <Select value={form.activityType} onValueChange={v => setForm(f => ({ ...f, activityType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ACTIVITY_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ngày hoạt động *</Label>
                  <Input type="date" value={form.activityDate} onChange={e => setForm(f => ({ ...f, activityDate: e.target.value }))} />
                </div>
              </div>
              <div><Label>Mô tả *</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><Label>Địa điểm</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div><Label>Kết quả</Label><Input value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))} /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
                <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">Lưu</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
            <Card key={key} className={`cursor-pointer hover:shadow-md transition-shadow ${activityType === key ? 'ring-2 ring-red-500' : ''}`} onClick={() => { setActivityType(activityType === key ? '' : key); setPage(1); }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-muted-foreground">{ACTIVITY_ICONS[key]}</span>
                  <span className="text-xl font-bold">{stats[key] || 0}</span>
                </div>
                <Badge className={`text-xs ${ACTIVITY_TYPE_COLORS[key]}`}>{label.split(' ')[0]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-sm">Thống kê theo loại</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Số hoạt động">
                  {chartData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-2 flex-1">
              <Input placeholder="Tìm theo mô tả, địa điểm..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPage(1), fetchActivities())} />
              <Button variant="outline" onClick={() => { setPage(1); fetchActivities(); }}><Search className="h-4 w-4" /></Button>
            </div>
            <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} className="w-36" placeholder="Từ ngày" />
            <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} className="w-36" placeholder="Đến ngày" />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Không có hoạt động nào</div>
          ) : (
            <div className="divide-y">
              {activities.map(act => (
                <div key={act.id} className="px-4 py-3 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-50 rounded-full mt-0.5">
                        {ACTIVITY_ICONS[act.activityType]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${ACTIVITY_TYPE_COLORS[act.activityType]}`}>
                            {ACTIVITY_TYPE_LABELS[act.activityType]}
                          </Badge>
                          <span className="font-medium text-sm">{act.partyMember?.user?.name}</span>
                          <span className="text-xs text-muted-foreground">{act.partyMember?.user?.militaryId}</span>
                        </div>
                        <p className="text-sm mt-1">{act.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(act.activityDate).toLocaleDateString('vi-VN')}
                          </span>
                          {act.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {act.location}
                            </span>
                          )}
                          {act.result && (
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {act.result}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{act.partyMember?.user?.unitRelation?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</Button>
          <span className="flex items-center text-sm px-2">Trang {page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
