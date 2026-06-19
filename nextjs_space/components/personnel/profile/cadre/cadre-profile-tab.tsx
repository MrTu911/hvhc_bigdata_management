'use client';

/**
 * Tab "Hồ sơ cán bộ điện tử" (mẫu 99 trường) trên trang chi tiết cán bộ.
 * Gồm: form trường scalar mở rộng + các bảng chi tiết dạng danh sách.
 * Quyền sửa theo PERSONNEL.UPDATE (ẩn nút khi không có quyền — backend vẫn enforce).
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { CADRE_LIST_SECTIONS } from '@/lib/constants/cadre-profile-sections';
import { CadreExtendedForm } from './cadre-extended-form';
import { CadreSectionCard } from './cadre-section-card';

interface CadreProfileTabProps {
  /** [id] của trang chi tiết — User.id (hoặc Personnel.id). */
  personnelId: string;
}

export function CadreProfileTab({ personnelId }: CadreProfileTabProps) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERSONNEL.UPDATE);

  return (
    <Tabs defaultValue="extended" className="space-y-4">
      <TabsList>
        <TabsTrigger value="extended">Trường thông tin mở rộng</TabsTrigger>
        <TabsTrigger value="lists">Bảng chi tiết (danh sách)</TabsTrigger>
      </TabsList>

      <TabsContent value="extended">
        <CadreExtendedForm personnelId={personnelId} canEdit={canEdit} />
      </TabsContent>

      <TabsContent value="lists">
        <div className="space-y-4">
          {CADRE_LIST_SECTIONS.map((section) => (
            <CadreSectionCard key={section.slug} personnelId={personnelId} section={section} canEdit={canEdit} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
