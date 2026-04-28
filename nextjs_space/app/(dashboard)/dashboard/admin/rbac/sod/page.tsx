"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ShieldAlert, Plus, Trash2, RefreshCw, AlertTriangle, Ban, Info
} from 'lucide-react';

interface SoDRule {
  id: string;
  functionCodeA: string;
  functionCodeB: string;
  description: string | null;
  severity: 'WARN' | 'BLOCK';
  isActive: boolean;
  createdAt: string;
}

interface FunctionOption {
  code: string;
  name: string;
  module: string;
}

export default function SoDManagementPage() {
  const [rules, setRules] = useState<SoDRule[]>([]);
  const [functions, setFunctions] = useState<FunctionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    functionCodeA: '',
    functionCodeB: '',
    description: '',
    severity: 'BLOCK' as 'WARN' | 'BLOCK',
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rbac/sod');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules);
      }
    } catch (error) {
      console.error('Error fetching SoD rules:', error);
      toast.error('Lỗi tải danh sách SoD');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFunctions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/rbac/functions');
      const data = await res.json();
      if (data.success) {
        setFunctions(data.functions);
      }
    } catch (error) {
      console.error('Error fetching functions:', error);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchFunctions();
  }, [fetchRules, fetchFunctions]);

  const handleCreate = async () => {
    if (!formData.functionCodeA || !formData.functionCodeB) {
      toast.error('Vui lòng chọn cả hai chức năng');
      return;
    }

    if (formData.functionCodeA === formData.functionCodeB) {
      toast.error('Hai chức năng phải khác nhau');
      return;
    }

    try {
      const res = await fetch('/api/admin/rbac/sod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Đã tạo rule SoD mới');
        setIsCreateOpen(false);
        resetForm();
        fetchRules();
      } else {
        toast.error(data.error || data.message || 'Không thể tạo rule SoD', {
          description: !res.ok ? `HTTP ${res.status}` : undefined,
        });
      }
    } catch (error) {
      toast.error('Lỗi kết nối', { description: 'Không thể tạo rule SoD. Kiểm tra kết nối mạng.' });
    }
  };

  const handleDelete = async (rule: SoDRule) => {
    if (!confirm(`Bạn có chắc muốn xóa rule xung đột giữa "${rule.functionCodeA}" và "${rule.functionCodeB}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rbac/sod?id=${rule.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa rule SoD', { description: `${rule.functionCodeA} ↔ ${rule.functionCodeB}` });
        fetchRules();
      } else {
        toast.error(data.error || data.message || 'Không thể xóa rule SoD', {
          description: !res.ok ? `HTTP ${res.status}` : undefined,
        });
      }
    } catch (error) {
      toast.error('Lỗi kết nối', { description: 'Không thể xóa rule SoD. Kiểm tra kết nối mạng.' });
    }
  };

  const resetForm = () => {
    setFormData({
      functionCodeA: '',
      functionCodeB: '',
      description: '',
      severity: 'BLOCK',
    });
  };

  const getFunctionName = (code: string) => {
    const fn = functions.find(f => f.code === code);
    return fn ? fn.name : code;
  };

  // Stats
  const stats = {
    total: rules.length,
    blocking: rules.filter(r => r.severity === 'BLOCK').length,
    warning: rules.filter(r => r.severity === 'WARN').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-600" />
            Separation of Duties (SoD)
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các quy tắc phân tách trách nhiệm - ngăn chặn xung đột quyền
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm quy tắc SoD</DialogTitle>
              <DialogDescription>
                Định nghĩa hai chức năng xung đột không được gán cho cùng một người
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Chức năng A *</Label>
                <Select
                  value={formData.functionCodeA}
                  onValueChange={(v) => setFormData({...formData, functionCodeA: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức năng..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {functions.map((fn) => (
                      <SelectItem key={fn.code} value={fn.code}>
                        <span className="font-mono text-xs">{fn.code}</span>
                        <span className="ml-2">{fn.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-center">
                <Badge variant="outline" className="text-lg">↔ Xung đột với</Badge>
              </div>
              <div>
                <Label>Chức năng B *</Label>
                <Select
                  value={formData.functionCodeB}
                  onValueChange={(v) => setFormData({...formData, functionCodeB: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức năng..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {functions.map((fn) => (
                      <SelectItem key={fn.code} value={fn.code}>
                        <span className="font-mono text-xs">{fn.code}</span>
                        <span className="ml-2">{fn.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Mô tả lý do</Label>
                <Textarea
                  placeholder="VD: Người tạo điểm không được tự duyệt điểm"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <Label>Mức độ</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => setFormData({...formData, severity: v as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BLOCK">
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-red-500" />
                        Chặn hoàn toàn (BLOCK)
                      </div>
                    </SelectItem>
                    <SelectItem value="WARN">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Cảnh báo (WARN)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
              <Button onClick={handleCreate}>Tạo rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Separation of Duties là gì?</AlertTitle>
        <AlertDescription>
          SoD là nguyên tắc bảo mật ngăn chặn một người có đồng thời cả quyền TẠO và DUYỆT cùng một đối tượng.
          Ví dụ: Người nhập điểm không được tự duyệt điểm đó.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng số rule</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chặn hoàn toàn</p>
                <p className="text-2xl font-bold text-red-600">{stats.blocking}</p>
              </div>
              <Ban className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cảnh báo</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách quy tắc xung đột</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchRules}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chức năng A</TableHead>
                <TableHead></TableHead>
                <TableHead>Chức năng B</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có quy tắc SoD nào
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{rule.functionCodeA}</p>
                        <p className="font-medium">{getFunctionName(rule.functionCodeA)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-500">
                        ↔ Xung đột
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{rule.functionCodeB}</p>
                        <p className="font-medium">{getFunctionName(rule.functionCodeB)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {rule.description || '-'}
                    </TableCell>
                    <TableCell>
                      {rule.severity === 'BLOCK' ? (
                        <Badge className="bg-red-500 text-white">
                          <Ban className="h-3 w-3 mr-1" />
                          BLOCK
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500 text-white">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          WARN
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rule)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
