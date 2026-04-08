
/**
 * User Permissions Manager Component
 * Manage user-specific permission overrides
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useAllPermissions, useUserPermissions } from '@/hooks/use-permissions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function UserPermissionsManager() {
  const { toast } = useToast();
  const { permissions: allPermissions, loading: loadingAllPerms } = useAllPermissions(false);
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('');
  const [action, setAction] = useState<'grant' | 'revoke'>('grant');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !selectedPermission) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng chọn người dùng và quyền',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/permissions/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          permissionCode: selectedPermission,
          action,
          reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Thành công',
          description: result.message,
        });
        // Reset form
        setSelectedPermission('');
        setReason('');
      } else {
        toast({
          title: 'Lỗi',
          description: result.error || 'Không thể cập nhật quyền',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi cập nhật quyền',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search User */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">ID Người dùng</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="userId"
                placeholder="Nhập ID người dùng..."
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              />
              <Button size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nhập ID của người dùng cần quản lý quyền
            </p>
          </div>
        </div>
      </Card>

      {/* Grant/Revoke Permission Form */}
      {selectedUserId && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="action">Hành động</Label>
              <Select
                value={action}
                onValueChange={(value: 'grant' | 'revoke') => setAction(value)}
              >
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Cấp quyền</SelectItem>
                  <SelectItem value="revoke">Thu hồi quyền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="permission">Quyền</Label>
              <Select
                value={selectedPermission}
                onValueChange={setSelectedPermission}
                disabled={loadingAllPerms}
              >
                <SelectTrigger id="permission">
                  <SelectValue placeholder="Chọn quyền..." />
                </SelectTrigger>
                <SelectContent>
                  {allPermissions?.map((perm: any) => (
                    <SelectItem key={perm.id} value={perm.code}>
                      <div className="flex items-center gap-2">
                        <span>{perm.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {perm.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Lý do</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do cấp/thu hồi quyền..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Đang xử lý...' : action === 'grant' ? 'Cấp quyền' : 'Thu hồi quyền'}
            </Button>
          </form>
        </Card>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Lưu ý</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Quyền được cấp sẽ ghi đè lên quyền mặc định của vai trò</li>
          <li>Quyền bị thu hồi sẽ không cho phép người dùng truy cập dù vai trò có quyền đó</li>
          <li>Tất cả thay đổi sẽ được ghi lại trong nhật ký kiểm toán</li>
        </ul>
      </Card>
    </div>
  );
}
