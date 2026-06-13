'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DocumentExportMenu } from '@/components/templates/export/document-export-menu';
import { PartyMemberSummaryCard } from '@/components/party/member/party-member-summary-card';
import { PartyMemberProfileTabs } from '@/components/party/member/party-member-profile-tabs';
import { PartyMemberEditDialog } from '@/components/party/member/party-member-edit-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { PARTY } from '@/lib/rbac/function-codes';
import { Pencil } from 'lucide-react';

export default function PartyMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const { hasAnyPermission } = usePermissions();
  const canEdit = hasAnyPermission([PARTY.UPDATE_MEMBER, PARTY.UPDATE]);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/party/members/${id}/profile360`);
      const json = await res.json();
      setProfile(json?.data || null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết hồ sơ Đảng viên</h1>
          <p className="text-sm text-muted-foreground">UC-63 – Hồ sơ 360° theo mẫu 2A-LLĐV</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && profile && (
            <Button variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Chỉnh sửa hồ sơ
            </Button>
          )}
          {id && <DocumentExportMenu entityType="party_member" entityId={id} />}
          <Link href="/dashboard/party/members">
            <Button variant="outline">Quay lại danh sách</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ...</p>
      ) : !profile ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy hồ sơ.</p>
      ) : (
        <>
          <PartyMemberSummaryCard profile={profile} />
          <PartyMemberProfileTabs profile={profile} />
        </>
      )}

      {canEdit && (
        <PartyMemberEditDialog
          memberId={id ?? null}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={loadProfile}
        />
      )}
    </div>
  );
}
