/**
 * TRANG QUẢN LÝ PHÒNG HỌC
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, Building2, Users, Layers } from 'lucide-react';

const ROOM_TYPES = [
  { value: 'THEORY', label: 'Lý thuyết' },
  { value: 'LAB', label: 'Phòng thí nghiệm' },
  { value: 'COMPUTER', label: 'Phòng máy tính' },
  { value: 'LANGUAGE', label: 'Phòng ngoại ngữ' },
  { value: 'LIBRARY', label: 'Thư viện' },
  { value: 'SEMINAR', label: 'Hội trường' },
  { value: 'WORKSHOP', label: 'Xưởng thực hành' },
];

const ROOM_TYPE_COLORS: Record<string, string> = {
  THEORY: 'bg-blue-500',
  LAB: 'bg-purple-500',
  COMPUTER: 'bg-green-500',
  LANGUAGE: 'bg-yellow-500',
  LIBRARY: 'bg-orange-500',
  SEMINAR: 'bg-pink-500',
  WORKSHOP: 'bg-red-500',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const [form, setForm] = useState({
    code: '', name: '', building: '', floor: '', capacity: 50, roomType: 'THEORY', equipment: '',
  });

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType) params.append('roomType', filterType);
      if (filterBuilding) params.append('building', filterBuilding);
      
      const res = await fetch(`/api/training/rooms?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchRooms(), 300);
    return () => clearTimeout(timer);
  }, [search, filterType, filterBuilding]);

  const handleSubmit = async () => {
    try {
      const method = editingRoom ? 'PUT' : 'POST';
      const body = editingRoom ? { id: editingRoom.id, ...form } : form;
      
      const res = await fetch('/api/training/rooms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingRoom ? 'Cập nhật thành công' : 'Tạo thành công');
        setDialogOpen(false);
        resetForm();
        fetchRooms();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Lỗi');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xác nhận xóa phòng học?')) return;
    try {
      const res = await fetch(`/api/training/rooms?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Xóa thành công');
        fetchRooms();
      }
    } catch (error) {
      toast.error('Lỗi xóa');
    }
  };

  const resetForm = () => {
    setForm({ code: '', name: '', building: '', floor: '', capacity: 50, roomType: 'THEORY', equipment: '' });
    setEditingRoom(null);
  };

  const openEdit = (room: any) => {
    setEditingRoom(room);
    setForm({
      code: room.code, name: room.name, building: room.building || '',
      floor: room.floor?.toString() || '', capacity: room.capacity,
      roomType: room.roomType, equipment: room.equipment || '',
    });
    setDialogOpen(true);
  };

  // Get unique buildings
  const buildings = [...new Set(rooms.map(r => r.building).filter(Boolean))];

  // Stats
  const stats = {
    total: rooms.length,
    byType: ROOM_TYPES.map(t => ({
      ...t,
      count: rooms.filter(r => r.roomType === t.value).length,
    })),
    totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
    inUse: rooms.filter(r => (r._count?.courses || 0) > 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý phòng học</h1>
          <p className="text-muted-foreground">Quản lý phòng học, phòng thí nghiệm</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Thêm phòng</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoom ? 'Cập nhật' : 'Thêm'} phòng học</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mã phòng *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="A101" />
                </div>
                <div className="space-y-2">
                  <Label>Loại phòng</Label>
                  <Select value={form.roomType} onValueChange={(v) => setForm({ ...form, roomType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tên phòng *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Phòng học A101" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tòa nhà</Label>
                  <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="Tòa A" />
                </div>
                <div className="space-y-2">
                  <Label>Tầng</Label>
                  <Input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="1" />
                </div>
                <div className="space-y-2">
                  <Label>Sức chứa</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thiết bị</Label>
                <Input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="Máy chiếu, bảng thông minh..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSubmit}>{editingRoom ? 'Cập nhật' : 'Tạo'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng phòng</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{stats.inUse} đang sử dụng</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng sức chứa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">chỗ ngồi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng lý thuyết</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.filter(r => r.roomType === 'THEORY').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phòng thí nghiệm</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rooms.filter(r => r.roomType === 'LAB' || r.roomType === 'COMPUTER').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Tìm theo mã, tên..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={filterType || '__ALL__'} onValueChange={(v) => setFilterType(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại phòng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterBuilding || '__ALL__'} onValueChange={(v) => setFilterBuilding(v === '__ALL__' ? '' : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tòa nhà" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__ALL__">Tất cả</SelectItem>
                {buildings.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã phòng</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Tòa/Tầng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Sức chứa</TableHead>
                <TableHead>Thiết bị</TableHead>
                <TableHead>Sử dụng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Đang tải...</TableCell></TableRow>
              ) : rooms.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Không có phòng nào</TableCell></TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.code}</TableCell>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>{room.building || '-'} / Tầng {room.floor || '-'}</TableCell>
                    <TableCell>
                      <Badge className={ROOM_TYPE_COLORS[room.roomType] || 'bg-gray-500'}>
                        {ROOM_TYPES.find(t => t.value === room.roomType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {room.capacity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{room.equipment || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {room._count?.courses || 0} lớp, {room._count?.exams || 0} thi
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(room)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(room.id)}>
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
