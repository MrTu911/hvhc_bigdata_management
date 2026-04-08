/**
 * TRANG QUẢN LÝ LỊCH HUẤN LUYỆN
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Users, Calendar, Clock, Building2, RefreshCw, CalendarPlus, AlertTriangle, CheckCircle2 } from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
  { value: '0', label: 'Chủ nhật' },
];

const CLASS_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-green-500',
  CLOSED: 'bg-gray-500',
  IN_PROGRESS: 'bg-blue-500',
  COMPLETED: 'bg-purple-500',
  CANCELLED: 'bg-red-500',
};

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('classes');
  const [classSections, setClassSections] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [curriculumCourses, setCurriculumCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [search, setSearch] = useState('');
  
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const [classForm, setClassForm] = useState({
    code: '', name: '', curriculumCourseId: '', termId: '', facultyId: '', roomId: '',
    maxStudents: 50, schedule: '', dayOfWeek: '', startPeriod: '', endPeriod: '',
  });

  const [generateForm, setGenerateForm] = useState({
    numberOfSessions: 15, startDate: '', dayOfWeek: '1', startTime: '07:00', endTime: '09:30',
    sessionType: 'THEORY', roomId: '', facultyId: '',
  });

  // Conflict check state
  const [conflictResult, setConflictResult] = useState<{
    hasConflict: boolean;
    conflicts: Array<{
      type: string;
      severity: string;
      message: string;
      conflictingSectionCode: string;
      conflictingStartPeriod: number;
      conflictingEndPeriod: number;
    }>;
  } | null>(null);
  const [conflictChecking, setConflictChecking] = useState(false);
  const conflictTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/education/terms');
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
        const current = data.find((t: any) => t.isCurrent);
        if (current) setSelectedTerm(current.id);
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/training/rooms');
      if (res.ok) setRooms(await res.json());
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await fetch('/api/faculty/list');
      if (res.ok) {
        const data = await res.json();
        setFaculty(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    }
  };

  const fetchClassSections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedTerm) params.append('termId', selectedTerm);
      if (search) params.append('search', search);
      
      const res = await fetch(`/api/education/class-sections?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClassSections(data.data || data);
      }
    } catch (error) {
      console.error('Failed to fetch class sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (classSectionId: string) => {
    try {
      const res = await fetch(`/api/education/sessions?classSectionId=${classSectionId}`);
      if (res.ok) setSessions(await res.json());
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  useEffect(() => {
    fetchTerms();
    fetchRooms();
    fetchFaculty();
  }, []);

  useEffect(() => {
    if (selectedTerm) {
      fetchClassSections();
    }
  }, [selectedTerm, search]);

  useEffect(() => {
    if (selectedClass) {
      fetchSessions(selectedClass.id);
    }
  }, [selectedClass]);

  const runConflictCheck = useCallback(async (form: typeof classForm) => {
    const termId = form.termId || selectedTerm;
    const dayOfWeek = parseInt(form.dayOfWeek);
    const startPeriod = parseInt(form.startPeriod);
    const endPeriod = parseInt(form.endPeriod);

    if (!termId || !form.dayOfWeek || !form.startPeriod || !form.endPeriod) {
      setConflictResult(null);
      return;
    }
    if (isNaN(dayOfWeek) || isNaN(startPeriod) || isNaN(endPeriod)) {
      setConflictResult(null);
      return;
    }

    try {
      setConflictChecking(true);
      const res = await fetch('/api/education/class-sections/conflict-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termId,
          dayOfWeek,
          startPeriod,
          endPeriod,
          facultyId: form.facultyId || null,
          roomId: form.roomId || null,
          excludeSectionId: editingClass?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setConflictResult(data.data);
      }
    } catch {
      // silent — conflict check is best-effort
    } finally {
      setConflictChecking(false);
    }
  }, [selectedTerm, editingClass]);

  const scheduleConflictCheck = useCallback((form: typeof classForm) => {
    if (conflictTimer.current) clearTimeout(conflictTimer.current);
    conflictTimer.current = setTimeout(() => runConflictCheck(form), 600);
  }, [runConflictCheck]);

  const handleSubmitClass = async () => {
    // Block submit if hard conflict detected
    if (conflictResult?.hasConflict) {
      const confirmed = confirm(
        `Phát hiện ${conflictResult.conflicts.length} xung đột lịch.\nVẫn muốn tiếp tục tạo lớp?`
      );
      if (!confirmed) return;
    }

    try {
      const method = editingClass ? 'PUT' : 'POST';
      const body = editingClass ? { id: editingClass.id, ...classForm } : classForm;

      const res = await fetch('/api/education/class-sections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingClass ? 'Cập nhật thành công' : 'Tạo thành công');
        setClassDialogOpen(false);
        resetClassForm();
        fetchClassSections();
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleGenerateSessions = async () => {
    if (!selectedClass) return;
    try {
      const res = await fetch('/api/education/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          classSectionId: selectedClass.id,
          termId: selectedClass.termId,
          ...generateForm,
          dayOfWeek: parseInt(generateForm.dayOfWeek),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Đã tạo ${data.created} buổi học`);
        setGenerateDialogOpen(false);
        fetchSessions(selectedClass.id);
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Xác nhận xóa lớp học phần?')) return;
    try {
      const res = await fetch(`/api/education/class-sections?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchClassSections();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  };

  const resetClassForm = () => {
    setClassForm({
      code: '', name: '', curriculumCourseId: '', termId: selectedTerm, facultyId: '', roomId: '',
      maxStudents: 50, schedule: '', dayOfWeek: '', startPeriod: '', endPeriod: '',
    });
    setEditingClass(null);
    setConflictResult(null);
  };

  const openEditClass = (cls: any) => {
    setEditingClass(cls);
    setConflictResult(null);
    const form = {
      code: cls.code, name: cls.name,
      curriculumCourseId: cls.curriculumCourseId || '',
      termId: cls.termId, facultyId: cls.facultyId || '',
      roomId: cls.roomId || '', maxStudents: cls.maxStudents,
      schedule: cls.schedule || '',
      dayOfWeek: cls.dayOfWeek?.toString() || '',
      startPeriod: cls.startPeriod?.toString() || '',
      endPeriod: cls.endPeriod?.toString() || '',
    };
    setClassForm(form);
    setClassDialogOpen(true);
    // Run check with existing data
    scheduleConflictCheck(form);
  };

  const openGenerateDialog = (cls: any) => {
    setSelectedClass(cls);
    setGenerateForm({
      numberOfSessions: 15, startDate: new Date().toISOString().split('T')[0],
      dayOfWeek: cls.dayOfWeek?.toString() || '1',
      startTime: '07:00', endTime: '09:30', sessionType: 'THEORY',
      roomId: cls.roomId || '', facultyId: cls.facultyId || '',
    });
    setGenerateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lịch huấn luyện</h1>
          <p className="text-muted-foreground">Quản lý lớp học phần và lịch học</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isCurrent && '(Đang diễn ra)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={classDialogOpen} onOpenChange={(open) => { setClassDialogOpen(open); if (!open) resetClassForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Thêm lớp</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingClass ? 'Cập nhật' : 'Thêm'} lớp học phần</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mã lớp *</Label>
                    <Input value={classForm.code} onChange={(e) => setClassForm({ ...classForm, code: e.target.value })} placeholder="QS101-01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Sỹ số tối đa</Label>
                    <Input type="number" value={classForm.maxStudents} onChange={(e) => setClassForm({ ...classForm, maxStudents: parseInt(e.target.value) })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tên lớp *</Label>
                  <Input value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="Nhập môn Quân sự - Nhóm 01" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giảng viên</Label>
                    <Select value={classForm.facultyId} onValueChange={(v) => {
                      const next = { ...classForm, facultyId: v };
                      setClassForm(next);
                      scheduleConflictCheck(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Chọn GV" /></SelectTrigger>
                      <SelectContent>
                        {faculty.map((f: any) => (
                          <SelectItem key={f.id} value={f.id}>{f.user?.name || f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phòng học</Label>
                    <Select value={classForm.roomId} onValueChange={(v) => {
                      const next = { ...classForm, roomId: v };
                      setClassForm(next);
                      scheduleConflictCheck(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                      <SelectContent>
                        {rooms.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.code} - {r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Thứ</Label>
                    <Select value={classForm.dayOfWeek} onValueChange={(v) => {
                      const next = { ...classForm, dayOfWeek: v };
                      setClassForm(next);
                      scheduleConflictCheck(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tiết bắt đầu</Label>
                    <Input type="number" value={classForm.startPeriod} onChange={(e) => {
                      const next = { ...classForm, startPeriod: e.target.value };
                      setClassForm(next);
                      scheduleConflictCheck(next);
                    }} placeholder="1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tiết kết thúc</Label>
                    <Input type="number" value={classForm.endPeriod} onChange={(e) => {
                      const next = { ...classForm, endPeriod: e.target.value };
                      setClassForm(next);
                      scheduleConflictCheck(next);
                    }} placeholder="3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lịch học (mô tả)</Label>
                  <Input value={classForm.schedule} onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })} placeholder="Thứ 2, tiết 1-3, phòng A101" />
                </div>
              </div>

              {/* Conflict panel */}
              {conflictChecking && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Đang kiểm tra xung đột...
                </div>
              )}
              {!conflictChecking && conflictResult && (
                <div className={`rounded-md border p-3 text-sm ${
                  conflictResult.hasConflict
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-green-200 bg-green-50 text-green-800'
                }`}>
                  {conflictResult.hasConflict ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Phát hiện {conflictResult.conflicts.length} xung đột lịch
                      </div>
                      <ul className="space-y-1 text-xs">
                        {conflictResult.conflicts.map((c, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="mt-0.5 text-red-500">•</span>
                            <span>{c.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Không phát hiện xung đột lịch
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setClassDialogOpen(false)}>Hủy</Button>
                <Button onClick={handleSubmitClass}>{editingClass ? 'Cập nhật' : 'Tạo'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Generate Sessions Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch buổi học tự động</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">Lớp: {selectedClass?.code} - {selectedClass?.name}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Số buổi</Label>
                <Input type="number" value={generateForm.numberOfSessions} onChange={(e) => setGenerateForm({ ...generateForm, numberOfSessions: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={generateForm.startDate} onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Thứ</Label>
                <Select value={generateForm.dayOfWeek} onValueChange={(v) => setGenerateForm({ ...generateForm, dayOfWeek: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Giờ bắt đầu</Label>
                <Input type="time" value={generateForm.startTime} onChange={(e) => setGenerateForm({ ...generateForm, startTime: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Giờ kết thúc</Label>
                <Input type="time" value={generateForm.endTime} onChange={(e) => setGenerateForm({ ...generateForm, endTime: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleGenerateSessions}><CalendarPlus className="h-4 w-4 mr-2" /> Tạo lịch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Tìm theo mã, tên lớp..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button variant="outline" onClick={fetchClassSections}>
              <RefreshCw className="h-4 w-4 mr-2" /> Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Class Sections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lớp học phần</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lớp</TableHead>
                <TableHead>Tên lớp</TableHead>
                <TableHead>Giảng viên</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Lịch</TableHead>
                <TableHead>Sỹ số</TableHead>
                <TableHead>Buổi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : classSections.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Không có lớp nào</TableCell></TableRow>
              ) : (
                classSections.map((cls) => (
                  <TableRow key={cls.id} className={selectedClass?.id === cls.id ? 'bg-accent' : ''}>
                    <TableCell className="font-medium">{cls.code}</TableCell>
                    <TableCell>{cls.name}</TableCell>
                    <TableCell>{cls.faculty?.user?.name || '-'}</TableCell>
                    <TableCell>{cls.room?.code || '-'}</TableCell>
                    <TableCell>{cls.schedule || `${DAYS_OF_WEEK.find(d => d.value === cls.dayOfWeek?.toString())?.label || ''} Tiết ${cls.startPeriod || ''}-${cls.endPeriod || ''}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {cls.currentStudents}/{cls.maxStudents}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {cls._count?.sessions || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={CLASS_STATUS_COLORS[cls.status]}>
                        {cls.status === 'OPEN' ? 'Mở' : cls.status === 'IN_PROGRESS' ? 'Đang học' : cls.status === 'COMPLETED' ? 'Hoàn thành' : cls.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedClass(cls)} title="Xem buổi học">
                          <Calendar className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openGenerateDialog(cls)} title="Tạo lịch">
                          <CalendarPlus className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEditClass(cls)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteClass(cls.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sessions for selected class */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Buổi học - {selectedClass.code}: {selectedClass.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Chưa có buổi học nào. Nhấn "Tạo lịch" để tạo tự động.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Buổi</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Điểm danh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">Buổi {session.sessionNumber}</TableCell>
                      <TableCell>{new Date(session.sessionDate).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{session.startTime} - {session.endTime}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {session.sessionType === 'THEORY' ? 'Lý thuyết' : session.sessionType === 'PRACTICE' ? 'Thực hành' : session.sessionType}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.room?.code || '-'}</TableCell>
                      <TableCell>
                        <Badge className={session.status === 'COMPLETED' ? 'bg-green-500' : session.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'}>
                          {session.status === 'SCHEDULED' ? 'Đã lên lịch' : session.status === 'COMPLETED' ? 'Hoàn thành' : session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{session._count?.attendances || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
