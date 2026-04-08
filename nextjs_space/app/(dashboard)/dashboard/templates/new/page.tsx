'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateWizard } from '@/components/templates/wizard/template-wizard';

export default function NewTemplatePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/templates')}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo mẫu biểu mới</h1>
          <p className="text-sm text-gray-500">M18 · Template Management</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Thông tin mẫu biểu</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateWizard
            onSuccess={(id) => router.push(`/dashboard/templates/${id}`)}
            onCancel={() => router.push('/dashboard/templates')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
