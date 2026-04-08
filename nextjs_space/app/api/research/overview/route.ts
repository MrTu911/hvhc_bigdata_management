import { NextRequest, NextResponse } from 'next/server'
import { requireFunction } from '@/lib/rbac/middleware'
import { RESEARCH } from '@/lib/rbac/function-codes'
import db from '@/lib/db'

// ── Label maps ──────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản thảo',
  SUBMITTED: 'Đã nộp',
  UNDER_REVIEW: 'Đang thẩm định',
  APPROVED: 'Được duyệt',
  REJECTED: 'Từ chối',
  IN_PROGRESS: 'Đang thực hiện',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Hủy bỏ',
}

const CATEGORY_LABELS: Record<string, string> = {
  CAP_HOC_VIEN: 'Cấp Học viện',
  CAP_TONG_CUC: 'Cấp Tổng cục',
  CAP_BO_QUOC_PHONG: 'Cấp Bộ Quốc phòng',
  CAP_NHA_NUOC: 'Cấp Nhà nước',
  SANG_KIEN_CO_SO: 'Sáng kiến cơ sở',
}

const FIELD_LABELS: Record<string, string> = {
  HOC_THUAT_QUAN_SU: 'Học thuật quân sự',
  HAU_CAN_KY_THUAT: 'Hậu cần - Kỹ thuật',
  KHOA_HOC_XA_HOI: 'Khoa học xã hội',
  KHOA_HOC_TU_NHIEN: 'Khoa học tự nhiên',
  CNTT: 'Công nghệ thông tin',
  Y_DUOC: 'Y - Dược',
  KHAC: 'Khác',
}

const PUB_TYPE_LABELS: Record<string, string> = {
  BAI_BAO_QUOC_TE: 'Bài báo quốc tế',
  BAI_BAO_TRONG_NUOC: 'Bài báo trong nước',
  SACH_CHUYEN_KHAO: 'Sách chuyên khảo',
  GIAO_TRINH: 'Giáo trình',
  SANG_KIEN: 'Sáng kiến',
  PATENT: 'Bằng sáng chế',
  BAO_CAO_KH: 'Báo cáo KH',
  LUAN_VAN: 'Luận văn',
  LUAN_AN: 'Luận án',
}

export async function GET(req: NextRequest) {
  const auth = await requireFunction(req, RESEARCH.VIEW)
  if (!auth.allowed) return auth.response!

  try {
    const now = new Date()
    const currentYear = now.getFullYear()

    // ── KPI aggregates (parallel) ──────────────────────────────────────────
    const [
      totalProjects,
      inProgressCount,
      completedCount,
      totalPublications,
      pubCitationAgg,
      scientistCount,
      budgetAgg,
      isiScopusCount,
    ] = await Promise.all([
      db.nckhProject.count(),
      db.nckhProject.count({ where: { status: 'IN_PROGRESS' } }),
      db.nckhProject.count({ where: { status: 'COMPLETED' } }),
      db.nckhPublication.count({ where: { status: 'PUBLISHED' } }),
      db.nckhPublication.aggregate({
        where: { status: 'PUBLISHED' },
        _sum: { citationCount: true },
      }),
      db.nckhScientistProfile.count(),
      db.nckhProject.aggregate({
        _sum: { budgetApproved: true },
        _avg: { budgetApproved: true },
      }),
      db.nckhPublication.count({
        where: { OR: [{ isISI: true }, { isScopus: true }], status: 'PUBLISHED' },
      }),
    ])

    // ── Projects by status ─────────────────────────────────────────────────
    const projectsByStatusRaw = await db.nckhProject.groupBy({
      by: ['status'],
      _count: { _all: true },
      orderBy: { _count: { status: 'desc' } },
    })
    const projectsByStatus = projectsByStatusRaw.map((r) => ({
      status: r.status,
      label: STATUS_LABELS[r.status] ?? r.status,
      count: r._count._all,
    }))

    // ── Projects by category ───────────────────────────────────────────────
    const projectsByCategoryRaw = await db.nckhProject.groupBy({
      by: ['category'],
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    })
    const projectsByCategory = projectsByCategoryRaw.map((r) => ({
      category: r.category,
      label: CATEGORY_LABELS[r.category] ?? r.category,
      count: r._count._all,
    }))

    // ── Projects by field ──────────────────────────────────────────────────
    const projectsByFieldRaw = await db.nckhProject.groupBy({
      by: ['field'],
      _count: { _all: true },
      orderBy: { _count: { field: 'desc' } },
    })
    const projectsByField = projectsByFieldRaw.map((r) => ({
      field: r.field,
      label: FIELD_LABELS[r.field] ?? r.field,
      count: r._count._all,
    }))

    // ── Year trend (last 6 budget years) ──────────────────────────────────
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i)
    const [projectsPerYear, pubsPerYear] = await Promise.all([
      db.nckhProject.groupBy({
        by: ['budgetYear'],
        _count: { _all: true },
        where: { budgetYear: { in: years } },
        orderBy: { budgetYear: 'asc' },
      }),
      db.nckhPublication.groupBy({
        by: ['publishedYear'],
        _count: { _all: true },
        where: { publishedYear: { in: years }, status: 'PUBLISHED' },
        orderBy: { publishedYear: 'asc' },
      }),
    ])
    const projMap = Object.fromEntries(projectsPerYear.map((r) => [r.budgetYear, r._count._all]))
    const pubMap  = Object.fromEntries(pubsPerYear.map((r) => [r.publishedYear, r._count._all]))
    const yearTrend = years.map((y) => ({
      year: y,
      projects: projMap[y] ?? 0,
      publications: pubMap[y] ?? 0,
    }))

    // ── Publications by type ───────────────────────────────────────────────
    const pubsByTypeRaw = await db.nckhPublication.groupBy({
      by: ['pubType'],
      _count: { _all: true },
      where: { status: 'PUBLISHED' },
      orderBy: { _count: { pubType: 'desc' } },
    })
    const pubsByType = pubsByTypeRaw.map((r) => ({
      pubType: r.pubType,
      label: PUB_TYPE_LABELS[r.pubType] ?? r.pubType,
      count: r._count._all,
    }))

    // ── Recent projects (8 newest, active/in-progress first) ──────────────
    const recentProjects = await db.nckhProject.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectCode: true,
        title: true,
        status: true,
        category: true,
        field: true,
        budgetYear: true,
        budgetApproved: true,
        startDate: true,
        endDate: true,
        principalInvestigator: { select: { name: true } },
        unit: { select: { name: true } },
        _count: { select: { members: true, milestones: true } },
      },
    })

    // ── Top scientists by h-index + publications ───────────────────────────
    const topScientists = await db.nckhScientistProfile.findMany({
      take: 6,
      orderBy: [{ hIndex: 'desc' }, { totalPublications: 'desc' }],
      select: {
        id: true,
        hIndex: true,
        i10Index: true,
        totalCitations: true,
        totalPublications: true,
        projectLeadCount: true,
        academicRank: true,
        degree: true,
        specialization: true,
        user: { select: { id: true, name: true } },
      },
    })

    // ── Projects completed this year ───────────────────────────────────────
    const completedThisYear = await db.nckhProject.count({
      where: {
        status: 'COMPLETED',
        actualEndDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
    })

    // ── Overdue (past endDate, not completed/cancelled) ────────────────────
    const overdueCount = await db.nckhProject.count({
      where: {
        endDate: { lt: now },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED', 'DRAFT'] },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalProjects,
          inProgressCount,
          completedCount,
          totalPublications,
          totalCitations: pubCitationAgg._sum.citationCount ?? 0,
          scientistCount,
          totalBudget: budgetAgg._sum.budgetApproved ?? 0,
          avgBudget: budgetAgg._avg.budgetApproved ?? 0,
          isiScopusCount,
          completedThisYear,
          overdueCount,
        },
        projectsByStatus,
        projectsByCategory,
        projectsByField,
        yearTrend,
        pubsByType,
        recentProjects: recentProjects.map((p) => ({
          id: p.id,
          projectCode: p.projectCode,
          title: p.title,
          status: p.status,
          statusLabel: STATUS_LABELS[p.status] ?? p.status,
          category: p.category,
          categoryLabel: CATEGORY_LABELS[p.category] ?? p.category,
          field: p.field,
          fieldLabel: FIELD_LABELS[p.field] ?? p.field,
          budgetYear: p.budgetYear,
          budgetApproved: p.budgetApproved,
          startDate: p.startDate,
          endDate: p.endDate,
          piName: p.principalInvestigator?.name ?? null,
          unitName: p.unit?.name ?? null,
          memberCount: p._count.members,
          milestoneCount: p._count.milestones,
        })),
        topScientists: topScientists.map((s) => ({
          id: s.id,
          userId: s.user.id,
          name: s.user.name,
          academicRank: s.academicRank,
          degree: s.degree,
          specialization: s.specialization,
          hIndex: s.hIndex,
          i10Index: s.i10Index,
          totalCitations: s.totalCitations,
          totalPublications: s.totalPublications,
          projectLeadCount: s.projectLeadCount,
        })),
      },
    })
  } catch (err) {
    console.error('[research/overview]', err)
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tải dữ liệu tổng quan NCKH' },
      { status: 500 },
    )
  }
}
