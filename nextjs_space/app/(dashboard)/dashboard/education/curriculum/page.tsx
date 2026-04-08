/**
 * TRANG QUẢN LÝ KHUNG CHƯƠNG TRÌNH ĐÀO TẠO
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, CheckCircle, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const COURSE_TYPES = [
  { value: 'REQUIRED', label: 'Bắt buộc' },
  { value: 'ELECTIVE', label: 'Tự chọn' },
  { value: 'CORE', label: 'Cốt lõi' },
  { value: 'GENERAL', label: 'Đại cương' },
  { value: 'SPECIALIZED', label: 'Chuyên ngành' },
  { value: 'THESIS', label: 'Luận văn/Đồ án' },
  { value: 'INTERNSHIP', label: 'Thực tập' },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  PENDING_APPROVAL: 'bg-yellow-500',
  ACTIVE: 'bg-green-500',
  ARCHIVED: 'bg-blue-500',
};

export default function CurriculumPage() {
  const searchParams = useSearchParams();
  const programIdParam = searchParams.get('programId');
  
  const [plans, setPlans] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const [planForm, setPlanForm] = useState({
    code: '', name: '', programId: '', cohort: '', totalCredits: 120, version: '1.0', notes: '',
  });

  const [courseForm, setCourseForm] = useState({
    subjectCode: '', subjectName: '', credits: 3, theoryHours: 30, practiceHours: 15,
    labHours: 0, semester: 1, courseType: 'REQUIRED', description: '', sortOrder: 0,
  });

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/education/programs');
      if (res.ok) setPrograms(await res.json());
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (programIdParam) params.append('programId', programIdParam);
      const res = await fetch(`/api/education/curriculum?${params}`);
      if (res.ok) setPlans(await res.json());
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async (planId: string) => {
    try {
      const res = await fetch(`/api/education/curriculum?type=courses&curriculumPlanId=${planId}`);
      if (res.ok) setCourses(await res.json());
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchPlans();
  }, [programIdParam]);

  useEffect(() => {
    if (expandedPlan) {
      fetchCourses(expandedPlan);
    }
  }, [expandedPlan]);

  const handleSubmitPlan = async () => {
    try {
      const method = editingPlan ? 'PUT' : 'POST';
      const body = editingPlan ? { id: editingPlan.id, ...planForm } : planForm;
      
      const res = await fetch('/api/education/curriculum', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingPlan ? 'Cập nhật thành công' : 'Tạo thành công');
        setPlanDialogOpen(false);
        resetPlanForm();
        fetchPlans();
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleSubmitCourse = async () => {
    try {
      const method = editingCourse ? 'PUT' : 'POST';
      const body = editingCourse 
        ? { type: 'course', id: editingCourse.id, ...courseForm }
        : { type: 'course', curriculumPlanId: selectedPlan.id, ...courseForm };
      
      const res = await fetch('/api/education/curriculum', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCourse ? 'Cập nhật thành công' : 'Thêm thành công');
        setCourseDialogOpen(false);
        resetCourseForm();
        fetchCourses(selectedPlan.id);
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Xác nhận xóa khung CTĐT?')) return;
    try {
      const res = await fetch(`/api/education/curriculum?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchPlans();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Xác nhận xóa môn học?')) return;
    try {
      const res = await fetch(`/api/education/curriculum?id=${id}&type=course`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        if (selectedPlan) fetchCourses(selectedPlan.id);
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  };

  const handleApprovePlan = async (id: string) => {
    try {
      const res = await fetch('/api/education/curriculum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });
      if (res.ok) {
        toast.success('Phê duyệt thành công');
        fetchPlans();
      }
    } catch (error) {
      toast.error('Lỗi');
    }
  };

  const resetPlanForm = () => {
    setPlanForm({ code: '', name: '', programId: '', cohort: '', totalCredits: 120, version: '1.0', notes: '' });
    setEditingPlan(null);
  };

  const resetCourseForm = () => {
    setCourseForm({
      subjectCode: '', subjectName: '', credits: 3, theoryHours: 30, practiceHours: 15,
      labHours: 0, semester: 1, courseType: 'REQUIRED', description: '', sortOrder: 0,
    });
    setEditingCourse(null);
  };

  const openEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      code: plan.code, name: plan.name, programId: plan.programId,
      cohort: plan.cohort || '', totalCredits: plan.totalCredits,
      version: plan.version, notes: plan.notes || '',
    });
    setPlanDialogOpen(true);
  };

  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      subjectCode: course.subjectCode, subjectName: course.subjectName,
      credits: course.credits, theoryHours: course.theoryHours,
      practiceHours: course.practiceHours, labHours: course.labHours,
      semester: course.semester, courseType: course.courseType,
      description: course.description || '', sortOrder: course.sortOrder,
    });
    setCourseDialogOpen(true);
  };

  const openAddCourse = (plan: any) => {
    setSelectedPlan(plan);
    resetCourseForm();
    setCourseDialogOpen(true);
  };

  const toggleExpandPlan = (planId: string) => {
    if (expandedPlan === planId) {
      setExpandedPlan(null);
      setSelectedPlan(null);
    } else {
      setExpandedPlan(planId);
      setSelectedPlan(plans.find(p => p.id === planId));
    }
  };

  // Group courses by semester
  const groupedCourses = courses.reduce((acc, course) => {
    const sem = `Học kỳ ${course.semester}`;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(course);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Khung chương trình đào tạo</h1>
          <p className="text-muted-foreground">Quản lý khung CTĐT và môn học theo khóa</p>
        </div>
        <Dialog open={planDialogOpen} onOpenChange={(open) => { setPlanDialogOpen(open); if (!open) resetPlanForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Thêm khung CTĐT</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Cập nhật' : 'Thêm'} khung CTĐT</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã khung *</Label>
                  <Input value={planForm.code} onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })} placeholder="QS-CN-K45" />
                </div>
                <div className="space-y-2">
                  <Label>Khóa</Label>
                  <Input value={planForm.cohort} onChange={(e) => setPlanForm({ ...planForm, cohort: e.target.value })} placeholder="K45" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tên khung CTĐT *</Label>
                <Input value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Khung CTĐT Quân sự K45" />
              </div>
              <div className="space-y-2">
                <Label>Chương trình *</Label>
                <Select value={planForm.programId} onValueChange={(v) => setPlanForm({ ...planForm, programId: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn CTĐT" /></SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tổng tín chỉ</Label>
                  <Input type="number" value={planForm.totalCredits} onChange={(e) => setPlanForm({ ...planForm, totalCredits: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Phiên bản</Label>
                  <Input value={planForm.version} onChange={(e) => setPlanForm({ ...planForm, version: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmitPlan}>{editingPlan ? 'Cập nhật' : 'Tạo'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={(open) => { setCourseDialogOpen(open); if (!open) resetCourseForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCourse ? 'Cập nhật' : 'Thêm'} môn học</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mã môn *</Label>
                <Input value={courseForm.subjectCode} onChange={(e) => setCourseForm({ ...courseForm, subjectCode: e.target.value })} placeholder="QS101" />
              </div>
              <div className="space-y-2">
                <Label>Học kỳ</Label>
                <Select value={courseForm.semester.toString()} onValueChange={(v) => setCourseForm({ ...courseForm, semester: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <SelectItem key={s} value={s.toString()}>Học kỳ {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tên môn học *</Label>
              <Input value={courseForm.subjectName} onChange={(e) => setCourseForm({ ...courseForm, subjectName: e.target.value })} placeholder="Nhập môn Quân sự" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Tín chỉ</Label>
                <Input type="number" value={courseForm.credits} onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>LT (giờ)</Label>
                <Input type="number" value={courseForm.theoryHours} onChange={(e) => setCourseForm({ ...courseForm, theoryHours: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>TH (giờ)</Label>
                <Input type="number" value={courseForm.practiceHours} onChange={(e) => setCourseForm({ ...courseForm, practiceHours: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>TN (giờ)</Label>
                <Input type="number" value={courseForm.labHours} onChange={(e) => setCourseForm({ ...courseForm, labHours: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Loại môn</Label>
              <Select value={courseForm.courseType} onValueChange={(v) => setCourseForm({ ...courseForm, courseType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURSE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmitCourse}>{editingCourse ? 'Cập nhật' : 'Thêm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plans List */}
      <div className="space-y-4">
        {loading ? (
          <Card><CardContent className="py-8 text-center">Đang tải...</CardContent></Card>
        ) : plans.length === 0 ? (
          <Card><CardContent className="py-8 text-center">Chưa có khung CTĐT nào</CardContent></Card>
        ) : (
          plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="cursor-pointer" onClick={() => toggleExpandPlan(plan.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedPlan === plan.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {plan.code} - {plan.name}
                        <Badge className={STATUS_COLORS[plan.status]}>
                          {plan.status === 'DRAFT' ? 'Nháp' : plan.status === 'ACTIVE' ? 'Đang áp dụng' : plan.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.program?.name} | Khóa {plan.cohort || '-'} | {plan.totalCredits} TC | {plan._count?.courses || 0} môn
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {plan.status === 'DRAFT' && (
                      <Button size="sm" variant="outline" onClick={() => handleApprovePlan(plan.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Duyệt
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openAddCourse(plan)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditPlan(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedPlan === plan.id && (
                <CardContent>
                  {Object.keys(groupedCourses).length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Chưa có môn học nào</p>
                  ) : (
                    <Tabs defaultValue={Object.keys(groupedCourses)[0]} className="w-full">
                      <TabsList className="mb-4">
                        {Object.keys(groupedCourses).sort().map((sem) => (
                          <TabsTrigger key={sem} value={sem}>{sem} ({groupedCourses[sem].length})</TabsTrigger>
                        ))}
                      </TabsList>
                      {Object.entries(groupedCourses).map(([sem, semCourses]) => (
                        <TabsContent key={sem} value={sem}>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Mã môn</TableHead>
                                <TableHead>Tên môn học</TableHead>
                                <TableHead>TC</TableHead>
                                <TableHead>LT/TH/TN</TableHead>
                                <TableHead>Loại</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(semCourses as any[]).map((course) => (
                                <TableRow key={course.id}>
                                  <TableCell className="font-medium">{course.subjectCode}</TableCell>
                                  <TableCell>{course.subjectName}</TableCell>
                                  <TableCell>{course.credits}</TableCell>
                                  <TableCell>{course.theoryHours}/{course.practiceHours}/{course.labHours}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {COURSE_TYPES.find(t => t.value === course.courseType)?.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => openEditCourse(course)}>
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteCourse(course.id)}>
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TabsContent>
                      ))}
                    </Tabs>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
