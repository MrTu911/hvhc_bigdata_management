
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Upload, Eye, Save, RefreshCw, Palette, Type, Layout, Image } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AppearanceSettings() {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [brandingAssets, setBrandingAssets] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadBrandingAssets();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/theme/settings');
      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data.grouped);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Không thể tải cài đặt giao diện');
    }
  };

  const loadBrandingAssets = async () => {
    try {
      const response = await fetch('/api/theme/branding');
      const result = await response.json();
      
      if (result.success) {
        setBrandingAssets(result.data);
      }
    } catch (error) {
      console.error('Error loading branding assets:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Collect all settings
      const allSettings: any[] = [];
      
      Object.keys(settings).forEach(category => {
        settings[category].forEach((setting: any) => {
          allSettings.push({
            key: setting.setting_key,
            value: setting.setting_value
          });
        });
      });

      const response = await fetch('/api/theme/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: allSettings })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Đã lưu cài đặt giao diện!');
        applyTheme();
      } else {
        toast.error('Không thể lưu cài đặt');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = () => {
    // Apply theme dynamically
    const root = document.documentElement;
    
    if (settings.colors) {
      settings.colors.forEach((setting: any) => {
        const cssVar = `--${setting.setting_key.replace(/_/g, '-')}`;
        root.style.setProperty(cssVar, setting.setting_value);
      });
    }

    toast.success('Đã áp dụng giao diện mới!');
  };

  const handleSettingChange = (category: string, key: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: prev[category].map((s: any) =>
        s.setting_key === key ? { ...s, setting_value: value } : s
      )
    }));
  };

  const handleFileUpload = async (assetType: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    try {
      toast.loading('Đang tải lên...', { id: 'upload' });
      
      const response = await fetch('/api/theme/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Save to branding assets
        await fetch('/api/theme/branding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType,
            assetName: result.data.fileName,
            filePath: result.data.filePath,
            fileUrl: result.data.filePath,
            fileSize: result.data.fileSize,
            mimeType: result.data.mimeType,
            dimensions: result.data.dimensions
          })
        });

        toast.success('Đã tải lên thành công!', { id: 'upload' });
        loadBrandingAssets();
      } else {
        toast.error('Không thể tải lên file', { id: 'upload' });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Lỗi khi tải lên file', { id: 'upload' });
    }
  };

  const ColorPicker = ({ setting, category }: any) => (
    <div className="space-y-2">
      <Label htmlFor={setting.setting_key}>
        {setting.display_name}
        <span className="text-xs text-muted-foreground ml-2">
          ({setting.description})
        </span>
      </Label>
      <div className="flex gap-2 items-center">
        <div 
          className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer"
          style={{ backgroundColor: `hsl(${setting.setting_value})` }}
        />
        <Input
          id={setting.setting_key}
          value={setting.setting_value}
          onChange={(e) => handleSettingChange(category, setting.setting_key, e.target.value)}
          placeholder="217 91% 45%"
          className="flex-1 font-mono text-sm"
        />
        <Badge variant="outline" className="font-mono text-xs">
          HSL
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Format: Hue Saturation Lightness (e.g., 217 91% 45%)
      </p>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Palette className="h-8 w-8 text-primary" />
            Quản lý Giao diện
          </h1>
          <p className="text-muted-foreground mt-1">
            Tùy chỉnh màu sắc, logo, banner và giao diện hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              loadSettings();
              toast.success('Đã làm mới!');
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setPreviewMode(!previewMode);
              if (!previewMode) applyTheme();
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Thoát xem trước' : 'Xem trước'}
          </Button>
          <Button onClick={handleSaveSettings} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Màu sắc
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Logo & Banner
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bảng màu hệ thống</CardTitle>
              <CardDescription>
                Tùy chỉnh màu sắc chính, phụ và các màu trạng thái. Sử dụng format HSL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.colors?.map((setting: any) => (
                <ColorPicker key={setting.setting_key} setting={setting} category="colors" />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bản xem trước màu sắc</CardTitle>
              <CardDescription>
                Xem trước các màu đã chọn trên các thành phần UI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button className="w-full">Primary Button</Button>
                <Button variant="secondary" className="w-full">Secondary</Button>
                <Button variant="destructive" className="w-full">Destructive</Button>
                <Button variant="outline" className="w-full">Outline</Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Badge>Default Badge</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logo hệ thống</CardTitle>
              <CardDescription>
                Tải lên logo chính của hệ thống (PNG, SVG, JPG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Kéo thả file hoặc click để chọn
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('logo', e)}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {brandingAssets
                  .filter(asset => asset.asset_type === 'logo')
                  .map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted flex items-center justify-center p-4">
                        <img
                          src={asset.file_url}
                          alt={asset.asset_name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs truncate">{asset.asset_name}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banner / Hero Image</CardTitle>
              <CardDescription>
                Tải lên hình ảnh banner cho trang chủ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Kích thước khuyến nghị: 1920x600px
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload('banner', e)}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                {brandingAssets
                  .filter(asset => asset.asset_type === 'banner')
                  .map((asset) => (
                    <Card key={asset.id} className="overflow-hidden">
                      <div className="aspect-[3/1] bg-muted">
                        <img
                          src={asset.file_url}
                          alt={asset.asset_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium">{asset.asset_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.dimensions} • {(asset.file_size / 1024).toFixed(0)} KB
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Typography</CardTitle>
              <CardDescription>
                Tùy chỉnh font chữ và kích thước text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.typography?.map((setting: any) => (
                <div key={setting.setting_key} className="space-y-2">
                  <Label htmlFor={setting.setting_key}>
                    {setting.display_name}
                  </Label>
                  <Input
                    id={setting.setting_key}
                    value={setting.setting_value}
                    onChange={(e) => handleSettingChange('typography', setting.setting_key, e.target.value)}
                    placeholder={setting.description}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Layout</CardTitle>
              <CardDescription>
                Điều chỉnh kích thước và bố cục các thành phần
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.layout?.map((setting: any) => (
                <div key={setting.setting_key} className="space-y-2">
                  <Label htmlFor={setting.setting_key}>
                    {setting.display_name}
                    <span className="text-xs text-muted-foreground ml-2">
                      ({setting.description})
                    </span>
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id={setting.setting_key}
                      type="number"
                      value={setting.setting_value}
                      onChange={(e) => handleSettingChange('layout', setting.setting_key, e.target.value)}
                      className="max-w-xs"
                    />
                    <Badge variant="outline">px</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
