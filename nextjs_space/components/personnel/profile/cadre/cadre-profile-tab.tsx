'use client';

/**
 * Tab "Hồ sơ cán bộ điện tử" (mẫu 99 trường) trên trang chi tiết cán bộ.
 * Gồm: form trường scalar mở rộng + các bảng chi tiết dạng danh sách.
 * canEdit và apiBase được truyền từ parent để hỗ trợ cả trang quản lý (PERSONNEL.UPDATE)
 * và trang tự phục vụ cá nhân (PERSONAL.MANAGE_PROFILE).
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONNEL } from '@/lib/rbac/function-codes';
import { CADRE_LIST_SECTIONS } from '@/lib/constants/cadre-profile-sections';
import { CadreExtendedForm } from './cadre-extended-form';
import { CadreSectionCard } from './cadre-section-card';
import { CadreImportDialog } from './cadre-import-dialog';

interface CadreProfileTabProps {
  /** [id] của trang chi tiết — User.id (hoặc Personnel.id). */
  personnelId: string;
  /** Override edit permission — nếu không truyền, tự lấy theo PERSONNEL.UPDATE. */
  canEdit?: boolean;
  /** Override API base URL — dùng cho trang cá nhân (self-service). */
  apiBase?: string;
}

export function CadreProfileTab({ personnelId, canEdit: canEditProp, apiBase }: CadreProfileTabProps) {
  const { hasPermission } = usePermissions();
  const canEdit = canEditProp !== undefined ? canEditProp : hasPermission(PERSONNEL.UPDATE);
  // Tự phục vụ (có apiBase) → route /api/profile/cadre-import; quản lý cán bộ → route theo [id].
  const importBase = apiBase ? '/api/profile/cadre-import' : `/api/personnel/${personnelId}/cadre-import`;
  const showImport = canEdit;
  // Đổi key để remount form/section sau khi import → tải lại dữ liệu mới.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Tabs defaultValue="extended" className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="extended">Trường thông tin mở rộng</TabsTrigger>
          <TabsTrigger value="lists">Bảng chi tiết (danh sách)</TabsTrigger>
        </TabsList>
        {showImport && (
          <CadreImportDialog apiBase={importBase} onImported={() => setRefreshKey((k) => k + 1)} />
        )}
      </div>

      <TabsContent value="extended">
        <CadreExtendedForm
          key={`extended-${refreshKey}`}
          personnelId={personnelId}
          canEdit={canEdit}
          apiBase={apiBase}
        />
      </TabsContent>

      <TabsContent value="lists">
        <div className="space-y-4">
          {CADRE_LIST_SECTIONS.map((section) => (
            <CadreSectionCard
              key={`${section.slug}-${refreshKey}`}
              personnelId={personnelId}
              section={section}
              canEdit={canEdit}
              apiBase={apiBase ? '/api/profile/cadre-sections' : undefined}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
