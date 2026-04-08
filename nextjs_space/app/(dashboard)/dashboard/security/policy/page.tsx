'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Save, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SecurityPolicyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policy, setPolicy] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    loadPolicy();
  }, []);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security/policy');
      const data = await res.json();
      
      if (data.success) {
        setPolicy(data.policy);
        
        // Convert settings array to object
        const settingsObj: any = {};
        data.settings.forEach((setting: any) => {
          settingsObj[setting.setting_key] = {
            value: setting.setting_value,
            description: setting.description,
          };
        });
        setSettings(settingsObj);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
      toast.error('Failed to load security policy');
    } finally {
      setLoading(false);
    }
  };

  const savePolicy = async () => {
    try {
      setSaving(true);
      
      // Convert settings object back to simple key-value
      const settingsToSave: any = {};
      Object.keys(settings).forEach(key => {
        settingsToSave[key] = settings[key].value;
      });

      const res = await fetch('/api/security/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success('Security policy updated successfully');
        loadPolicy(); // Reload to get updated policy
      } else {
        toast.error(data.error || 'Failed to update policy');
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
      toast.error('Failed to save security policy');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings({
      ...settings,
      [key]: {
        ...settings[key],
        value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="h-8 w-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Policy</h2>
          <p className="text-muted-foreground">Configure password and security settings</p>
        </div>
        <Button onClick={savePolicy} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These settings will affect all users. Changes take effect immediately.
        </AlertDescription>
      </Alert>

      {/* Current Policy Summary */}
      {policy && (
        <Card>
          <CardHeader>
            <CardTitle>Current Policy Summary</CardTitle>
            <CardDescription>Overview of active security policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Password Requirements</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Min {policy.minLength} characters</Badge>
                  {policy.requireUppercase && <Badge variant="outline">Uppercase</Badge>}
                  {policy.requireLowercase && <Badge variant="outline">Lowercase</Badge>}
                  {policy.requireNumber && <Badge variant="outline">Numbers</Badge>}
                  {policy.requireSpecial && <Badge variant="outline">Special chars</Badge>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password Expiry</Label>
                <Badge variant="secondary">{policy.expiryDays} days</Badge>
              </div>
              <div className="space-y-2">
                <Label>Password History</Label>
                <Badge variant="secondary">Remember last {policy.historyCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Password Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Password Requirements</CardTitle>
          <CardDescription>Set password complexity requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password_min_length">Minimum Password Length</Label>
              <Input
                id="password_min_length"
                type="number"
                min="6"
                max="32"
                value={settings.password_min_length?.value || '8'}
                onChange={(e) => updateSetting('password_min_length', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {settings.password_min_length?.description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_expiry_days">Password Expiry (days)</Label>
              <Input
                id="password_expiry_days"
                type="number"
                min="0"
                max="365"
                value={settings.password_expiry_days?.value || '90'}
                onChange={(e) => updateSetting('password_expiry_days', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set to 0 to disable password expiry
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Uppercase Letter</Label>
                <p className="text-sm text-muted-foreground">
                  Password must contain at least one uppercase letter
                </p>
              </div>
              <Switch
                checked={settings.password_require_uppercase?.value === 'true'}
                onCheckedChange={(checked) => 
                  updateSetting('password_require_uppercase', checked ? 'true' : 'false')
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Lowercase Letter</Label>
                <p className="text-sm text-muted-foreground">
                  Password must contain at least one lowercase letter
                </p>
              </div>
              <Switch
                checked={settings.password_require_lowercase?.value === 'true'}
                onCheckedChange={(checked) => 
                  updateSetting('password_require_lowercase', checked ? 'true' : 'false')
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Number</Label>
                <p className="text-sm text-muted-foreground">
                  Password must contain at least one number
                </p>
              </div>
              <Switch
                checked={settings.password_require_number?.value === 'true'}
                onCheckedChange={(checked) => 
                  updateSetting('password_require_number', checked ? 'true' : 'false')
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Special Character</Label>
                <p className="text-sm text-muted-foreground">
                  Password must contain at least one special character
                </p>
              </div>
              <Switch
                checked={settings.password_require_special?.value === 'true'}
                onCheckedChange={(checked) => 
                  updateSetting('password_require_special', checked ? 'true' : 'false')
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Login and account protection settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max_failed_login_attempts">Max Failed Login Attempts</Label>
              <Input
                id="max_failed_login_attempts"
                type="number"
                min="3"
                max="10"
                value={settings.max_failed_login_attempts?.value || '5'}
                onChange={(e) => updateSetting('max_failed_login_attempts', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lock account after this many failed login attempts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_lock_duration_minutes">Account Lock Duration (minutes)</Label>
              <Input
                id="account_lock_duration_minutes"
                type="number"
                min="5"
                max="1440"
                value={settings.account_lock_duration_minutes?.value || '30'}
                onChange={(e) => updateSetting('account_lock_duration_minutes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                How long to lock the account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_timeout_minutes">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout_minutes"
                type="number"
                min="5"
                max="480"
                value={settings.session_timeout_minutes?.value || '60'}
                onChange={(e) => updateSetting('session_timeout_minutes', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Auto logout after inactivity
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_history_count">Password History Count</Label>
              <Input
                id="password_history_count"
                type="number"
                min="0"
                max="24"
                value={settings.password_history_count?.value || '5'}
                onChange={(e) => updateSetting('password_history_count', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Prevent reusing last N passwords
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePolicy} disabled={saving} size="lg">
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Saving...' : 'Save Security Policy'}
        </Button>
      </div>
    </div>
  );
}
