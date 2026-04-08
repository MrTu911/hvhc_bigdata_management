/**
 * NckhMilestoneRepo – Module M09 UC-45
 * Data access layer cho NckhMilestone.
 * Không chứa business logic – logic OVERDUE detection do service xử lý.
 */
import 'server-only'
import db from '@/lib/db'
import type { NckhMilestoneStatus } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NckhMilestoneCreateData {
  projectId: string
  title: string
  dueDate: Date
  note?: string | null
  attachmentUrl?: string | null
}

export interface NckhMilestoneUpdateData {
  title?: string
  dueDate?: Date
  status?: NckhMilestoneStatus
  completedAt?: Date | null
  note?: string | null
  attachmentUrl?: string | null
}

// ─── Repository ───────────────────────────────────────────────────────────────

export const nckhMilestoneRepo = {
  async findByProject(projectId: string) {
    return db.nckhMilestone.findMany({
      where: { projectId },
      orderBy: { dueDate: 'asc' },
    })
  },

  async findById(id: string) {
    return db.nckhMilestone.findUnique({ where: { id } })
  },

  /** Milestone quá hạn: dueDate < now và chưa hoàn thành */
  async findOverdue(projectId?: string) {
    return db.nckhMilestone.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        dueDate: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        project: { select: { id: true, projectCode: true, title: true, principalInvestigatorId: true } },
      },
      orderBy: { dueDate: 'asc' },
    })
  },

  async findByStatus(projectId: string, status: NckhMilestoneStatus) {
    return db.nckhMilestone.findMany({
      where: { projectId, status },
      orderBy: { dueDate: 'asc' },
    })
  },

  async create(data: NckhMilestoneCreateData) {
    return db.nckhMilestone.create({
      data: {
        ...data,
        status: 'PENDING',
      },
    })
  },

  async update(id: string, data: NckhMilestoneUpdateData) {
    return db.nckhMilestone.update({ where: { id }, data })
  },

  /** Bulk update: đánh dấu OVERDUE cho các milestone quá hạn chưa xử lý */
  async markOverdueByProjectId(projectId: string) {
    return db.nckhMilestone.updateMany({
      where: {
        projectId,
        dueDate: { lt: new Date() },
        status: 'PENDING',
      },
      data: { status: 'OVERDUE' },
    })
  },

  async delete(id: string) {
    return db.nckhMilestone.delete({ where: { id } })
  },

  async countByProject(projectId: string) {
    return db.nckhMilestone.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    })
  },
}
