/**
 * M10 – UC-51 / UC-58: Hồ sơ học viên toàn trình + Rèn luyện
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { StudentSummaryCard } from '@/components/education/student/student-summary-card';
import { StudentProfileTabs } from '@/components/education/student/student-profile-tabs';
import { STATUS_LABELS, STATUS_VARIANTS } from '@/components/education/student/student-table';

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile360, setProfile360] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/education/students/${id}/profile360`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setProfile360(json.data);
      } catch (err: any) {
        toast.error(err.message || 'Lỗi tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile360) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p>Không tìm thấy học viên.</p>
        <Link href="/dashboard/education/students">
          <Button variant="outline" className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const { profile, summary } = profile360;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/education/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Danh sách
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{profile.hoTen}</h1>
          <p className="text-sm text-muted-foreground font-mono">{profile.maHocVien}</p>
        </div>
        <Badge variant={STATUS_VARIANTS[profile.currentStatus] || 'outline'}>
          {STATUS_LABELS[profile.currentStatus] || profile.currentStatus}
        </Badge>
      </div>

      <StudentSummaryCard summary={summary} />

      <StudentProfileTabs studentId={id} profile360={profile360} />
    </div>
  );
}
