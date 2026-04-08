'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, FlaskConical, Award, Hash } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Publication {
  id: string;
  type: string;
  title: string;
  year: number;
  role: string;
  publisher?: string | null;
  coAuthors?: string | null;
}

interface AwardsRecord {
  id: string;
  type: string;
  category: string;
  description: string;
  year: number;
}

interface ResearchProject {
  id: string;
  projectCode: string;
  title: string;
  status: string;
  phase: string;
  role: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface ScientificProfilePanelProps {
  scientificProfile?: {
    summary?: string | null;
    publicationCount?: number | null;
    hIndex?: number | null;
    publications?: Publication[];
    awardsRecords?: AwardsRecord[];
  } | null;
  researchProjects?: ResearchProject[];
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const PUB_TYPE_MAP: Record<string, string> = {
  JOURNAL_ARTICLE: 'Tạp chí khoa học',
  CONFERENCE_PAPER: 'Hội thảo',
  BOOK: 'Sách',
  BOOK_CHAPTER: 'Chương sách',
  THESIS: 'Luận văn / Luận án',
  OTHER: 'Khác',
};

const PUB_ROLE_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  MAIN_AUTHOR: { label: 'Tác giả chính', variant: 'default' },
  CO_AUTHOR: { label: 'Đồng tác giả', variant: 'secondary' },
  EDITOR: { label: 'Biên tập', variant: 'outline' },
};

const RESEARCH_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  DRAFT: { label: 'Dự thảo', variant: 'outline' },
  SUBMITTED: { label: 'Đã nộp', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Đang xét duyệt', variant: 'secondary' },
  APPROVED: { label: 'Đã duyệt', variant: 'default' },
  IN_PROGRESS: { label: 'Đang thực hiện', variant: 'default' },
  COMPLETED: { label: 'Hoàn thành', variant: 'default' },
  REJECTED: { label: 'Bị từ chối', variant: 'destructive' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' },
};

const AWARD_TYPE_MAP: Record<string, string> = {
  KHEN_THUONG: 'Khen thưởng',
  KY_LUAT: 'Kỷ luật',
};

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function StubBanner({ label }: { label: string }) {
  return (
    <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded border border-dashed">
      {label}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground py-4 text-center">{label}</p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScientificProfilePanel({
  scientificProfile,
  researchProjects = [],
}: ScientificProfilePanelProps) {
  const publications = scientificProfile?.publications ?? [];
  const awardsRecords = scientificProfile?.awardsRecords ?? [];

  return (
    <div className="space-y-6">

      {/* ── Overview metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: 'Công trình', value: scientificProfile?.publicationCount ?? publications.length },
          { icon: FlaskConical, label: 'Đề tài NCKH', value: researchProjects.length },
          { icon: Award, label: 'Khen thưởng', value: awardsRecords.filter(a => a.type === 'KHEN_THUONG').length },
          {
            icon: Hash,
            label: 'H-index',
            value: scientificProfile?.hIndex ?? '—',
            note: scientificProfile?.hIndex == null ? '[M09-pending]' : undefined,
          },
        ].map(({ icon: Icon, label, value, note }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <Icon className="w-4 h-4 text-muted-foreground mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
              {note && <div className="text-[10px] text-amber-500 mt-1">{note}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Biography / summary ── */}
      {scientificProfile?.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Giới thiệu nghiên cứu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{scientificProfile.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Publications ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Công trình khoa học ({publications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {publications.length === 0 ? (
            <EmptyState label="Chưa có công trình khoa học" />
          ) : (
            <div className="divide-y">
              {publications.map((pub) => {
                const roleInfo = PUB_ROLE_MAP[pub.role] ?? { label: pub.role, variant: 'outline' as const };
                return (
                  <div key={pub.id} className="py-3 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={roleInfo.variant} className="text-xs shrink-0">
                        {roleInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {PUB_TYPE_MAP[pub.type] ?? pub.type} · {pub.year}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{pub.title}</p>
                    {(pub.publisher || pub.coAuthors) && (
                      <p className="text-xs text-muted-foreground">
                        {[pub.publisher, pub.coAuthors].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Research projects – M09 ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            Đề tài nghiên cứu – M09 ({researchProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {researchProjects.length === 0 ? (
            <EmptyState label="Chưa tham gia đề tài nào" />
          ) : (
            <div className="divide-y">
              {researchProjects.map((proj) => {
                const statusInfo = RESEARCH_STATUS_MAP[proj.status] ?? { label: proj.status, variant: 'outline' as const };
                return (
                  <div key={proj.id} className="py-3 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusInfo.variant} className="text-xs shrink-0">
                        {statusInfo.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{proj.projectCode}</span>
                      <span className="text-xs text-muted-foreground">· Vai trò: {proj.role}</span>
                    </div>
                    <p className="text-sm font-medium">{proj.title}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Awards & Khen thưởng ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-4 h-4" />
            Thành tích – Khen thưởng ({awardsRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {awardsRecords.length === 0 ? (
            <EmptyState label="Chưa có thành tích ghi nhận" />
          ) : (
            <div className="divide-y">
              {awardsRecords.map((award) => (
                <div key={award.id} className="py-3 flex items-start gap-3">
                  <div className="text-lg font-bold text-muted-foreground shrink-0 w-12 text-right">
                    {award.year}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{award.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {AWARD_TYPE_MAP[award.type] ?? award.type} · {award.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* H-index pending stub note */}
      <StubBanner label="H-index và citation metrics sẽ được tính tự động khi M09 hoàn thiện compute-stats." />
    </div>
  );
}
