
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bell, Mail, MessageSquare, CheckCircle, XCircle, Clock, Search } from 'lucide-react';

interface NotificationEntry {
  id: number;
  notification_type: string;
  recipient: string;
  subject?: string;
  message: string;
  status: string;
  error_message?: string;
  sent_at: string;
}

export default function NotificationHistoryPage() {
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: '',
  });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, [filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.status !== 'all') params.set('status', filters.status);
      if (filters.search) params.set('recipient', filters.search);

      const res = await fetch(`/api/notifications/history?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch('/api/notifications/history?action=stats&timeRange=week');
      const data = await res.json();
      setStats(data.stats || []);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'telegram':
        return <MessageSquare className="h-4 w-4 text-sky-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      sent: 'secondary',
      failed: 'destructive',
      pending: 'default',
    };
    
    const icons: any = {
      sent: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center gap-1">
        {icons[status]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTotalByType = (type: string) => {
    return stats
      .filter((s: any) => s.notification_type === type)
      .reduce((sum: number, s: any) => sum + parseInt(s.count), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notification History</h2>
        <p className="text-muted-foreground">View all sent notifications and alerts</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Notifications</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalByType('email')}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Telegram Alerts</CardTitle>
            <MessageSquare className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalByType('telegram')}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Notifications</CardTitle>
            <Bell className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalByType('system')}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by recipient..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadNotifications}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>{notifications.length} notifications found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No notifications found</TableCell>
                </TableRow>
              ) : (
                notifications.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notif.notification_type)}
                        <span className="capitalize">{notif.notification_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{notif.recipient}</TableCell>
                    <TableCell>{notif.subject || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{notif.message}</TableCell>
                    <TableCell>{getStatusBadge(notif.status)}</TableCell>
                    <TableCell>{new Date(notif.sent_at).toLocaleString()}</TableCell>
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
