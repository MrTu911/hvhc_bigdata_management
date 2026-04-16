/**
 * WidgetDataService – M11 Phase 1
 *
 * Adapter trả data cho từng widget key. Mỗi adapter:
 *  1. Kiểm tra cache (scope-aware)
 *  2. Nếu miss: query module nguồn
 *  3. Set cache với TTL đúng layer
 *  4. Trả data
 *
 * Không chứa business logic – chỉ orchestrate đọc và cache.
 */
import 'server-only'
import db from '@/lib/db'
import { getWidgetById } from '@/lib/dashboard/widget-registry'
import { getWidgetCache, setWidgetCache, type WidgetCacheContext } from './dashboard-cache.service'

export interface WidgetDataResult {
  data: unknown
  cachedAt?: Date
  fromCache: boolean
}

export async function getWidgetData(
  widgetKey: string,
  ctx: WidgetCacheContext,
): Promise<WidgetDataResult> {
  const widget = getWidgetById(widgetKey)
  if (!widget) throw new Error(`Widget '${widgetKey}' không tồn tại trong registry`)

  // Cache-first
  const cached = await getWidgetCache<unknown>(ctx)
  if (cached !== null) {
    return { data: cached, cachedAt: new Date(), fromCache: true }
  }

  // Dispatch đến adapter
  const fresh = await resolveWidgetData(widgetKey, ctx)

  // Cache với policy của widget
  await setWidgetCache(ctx, fresh, widget.refreshPolicy)

  return { data: fresh, fromCache: false }
}

// ─── Resolvers theo widget key ────────────────────────────────────────────────

async function resolveWidgetData(widgetKey: string, ctx: WidgetCacheContext): Promise<unknown> {
  const unitFilter = ctx.unitId ? { unitId: ctx.unitId } : {}

  switch (widgetKey) {
    // ── Alert widgets ────────────────────────────────────────────────────────
    case 'PERSONNEL_RETIRING': {
      const threeMonthsLater = new Date()
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
      const items = await db.user
        .findMany({
          where: {
            ...unitFilter,
            workStatus: 'ACTIVE',
            endDate: { lte: threeMonthsLater, gte: new Date() },
          },
          select: { id: true, name: true, rank: true, endDate: true, unitId: true },
          take: 20,
          orderBy: { endDate: 'asc' },
        })
        .catch(() => [])
      return { count: items.length, items }
    }

    case 'ACADEMIC_WARNINGS': {
      // academicStatus != NORMAL nghĩa là đang trong tình trạng cảnh báo
      const count = await db.hocVien
        .count({ where: { academicStatus: { not: 'NORMAL' } } })
        .catch(() => 0)
      return { count }
    }

    case 'PARTY_FEE_DEBT': {
      const count = await db.partyMember
        .count({ where: { currentDebtAmount: { gt: 0 } } })
        .catch(() => 0)
      return { count }
    }

    case 'BHYT_EXPIRING': {
      const thirtyDaysLater = new Date()
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
      // healthInsuranceEndDate là trường BHYT expiry trong InsuranceInfo
      const count = await db.insuranceInfo
        .count({ where: { healthInsuranceEndDate: { lte: thirtyDaysLater, gte: new Date() } } })
        .catch(() => 0)
      return { count }
    }

    case 'SLA_OVERDUE': {
      // EXPIRED = workflow đã vượt SLA tổng
      const count = await db.workflowInstance
        .count({ where: { status: 'EXPIRED' } })
        .catch(() => 0)
      return { count }
    }

    case 'WORKFLOW_PENDING': {
      const count = await db.workflowInstance
        .count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } })
        .catch(() => 0)
      return { count }
    }

    // ── Personnel widgets ────────────────────────────────────────────────────
    case 'personnel-total': {
      const total = await db.user.count({ where: unitFilter })
      const active = await db.user.count({ where: { ...unitFilter, workStatus: 'ACTIVE' } })
      return { total, active }
    }

    // ── Student widgets ──────────────────────────────────────────────────────
    case 'student-avg-gpa': {
      const result = await db.ketQuaHocTap.aggregate({ _avg: { diemTongKet: true } })
      return { avgGpa: result._avg.diemTongKet ? parseFloat(result._avg.diemTongKet.toFixed(1)) : 0 }
    }

    // ── Research widgets ─────────────────────────────────────────────────────
    case 'research-total': {
      const [total, active] = await Promise.all([
        db.nckhProject.count().catch(() => 0),
        db.nckhProject.count({ where: { status: { in: ['APPROVED', 'IN_PROGRESS'] } } }).catch(() => 0),
      ])
      return { total, active }
    }

    // Fallback: gọi thẳng API endpoint của widget (dùng cho widgets chưa có adapter riêng)
    default:
      return { message: `Widget '${widgetKey}' chưa có adapter riêng – dùng apiEndpoint trực tiếp` }
  }
}
