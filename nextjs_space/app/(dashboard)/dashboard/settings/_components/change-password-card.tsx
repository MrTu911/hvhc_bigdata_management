'use client';

/**
 * ChangePasswordCard — Đổi mật khẩu tài khoản.
 * Dùng chung cho /dashboard/settings (tab Bảo mật) và /dashboard/settings/security.
 * Gọi POST /api/auth/change-password. Logic validation chỉ ở mức UX, rule thật ở backend.
 */

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordCard() {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('settings.security.passwordMismatch') });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMessage({ type: 'error', text: t('settings.security.passwordTooShort') });
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
          setMessage({ type: 'success', text: t('settings.security.passwordChanged') });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          setMessage({ type: 'error', text: data.error ?? t('settings.security.passwordError') });
        }
      } catch {
        setMessage({ type: 'error', text: t('settings.security.connError') });
      }
    });
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-500" /> {t('settings.security.passwordTitle')}
        </CardTitle>
        <CardDescription>{t('settings.security.passwordDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('settings.security.currentPassword')}</Label>
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
            <Label htmlFor="newPassword">{t('settings.security.newPassword')}</Label>
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
            <Label htmlFor="confirmPassword">{t('settings.security.confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? t('settings.security.processing') : t('settings.security.changePassword')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
