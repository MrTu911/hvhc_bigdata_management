'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { MeetingCalendar } from '@/components/party/meeting/meeting-calendar';
import { AttendanceSheet } from '@/components/party/meeting/attendance-sheet';
import { useMasterData } from '@/hooks/use-master-data';

const MEETING_TYPES = [
  'THUONG_KY',
  'BAT_THUONG',
  'MO_RONG',
  'CHUYEN_DE',
  'KIEM_DIEM_CUOI_NAM',
  'BAU_CU',
];

export default function PartyMeetingsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [orgOptions, setOrgOptions] = useState<any[]>([]);

  const [orgId, setOrgId] = useState('');
  const [meetingType, setMeetingType] = useState('THUONG_KY');
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [location, setLocation] = useState('');
  const [attendanceItems, setAttendanceItems] = useState<any[]>([]);
  const [minutesUrl, setMinutesUrl] = useState('');
  const [resolutionUrl, setResolutionUrl] = useState('');
  const { items: mdMeetingTypes } = useMasterData('MD_PARTY_MEETING_TYPE');

  const meetingTypeOptions =
    mdMeetingTypes.length > 0
      ? mdMeetingTypes.map((x) => ({ value: x.code, label: x.nameVi }))
      : MEETING_TYPES.map((x) => ({ value: x, label: x }));

  const selected = useMemo(() => items.find((x) => x.id === selectedId), [items, selectedId]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/party/meetings?limit=100');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được danh sách cuộc họp');
      const rows = data.data || [];
      setItems(rows);
      if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/party/meetings/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được chi tiết');
      setAttendanceItems(data.data?.attendances || []);
      setMinutesUrl(data.data?.minutesUrl || '');
      setResolutionUrl(data.data?.resolutionUrl || '');
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const fetchOrgs = async () => {
    try {
      const res = await fetch('/api/party/orgs?limit=500');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Không tải được danh sách tổ chức');
      setOrgOptions(data.data || []);
    } catch {
      // keep silent, user still can use existing data
    }
  };

  useEffect(() => {
    fetchList();
    fetchOrgs();
  }, []);

  useEffect(() => {
    fetchDetail(selectedId);
  }, [selectedId]);

  const createMeeting = async () => {
    try {
      const res = await fetch('/api/party/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partyOrgId: orgId, meetingType, title, meetingDate, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo cuộc họp thất bại');
      toast({ title: 'Thành công', description: 'Đã tạo lịch họp' });
      setOrgId('');
      setTitle('');
      setMeetingDate('');
      setLocation('');
      fetchList();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const saveAttendance = async () => {
    if (!selectedId) return;
    try {
      const payload = attendanceItems.map((x: any) => ({
        partyMemberId: x.partyMemberId,
        attendanceStatus: x.attendanceStatus,
        absenceReason: x.absenceReason || null,
        note: x.note || null,
      }));
      const res = await fetch(`/api/party/meetings/${selectedId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu điểm danh thất bại');
      toast({ title: 'Thành công', description: 'Đã lưu điểm danh' });
      fetchDetail(selectedId);
      fetchList();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const saveMinutes = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/party/meetings/${selectedId}/minutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutesUrl, resolutionUrl, status: 'held' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu biên bản thất bại');
      toast({ title: 'Thành công', description: 'Đã cập nhật biên bản và nghị quyết' });
      fetchDetail(selectedId);
      fetchList();
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Lịch họp chi bộ & điểm danh</h1>
        <p className="text-sm text-muted-foreground">Quản lý lịch họp, điểm danh đảng viên, biên bản và nghị quyết.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tạo cuộc họp</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={orgId || 'NONE'} onValueChange={(v) => setOrgId(v === 'NONE' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Chọn tổ chức Đảng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Chọn tổ chức Đảng</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name} ({org.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {meetingTypeOptions.map((x) => <SelectItem key={x.value} value={x.value}>{x.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
            <Input placeholder="Địa điểm" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={createMeeting}>Tạo lịch họp</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Meeting calendar</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-sm text-muted-foreground">Đang tải...</div> : <MeetingCalendar items={items} selectedId={selectedId} onSelect={setSelectedId} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Chi tiết cuộc họp</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="text-sm">
                  <div><b>Tiêu đề:</b> {selected.title}</div>
                  <div><b>Thời gian:</b> {new Date(selected.meetingDate).toLocaleString('vi-VN')}</div>
                  <div><b>Địa điểm:</b> {selected.location || '-'}</div>
                </div>

                <AttendanceSheet items={attendanceItems} onChange={setAttendanceItems} onSubmit={saveAttendance} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <Input placeholder="Minutes URL" value={minutesUrl} onChange={(e) => setMinutesUrl(e.target.value)} />
                  <Input placeholder="Resolution URL" value={resolutionUrl} onChange={(e) => setResolutionUrl(e.target.value)} />
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={saveMinutes}>Lưu biên bản</Button>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Chọn một cuộc họp để thao tác</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
