/**
 * Position Detail Card - Thông tin chi tiết chức vụ
 * 
 * Hiển thị:
 * - Thông tin cơ bản chức vụ
 * - Số users đang giữ chức vụ
 * - Số quyền đã gán
 * - Danh sách quyền theo module
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Users, 
  Key, 
  Building2, 
  Globe, 
  User, 
  CheckCircle,
  Shield,
  Eye,
  Edit,
  Plus,
  Trash,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
  positionScope?: string;
  isActive: boolean;
  _count?: {
    positionFunctions: number;
    userPositions: number;
  };
}

interface FunctionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  actionType: string;
  scope: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  rank?: string;
  unitName?: string;
}

interface PositionDetailCardProps {
  positionId: string;
  onEdit?: () => void;
}

const ACTION_ICONS: Record<string, any> = {
  VIEW: Eye,
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash,
  APPROVE: CheckCircle,
  EXPORT: Download,
  IMPORT: Upload,
};

const SCOPE_COLORS: Record<string, string> = {
  SELF: 'bg-gray-500',
  UNIT: 'bg-blue-500',
  DEPARTMENT: 'bg-green-500',
  ACADEMY: 'bg-purple-500',
};

export function PositionDetailCard({ positionId, onEdit }: PositionDetailCardProps) {
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [functions, setFunctions] = useState<FunctionItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    if (!positionId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch position detail
        const posRes = await fetch(`/api/admin/rbac/positions/${positionId}`);
        if (posRes.ok) {
          const data = await posRes.json();
          setPosition(data.position);
          setFunctions(data.functions || []);
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching position detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [positionId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (!position) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Không tìm thấy thông tin chức vụ
        </CardContent>
      </Card>
    );
  }

  // Group functions by module
  const functionsByModule = functions.reduce((acc, fn) => {
    if (!acc[fn.module]) acc[fn.module] = [];
    acc[fn.module].push(fn);
    return acc;
  }, {} as Record<string, FunctionItem[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {position.name}
            </CardTitle>
            <CardDescription>
              Mã: {position.code}
            </CardDescription>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Sửa
            </Button>
          )}
        </div>
        {position.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {position.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-xs text-muted-foreground">Người dùng</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Key className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{functions.length}</p>
              <p className="text-xs text-muted-foreground">Quyền</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
            <Globe className="h-5 w-5 text-purple-500" />
            <div>
              <Badge className={cn('text-white', SCOPE_COLORS[position.positionScope || 'UNIT'])}>
                {position.positionScope || 'UNIT'}
              </Badge>
              <p className="text-xs text-muted-foreground">Phạm vi</p>
            </div>
          </div>
        </div>

        {/* Functions by Module */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Key className="h-4 w-4" />
            Danh sách quyền ({functions.length})
          </h4>
          <ScrollArea className="h-[200px]">
            <Accordion type="multiple" className="w-full">
              {Object.entries(functionsByModule).map(([module, fns]) => (
                <AccordionItem key={module} value={module}>
                  <AccordionTrigger className="text-sm hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{module}</span>
                      <Badge variant="secondary">{fns.length}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pl-4">
                      {fns.map(fn => {
                        const ActionIcon = ACTION_ICONS[fn.actionType] || Key;
                        return (
                          <div key={fn.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <ActionIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm">{fn.name}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {fn.scope}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>

        {/* Users */}
        {users.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Người dùng giữ chức vụ ({users.length})
            </h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    {user.rank && (
                      <Badge variant="outline">{user.rank}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
