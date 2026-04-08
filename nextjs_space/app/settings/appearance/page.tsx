
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Paintbrush, Save, RefreshCw, Palette, Type, Layout } from 'lucide-react';

interface ThemeSettings {
  colors: Record<string, string>;
  typography: Record<string, any>;
  layout: Record<string, any>;
  branding: Record<string, any>;
}

export default function AppearancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeSettings>({
    colors: {},
    typography: {},
    layout: {},
    branding: {}
  });

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/theme');
      if (!response.ok) throw new Error('Failed to load theme');
      
      const data = await response.json();
      setTheme(data.theme);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Flatten settings for API
      const flattenedSettings: Record<string, any> = {};
      Object.values(theme).forEach(category => {
        Object.entries(category).forEach(([key, value]) => {
          flattenedSettings[key] = value;
        });
      });

      const response = await fetch('/api/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings: flattenedSettings })
      });

      if (!response.ok) throw new Error('Failed to save theme');

      toast({
        title: 'Thành công',
        description: 'Cài đặt giao diện đã được lưu'
      });

      // Reload to apply changes
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateColor = (key: string, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }));
  };

  const updateTypography = (key: string, value: any) => {
    setTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value
      }
    }));
  };

  const updateBranding = (key: string, value: any) => {
    setTheme(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value
      }
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Paintbrush className="h-8 w-8 text-primary" />
            Cài đặt Giao diện
          </h1>
          <p className="text-muted-foreground mt-1">
            Tùy chỉnh màu sắc, typography và branding
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadTheme} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Màu sắc
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Layout className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt màu sắc</CardTitle>
              <CardDescription>
                Tùy chỉnh bảng màu của hệ thống (HSL format)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.colors).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={value as string}
                      onChange={(e) => updateColor(key, e.target.value)}
                      placeholder="217 91% 45%"
                    />
                    <div
                      className="w-12 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${value})` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Typography</CardTitle>
              <CardDescription>
                Tùy chỉnh font chữ và kích thước
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.typography).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    value={value as string}
                    onChange={(e) => updateTypography(key, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Branding</CardTitle>
              <CardDescription>
                Tùy chỉnh tên và thông tin hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(theme.branding).map(([key, value]) => (
                <div key={key} className="grid grid-cols-2 gap-4 items-center">
                  <Label className="capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <Input
                    value={value as string}
                    onChange={(e) => updateBranding(key, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
