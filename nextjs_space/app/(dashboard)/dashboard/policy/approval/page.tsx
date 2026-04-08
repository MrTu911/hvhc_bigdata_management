/**
 * Duyệt yêu cầu chính sách
 * Hiển thị các yêu cầu đang chờ duyệt
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Eye, Loader2, FileText, AlertCircle, Send, RotateCcw } from 'lucide-react';

interface PolicyRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  reason: string | null;
  requestedAmount: number | null;
  status: string;
  currentLevel: number;
  createdAt: string;
  submittedAt: string | null;
  requester: { id: string; name: string; email: string; rank: string | null };
  category: { id: string; name: string; approvalLevels: number };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Nháp', color: 'bg-gray-100 text-gray-800', icon: Clock },
  SUBMITTED: { label: 'Đã gửi', color: 'bg-blue-100 text-blue-800', icon: Send },
  UNDER_REVIEW: { label: 'Đang xét duyệt', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  CANCELLED: { label: 'Hủy', color: 'bg-gray-100 text-gray-800', icon: RotateCcw },
};

export default function PolicyApprovalPage() {
  const [requests, setRequests] = useState<PolicyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [viewRequest, setViewRequest] = useState<PolicyRequest | null>(null);
  const [approveRequest, setApproveRequest] = useState<PolicyRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const status = tab === 'pending' ? 'SUBMITTED' : tab === 'review' ? 'UNDER_REVIEW' : 'APPROVED';
      const res = await fetch(`/api/policy/requests?status=${status}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    if (!approveRequest) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/policy/requests/${approveRequest.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE', note: approvalNote }),
      });
      if (res.ok) {
        toast.success('Phê duyệt thành công');
        setApproveRequest(null);
        setApprovalNote('');
        fetchRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi phê duyệt');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approveRequest) return;
    if (!approvalNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/policy/requests/${approveRequest.id}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', note: approvalNote }),
      });
      if (res.ok) {
        toast.success('Từ chối thành công');
        setApproveRequest(null);
        setApprovalNote('');
        fetchRequests();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Lỗi từ chối');
      }
    } catch (e) {
      toast.error('Lỗi kết nối');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (n: number | null) => n ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n) : '-';
  const formatDate = (s: string | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Duyệt yêu cầu chính sách
          </h1>
          <p className="text-gray-500 mt-1">Xét duyệt các yêu cầu chính sách, khen thưởng, đãi ngộ</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />Chờ duyệt
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />Đang xét
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />Đã duyệt
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  Không có yêu cầu nào
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã yêu cầu</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Người yêu cầu</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => {
                      const st = statusConfig[req.status];
                      return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <Badge variant="outline">{req.requestNumber}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.title}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{req.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{req.requester.name}</p>
                              <p className="text-sm text-gray-500">{req.requester.rank || ''}</p>
                            </div>
                          </TableCell>
                          <TableCell>{req.category.name}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(req.requestedAmount)}</TableCell>
                          <TableCell>{formatDate(req.submittedAt || req.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewRequest(req)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                                <Button variant="default" size="sm" onClick={() => setApproveRequest(req)} className="bg-green-600 hover:bg-green-700">
                                  Duyệt
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu #{viewRequest?.requestNumber}</DialogTitle>
            <DialogDescription>{viewRequest?.title}</DialogDescription>
          </DialogHeader>
          {viewRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Người yêu cầu</Label>
                  <p className="font-medium">{viewRequest.requester.name}</p>
                  <p className="text-sm text-gray-500">{viewRequest.requester.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Danh mục</Label>
                  <p>{viewRequest.category.name}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-500">Mô tả</Label>
                <p>{viewRequest.description}</p>
              </div>
              {viewRequest.reason && (
                <div>
                  <Label className="text-gray-500">Lý do</Label>
                  <p>{viewRequest.reason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Số tiền yêu cầu</Label>
                  <p className="font-medium text-lg">{formatCurrency(viewRequest.requestedAmount)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Trạng thái</Label>
                  <Badge className={statusConfig[viewRequest.status]?.color}>
                    {statusConfig[viewRequest.status]?.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRequest(null)}>Đóng</Button>
            {viewRequest && (viewRequest.status === 'SUBMITTED' || viewRequest.status === 'UNDER_REVIEW') && (
              <Button onClick={() => { setViewRequest(null); setApproveRequest(viewRequest); }} className="bg-green-600 hover:bg-green-700">
                Duyệt / Từ chối
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      <Dialog open={!!approveRequest} onOpenChange={() => { setApproveRequest(null); setApprovalNote(''); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xét duyệt yêu cầu #{approveRequest?.requestNumber}</DialogTitle>
            <DialogDescription>{approveRequest?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-500">Người yêu cầu:</span>
                <span className="font-medium">{approveRequest?.requester.name}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-500">Số tiền:</span>
                <span className="font-medium text-lg">{formatCurrency(approveRequest?.requestedAmount || null)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ghi chú (bắt buộc khi từ chối)</Label>
              <Textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc lý do..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setApproveRequest(null); setApprovalNote(''); }}>Hủy</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <XCircle className="h-4 w-4 mr-2" />
              Từ chối
            </Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Phê duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
