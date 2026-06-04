'use client';

/**
 * MfaSetupDialog — Thiết lập MFA: setup (lấy QR + secret) → verify (nhập OTP) → bật.
 * Gọi POST /api/auth/mfa/setup rồi POST /api/auth/mfa/verify.
 */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnabled: () => void;
}

const OTP_LENGTH = 6;

export function MfaSetupDialog({ open, onOpenChange, onEnabled }: MfaSetupDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state khi đóng dialog (secret chỉ hiển thị 1 lần)
      setQrCodeDataUrl(null);
      setSecret(null);
      setToken('');
      setError(null);
      return;
    }

    let cancelled = false;
    setLoadingSetup(true);
    setError(null);
    fetch('/api/auth/mfa/setup', { method: 'POST' })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setQrCodeDataUrl(res.data.qrCodeDataUrl);
          setSecret(res.data.secret);
        } else {
          setError(res.error ?? t('settings.security.connError'));
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('settings.security.connError'));
      })
      .finally(() => {
        if (!cancelled) setLoadingSetup(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, t]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.status === 429) {
        setError(t('settings.security.mfaRateLimit'));
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: t('settings.security.mfaEnabledToast') });
        onEnabled();
        onOpenChange(false);
      } else {
        setError(data.error ?? t('settings.security.passwordError'));
      }
    } catch {
      setError(t('settings.security.connError'));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.security.mfaSetupTitle')}</DialogTitle>
          <DialogDescription>{t('settings.security.mfaSetupStep1')}</DialogDescription>
        </DialogHeader>

        {loadingSetup ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-5">
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <Image src={qrCodeDataUrl} alt="MFA QR code" width={180} height={180} unoptimized />
                </div>
                {secret && (
                  <div className="w-full text-center">
                    <p className="text-xs text-muted-foreground">{t('settings.security.mfaSetupSecret')}</p>
                    <code className="mt-1 inline-block break-all rounded bg-slate-100 px-2 py-1 text-sm font-mono text-slate-700">
                      {secret}
                    </code>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="mfa-otp">{t('settings.security.mfaSetupStep2')}</Label>
                <Input
                  id="mfa-otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  placeholder={t('settings.security.mfaOtpPlaceholder')}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                  className="tracking-widest text-center text-lg"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={verifying || token.length < OTP_LENGTH || !qrCodeDataUrl}>
                {verifying ? t('settings.security.processing') : t('settings.security.mfaConfirm')}
              </Button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
