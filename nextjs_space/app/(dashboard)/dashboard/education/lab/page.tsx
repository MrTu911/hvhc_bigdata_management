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
import { Plus, Search, Edit, Trash2, Monitor, FlaskConical, Wrench, Settings, Building2, Cpu, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Lab {
  id: string;
  code: string;
  name: string;
  labType: string;
  building?: string;
  floor?: number;
  roomNumber?: string;
  capacity: number;
  area?: number;
  unitId?: string;
  managerId?: string;
  description?: string;
  status: string;
  unit?: { code: string; name: string };
  equipmentCount?: number;
  upcomingSessionCount?: number;
}

interface LabEquipment {
  id: string;
  code: string;
  name: string;
  labId: string;
  equipmentType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: string;
  condition: string;
  lab?: { code: string; name: string };
}

interface Unit {
  id: string;
  code: string;
  name: string;
}

const labTypes = [
  { value: 'COMPUTER', label: 'PTN Tin học', icon: Monitor },
  { value: 'PHYSICS', label: 'PTN Vật lý', icon: FlaskConical },
  { value: 'ELECTRONICS', label: 'PTN Điện tử', icon: Cpu },
  { value: 'SIMULATION', label: 'PTN Mô phỏng', icon: Settings },
  { value: 'MILITARY', label: 'PTN Quân sự', icon: Building2 },
  { value: 'OTHER', label: 'Khác', icon: FlaskConical }
];

const labStatuses = [
  { value: 'AVAILABLE', label: 'Sẵn sàng', color: 'bg-green-100 text-green-800' },
  { value: 'OCCUPIED', label: 'Đang sử dụng', color: 'bg-blue-100 text-blue-800' },
  { value: 'MAINTENANCE', label: 'Bảo trì', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CLOSED', label: 'Đóng cửa', color: 'bg-red-100 text-red-800' }
];

const equipmentTypes = [
  { value: 'COMPUTER', label: 'Máy tính' },
  { value: 'SERVER', label: 'Máy chủ' },
  { value: 'NETWORK', label: 'Thiết bị mạng' },
  { value: 'PROJECTOR', label: 'Máy chiếu' },
  { value: 'PRINTER', label: 'Máy in' },
  { value: 'LAB_INSTRUMENT', label: 'Dụng cụ TN' },
  { value: 'MEASURING', label: 'Thiết bị đo' },
  { value: 'OTHER', label: 'Khác' }
];

const equipmentStatuses = [
  { value: 'OPERATIONAL', label: 'Hoạt động tốt', color: 'bg-green-100 text-green-800' },
  { value: 'DEGRADED', label: 'Giảm hiệu năng', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'UNDER_REPAIR', label: 'Đang sửa chữa', color: 'bg-orange-100 text-orange-800' },
  { value: 'OUT_OF_SERVICE', label: 'Ngừng hoạt động', color: 'bg-red-100 text-red-800' }
];

const CHART_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#8b5cf6'];

export default function LabManagementPage() {
  const { toast } = useToast();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [equipment, setEquipment] = useState<LabEquipment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('labs');
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [editingEquip, setEditingEquip] = useState<LabEquipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeStats, setTypeStats] = useState<any[]>([]);
  const [statusStats, setStatusStats] = useState<any[]>([]);

  const [labForm, setLabForm] = useState({
    code: '',
    name: '',
    labType: 'COMPUTER',
    building: '',
    floor: 1,
    roomNumber: '',
    capacity: 30,
    area: 0,
    unitId: '',
    description: ''
  });

  const [equipForm, setEquipForm] = useState({
    code: '',
    name: '',
    labId: '',
    equipmentType: 'COMPUTER',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchLabs();
    fetchUnits();
  }, []);

  useEffect(() => {
    if (selectedLab) {
      fetchEquipment(selectedLab.id);
    }
  }, [selectedLab]);

  const fetchLabs = async () => {
    try {
      const res = await fetch('/api/education/lab');
      const data = await res.json();
      if (data.data) setLabs(data.data);
      if (data.stats?.typeStats) {
        const stats = data.stats.typeStats.map((s: any, i: number) => ({
          name: labTypes.find(t => t.value === s.labType)?.label || s.labType,
          value: s._count.id,
          color: CHART_COLORS[i % CHART_COLORS.length]
        }));
        setTypeStats(stats);
      }
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async (labId: string) => {
    try {
      const res = await fetch(`/api/education/lab-equipment?labId=${labId}`);
      const data = await res.json();
      if (data.data) setEquipment(data.data);
      if (data.stats?.statusStats) {
        const stats = data.stats.statusStats.map((s: any, i: number) => ({
          name: equipmentStatuses.find(st => st.value === s.status)?.label || s.status,
          value: s._count.id,
          color: CHART_COLORS[i % CHART_COLORS.length]
        }));
        setStatusStats(stats);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
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

  const handleLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingLab ? 'PUT' : 'POST';
      const body = editingLab ? { id: editingLab.id, ...labForm } : labForm;

      const res = await fetch('/api/education/lab', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setLabDialogOpen(false);
        resetLabForm();
        fetchLabs();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu PTN', variant: 'destructive' });
    }
  };

  const handleEquipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingEquip ? 'PUT' : 'POST';
      const body = editingEquip ? { id: editingEquip.id, ...equipForm } : { ...equipForm, labId: selectedLab?.id };

      const res = await fetch('/api/education/lab-equipment', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        setEquipDialogOpen(false);
        resetEquipForm();
        if (selectedLab) fetchEquipment(selectedLab.id);
        fetchLabs();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể lưu thiết bị', variant: 'destructive' });
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phòng thí nghiệm này?')) return;
    try {
      const res = await fetch(`/api/education/lab?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        fetchLabs();
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const handleDeleteEquip = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;
    try {
      const res = await fetch(`/api/education/lab-equipment?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Thành công', description: data.message });
        if (selectedLab) fetchEquipment(selectedLab.id);
      } else {
        toast({ title: 'Lỗi', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể xóa', variant: 'destructive' });
    }
  };

  const resetLabForm = () => {
    setEditingLab(null);
    setLabForm({ code: '', name: '', labType: 'COMPUTER', building: '', floor: 1, roomNumber: '', capacity: 30, area: 0, unitId: '', description: '' });
  };

  const resetEquipForm = () => {
    setEditingEquip(null);
    setEquipForm({ code: '', name: '', labId: '', equipmentType: 'COMPUTER', brand: '', model: '', serialNumber: '', purchaseDate: '', warrantyExpiry: '', location: '', notes: '' });
  };

  const openLabEdit = (lab: Lab) => {
    setEditingLab(lab);
    setLabForm({
      code: lab.code,
      name: lab.name,
      labType: lab.labType,
      building: lab.building || '',
      floor: lab.floor || 1,
      roomNumber: lab.roomNumber || '',
      capacity: lab.capacity,
      area: lab.area || 0,
      unitId: lab.unitId || '',
      description: lab.description || ''
    });
    setLabDialogOpen(true);
  };

  const filteredLabs = labs.filter(lab =>
    lab.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lab.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCapacity = labs.reduce((sum, l) => sum + l.capacity, 0);
  const totalEquipment = labs.reduce((sum, l) => sum + (l.equipmentCount || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Phòng thí nghiệm</h1>
          <p className="text-muted-foreground">PTN & Thiết bị</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng PTN</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sức chứa</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng thiết bị</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sẵn sàng</CardTitle>
            <Wrench className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labs.filter(l => l.status === 'AVAILABLE').length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="labs">Phòng thí nghiệm</TabsTrigger>
          <TabsTrigger value="equipment" disabled={!selectedLab}>Thiết bị {selectedLab ? `(${selectedLab.name})` : ''}</TabsTrigger>
        </TabsList>

        <TabsContent value="labs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Phân bố theo loại</CardTitle>
              </CardHeader>
              <CardContent>
                {typeStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={typeStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                        {typeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
                )}
              </CardContent>
            </Card>

            {/* Labs Table */}
            <Card className="col-span-2">
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Tìm kiếm..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  <Dialog open={labDialogOpen} onOpenChange={(open) => { setLabDialogOpen(open); if (!open) resetLabForm(); }}>
                    <DialogTrigger asChild>
                      <Button><Plus className="mr-2 h-4 w-4" /> Thêm PTN</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingLab ? 'Chỉnh sửa' : 'Thêm'} phòng thí nghiệm</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleLabSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Mã PTN *</Label>
                            <Input value={labForm.code} onChange={(e) => setLabForm({ ...labForm, code: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Tên PTN *</Label>
                            <Input value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })} required />
                          </div>
                          <div className="space-y-2">
                            <Label>Loại PTN</Label>
                            <Select value={labForm.labType} onValueChange={(v) => setLabForm({ ...labForm, labType: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {labTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Sức chứa</Label>
                            <Input type="number" value={labForm.capacity} onChange={(e) => setLabForm({ ...labForm, capacity: parseInt(e.target.value) })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Tòa nhà</Label>
                            <Input value={labForm.building} onChange={(e) => setLabForm({ ...labForm, building: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Tầng</Label>
                            <Input type="number" value={labForm.floor} onChange={(e) => setLabForm({ ...labForm, floor: parseInt(e.target.value) })} />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label>Đơn vị quản lý</Label>
                            <Select value={labForm.unitId} onValueChange={(v) => setLabForm({ ...labForm, unitId: v })}>
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
                          <Textarea value={labForm.description} onChange={(e) => setLabForm({ ...labForm, description: e.target.value })} />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setLabDialogOpen(false)}>Hủy</Button>
                          <Button type="submit">{editingLab ? 'Cập nhật' : 'Tạo'}</Button>
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
                      <TableHead>Loại</TableHead>
                      <TableHead>Vị trí</TableHead>
                      <TableHead>Sức chứa</TableHead>
                      <TableHead>Thiết bị</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLabs.map((lab) => (
                      <TableRow key={lab.id} className="cursor-pointer" onClick={() => { setSelectedLab(lab); setActiveTab('equipment'); }}>
                        <TableCell className="font-medium">{lab.code}</TableCell>
                        <TableCell>{lab.name}</TableCell>
                        <TableCell>{labTypes.find(t => t.value === lab.labType)?.label}</TableCell>
                        <TableCell>{lab.building ? `${lab.building}, Tầng ${lab.floor}` : '-'}</TableCell>
                        <TableCell>{lab.capacity}</TableCell>
                        <TableCell><Badge variant="secondary">{lab.equipmentCount || 0}</Badge></TableCell>
                        <TableCell>
                          <Badge className={labStatuses.find(s => s.value === lab.status)?.color}>
                            {labStatuses.find(s => s.value === lab.status)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => openLabEdit(lab)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLab(lab.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          {selectedLab && (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold">{selectedLab.name}</h2>
                  <p className="text-muted-foreground">{labTypes.find(t => t.value === selectedLab.labType)?.label} - {selectedLab.building}, Tầng {selectedLab.floor}</p>
                </div>
                <Dialog open={equipDialogOpen} onOpenChange={(open) => { setEquipDialogOpen(open); if (!open) resetEquipForm(); }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" /> Thêm thiết bị</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingEquip ? 'Chỉnh sửa' : 'Thêm'} thiết bị</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEquipSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mã *</Label>
                          <Input value={equipForm.code} onChange={(e) => setEquipForm({ ...equipForm, code: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Tên *</Label>
                          <Input value={equipForm.name} onChange={(e) => setEquipForm({ ...equipForm, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Loại</Label>
                          <Select value={equipForm.equipmentType} onValueChange={(v) => setEquipForm({ ...equipForm, equipmentType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {equipmentTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Thương hiệu</Label>
                          <Input value={equipForm.brand} onChange={(e) => setEquipForm({ ...equipForm, brand: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Model</Label>
                          <Input value={equipForm.model} onChange={(e) => setEquipForm({ ...equipForm, model: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Serial</Label>
                          <Input value={equipForm.serialNumber} onChange={(e) => setEquipForm({ ...equipForm, serialNumber: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Ngày mua</Label>
                          <Input type="date" value={equipForm.purchaseDate} onChange={(e) => setEquipForm({ ...equipForm, purchaseDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Hết bảo hành</Label>
                          <Input type="date" value={equipForm.warrantyExpiry} onChange={(e) => setEquipForm({ ...equipForm, warrantyExpiry: e.target.value })} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEquipDialogOpen(false)}>Hủy</Button>
                        <Button type="submit">{editingEquip ? 'Cập nhật' : 'Thêm'}</Button>
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
                          <TableHead>Tên</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Thương hiệu</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment.map((eq) => (
                          <TableRow key={eq.id}>
                            <TableCell className="font-medium">{eq.code}</TableCell>
                            <TableCell>{eq.name}</TableCell>
                            <TableCell>{equipmentTypes.find(t => t.value === eq.equipmentType)?.label}</TableCell>
                            <TableCell>{eq.brand} {eq.model}</TableCell>
                            <TableCell>
                              <Badge className={equipmentStatuses.find(s => s.value === eq.status)?.color}>
                                {equipmentStatuses.find(s => s.value === eq.status)?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteEquip(eq.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Trạng thái thiết bị</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={statusStats} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                            {statusStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Chưa có dữ liệu</p>
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
