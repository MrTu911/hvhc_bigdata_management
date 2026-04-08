/**
 * NckhReviewRepo – Module M09 UC-45
 * Data access layer cho NckhReview (phiên nghiệm thu).
 * Quyết định phase transition sau review do service/workflow xử lý.
 */
import 'server-only'
import db from '@/lib/db'
import type { NckhReviewType, NckhReviewDecision } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NckhReviewCreateData {
  projectId: string
  reviewType: NckhReviewType
  reviewDate: Date
  score?: number | null
  grade?: string | null
  decision: NckhReviewDecision
  comments?: string | null
  minutesUrl?: string | null
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const nckhReviewRepo = {
  async findByProject(projectId: string) {
    return db.nckhReview.findMany({
      where: { projectId },
      orderBy: { reviewDate: 'desc' },
    })
  },

  async findById(id: string) {
    return db.nckhReview.findUnique({ where: { id } })
  },

  /** Lấy phiên nghiệm thu mới nhất của project (để xác định kết quả cuối) */
  async findLatestByProject(projectId: string) {
    return db.nckhReview.findFirst({
      where: { projectId },
      orderBy: { reviewDate: 'desc' },
    })
  },

  /** Lấy phiên nghiệm thu theo loại cụ thể */
  async findByType(projectId: string, reviewType: NckhReviewType) {
    return db.nckhReview.findMany({
      where: { projectId, reviewType },
      orderBy: { reviewDate: 'desc' },
    })
  },

  async create(data: NckhReviewCreateData) {
    return db.nckhReview.create({ data })
  },

  /** Cập nhật biên bản – chỉ cho phép sửa minutesUrl và comments sau khi tạo */
  async updateMinutes(id: string, data: { minutesUrl?: string | null; comments?: string | null }) {
    return db.nckhReview.update({ where: { id }, data })
  },

  async delete(id: string) {
    return db.nckhReview.delete({ where: { id } })
  },

  /** Tổng hợp kết quả nghiệm thu cho dashboard */
  async summarizeByProject(projectId: string) {
    return db.nckhReview.groupBy({
      by: ['decision'],
      where: { projectId },
      _count: { id: true },
      _avg: { score: true },
    })
  },

  /** Thống kê theo loại nghiệm thu cho toàn bộ HV */
  async statsAcademy(budgetYear?: number) {
    return db.nckhReview.groupBy({
      by: ['reviewType', 'decision'],
      where: budgetYear
        ? { project: { budgetYear } }
        : undefined,
      _count: { id: true },
      _avg: { score: true },
    })
  },
}
