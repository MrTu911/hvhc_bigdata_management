'use client';

/**
 * /dashboard/settings/security
 * Bảo mật tài khoản: đổi mật khẩu, xem phiên đăng nhập.
 * Yêu cầu: MANAGE_MY_SECURITY (Tầng 0 — MỌI user)
 */

import { useEffect, useState, useTransition } from 'react';
import { ShieldCheck, KeyRound, Monitor, LogOut, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isCurrent?: boolean;
}

export default function SecuritySettingsPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadSessions() {
    setSessionsLoading(true);
    setSessionsError(null);
    fetch('/api/auth/sessions/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSessions(res.data ?? []);
        else setSessionsError(res.error ?? 'Không thể tải phiên đăng nhập');
      })
      .catch(() => setSessionsError('Lỗi kết nối server'))
      .finally(() => setSessionsLoading(false));
  }

  useEffect(() => { loadSessions(); }, []);

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setPwMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setPwMsg({ type: 'error', text: data.error ?? 'Đổi mật khẩu thất bại' });
        }
      } catch {
        setPwMsg({ type: 'error', text: 'Lỗi kết nối server' });
      }
    });
  }

  async function revokeSession(sessionId: string) {
    try {
      const res = await fetch('/api/auth/sessions/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) loadSessions();
    } catch {
      // ignore
    }
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN');
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Bảo mật tài khoản
        </h1>
        <p className="text-muted-foreground mt-1">Quản lý mật khẩu và phiên đăng nhập</p>
      </div>

      {/* Đổi mật khẩu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Đổi mật khẩu
          </CardTitle>
          <CardDescription>Mật khẩu mới phải có ít nhất 8 ký tự</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {pwMsg && (
              <p className={`text-sm ${pwMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {pwMsg.text}
              </p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Phiên đăng nhập */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Phiên đăng nhập
            </CardTitle>
            <CardDescription>Xem và thu hồi các phiên đăng nhập đang hoạt động</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadSessions} disabled={sessionsLoading}>
            <RefreshCw className={`h-4 w-4 ${sessionsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {sessionsError && <p className="text-sm text-destructive">{sessionsError}</p>}
          {!sessionsError && sessions.length === 0 && !sessionsLoading && (
            <p className="text-sm text-muted-foreground">Không có phiên nào đang hoạt động.</p>
          )}
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
                <div className="space-y-1 text-sm min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {s.userAgent ? s.userAgent.substring(0, 60) : 'Thiết bị không xác định'}
                    </span>
                    {s.isCurrent && <Badge variant="default" className="text-xs shrink-0">Hiện tại</Badge>}
                  </div>
                  <div className="text-muted-foreground space-y-0.5">
                    {s.ipAddress && <div>IP: {s.ipAddress}</div>}
                    <div>Đăng nhập: {formatDate(s.createdAt)}</div>
                    {s.lastActiveAt && <div>Hoạt động lần cuối: {formatDate(s.lastActiveAt)}</div>}
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => revokeSession(s.id)}
                  >
                    <LogOut className="h-3 w-3 mr-1" /> Thu hồi
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
