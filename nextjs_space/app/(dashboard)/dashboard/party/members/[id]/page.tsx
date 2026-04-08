'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PartyMemberSummaryCard } from '@/components/party/member/party-member-summary-card';
import { PartyMemberProfileTabs } from '@/components/party/member/party-member-profile-tabs';

export default function PartyMemberDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      setLoading(true);
      const res = await fetch(`/api/party/members/${id}/profile360`);
      const json = await res.json();
      setProfile(json?.data || null);
      setLoading(false);
    };
    run();
  }, [id]);

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chi tiết hồ sơ Đảng viên</h1>
          <p className="text-sm text-muted-foreground">UC-63 – Hồ sơ 360° theo mẫu 2A-LLĐV</p>
        </div>
        <Link href="/dashboard/party/members">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
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
    </div>
  );
}
