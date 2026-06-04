'use client';

/**
 * SessionsCard — Xem và thu hồi các phiên đăng nhập đang hoạt động.
 * Dùng chung cho /dashboard/settings (tab Bảo mật) và /dashboard/settings/security.
 * Gọi GET/DELETE /api/auth/sessions/me.
 */

import { useEffect, useState } from 'react';
import { Monitor, LogOut, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/providers/language-provider';

interface SessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  lastActiveAt: string | null;
  isCurrent?: boolean;
}

export function SessionsCard() {
  const { t, language } = useLanguage();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function loadSessions() {
    setLoading(true);
    setError(null);
    fetch('/api/auth/sessions/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSessions(res.data ?? []);
        else setError(res.error ?? t('settings.security.sessionLoadError'));
      })
      .catch(() => setError(t('settings.security.connError')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function revokeSession(sessionId: string) {
    try {
      const res = await fetch('/api/auth/sessions/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) loadSessions();
    } catch {
      // bỏ qua: lỗi mạng tạm thời, user có thể bấm làm mới
    }
  }

  function formatDate(value: string | null) {
    if (!value) return '—';
    return new Date(value).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US');
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4 text-slate-500" /> {t('settings.security.sessionsTitle')}
          </CardTitle>
          <CardDescription>{t('settings.security.sessionsDesc')}</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSessions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!error && sessions.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">{t('settings.security.sessionEmpty')}</p>
        )}
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
              <div className="space-y-1 text-sm min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {s.userAgent ? s.userAgent.substring(0, 60) : t('settings.security.sessionUnknownDevice')}
                  </span>
                  {s.isCurrent && (
                    <Badge className="text-xs shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                      {t('settings.security.sessionCurrent')}
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground space-y-0.5">
                  {s.ipAddress && <div>IP: {s.ipAddress}</div>}
                  <div>{t('settings.security.sessionLoginAt')}: {formatDate(s.createdAt)}</div>
                  {s.lastActiveAt && (
                    <div>{t('settings.security.sessionLastActive')}: {formatDate(s.lastActiveAt)}</div>
                  )}
                </div>
              </div>
              {!s.isCurrent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => revokeSession(s.id)}
                >
                  <LogOut className="h-3 w-3 mr-1" /> {t('settings.security.sessionRevoke')}
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
