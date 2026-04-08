/**
 * Create New Policy Request Page
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
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Save, Send, ArrowLeft, Loader2 } from 'lucide-react';

interface Category { id: string; name: string; description: string; }

export default function NewPolicyRequestPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ categoryId: '', title: '', description: '', requestedAmount: '', priority: 'MEDIUM', notes: '' });

  useEffect(() => { if (status === 'unauthenticated') router.push('/login'); }, [status, router]);
  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    const res = await fetch('/api/policy/categories');
    if (res.ok) { const d = await res.json(); setCategories(d.data || []); }
  }

  async function handleSubmit(e: React.FormEvent, submit = false) {
    e.preventDefault();
    if (!formData.categoryId || !formData.title) { toast.error('Vui lòng điền đầy đủ thông tin'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/policy/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : 0, status: submit ? 'SUBMITTED' : 'DRAFT' })
      });
      if (res.ok) { toast.success(submit ? 'Gửi thành công' : 'Lưu nháp thành công'); router.push('/dashboard/policy/requests'); }
      else { const d = await res.json(); toast.error(d.error); }
    } catch { toast.error('Lỗi kết nối'); }
    finally { setSubmitting(false); }
  }

  if (status === 'loading') return <div className="flex items-center justify-center h-screen"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div></div>;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <PageHeader title="Tạo Yêu cầu Chính sách" icon={<FileText className="h-6 w-6" />} actions={<Button variant="outline" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button>} />
      <form onSubmit={(e) => handleSubmit(e, false)}>
        <Card><CardHeader><CardTitle>Thông tin Yêu cầu</CardTitle><CardDescription>* là bắt buộc</CardDescription></CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2"><Label>Danh mục *</Label><Select value={formData.categoryId} onValueChange={v => setFormData(p => ({ ...p, categoryId: v }))}><SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Tiêu đề *</Label><Input placeholder="Tiêu đề yêu cầu" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Mô tả</Label><Textarea placeholder="Mô tả chi tiết..." rows={4} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Số tiền (VNĐ)</Label><Input type="number" placeholder="0" value={formData.requestedAmount} onChange={e => setFormData(p => ({ ...p, requestedAmount: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Độ ưu tiên</Label><Select value={formData.priority} onValueChange={v => setFormData(p => ({ ...p, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Thấp</SelectItem><SelectItem value="MEDIUM">Trung bình</SelectItem><SelectItem value="HIGH">Cao</SelectItem><SelectItem value="URGENT">Khẩn cấp</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Ghi chú</Label><Textarea placeholder="Ghi chú..." rows={2} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Hủy</Button>
          <Button type="submit" variant="secondary" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Lưu nháp</Button>
          <Button type="button" onClick={e => handleSubmit(e, true)} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Gửi</Button>
        </div>
      </form>
    </div>
  );
}
