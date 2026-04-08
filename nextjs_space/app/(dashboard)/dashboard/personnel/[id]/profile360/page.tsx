'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, FileDown } from 'lucide-react';
import { PersonnelSummaryCard } from '@/components/personnel/profile/personnel-summary-card';
import { CategorySpecificSections } from '@/components/personnel/profile/category-specific-sections';
import { PersonnelTabs } from '@/components/personnel/profile/personnel-tabs';
import type { Profile360Data } from '@/components/personnel/profile/personnel-tabs';
import type { PersonnelCategory } from '@prisma/client';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Profile360Skeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

function StubBanner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800">
      <AlertTriangle className="w-3 h-3 shrink-0" />
      {label}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Profile360Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile360Data | null>(null);
  const [meta, setMeta] = useState<{
    canViewSensitive: boolean;
    hasUserBridge: boolean;
    warningCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/personnel/${id}/profile360`)
      .then(res => res.json())
      .then(json => {
        if (!json.success) {
          setError(json.error ?? 'Không tải được hồ sơ');
        } else {
          setProfile(json.data);
          setMeta(json.meta);
        }
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, [id]);

  const canViewSensitive = meta?.canViewSensitive ?? false;

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded" />
          <Skeleton className="w-48 h-6" />
        </div>
        <Profile360Skeleton />
      </div>
    );
  }

  if (error || !profile || !profile.personnel) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {error ?? 'Không tìm thấy hồ sơ cán bộ'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { personnel, scientificProfile, researchProjects, facultyProfile, warnings } = profile;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <h2 className="text-lg font-semibold text-muted-foreground flex-1">
          Hồ sơ 360° · {personnel.personnelCode}
        </h2>
        {/* UC-09: Xuất 2A-LLĐV — only available when user bridge exists */}
        {meta?.hasUserBridge && profile._bridge.userId && (
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href={`/api/personnel/export-2a?userId=${profile._bridge.userId}`}
              target="_blank"
              rel="noreferrer"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Xuất 2A-LLĐV
            </a>
          </Button>
        )}
      </div>

      {/* ── Data warnings ── */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-amber-700 dark:text-amber-300">
                <span className="font-mono text-xs">[{w.source}]</span> {w.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary card ── */}
      <PersonnelSummaryCard
        personnel={personnel}
        scientificProfile={scientificProfile ?? undefined}
        researchProjectCount={researchProjects.length}
        facultyProfile={facultyProfile ?? undefined}
        warnings={warnings}
        canViewSensitive={canViewSensitive}
      />

      {/* ── No bridge warning ── */}
      {!meta?.hasUserBridge && (
        <StubBanner label="Cán bộ này chưa được liên kết tài khoản User. Dữ liệu từ M03/M05/M07/M09 sẽ trống cho đến khi liên kết." />
      )}

      {/* ── Category banner (UC-13 CategorySpecificSections) ── */}
      {personnel.category && (
        <CategorySpecificSections
          category={personnel.category as PersonnelCategory}
          slots={{}}
        />
      )}

      {/* ── Tabs (extracted to PersonnelTabs for maintainability) ── */}
      <PersonnelTabs profile={profile} id={id} canViewSensitive={canViewSensitive} />

    </div>
  );
}
