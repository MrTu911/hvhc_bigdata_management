import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// KPI + alerts + upcoming events dành cho Command Center của Phòng khoa học
export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const thirtyDaysLater = new Date(now)
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
    const sevenDaysLater = new Date(now)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    // ── KPI tổng hợp (parallel) ───────────────────────────────────────────────
    const [
      totalProjects,
      inProgressCount,
      completedCount,
      draftCount,
      underReviewCount,
      totalPublications,
      isiScopusCount,
      domesticPubCount,
      scientistCount,
      budgetAgg,
      totalCitationsAgg,
      councilCount,
    ] = await Promise.all([
      db.nckhProject.count(),
      db.nckhProject.count({ where: { status: 'IN_PROGRESS' } }),
      db.nckhProject.count({ where: { status: 'COMPLETED' } }),
      db.nckhProject.count({ where: { status: 'DRAFT' } }),
      db.nckhProject.count({ where: { status: 'UNDER_REVIEW' } }),
      db.nckhPublication.count({ where: { status: 'PUBLISHED' } }),
      db.nckhPublication.count({
        where: { OR: [{ isISI: true }, { isScopus: true }], status: 'PUBLISHED' },
      }),
      db.nckhPublication.count({
        where: { pubType: 'BAI_BAO_TRONG_NUOC', status: 'PUBLISHED' },
      }),
      db.nckhScientistProfile.count(),
      db.nckhProject.aggregate({ _sum: { budgetApproved: true, budgetUsed: true } }),
      db.nckhPublication.aggregate({
        where: { status: 'PUBLISHED' },
        _sum: { citationCount: true },
      }),
      db.scientificCouncil.count(),
    ])

    // ── Projects by category ───────────────────────────────────────────────────
    const projectsByCategoryRaw = await db.nckhProject.groupBy({
      by: ['category'],
      _count: { _all: true },
    })
    const CATEGORY_LABELS: Record<string, string> = {
      CAP_HOC_VIEN: 'Cấp Học viện',
      CAP_TONG_CUC: 'Cấp Tổng cục',
      CAP_BO_QUOC_PHONG: 'Cấp Bộ QP',
      CAP_NHA_NUOC: 'Cấp Nhà nước',
      SANG_KIEN_CO_SO: 'Sáng kiến',
    }
    const projectsByCategory = projectsByCategoryRaw.map((r) => ({
      category: r.category,
      label: CATEGORY_LABELS[r.category] ?? r.category,
      count: r._count._all,
    }))

    // ── Cảnh báo (alerts) ──────────────────────────────────────────────────────
    const [overdueProjects, endingSoonProjects, overduePublications] = await Promise.all([
      // Đề tài quá hạn (qua endDate nhưng chưa hoàn thành)
      db.nckhProject.findMany({
        where: {
          endDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] },
        },
        select: { id: true, projectCode: true, title: true, endDate: true, status: true },
        take: 10,
        orderBy: { endDate: 'asc' },
      }),
      // Đề tài sắp hết hạn trong 30 ngày
      db.nckhProject.findMany({
        where: {
          endDate: { gte: now, lte: thirtyDaysLater },
          status: { in: ['IN_PROGRESS', 'APPROVED'] },
        },
        select: { id: true, projectCode: true, title: true, endDate: true, status: true },
        take: 10,
        orderBy: { endDate: 'asc' },
      }),
      // Milestone quá hạn
      db.nckhMilestone.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ])

    // ── Sự kiện sắp tới (upcoming events) ────────────────────────────────────
    const upcomingCouncils = await db.scientificCouncil.findMany({
      where: {
        meetingDate: { gte: now, lte: thirtyDaysLater },
        result: null,
      },
      select: {
        id: true,
        type: true,
        meetingDate: true,
        project: { select: { id: true, projectCode: true, title: true } },
        chairman: { select: { name: true } },
      },
      take: 10,
      orderBy: { meetingDate: 'asc' },
    })

    // ── Đề tài theo năm (6 năm gần nhất) ────────────────────────────────────
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 4 + i)
    const projectsPerYear = await db.nckhProject.groupBy({
      by: ['budgetYear'],
      _count: { _all: true },
      where: { budgetYear: { in: years } },
      orderBy: { budgetYear: 'asc' },
    })
    const projMap = Object.fromEntries(projectsPerYear.map((r) => [r.budgetYear, r._count._all]))
    const yearTrend = years.map((y) => ({ year: y, count: projMap[y] ?? 0 }))

    // ── Đề tài mới nhất cần xử lý (submitted/under_review) ──────────────────
    const pendingActions = await db.nckhProject.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        category: true,
        createdAt: true,
        principalInvestigator: { select: { name: true } },
      },
      take: 8,
      orderBy: { createdAt: 'asc' },
    })

    const COUNCIL_TYPE_LABELS: Record<string, string> = {
      REVIEW: 'Thẩm định',
      ACCEPTANCE: 'Nghiệm thu',
      FINAL: 'Kết luận',
    }
    const STATUS_LABELS: Record<string, string> = {
      DRAFT: 'Bản thảo', SUBMITTED: 'Chờ xét duyệt', UNDER_REVIEW: 'Đang thẩm định',
      APPROVED: 'Được duyệt', REJECTED: 'Từ chối', IN_PROGRESS: 'Đang thực hiện',
      PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn thành', CANCELLED: 'Hủy bỏ',
    }

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalProjects,
          inProgressCount,
          completedCount,
          draftCount,
          underReviewCount,
          totalPublications,
          isiScopusCount,
          domesticPubCount,
          scientistCount,
          totalBudgetApproved: budgetAgg._sum.budgetApproved ?? 0,
          totalBudgetUsed: budgetAgg._sum.budgetUsed ?? 0,
          totalCitations: totalCitationsAgg._sum.citationCount ?? 0,
          overdueMilestoneCount: overduePublications,
          councilCount,
        },
        projectsByCategory,
        yearTrend,
        alerts: {
          overdueProjects: overdueProjects.map((p) => ({
            id: p.id,
            projectCode: p.projectCode,
            title: p.title,
            endDate: p.endDate,
            status: p.status,
            statusLabel: STATUS_LABELS[p.status] ?? p.status,
            daysOverdue: Math.floor((now.getTime() - new Date(p.endDate!).getTime()) / 86400000),
          })),
          endingSoonProjects: endingSoonProjects.map((p) => ({
            id: p.id,
            projectCode: p.projectCode,
            title: p.title,
            endDate: p.endDate,
            status: p.status,
            statusLabel: STATUS_LABELS[p.status] ?? p.status,
            daysLeft: Math.floor((new Date(p.endDate!).getTime() - now.getTime()) / 86400000),
          })),
        },
        upcomingCouncils: upcomingCouncils.map((c) => ({
          id: c.id,
          type: c.type,
          typeLabel: COUNCIL_TYPE_LABELS[c.type] ?? c.type,
          meetingDate: c.meetingDate,
          projectId: c.project.id,
          projectCode: c.project.projectCode,
          projectTitle: c.project.title,
          chairmanName: c.chairman.name,
        })),
        pendingActions: pendingActions.map((p) => ({
          id: p.id,
          projectCode: p.projectCode,
          title: p.title,
          status: p.status,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          category: p.category,
          categoryLabel: CATEGORY_LABELS[p.category] ?? p.category,
          piName: p.principalInvestigator?.name ?? null,
          createdAt: p.createdAt,
        })),
      },
    })
  } catch (err) {
    console.error('[research/management/stats]', err)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải dữ liệu thống kê' },
      { status: 500 },
    )
  }
}
