'use client';

/**
 * MfaCard — Hiển thị trạng thái MFA và cho phép bật/tắt.
 * Gọi GET /api/auth/mfa/status, POST /api/auth/mfa/disable; bật MFA qua MfaSetupDialog.
 */

import { useEffect, useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { MfaSetupDialog } from './mfa-setup-dialog';

const OTP_LENGTH = 6;

export function MfaCard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupOpen, setSetupOpen] = useState(false);
  const [disableToken, setDisableToken] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  function loadStatus() {
    setLoading(true);
    fetch('/api/auth/mfa/status')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setMfaEnabled(res.data.mfaEnabled);
      })
      .catch(() => setMfaEnabled(false))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setDisableError(null);
    setDisabling(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: disableToken }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: t('settings.security.mfaDisabledToast') });
        setDisableToken('');
        loadStatus();
      } else {
        setDisableError(data.error ?? t('settings.security.passwordError'));
      }
    } catch {
      setDisableError(t('settings.security.connError'));
    } finally {
      setDisabling(false);
    }
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200 rounded-xl dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-slate-500" /> {t('settings.security.mfaTitle')}
          </CardTitle>
          <CardDescription>{t('settings.security.mfaDesc')}</CardDescription>
        </div>
        {!loading && mfaEnabled !== null && (
          mfaEnabled ? (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              {t('settings.security.mfaEnabled')}
            </Badge>
          ) : (
            <Badge variant="secondary">{t('settings.security.mfaDisabled')}</Badge>
          )
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : mfaEnabled ? (
          <form onSubmit={handleDisable} className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="mfa-disable-otp">{t('settings.security.mfaEnableHint')}</Label>
              <Input
                id="mfa-disable-otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                placeholder={t('settings.security.mfaOtpPlaceholder')}
                value={disableToken}
                onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
                className="tracking-widest"
              />
            </div>
            {disableError && <p className="text-sm text-destructive">{disableError}</p>}
            <Button
              type="submit"
              variant="destructive"
              disabled={disabling || disableToken.length < OTP_LENGTH}
            >
              {disabling ? t('settings.security.processing') : t('settings.security.mfaDisable')}
            </Button>
          </form>
        ) : (
          <Button onClick={() => setSetupOpen(true)}>{t('settings.security.mfaEnable')}</Button>
        )}
      </CardContent>

      <MfaSetupDialog open={setupOpen} onOpenChange={setSetupOpen} onEnabled={loadStatus} />
    </Card>
  );
}
