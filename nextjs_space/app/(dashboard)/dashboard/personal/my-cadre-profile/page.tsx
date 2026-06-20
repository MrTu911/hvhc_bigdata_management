'use client';

/**
 * /dashboard/personal/my-cadre-profile
 * Cán bộ tự xem và khai báo/cập nhật hồ sơ điện tử 99 trường của chính mình (SELF scope).
 *
 * Hai chế độ theo vòng đời khai báo:
 *  - Đang khai báo (chưa chốt): cho ghi trực tiếp + nút "Xác nhận hoàn tất khai báo".
 *  - Đã khai báo (đã chốt): khóa ghi trực tiếp, thay đổi đi qua đề nghị 2 cấp.
 *
 * Yêu cầu: VIEW_MY_CADRE_PROFILE
 */
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, FileUser } from 'lucide-react';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { DocumentExportMenu } from '@/components/templates/export/document-export-menu';
import { CadreProfileTab } from '@/components/personnel/profile/cadre/cadre-profile-tab';
import { DeclarationBanner, type DeclarationState } from '@/components/personnel/profile/cadre/declaration-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONAL } from '@/lib/rbac/function-codes';

const SELF_API_BASE = '/api/profile/cadre-extended';

export default function MyCadreProfilePage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const [declaration, setDeclaration] = useState<DeclarationState | null>(null);
  const [declarationLoading, setDeclarationLoading] = useState(true);
  const [tabKey, setTabKey] = useState(0);

  const userId = session?.user?.id;

  const loadDeclaration = useCallback(async () => {
    try {
      const res = await fetch('/api/profile/declaration');
      const json = await res.json();
      if (res.ok && json.success) setDeclaration(json.data);
    } catch {
      /* giữ trạng thái cũ */
    } finally {
      setDeclarationLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) loadDeclaration();
  }, [userId, loadDeclaration]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!userId || !hasPermission(PERSONAL.VIEW_CADRE_PROFILE)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Không có quyền truy cập hồ sơ cán bộ điện tử.
      </div>
    );
  }

  // Chỉ cho ghi trực tiếp khi đang khai báo (chưa chốt) và có quyền sửa hồ sơ.
  const declaring = declaration ? !declaration.declared : false;
  const canEdit = declaring && hasPermission(PERSONAL.MANAGE_PROFILE);

  const handleConfirmed = () => {
    loadDeclaration();
    setTabKey((k) => k + 1); // remount tab → chuyển sang chế độ chỉ đọc
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <ModuleHero
          moduleId="personnel"
          title="Hồ sơ cán bộ điện tử"
          subtitle="Cập nhật thông tin hồ sơ cán bộ theo mẫu 99 trường"
          icon={FileUser}
        />
        <DocumentExportMenu
          entityType="personnel"
          entityId={userId}
          label="Xuất hồ sơ điện tử"
          templateCodes={['TPL_M02_HSCB_DIENTU']}
          exportEndpoint={`/api/personnel/${userId}/profile-document/export`}
        />
      </div>

      <DeclarationBanner
        state={declaration}
        loading={declarationLoading}
        onConfirmed={handleConfirmed}
        onRefresh={loadDeclaration}
      />

      <CadreProfileTab
        key={tabKey}
        personnelId={userId}
        canEdit={canEdit}
        apiBase={SELF_API_BASE}
      />
    </div>
  );
}
