'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Eye,
  FlaskConical,
  Building2,
  Star,
  Users,
  Filter,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScoreDetail {
  criterion: string
  points: number
  max: number
}

export interface TalentCandidate {
  id: string
  fullName: string
  personnelCode: string
  category: string | null
  militaryRank: string | null
  position: string | null
  academicDegree: string | null
  academicTitle: string | null
  specialization: string | null
  unitId: string | null
  unitName: string | null
  score: number
  scoreDetails: ScoreDetail[]
  strengths: string[]
  missingCriteria: string[]
  hardFilterPassed: boolean
  hardFilterReasons: string[]
}

interface TalentRankingPanelProps {
  candidates: TalentCandidate[]
  meta?: {
    topN: number
    totalScanned: number
    hardFiltered: number
  }
  loading?: boolean
  /** Name of the target position selected from the catalog */
  targetPositionName?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_POSSIBLE_SCORE = 90

/** Medal styles for rank 0, 1, 2 */
const MEDAL_CONFIG = [
  {
    icon: 'text-yellow-500',
    border: 'border-l-4 border-l-yellow-400',
    bg: 'bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-950/20',
    ring: 'ring-1 ring-yellow-200 dark:ring-yellow-800/60',
    label: 'Vàng',
  },
  {
    icon: 'text-slate-400',
    border: 'border-l-4 border-l-slate-400',
    bg: 'bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900/30',
    ring: 'ring-1 ring-slate-200 dark:ring-slate-700/60',
    label: 'Bạc',
  },
  {
    icon: 'text-amber-600',
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20',
    ring: 'ring-1 ring-amber-200 dark:ring-amber-800/60',
    label: 'Đồng',
  },
]

/** Progress bar color based on score percentage */
function scoreProgressClass(pct: number): string {
  if (pct >= 70) return '[&>div]:bg-emerald-500'
  if (pct >= 45) return '[&>div]:bg-amber-400'
  return '[&>div]:bg-rose-400'
}

/** Score label text color */
function scoreLabelClass(pct: number): string {
  if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 45) return 'text-amber-600 dark:text-amber-400'
  return 'text-rose-600 dark:text-rose-400'
}

// ─── Single candidate card ────────────────────────────────────────────────────

function CandidateCard({ candidate, rank }: { candidate: TalentCandidate; rank: number }) {
  const pct = Math.round((candidate.score / MAX_POSSIBLE_SCORE) * 100)
  const medal = rank < 3 ? MEDAL_CONFIG[rank] : null

  return (
    <Card
      className={[
        'transition-all hover:shadow-md',
        medal ? `${medal.border} ${medal.bg} ${medal.ring} shadow-sm` : 'hover:border-indigo-200 dark:hover:border-indigo-800',
      ].join(' ')}
    >
      <CardContent className="pt-3 pb-3 px-4">
        <div className="flex items-start gap-3">
          {/* Rank indicator */}
          <div className="shrink-0 w-8 flex flex-col items-center justify-start pt-0.5 gap-1">
            {medal ? (
              <Trophy className={`w-5 h-5 ${medal.icon}`} />
            ) : (
              <span className="text-xs font-mono font-bold text-muted-foreground">#{rank + 1}</span>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Name row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm leading-snug">{candidate.fullName}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{candidate.personnelCode}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-indigo-600" asChild>
                <Link href={`/dashboard/personnel/${candidate.id}`}>
                  <Eye className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>

            {/* Position / rank / unit chips */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {candidate.militaryRank && (
                <span className="font-medium text-foreground/70">{candidate.militaryRank}</span>
              )}
              {candidate.position && (
                <span className="truncate">{candidate.position}</span>
              )}
              {candidate.unitName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {candidate.unitName}
                </span>
              )}
              {candidate.academicDegree && (
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {candidate.academicDegree}
                </span>
              )}
              {candidate.academicTitle && (
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {candidate.academicTitle}
                </span>
              )}
            </div>

            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Điểm phù hợp</span>
                <span className={`text-sm font-bold tabular-nums ${scoreLabelClass(pct)}`}>
                  {candidate.score}
                  <span className="text-[11px] font-normal text-muted-foreground ml-0.5">/{MAX_POSSIBLE_SCORE}</span>
                </span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Progress
                        value={pct}
                        className={`h-2 bg-muted/60 ${scoreProgressClass(pct)}`}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs" side="top">
                    <p className="text-xs font-semibold mb-1.5">Chi tiết điểm</p>
                    <div className="space-y-1 text-xs">
                      {candidate.scoreDetails.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">{d.criterion}</span>
                          <span className={d.points > 0 ? 'text-emerald-400 font-medium' : 'text-muted-foreground/50'}>
                            {d.points}/{d.max}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Strengths */}
            {(candidate.strengths.length > 0 || candidate.specialization) && (
              <div className="flex flex-wrap gap-1">
                {candidate.strengths.map((s, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[11px] gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    {s}
                  </Badge>
                ))}
                {candidate.specialization && (
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800/60"
                  >
                    <FlaskConical className="w-2.5 h-2.5" />
                    {candidate.specialization}
                  </Badge>
                )}
              </div>
            )}

            {/* Missing criteria */}
            {candidate.missingCriteria.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.missingCriteria.map((m, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[11px] gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/60"
                  >
                    <AlertCircle className="w-2.5 h-2.5" />
                    Thiếu: {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function TalentRankingPanel({
  candidates,
  meta,
  loading = false,
  targetPositionName,
}: TalentRankingPanelProps) {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold text-sm">Kết quả quy hoạch</span>
          {targetPositionName && (
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
              {targetPositionName}
            </span>
          )}
        </div>

        {/* Meta chips */}
        {meta && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-full px-2.5 py-1">
              <Users className="w-3 h-3" />
              <span>Đã quét <strong className="text-foreground">{meta.totalScanned}</strong> cán bộ</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 rounded-full px-2.5 py-1">
              <Filter className="w-3 h-3" />
              <span>Loại <strong>{meta.hardFiltered}</strong> (không đạt cứng)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-full px-2.5 py-1">
              <TrendingUp className="w-3 h-3" />
              <span>Top <strong>{candidates.length}</strong> ứng viên</span>
            </div>
          </div>
        )}

        {!meta && (
          <Badge variant="secondary" className="text-xs">
            {candidates.length} ứng viên
          </Badge>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-amber-700 dark:text-amber-400 italic border-l-2 border-amber-400 pl-2 bg-amber-50 dark:bg-amber-950/20 py-1 pr-2 rounded-r">
        Kết quả là công cụ hỗ trợ quyết định — không thay thế quyết định nhân sự của cơ quan có thẩm quyền.
      </p>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="pt-3 pb-3">
                <div className="flex gap-3">
                  <div className="w-8 h-5 rounded bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-2 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && candidates.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-muted py-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2.5 rounded-full bg-muted/60">
              <Users className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium">Không tìm thấy ứng viên phù hợp</p>
            <p className="text-xs text-muted-foreground/70">Thử nới lỏng tiêu chí hoặc thay đổi nhóm cán bộ.</p>
          </div>
        </div>
      )}

      {/* Candidate cards */}
      {!loading && candidates.map((c, i) => (
        <CandidateCard key={c.id} candidate={c} rank={i} />
      ))}
    </div>
  )
}
