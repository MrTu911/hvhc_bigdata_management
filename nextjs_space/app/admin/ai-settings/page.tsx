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
  TrendingUp
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

export default function AISettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  // Form state
  const [provider, setProvider] = useState<string>('none');
  const [apiKey, setApiKey] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(2000);

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

  const handleSave = async (validateKey: boolean = false) => {
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
          validateKey
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cấu hình AI đã được lưu thành công!');
        await loadConfig();
        setApiKey(''); // Clear API key after saving
      } else {
        toast.error(data.error || 'Không thể lưu cấu hình');
        if (data.details) {
          toast.error(data.details);
        }
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey) {
      toast.error('Vui lòng nhập API Key để test');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      
      const response = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey })
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('Kết nối AI thành công!');
      } else {
        toast.error('Kết nối AI thất bại');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Lỗi khi test kết nối');
      setTestResult({ success: false, error: 'Connection timeout' });
    } finally {
      setTesting(false);
    }
  };

  const handleDisable = async () => {
    if (!confirm('Bạn có chắc muốn vô hiệu hóa AI không?')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/ai-config', {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Đã vô hiệu hóa AI');
        await loadConfig();
        setApiKey('');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getModelOptions = () => {
    if (provider === 'openai') {
      return [
        { value: 'gpt-4o', label: 'GPT-4o (Mạnh nhất)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Khuyến nghị)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Rẻ nhất)' }
      ];
    } else if (provider === 'abacusai') {
      return [
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Khuyến nghị)' },
        { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Nhanh)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' }
      ];
    }
    return [];
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Cấu Hình AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Kích hoạt và cấu hình các tính năng AI cho hệ thống
          </p>
        </div>
        
        {config?.configured && (
          <Badge variant="default" className="text-lg px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            AI Đang Hoạt Động
          </Badge>
        )}
      </div>

      {/* AI Features Overview */}
      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Các Tính Năng AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phân Tích Cảm Xúc</h4>
                <p className="text-xs text-muted-foreground">Đánh giá phản hồi học viên</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Gợi Ý Học Tập</h4>
                <p className="text-xs text-muted-foreground">Đề xuất cá nhân hóa</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Tóm Tắt Nghiên Cứu</h4>
                <p className="text-xs text-muted-foreground">Tự động tổng hợp</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Check className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Phân Tích KPI</h4>
                <p className="text-xs text-muted-foreground">Insights thông minh</p>
              </div>
            </div>
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
            Test Kết Nối
          </TabsTrigger>
          <TabsTrigger value="guide">
            <Shield className="h-4 w-4 mr-2" />
            Hướng Dẫn
          </TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chọn AI Provider</CardTitle>
              <CardDescription>
                Chọn nhà cung cấp AI và nhập API key để kích hoạt các tính năng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={provider} onValueChange={setProvider}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="abacusai" id="abacusai" />
                    <Label htmlFor="abacusai" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Abacus AI (Khuyến nghị)</h4>
                          <p className="text-sm text-muted-foreground">
                            Giá tốt nhất • Nhiều model • $0.88-17.5/tháng
                          </p>
                        </div>
                        <Badge variant="secondary">Recommend</Badge>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="openai" id="openai" />
                    <Label htmlFor="openai" className="flex-1 cursor-pointer">
                      <div>
                        <h4 className="font-semibold">OpenAI</h4>
                        <p className="text-sm text-muted-foreground">
                          GPT-4o, GPT-4o Mini • $5-20/tháng
                        </p>
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer">
                      <div>
                        <h4 className="font-semibold">Không sử dụng AI</h4>
                        <p className="text-sm text-muted-foreground">
                          Tắt tất cả tính năng AI
                        </p>
                      </div>
                    </Label>
                  </div>
                </div>
              </RadioGroup>

              {provider !== 'none' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      API Key {provider === 'abacusai' ? '(Abacus AI)' : '(OpenAI)'}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder={
                        provider === 'abacusai' 
                          ? 'Nhập Abacus AI API key...' 
                          : 'sk-...'
                      }
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {provider === 'abacusai' && (
                        <>
                          Lấy API key tại{' '}
                          <a 
                            href="https://abacus.ai/app/profile/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            Abacus.AI Profile
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                      {provider === 'openai' && (
                        <>
                          Lấy API key tại{' '}
                          <a 
                            href="https://platform.openai.com/api-keys" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            OpenAI Platform
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn model" />
                      </SelectTrigger>
                      <SelectContent>
                        {getModelOptions().map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">
                        Temperature: {temperature}
                      </Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = chính xác, 2 = sáng tạo
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        min="100"
                        max="4000"
                        step="100"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Độ dài tối đa của phản hồi
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleSave(false)}
                  disabled={saving || (provider !== 'none' && !apiKey)}
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
                      Lưu Cấu Hình
                    </>
                  )}
                </Button>

                {config?.configured && (
                  <Button
                    onClick={handleDisable}
                    disabled={saving}
                    variant="outline"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Vô Hiệu Hóa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Connection Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kiểm Tra Kết Nối AI</CardTitle>
              <CardDescription>
                Test kết nối với AI provider để đảm bảo hoạt động tốt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!config?.configured && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vui lòng cấu hình AI provider trước khi test
                  </AlertDescription>
                </Alert>
              )}

              {config?.configured && (
                <>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Provider hiện tại:</span>
                      <Badge variant="default">
                        {config.provider === 'openai' ? 'OpenAI' : 'Abacus AI'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Model:</span>
                      <span className="text-sm text-muted-foreground">
                        {config.modelConfig.model}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>API Key để test (nếu muốn test key mới)</Label>
                    <Input
                      type="password"
                      placeholder="Để trống để test key hiện tại"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleTest}
                    disabled={testing}
                    className="w-full"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang test...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Kết Nối
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <Alert
                      variant={testResult.success ? 'default' : 'destructive'}
                      className="mt-4"
                    >
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        {testResult.success ? (
                          <div className="space-y-2">
                            <div className="font-semibold">✓ Kết nối thành công!</div>
                            <div className="text-sm space-y-1">
                              <div>Provider: {testResult.provider}</div>
                              <div>Model: {testResult.model}</div>
                              <div>Response Time: {testResult.responseTime}</div>
                              <div className="mt-2 p-2 bg-background rounded">
                                {testResult.message}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold">✗ Kết nối thất bại</div>
                            <div className="text-sm mt-1">{testResult.error}</div>
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

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hướng Dẫn Cấu Hình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Abacus AI (Khuyến nghị)
                </h3>
                <div className="space-y-2 text-sm pl-7">
                  <p className="font-medium">Ưu điểm:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Giá rẻ nhất: $0.88-17.5/tháng</li>
                    <li>Nhiều model: Claude, GPT, Gemini</li>
                    <li>Không cần thẻ tín dụng quốc tế</li>
                    <li>Hỗ trợ tiếng Việt tốt</li>
                  </ul>
                  <p className="font-medium mt-3">Cách lấy API key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Truy cập <a href="https://abacus.ai" target="_blank" className="text-primary hover:underline">abacus.ai</a></li>
                    <li>Đăng ký/đăng nhập tài khoản</li>
                    <li>Vào Profile → API Keys</li>
                    <li>Tạo API key mới</li>
                    <li>Copy và paste vào form trên</li>
                  </ol>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  OpenAI
                </h3>
                <div className="space-y-2 text-sm pl-7">
                  <p className="font-medium">Ưu điểm:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Chất lượng cao, ổn định</li>
                    <li>GPT-4o mạnh nhất</li>
                    <li>Tài liệu phong phú</li>
                  </ul>
                  <p className="font-medium mt-3">Nhược điểm:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Cần thẻ Visa/Master quốc tế</li>
                    <li>Chi phí cao hơn: $5-20/tháng</li>
                  </ul>
                  <p className="font-medium mt-3">Cách lấy API key:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Truy cập <a href="https://platform.openai.com" target="_blank" className="text-primary hover:underline">platform.openai.com</a></li>
                    <li>Đăng ký/đăng nhập</li>
                    <li>Vào API Keys</li>
                    <li>Create new secret key</li>
                    <li>Copy và paste vào form</li>
                  </ol>
                </div>
              </div>

              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Lưu ý bảo mật:</strong> API key rất quan trọng, không chia sẻ với người khác. 
                  Nếu bị lộ, hãy xóa và tạo key mới ngay lập tức.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}