'use client';

/**
 * /dashboard/personal/my-cadre-profile
 * Cán bộ tự xem và cập nhật hồ sơ điện tử 99 trường của chính mình (SELF scope).
 * Yêu cầu: VIEW_MY_CADRE_PROFILE
 */
import { useSession } from 'next-auth/react';
import { Loader2, FileUser } from 'lucide-react';
import { ModuleHero } from '@/components/ui/enhanced-data-card';
import { DocumentExportMenu } from '@/components/templates/export/document-export-menu';
import { CadreProfileTab } from '@/components/personnel/profile/cadre/cadre-profile-tab';
import { usePermissions } from '@/hooks/use-permissions';
import { PERSONAL } from '@/lib/rbac/function-codes';

const SELF_API_BASE = '/api/profile/cadre-extended';

export default function MyCadreProfilePage() {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!session?.user?.id || !hasPermission(PERSONAL.VIEW_CADRE_PROFILE)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Không có quyền truy cập hồ sơ cán bộ điện tử.
      </div>
    );
  }

  const userId = session.user.id;
  const canEdit = hasPermission(PERSONAL.MANAGE_PROFILE);

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

      <CadreProfileTab
        personnelId={userId}
        canEdit={canEdit}
        apiBase={SELF_API_BASE}
      />
    </div>
  );
}
