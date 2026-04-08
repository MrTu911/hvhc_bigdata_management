'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_POSSIBLE_SCORE = 90 // sum of all softWeights defaults

function medalColor(rank: number): string {
  if (rank === 0) return 'text-yellow-500'
  if (rank === 1) return 'text-gray-400'
  if (rank === 2) return 'text-amber-600'
  return 'text-muted-foreground'
}

// ─── Single candidate card ────────────────────────────────────────────────────

function CandidateCard({ candidate, rank }: { candidate: TalentCandidate; rank: number }) {
  const pct = Math.round((candidate.score / MAX_POSSIBLE_SCORE) * 100)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-3">
          {/* Rank badge */}
          <div className="shrink-0 w-8 text-center">
            {rank < 3 ? (
              <Trophy className={`w-5 h-5 mx-auto ${medalColor(rank)}`} />
            ) : (
              <span className="text-sm font-mono text-muted-foreground">#{rank + 1}</span>
            )}
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{candidate.fullName}</p>
                <p className="text-xs text-muted-foreground font-mono">{candidate.personnelCode}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                <Link href={`/dashboard/personnel/${candidate.id}`}>
                  <Eye className="w-3 h-3" />
                </Link>
              </Button>
            </div>

            {/* Position / rank / unit */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {candidate.militaryRank && <span>{candidate.militaryRank}</span>}
              {candidate.position && <span className="truncate">{candidate.position}</span>}
              {candidate.unitName && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {candidate.unitName}
                </span>
              )}
              {candidate.academicDegree && (
                <span className="text-blue-600">{candidate.academicDegree}</span>
              )}
            </div>

            {/* Score bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Điểm phù hợp</span>
                <span className="text-sm font-semibold">{candidate.score} / {MAX_POSSIBLE_SCORE}</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      {candidate.scoreDetails.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-4">
                          <span>{d.criterion}</span>
                          <span className={d.points > 0 ? 'text-green-400' : 'text-muted-foreground'}>
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
            {candidate.strengths.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {candidate.strengths.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                    {s}
                  </Badge>
                ))}
                {candidate.specialization && (
                  <Badge variant="outline" className="text-xs gap-1">
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
                  <Badge key={i} variant="outline" className="text-xs text-amber-600 border-amber-300 gap-1">
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
}: TalentRankingPanelProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-medium text-sm">Kết quả quy hoạch</span>
          {meta && (
            <span className="text-xs text-muted-foreground">
              (đã lọc {meta.hardFiltered} ứng viên không đủ điều kiện cứng,
              xếp hạng {candidates.length}/{meta.totalScanned})
            </span>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {candidates.length} ứng viên
        </Badge>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground italic border-l-2 border-amber-400 pl-2">
        Kết quả là công cụ hỗ trợ quyết định — không thay thế quyết định nhân sự của cơ quan có thẩm quyền.
      </p>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-3 pb-3">
                <div className="h-16 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && candidates.length === 0 && (
        <div className="rounded-md border py-10 text-center text-muted-foreground text-sm">
          Không tìm thấy ứng viên phù hợp với tiêu chí đã nhập.
        </div>
      )}

      {/* Candidate cards */}
      {!loading && candidates.map((c, i) => (
        <CandidateCard key={c.id} candidate={c} rank={i} />
      ))}
    </div>
  )
}
