'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Brain,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
  Zap,
  Shield,
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  WifiOff,
  Wifi,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AIConfig {
  provider: string;
  configured: boolean;
  modelConfig: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

interface TestResult {
  success: boolean;
  provider?: string;
  model?: string;
  responseTime?: string;
  message?: string;
  error?: string;
  status?: string;
}

export default function AISettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);

  // Form state
  const [provider, setProvider] = useState<string>('none');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2000);

  // Test tab state — separate apiKey for testing without polluting the config form
  const [testApiKey, setTestApiKey] = useState<string>('');
  const [showTestApiKey, setShowTestApiKey] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ai-config');

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setProvider(data.provider);
        setModel(data.modelConfig.model);
        setTemperature(data.modelConfig.temperature);
        setMaxTokens(data.modelConfig.maxTokens);
      } else {
        toast.error('Không thể tải cấu hình AI');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Lỗi khi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (provider !== 'none' && !apiKey) {
      toast.error('Vui lòng nhập API Key');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          temperature,
          maxTokens,
          validateKey: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cấu hình AI đã được lưu thành công!');
        await loadConfig();
        setApiKey('');
      } else {
        toast.error(data.error || 'Không thể lưu cấu hình');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    // Use testApiKey if provided, otherwise test the currently saved config
    const keyToTest = testApiKey.trim();
    const providerToTest = provider;

    if (keyToTest && !providerToTest || providerToTest === 'none') {
      toast.error('Vui lòng chọn provider trước khi test');
      return;
    }

    if (!config?.configured && !keyToTest) {
      toast.error('Vui lòng cấu hình AI hoặc nhập API Key để test');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const response = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config?.provider || providerToTest,
          // Send key only if user provided a new one to test; backend uses saved key if empty
          ...(keyToTest ? { apiKey: keyToTest } : {}),
        }),
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('Kết nối AI thành công!');
      } else {
        toast.error('Kết nối AI thất bại: ' + (data.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Lỗi khi test kết nối');
      setTestResult({ success: false, error: 'Connection timeout' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisableConfirm = async () => {
    setDisableDialogOpen(false);
    try {
      setSaving(true);
      const response = await fetch('/api/admin/ai-config', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Đã vô hiệu hóa AI');
        await loadConfig();
        setApiKey('');
        setTestApiKey('');
        setTestResult(null);
      } else {
        toast.error('Không thể vô hiệu hóa AI');
      }
    } catch (error) {
      console.error('Error disabling AI:', error);
      toast.error('Lỗi khi vô hiệu hóa AI');
    } finally {
      setSaving(false);
    }
  };

  const getModelOptions = () => {
    if (provider === 'openai') {
      return [
        { value: 'gpt-4o', label: 'GPT-4o (Mạnh nhất)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Khuyến nghị)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Rẻ nhất)' },
      ];
    } else if (provider === 'abacusai') {
      return [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Khuyến nghị)' },
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Nhanh)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
      ];
    }
    return [];
  };

  const providerLabel = (p: string) => {
    if (p === 'openai') return 'OpenAI';
    if (p === 'abacusai') return 'Abacus AI';
    return 'Không có';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canSave = provider === 'none' || !!apiKey;
  const configChanged =
    provider !== config?.provider ||
    model !== config?.modelConfig?.model ||
    temperature !== config?.modelConfig?.temperature ||
    maxTokens !== config?.modelConfig?.maxTokens ||
    !!apiKey;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Cấu Hình AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Kích hoạt và cấu hình các tính năng AI cho hệ thống
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Làm mới
          </Button>
          {config?.configured ? (
            <Badge className="gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-600 text-white">
              <Wifi className="h-3.5 w-3.5" />
              AI Đang Hoạt Động
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" />
              Chưa Cấu Hình
            </Badge>
          )}
        </div>
      </div>

      {/* Status summary card */}
      {config?.configured && (
        <Card className="mb-6 border-green-200 bg-green-50/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Đang dùng:</span>
                  <Badge variant="secondary">{providerLabel(config.provider)}</Badge>
                </div>
                <div className="text-muted-foreground">
                  Model: <span className="font-mono font-medium">{config.modelConfig.model}</span>
                </div>
                <div className="text-muted-foreground">
                  Temperature: <span className="font-medium">{config.modelConfig.temperature}</span>
                </div>
                <div className="text-muted-foreground">
                  Max Tokens: <span className="font-medium">{config.modelConfig.maxTokens}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisableDialogOpen(true)}
                disabled={saving}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Vô Hiệu Hóa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Features overview */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-blue-600" />
            Các Tính Năng AI Được Kích Hoạt
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { title: 'Phân Tích Cảm Xúc', desc: 'Đánh giá phản hồi học viên' },
              { title: 'Gợi Ý Học Tập', desc: 'Đề xuất cá nhân hóa' },
              { title: 'Tóm Tắt Nghiên Cứu', desc: 'Tự động tổng hợp' },
              { title: 'Phân Tích KPI', desc: 'Insights thông minh' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Cấu Hình
          </TabsTrigger>
          <TabsTrigger value="test">
            <Zap className="h-4 w-4 mr-2" />
            Kiểm Tra Kết Nối
          </TabsTrigger>
          <TabsTrigger value="guide">
            <Shield className="h-4 w-4 mr-2" />
            Hướng Dẫn
          </TabsTrigger>
        </TabsList>

        {/* ── Configuration Tab ── */}
        <TabsContent value="config" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Chọn AI Provider</CardTitle>
              <CardDescription>
                Chọn nhà cung cấp AI và nhập API key để kích hoạt các tính năng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={provider} onValueChange={(val) => { setProvider(val); setModel(''); }}>
                <div className="space-y-2">
                  <label
                    htmlFor="abacusai"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="abacusai" id="abacusai" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">Abacus AI</p>
                        <Badge variant="secondary" className="text-xs">Khuyến nghị</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Giá tốt nhất • Nhiều model: Claude, GPT, Gemini • $0.88–17.5/tháng
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="openai"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="openai" id="openai" />
                    <div className="flex-1">
                      <p className="font-semibold">OpenAI</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        GPT-4o, GPT-4o Mini • Chất lượng cao • $5–20/tháng
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="none"
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  >
                    <RadioGroupItem value="none" id="none" />
                    <div className="flex-1">
                      <p className="font-semibold">Không sử dụng AI</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Tắt tất cả tính năng AI</p>
                    </div>
                  </label>
                </div>
              </RadioGroup>

              {provider !== 'none' && (
                <div className="space-y-5 pt-2 border-t">
                  {/* API Key */}
                  <div className="space-y-1.5">
                    <Label htmlFor="apiKey">
                      API Key{' '}
                      <span className="text-muted-foreground font-normal">
                        ({provider === 'abacusai' ? 'Abacus AI' : 'OpenAI'})
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={
                          config?.configured && config.provider === provider
                            ? '••••••••  (đã lưu — nhập để thay đổi)'
                            : provider === 'abacusai'
                            ? 'Nhập Abacus AI API key...'
                            : 'sk-...'
                        }
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {provider === 'abacusai' ? (
                        <>
                          Lấy API key tại{' '}
                          <a
                            href="https://abacus.ai/app/profile/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            Abacus.AI Profile <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      ) : (
                        <>
                          Lấy API key tại{' '}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            OpenAI Platform <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Chọn model AI" />
                      </SelectTrigger>
                      <SelectContent>
                        {getModelOptions().map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">Temperature</Label>
                      <span className="text-sm font-mono font-medium w-10 text-right">
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      id="temperature"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={([val]) => setTemperature(val)}
                      className="py-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Chính xác (0)</span>
                      <span>Cân bằng (1)</span>
                      <span>Sáng tạo (2)</span>
                    </div>
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <span className="text-sm font-mono font-medium">{maxTokens.toLocaleString()}</span>
                    </div>
                    <Slider
                      id="maxTokens"
                      min={100}
                      max={4000}
                      step={100}
                      value={[maxTokens]}
                      onValueChange={([val]) => setMaxTokens(val)}
                      className="py-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>100</span>
                      <span>Độ dài tối đa phản hồi AI</span>
                      <span>4,000</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Save button */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving || !canSave || !configChanged}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {configChanged ? 'Lưu Cấu Hình' : 'Đã Lưu'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Test Connection Tab ── */}
        <TabsContent value="test" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Kiểm Tra Kết Nối AI</CardTitle>
              <CardDescription>
                Xác nhận kết nối với AI provider hoạt động bình thường
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!config?.configured ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Chưa có cấu hình AI. Vui lòng cấu hình ở tab{' '}
                    <strong>Cấu Hình</strong> trước.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Current config summary */}
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Provider đang dùng</span>
                      <Badge variant="default">{providerLabel(config.provider)}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Model</span>
                      <span className="font-mono font-medium">{config.modelConfig.model}</span>
                    </div>
                  </div>

                  {/* Optional: test with a different key */}
                  <div className="space-y-1.5">
                    <Label>API Key (tuỳ chọn)</Label>
                    <div className="relative">
                      <Input
                        type={showTestApiKey ? 'text' : 'password'}
                        placeholder="Để trống → dùng key đang lưu trong hệ thống"
                        value={testApiKey}
                        onChange={(e) => setTestApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTestApiKey(!showTestApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showTestApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Nhập key mới nếu muốn test trước khi lưu vào hệ thống.
                    </p>
                  </div>

                  <Button
                    onClick={handleTest}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang kiểm tra...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Kiểm Tra Kết Nối
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <Alert
                      variant={testResult.success ? 'default' : 'destructive'}
                      className={testResult.success ? 'border-green-300 bg-green-50' : ''}
                    >
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {testResult.success ? (
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold text-green-800">Kết nối thành công!</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-green-700">
                              <span>Provider:</span><span className="font-medium">{testResult.provider}</span>
                              <span>Model:</span><span className="font-mono font-medium">{testResult.model}</span>
                              <span>Thời gian phản hồi:</span><span className="font-medium">{testResult.responseTime}</span>
                            </div>
                            {testResult.message && (
                              <div className="mt-2 p-2.5 bg-white border border-green-200 rounded text-green-900 text-xs">
                                <span className="font-medium">Phản hồi AI: </span>{testResult.message}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="font-semibold">Kết nối thất bại</p>
                            <p className="text-sm mt-1">{testResult.error}</p>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Guide Tab ── */}
        <TabsContent value="guide" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Hướng Dẫn Lấy API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Abacus AI */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Abacus AI
                  <Badge variant="secondary" className="text-xs font-normal">Khuyến nghị</Badge>
                </h3>
                <div className="space-y-3 text-sm pl-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-1">Ưu điểm</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Giá rẻ nhất: $0.88–17.5/tháng</li>
                        <li>Nhiều model: Claude, GPT, Gemini</li>
                        <li>Không cần thẻ tín dụng quốc tế</li>
                        <li>Hỗ trợ tiếng Việt tốt</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Các bước lấy API key</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Truy cập <a href="https://abacus.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">abacus.ai</a></li>
                        <li>Đăng ký / đăng nhập</li>
                        <li>Vào <strong>Profile → API Keys</strong></li>
                        <li>Tạo API key mới</li>
                        <li>Copy và paste vào form</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t" />

              {/* OpenAI */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  OpenAI
                </h3>
                <div className="space-y-3 text-sm pl-7">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-1">Ưu/nhược điểm</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Chất lượng cao, ổn định</li>
                        <li>GPT-4o là model mạnh nhất</li>
                        <li>Cần thẻ Visa/Master quốc tế</li>
                        <li>Chi phí cao hơn: $5–20/tháng</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Các bước lấy API key</p>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Truy cập <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com</a></li>
                        <li>Đăng ký / đăng nhập</li>
                        <li>Vào <strong>API Keys</strong></li>
                        <li>Create new secret key</li>
                        <li>Copy và paste vào form</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900 text-sm">
                  <strong>Lưu ý bảo mật:</strong> API key là thông tin bí mật. Không chia sẻ với người khác.
                  Nếu bị lộ, hãy thu hồi và tạo key mới ngay lập tức.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Disable confirmation dialog */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Vô Hiệu Hóa AI?
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ xóa cấu hình AI khỏi hệ thống. Tất cả các tính năng AI
              (phân tích cảm xúc, gợi ý học tập, tóm tắt nghiên cứu, phân tích KPI) sẽ
              ngừng hoạt động. Bạn có thể bật lại bất cứ lúc nào.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDisableConfirm} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Vô Hiệu Hóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
