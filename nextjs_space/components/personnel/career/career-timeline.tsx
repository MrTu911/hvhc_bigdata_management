'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertTriangle,
  Briefcase,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  MoveRight,
  Award,
  ShieldOff,
  Users,
  RefreshCcw,
  Clock,
} from 'lucide-react'
import type { CareerEventType } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CareerEvent {
  id: string
  personnelId: string | null
  eventType: CareerEventType
  eventDate: string
  effectiveDate: string | null
  endDate: string | null
  reason: string | null
  title: string | null
  decisionNumber: string | null
  decisionAuthority: string | null
  oldPosition: string | null
  newPosition: string | null
  oldRank: string | null
  newRank: string | null
  oldUnit: string | null
  newUnit: string | null
  attachmentUrl: string | null
  notes: string | null
}

interface CareerTimelineProps {
  events: CareerEvent[]
  canEdit?: boolean
  onAdd?: () => void
  onEdit?: (event: CareerEvent) => void
  onDelete?: (event: CareerEvent) => void
}

// ─── Label / Icon maps ────────────────────────────────────────────────────────

const EVENT_META: Record<
  CareerEventType,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    variant: 'default' | 'secondary' | 'outline' | 'destructive'
    color: string
  }
> = {
  ENLISTMENT:       { label: 'Nhập ngũ',           icon: Users,        variant: 'default',     color: 'bg-green-500' },
  PROMOTION:        { label: 'Thăng quân hàm',      icon: TrendingUp,   variant: 'default',     color: 'bg-blue-500' },
  APPOINTMENT:      { label: 'Bổ nhiệm',             icon: Briefcase,    variant: 'default',     color: 'bg-indigo-500' },
  TRANSFER:         { label: 'Điều động',             icon: MoveRight,    variant: 'secondary',   color: 'bg-amber-500' },
  TRAINING:         { label: 'Đào tạo / Bồi dưỡng', icon: GraduationCap,variant: 'secondary',   color: 'bg-teal-500' },
  AWARD:            { label: 'Khen thưởng',           icon: Award,        variant: 'default',     color: 'bg-yellow-500' },
  DISCIPLINE:       { label: 'Kỷ luật',               icon: ShieldOff,    variant: 'destructive', color: 'bg-red-500' },
  RETIREMENT:       { label: 'Nghỉ hưu',              icon: Clock,        variant: 'outline',     color: 'bg-gray-400' },
  DISCHARGE:        { label: 'Xuất ngũ',              icon: RefreshCcw,   variant: 'outline',     color: 'bg-gray-400' },
  OTHER:            { label: 'Khác',                  icon: Briefcase,    variant: 'outline',     color: 'bg-gray-400' },
  RANK_DEMOTION:    { label: 'Hạ quân hàm',          icon: TrendingUp,   variant: 'destructive', color: 'bg-red-400' },
  SECONDMENT:       { label: 'Biệt phái',             icon: MoveRight,    variant: 'secondary',   color: 'bg-orange-500' },
  STUDY_LEAVE:      { label: 'Đi học',                icon: GraduationCap,variant: 'secondary',   color: 'bg-teal-400' },
  RETURN:           { label: 'Về đơn vị',             icon: RefreshCcw,   variant: 'default',     color: 'bg-green-400' },
  RETIREMENT_PREP:  { label: 'Chuẩn bị hưu',         icon: Clock,        variant: 'outline',     color: 'bg-gray-300' },
  UNIT_CHANGE:      { label: 'Chuyển đơn vị',         icon: MoveRight,    variant: 'secondary',   color: 'bg-amber-400' },
  POSITION_CHANGE:  { label: 'Thay đổi chức vụ',     icon: Briefcase,    variant: 'secondary',   color: 'bg-indigo-400' },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({
  event,
  canEdit,
  onEdit,
  onDelete,
}: {
  event: CareerEvent
  canEdit?: boolean
  onEdit?: (e: CareerEvent) => void
  onDelete?: (e: CareerEvent) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = EVENT_META[event.eventType] ?? {
    label: event.eventType,
    icon: Briefcase,
    variant: 'outline' as const,
    color: 'bg-gray-400',
  }
  const Icon = meta.icon

  const hasDetail =
    event.oldPosition || event.newPosition ||
    event.oldRank || event.newRank ||
    event.oldUnit || event.newUnit ||
    event.decisionNumber || event.reason || event.notes

  return (
    <div className="flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-full ${meta.color} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Card */}
      <Card className="flex-1 mb-4">
        <CardContent className="pt-3 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={meta.variant} className="text-xs shrink-0">
                  {meta.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(event.effectiveDate ?? event.eventDate)}
                  {event.endDate && ` → ${formatDate(event.endDate)}`}
                </span>
                {event.decisionNumber && (
                  <span className="text-xs text-muted-foreground font-mono">
                    QĐ: {event.decisionNumber}
                  </span>
                )}
              </div>

              {event.title && (
                <p className="text-sm font-medium">{event.title}</p>
              )}

              {(event.newPosition || event.newRank) && (
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {event.oldPosition && event.newPosition && (
                    <span>{event.oldPosition} → <strong className="text-foreground">{event.newPosition}</strong></span>
                  )}
                  {!event.oldPosition && event.newPosition && (
                    <span>Chức vụ: <strong className="text-foreground">{event.newPosition}</strong></span>
                  )}
                  {event.oldRank && event.newRank && (
                    <span>{event.oldRank} → <strong className="text-foreground">{event.newRank}</strong></span>
                  )}
                  {!event.oldRank && event.newRank && (
                    <span>Quân hàm: <strong className="text-foreground">{event.newRank}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {hasDetail && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </Button>
              )}
              {canEdit && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit?.(event)}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(event)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Expanded detail */}
          {expanded && (
            <div className="mt-3 pt-3 border-t space-y-2 text-xs text-muted-foreground">
              {event.decisionAuthority && (
                <p><span className="font-medium text-foreground">Cơ quan ra QĐ:</span> {event.decisionAuthority}</p>
              )}
              {event.oldUnit && event.newUnit && (
                <p><span className="font-medium text-foreground">Đơn vị:</span> {event.oldUnit} → {event.newUnit}</p>
              )}
              {!event.oldUnit && event.newUnit && (
                <p><span className="font-medium text-foreground">Đơn vị mới:</span> {event.newUnit}</p>
              )}
              {event.reason && (
                <p><span className="font-medium text-foreground">Lý do:</span> {event.reason}</p>
              )}
              {event.notes && (
                <p><span className="font-medium text-foreground">Ghi chú:</span> {event.notes}</p>
              )}
              {event.attachmentUrl && (
                <a
                  href={event.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Xem quyết định đính kèm
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CareerTimeline({
  events,
  canEdit = false,
  onAdd,
  onEdit,
  onDelete,
}: CareerTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <Briefcase className="w-8 h-8 opacity-30" />
        <p className="text-sm">Chưa có lịch sử công tác</p>
        {canEdit && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <Plus className="w-3 h-3 mr-1" />
            Thêm sự kiện
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-4">
          <Button size="sm" onClick={onAdd}>
            <Plus className="w-3 h-3 mr-1" />
            Thêm sự kiện
          </Button>
        </div>
      )}

      <div>
        {events.map((ev) => (
          <EventCard
            key={ev.id}
            event={ev}
            canEdit={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  )
}
