/**
 * TRANG PHÂN CÔNG GIẢNG DẠY
 * - Chủ nhiệm bộ môn phân công giảng viên
 * - Thời gian: 2 tiết = 1 cặp, mỗi tiết 45 phút, nghỉ 5 phút giữa các cặp
 * - Sáng: 6 tiết, Chiều: 2 tiết, Tối: đặc biệt
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Calendar, Clock, Users, User, BookOpen, RefreshCw, Edit, ChevronDown, ChevronRight } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: '1', label: 'Thứ Hai' },
  { value: '2', label: 'Thứ Ba' },
  { value: '3', label: 'Thứ Tư' },
  { value: '4', label: 'Thứ Năm' },
  { value: '5', label: 'Thứ Sáu' },
  { value: '6', label: 'Thứ Bảy' },
  { value: '0', label: 'Chủ nhật' },
];

interface TimeSlot {
  pair: number;
  label: string;
  startTime: string;
  endTime: string;
  periods: number[];
  shift: string;
}

interface ClassSection {
  id: string;
  code: string;
  name: string;
  dayOfWeek: number | null;
  startPeriod: number | null;
  endPeriod: number | null;
  maxStudents: number;
  faculty: {
    id: string;
    academicRank: string | null;
    academicDegree: string | null;
    user: { id: string; name: string; email: string };
  } | null;
  room: { id: string; name: string; code: string; building: string | null } | null;
  curriculumCourse: {
    id: string;
    course: { id: string; code: string; name: string; credits: number };
  } | null;
  term: { id: string; name: string; termNumber: number };
  sessions: any[];
  _count: { enrollments: number };
}

interface Faculty {
  id: string;
  academicRank: string | null;
  academicDegree: string | null;
  user: { id: string; name: string; email: string };
  unit: { id: string; name: string; code: string } | null;
}

export default function TeachingAssignmentPage() {
  const [data, setData] = useState<{
    classSections: ClassSection[];
    availableFaculty: Faculty[];
    terms: any[];
    rooms: any[];
    units: any[];
    timeSlots: TimeSlot[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassSection | null>(null);
  const [assignForm, setAssignForm] = useState({
    facultyId: '',
    roomId: '',
    dayOfWeek: '',
    startPeriod: '',
    endPeriod: '',
    assignType: 'class_only',
  });

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTerm) params.append('termId', selectedTerm);
      if (selectedUnit) params.append('unitId', selectedUnit);
      if (selectedDay) params.append('dayOfWeek', selectedDay);

      const res = await fetch(`/api/education/teaching-assignment?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (!selectedTerm && result.terms?.length > 0) {
          const current = result.terms.find((t: any) => t.isCurrent);
          setSelectedTerm(current?.id || result.terms[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTerm, selectedUnit, selectedDay]);

  const openAssignDialog = (classSection: ClassSection) => {
    setSelectedClass(classSection);
    setAssignForm({
      facultyId: classSection.faculty?.id || '',
      roomId: classSection.room?.id || '',
      dayOfWeek: classSection.dayOfWeek?.toString() || '',
      startPeriod: classSection.startPeriod?.toString() || '',
      endPeriod: classSection.endPeriod?.toString() || '',
      assignType: 'class_only',
    });
    setAssignDialogOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch('/api/education/teaching-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classSectionId: selectedClass.id, ...assignForm }),
      });
      if (res.ok) {
        toast.success('Phân công thành công');
        setAssignDialogOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Lỗi khi phân công');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const toggleSection = (id: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSections(newSet);
  };

  const getDayLabel = (day: number | null) => {
    if (day === null) return 'Chưa xếp';
    return DAYS_OF_WEEK.find(d => d.value === day.toString())?.label || `Thứ ${day + 1}`;
  };

  const getPeriodLabel = (start: number | null, end: number | null) => {
    if (!start || !end) return 'Chưa xếp';
    return `Tiết ${start}-${end}`;
  };

  if (loading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Phân công giảng dạy
          </h1>
          <p className="text-muted-foreground mt-1">
            Phân công giảng viên cho các lớp học phần và buổi học
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
        </Button>
      </div>

      {/* Time Slots Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" /> Khung giờ huấn luyện
          </CardTitle>
          <CardDescription>
            Mỗi cặp tiết = 2 tiết x 45 phút = 90 phút. Nghỉ 5 phút giữa các cặp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data?.timeSlots?.map((slot) => (
              <Badge
                key={slot.pair}
                variant={slot.shift === 'morning' ? 'default' : slot.shift === 'afternoon' ? 'secondary' : 'outline'}
                className="text-sm py-1 px-3"
              >
                {slot.label}: {slot.startTime} - {slot.endTime}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Học kỳ</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger><SelectValue placeholder="Chọn học kỳ" /></SelectTrigger>
                <SelectContent>
                  {data?.terms?.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name} - {term.academicYear?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Bộ môn/Khoa</Label>
              <Select value={selectedUnit || '__ALL__'} onValueChange={(v) => setSelectedUnit(v === '__ALL__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Tất cả</SelectItem>
                  {data?.units?.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày trong tuần</Label>
              <Select value={selectedDay || '__ALL__'} onValueChange={(v) => setSelectedDay(v === '__ALL__' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Tất cả" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ALL__">Tất cả</SelectItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setSelectedUnit(''); setSelectedDay(''); }} className="w-full">
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng lớp HP</p>
                <p className="text-2xl font-bold">{data?.classSections?.length || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Đã phân công</p>
                <p className="text-2xl font-bold text-green-600">
                  {data?.classSections?.filter(c => c.faculty).length || 0}
                </p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chưa phân công</p>
                <p className="text-2xl font-bold text-amber-600">
                  {data?.classSections?.filter(c => !c.faculty).length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Giảng viên</p>
                <p className="text-2xl font-bold">{data?.availableFaculty?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Sections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lớp học phần</CardTitle>
          <CardDescription>Click vào dòng để xem chi tiết các buổi học</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.classSections?.length ? (
            <div className="text-center py-8 text-muted-foreground">Không có lớp học phần nào</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Mã lớp</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Lịch học</TableHead>
                  <TableHead>Phòng</TableHead>
                  <TableHead className="text-center">Sĩ số</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.classSections.map((cs) => (
                  <>
                    <TableRow key={cs.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSection(cs.id)}>
                      <TableCell>
                        {cs.sessions?.length > 0 && (
                          expandedSections.has(cs.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono font-medium">{cs.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cs.curriculumCourse?.course?.name || cs.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {cs.curriculumCourse?.course?.code} - {cs.curriculumCourse?.course?.credits} TC
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cs.faculty ? (
                          <div>
                            <div className="font-medium">{cs.faculty.user.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {cs.faculty.academicDegree} {cs.faculty.academicRank}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-amber-600">Chưa phân công</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">{getDayLabel(cs.dayOfWeek)}</Badge>
                          <span className="text-xs">{getPeriodLabel(cs.startPeriod, cs.endPeriod)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cs.room ? (
                          <div>
                            <div>{cs.room.name}</div>
                            <div className="text-xs text-muted-foreground">{cs.room.building}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Chưa xếp</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{cs._count.enrollments}</span>
                        <span className="text-muted-foreground">/{cs.maxStudents}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openAssignDialog(cs); }}>
                          <Edit className="h-4 w-4 mr-1" /> Phân công
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedSections.has(cs.id) && cs.sessions?.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="text-sm font-medium mb-2">Chi tiết {cs.sessions.length} buổi học:</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {cs.sessions.slice(0, 6).map((session: any) => (
                              <div key={session.id} className="p-2 bg-background rounded border text-sm">
                                <div className="font-medium">Buổi {session.sessionNumber}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(session.sessionDate).toLocaleDateString('vi-VN')}
                                  {session.startTime && ` - ${session.startTime}`}
                                </div>
                                <div className="text-xs">GV: {session.faculty?.user?.name || 'Chưa xếp'}</div>
                              </div>
                            ))}
                            {cs.sessions.length > 6 && (
                              <div className="p-2 text-center text-muted-foreground text-sm">+ {cs.sessions.length - 6} buổi khác</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Phân công giảng dạy</DialogTitle>
            <DialogDescription>
              {selectedClass?.curriculumCourse?.course?.name || selectedClass?.name} ({selectedClass?.code})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Giảng viên</Label>
              <Select value={assignForm.facultyId || '__NONE__'} onValueChange={(v) => setAssignForm({ ...assignForm, facultyId: v === '__NONE__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Chọn giảng viên" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">-- Chưa phân công --</SelectItem>
                  {data?.availableFaculty?.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.user.name} ({f.academicDegree}) - {f.unit?.name || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phòng học</Label>
              <Select value={assignForm.roomId || '__NONE__'} onValueChange={(v) => setAssignForm({ ...assignForm, roomId: v === '__NONE__' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__NONE__">-- Chưa xếp phòng --</SelectItem>
                  {data?.rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.building}) - {room.capacity} chỗ
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Ngày</Label>
                <Select value={assignForm.dayOfWeek || '__NONE__'} onValueChange={(v) => setAssignForm({ ...assignForm, dayOfWeek: v === '__NONE__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Chưa xếp</SelectItem>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tiết đầu</Label>
                <Select value={assignForm.startPeriod || '__NONE__'} onValueChange={(v) => setAssignForm({ ...assignForm, startPeriod: v === '__NONE__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Tiết" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Chưa xếp</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <SelectItem key={p} value={p.toString()}>Tiết {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tiết cuối</Label>
                <Select value={assignForm.endPeriod || '__NONE__'} onValueChange={(v) => setAssignForm({ ...assignForm, endPeriod: v === '__NONE__' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Tiết" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Chưa xếp</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <SelectItem key={p} value={p.toString()}>Tiết {p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Áp dụng cho</Label>
              <Select value={assignForm.assignType} onValueChange={(v) => setAssignForm({ ...assignForm, assignType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="class_only">Chỉ lớp học phần</SelectItem>
                  <SelectItem value="all_sessions">Tất cả buổi học ({selectedClass?.sessions?.length || 0} buổi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleAssign}>Lưu phân công</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
