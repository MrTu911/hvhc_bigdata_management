/**
 * Policy Create Page - Tạo yêu cầu chính sách mới
 * RBAC: POLICY.CREATE, POLICY.CREATE_REQUEST
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PolicyCategory {
  id: string;
  name: string;
  code: string;
}

export default function PolicyCreatePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<PolicyCategory[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    recordType: 'WELFARE',
    requestedAmount: '',
    effectiveDate: '',
    expiryDate: '',
    attachments: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/policy/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.recordType) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/policy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : null,
        }),
      });

      if (res.ok) {
        toast.success('Tạo yêu cầu chính sách thành công');
        router.push('/dashboard/policy/list');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi khi tạo yêu cầu');
      }
    } catch (error) {
      console.error('Error creating policy request:', error);
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const recordTypes = [
    { value: 'WELFARE', label: 'Phúc lợi' },
    { value: 'RETIREMENT', label: 'Hưu trí' },
    { value: 'MATERNITY', label: 'Thai sản' },
    { value: 'SICKNESS', label: 'Ốm đau' },
    { value: 'WORK_ACCIDENT', label: 'TNLĐ-BNN' },
    { value: 'DEATH', label: 'Tử tuất' },
    { value: 'OTHER', label: 'Khác' },
  ];

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/policy/list" className="flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />Quay lại danh sách
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-amber-500" />
          Tạo Yêu cầu Chính sách mới
        </h1>
        <p className="text-muted-foreground">Điền thông tin để tạo yêu cầu chính sách</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu</CardTitle>
            <CardDescription>Các trường có dấu * là bắt buộc</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Loại chính sách */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recordType">Loại chính sách *</Label>
                <Select
                  value={formData.recordType}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, recordType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại" />
                  </SelectTrigger>
                  <SelectContent>
                    {recordTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Danh mục</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tiêu đề */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề yêu cầu *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề yêu cầu..."
                required
              />
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả chi tiết</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Mô tả chi tiết về yêu cầu..."
                rows={4}
              />
            </div>

            {/* Số tiền & Ngày */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="requestedAmount">Số tiền đề xuất (VNĐ)</Label>
                <Input
                  id="requestedAmount"
                  type="number"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Ngày hiệu lực</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú thêm</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Các ghi chú bổ sung..."
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang xử lý...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Tạo yêu cầu</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
