'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, BookOpen, HelpCircle, FileQuestion, Eye, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface QuestionBank {
  id: string;
  code: string;
  name: string;
  subjectCode: string;
  subjectName: string;
  unitId?: string;
  description?: string;
  totalQuestions: number;
  isPublic: boolean;
  unit?: { code: string; name: string };
  questionCount?: number;
}

interface Question {
  id: string;
  questionBankId: string;
  code: string;
  content: string;
  questionType: string;
  difficulty: string;
  chapter?: string;
  topic?: string;
  points: number;
  usageCount: number;
}

interface Unit {
  id: string;
  code: string;
  name: string;
}

const difficultyColors: Record<string, string> = {
  VERY_EASY: 'bg-green-100 text-green-800',
  EASY: 'bg-emerald-100 text-emerald-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HARD: 'bg-orange-100 text-orange-800',
  VERY_HARD: 'bg-red-100 text-red-800'
};

const difficultyLabels: Record<string, string> = {
  VERY_EASY: 'Rất dễ',
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
  VERY_HARD: 'Rất khó'
};

const questionTypeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: 'Trắc nghiệm nhiều lựa chọn',
  SINGLE_CHOICE: 'Trắc nghiệm một đáp án',
  TRUE_FALSE: 'Đúng/Sai',
  FILL_BLANK: 'Điền khuyết',
  MATCHING: 'Nối cặp',
  ESSAY: 'Tự luận ngắn',
  LONG_ESSAY: 'Tự luận dài',
  CALCULATION: 'Bài toán',
  CODE: 'Viết code'
};

const CHART_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'];

export default function QuestionBankPage() {
  const { toast } = useToast();
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('banks');
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyStats, setDifficultyStats] = useState<any[]>([]);

  const [bankForm, setBankForm] = useState({
    code: '',
    name: '',
    subjectCode: '',
    subjectName: '',
    unitId: '',
    description: '',
    isPublic: false
  });

  const [questionForm, setQuestionForm] = useState({
    questionBankId: '',
    code: '',
    content: '',
    questionType: 'MULTIPLE_CHOICE',
    options: '',
    correctAnswer: '',
    explanation: '',
    difficulty: 'MEDIUM',
    points: 1,
    chapter: '',
    topic: ''
  });

  useEffect(() => {
    fetchBanks();
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      fetchQuestions(selectedBank.id);
    }
  }, [selectedBank]);

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/education/question-bank');
      const data = await res.json();
      if (data.data) setBanks(data.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (bankId: string) => {
    try {
      const res = await fetch(`/api/education/question-bank/questions?questionBankId=${bankId}`);
      const data = await res.json();
      if (data.data) setQuestions(data.data);
      if (data.stats?.difficultyStats) {
        const statsData = data.stats.difficultyStats.map((s: any, i: number) => ({
          name: difficultyLabels[s.difficulty] || s.difficulty,
          value: s._count.id,
          color: CHART_COLORS[i % CHART_COLORS.length]
        }));
        setDifficultyStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/units');
      const data = await res.json();
      if (data.data) setUnits(data.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingBank ? 'PUT' : 'POST';
      const body = editingBank ? { id: editingBank.id, ...bankForm } : bankForm;

      const res = await fetch('/api/education/question-bank', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setBankDialogOpen(false);
        resetBankForm();
        fetchBanks();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu ngân hàng câu hỏi', variant: 'destructive' });
    }
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingQuestion ? 'PUT' : 'POST';
      const body = editingQuestion ? { id: editingQuestion.id, ...questionForm } : { ...questionForm, questionBankId: selectedBank?.id };

      // Parse options as JSON if provided
      if (body.options && typeof body.options === 'string') {
        try {
          (body as any).options = JSON.parse(body.options);
        } catch {
          (body as any).options = body.options.split('\n').filter(Boolean);
        }
      }

      const res = await fetch('/api/education/question-bank/questions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setQuestionDialogOpen(false);
        resetQuestionForm();
        if (selectedBank) fetchQuestions(selectedBank.id);
        fetchBanks();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu câu hỏi', variant: 'destructive' });
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngân hàng câu hỏi này?')) return;
    try {
      const res = await fetch(`/api/education/question-bank?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        fetchBanks();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    try {
      const res = await fetch(`/api/education/question-bank/questions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        if (selectedBank) fetchQuestions(selectedBank.id);
        fetchBanks();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const resetBankForm = () => {
    setEditingBank(null);
    setBankForm({ code: '', name: '', subjectCode: '', subjectName: '', unitId: '', description: '', isPublic: false });
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({ questionBankId: '', code: '', content: '', questionType: 'MULTIPLE_CHOICE', options: '', correctAnswer: '', explanation: '', difficulty: 'MEDIUM', points: 1, chapter: '', topic: '' });
  };

  const openBankEdit = (bank: QuestionBank) => {
    setEditingBank(bank);
    setBankForm({
      code: bank.code,
      name: bank.name,
      subjectCode: bank.subjectCode,
      subjectName: bank.subjectName,
      unitId: bank.unitId || '',
      description: bank.description || '',
      isPublic: bank.isPublic
    });
    setBankDialogOpen(true);
  };

  const filteredBanks = banks.filter(bank =>
    bank.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.subjectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalQuestions = banks.reduce((sum, b) => sum + (b.questionCount || b.totalQuestions || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ngân hàng câu hỏi</h1>
          <p className="text-muted-foreground">Quản lý ngân hàng câu hỏi theo môn học</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng ngân hàng</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng câu hỏi</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(banks.map(b => b.subjectCode)).size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công khai</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{banks.filter(b => b.isPublic).length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="banks">Ngân hàng câu hỏi</TabsTrigger>
          <TabsTrigger value="questions" disabled={!selectedBank}>Câu hỏi {selectedBank ? `(${selectedBank.name})` : ''}</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                </div>
                <Dialog open={bankDialogOpen} onOpenChange={(open) => { setBankDialogOpen(open); if (!open) resetBankForm(); }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Tạo ngân hàng mới</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingBank ? 'Chỉnh sửa' : 'Tạo'} ngân hàng câu hỏi</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleBankSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mã *</Label>
                          <Input value={bankForm.code} onChange={(e) => setBankForm({ ...bankForm, code: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tên *</Label>
                          <Input value={bankForm.name} onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Mã môn *</Label>
                          <Input value={bankForm.subjectCode} onChange={(e) => setBankForm({ ...bankForm, subjectCode: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tên môn *</Label>
                          <Input value={bankForm.subjectName} onChange={(e) => setBankForm({ ...bankForm, subjectName: e.target.value })} required />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label>Đơn vị</Label>
                          <Select value={bankForm.unitId} onValueChange={(v) => setBankForm({ ...bankForm, unitId: v })}>
                            <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                            <SelectContent>
                              {units.map(unit => (
                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea value={bankForm.description} onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })} />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setBankDialogOpen(false)}>Hủy</Button>
                        <Button type="submit">{editingBank ? 'Cập nhật' : 'Tạo'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Số câu</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBanks.map((bank) => (
                    <TableRow key={bank.id} className="cursor-pointer" onClick={() => { setSelectedBank(bank); setActiveTab('questions'); }}>
                      <TableCell className="font-medium">{bank.code}</TableCell>
                      <TableCell>{bank.name}</TableCell>
                      <TableCell>{bank.subjectName}</TableCell>
                      <TableCell>{bank.unit?.name || '-'}</TableCell>
                      <TableCell><Badge variant="secondary">{bank.questionCount || bank.totalQuestions} câu</Badge></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openBankEdit(bank)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteBank(bank.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          {selectedBank && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{selectedBank.name}</h2>
                  <p className="text-muted-foreground">{selectedBank.subjectName} ({selectedBank.subjectCode})</p>
                </div>
                <Dialog open={questionDialogOpen} onOpenChange={(open) => { setQuestionDialogOpen(open); if (!open) resetQuestionForm(); }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Thêm câu hỏi</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingQuestion ? 'Chỉnh sửa' : 'Thêm'} câu hỏi</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleQuestionSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mã câu *</Label>
                          <Input value={questionForm.code} onChange={(e) => setQuestionForm({ ...questionForm, code: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại câu hỏi</Label>
                          <Select value={questionForm.questionType} onValueChange={(v) => setQuestionForm({ ...questionForm, questionType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(questionTypeLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Độ khó</Label>
                          <Select value={questionForm.difficulty} onValueChange={(v) => setQuestionForm({ ...questionForm, difficulty: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(difficultyLabels).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Điểm</Label>
                          <Input type="number" step="0.5" value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: parseFloat(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Chương</Label>
                          <Input value={questionForm.chapter} onChange={(e) => setQuestionForm({ ...questionForm, chapter: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Chủ đề</Label>
                          <Input value={questionForm.topic} onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Nội dung câu hỏi *</Label>
                        <Textarea value={questionForm.content} onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })} rows={3} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Các lựa chọn (mỗi dòng 1 lựa chọn)</Label>
                        <Textarea value={questionForm.options} onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })} rows={4} placeholder="A. Lựa chọn 1\nB. Lựa chọn 2\nC. Lựa chọn 3\nD. Lựa chọn 4" />
                      </div>
                      <div className="space-y-2">
                        <Label>Đáp án đúng</Label>
                        <Input value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} placeholder="VD: A hoặc đáp án đầy đủ" />
                      </div>
                      <div className="space-y-2">
                        <Label>Giải thích</Label>
                        <Textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} rows={2} />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setQuestionDialogOpen(false)}>Hủy</Button>
                        <Button type="submit">{editingQuestion ? 'Cập nhật' : 'Thêm'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card className="col-span-2">
                  <CardContent className="pt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Nội dung</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Độ khó</TableHead>
                          <TableHead>Điểm</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.code}</TableCell>
                            <TableCell className="max-w-xs truncate">{q.content}</TableCell>
                            <TableCell className="text-sm">{questionTypeLabels[q.questionType] || q.questionType}</TableCell>
                            <TableCell><Badge className={difficultyColors[q.difficulty]}>{difficultyLabels[q.difficulty]}</Badge></TableCell>
                            <TableCell>{q.points}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Phân bố độ khó</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {difficultyStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={difficultyStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                            {difficultyStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground">Chưa có dữ liệu</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
