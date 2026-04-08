'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateWizard, type TemplateWizardValues } from '@/components/templates/wizard/template-wizard';

interface TemplateData {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  moduleSource: string[];
  outputFormats: string[];
  rbacCode: string;
}

export default function EditTemplatePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTemplate(json.data);
        else toast.error(json.error || 'Không tìm thấy template');
      })
      .catch(() => toast.error('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [id]);

  const initialValues: Partial<TemplateWizardValues> | undefined = template
    ? {
        code: template.code,
        name: template.name,
        description: template.description ?? '',
        category: template.category ?? '',
        moduleSource: template.moduleSource,
        outputFormats: template.outputFormats,
        rbacCode: template.rbacCode,
      }
    : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/templates/${id}`)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {loading ? 'Đang tải...' : `Chỉnh sửa: ${template?.name ?? ''}`}
          </h1>
          {template && (
            <p className="text-sm text-gray-400 font-mono">{template.code}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Cập nhật thông tin mẫu biểu</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !template ? (
            <div className="text-center py-10 text-gray-400">
              Không tìm thấy template. Có thể đã bị xóa hoặc bạn không có quyền truy cập.
            </div>
          ) : (
            <TemplateWizard
              templateId={id}
              initialValues={initialValues}
              onSuccess={() => {
                toast.success('Đã cập nhật template');
                router.push(`/dashboard/templates/${id}`);
              }}
              onCancel={() => router.push(`/dashboard/templates/${id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
