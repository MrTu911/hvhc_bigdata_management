/**
 * ProjectService – CSDL-KHQL Phase 3
 * Business logic cho NckhProject wrapper:
 *   - list / get với sensitivity guard
 *   - create project + auto-generate projectCode
 *   - workflow transition với guard hợp lệ
 *   - alerts: deadline < 30 ngày
 */
import 'server-only'
import { projectRepo, milestoneRepo, acceptanceRepo } from '@/lib/repositories/science/project.repo'
import { scienceCatalogRepo } from '@/lib/repositories/science/catalog.repo'
import { logAudit } from '@/lib/audit'
import {
  VALID_STATUS_TRANSITIONS,
  LOCKED_STATUSES,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectListFilter,
  type WorkflowTransitionInput,
  type MilestoneCreateInput,
  type MilestoneUpdateInput,
  type AcceptanceSubmitInput,
} from '@/lib/validations/science-project'
import prisma from '@/lib/db'

// ─── Code generation ──────────────────────────────────────────────────────────

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear()

  const seq = await prisma.scienceIdSequence.upsert({
    where: { entityType_year: { entityType: 'PROJECT', year } },
    create: { entityType: 'PROJECT', year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  })

  return `HVHC-${year}-PRJ-${String(seq.lastSeq).padStart(3, '0')}`
}

// ─── Sensitivity guard ────────────────────────────────────────────────────────

function canView(sensitivity: string, canViewConfidential: boolean, canViewSecret: boolean) {
  if (sensitivity === 'SECRET') return canViewSecret
  if (sensitivity === 'CONFIDENTIAL') return canViewConfidential
  return true
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const projectService = {
  async listProjects(
    filter: ProjectListFilter,
    canViewConfidential: boolean,
    canViewSecret: boolean
  ) {
    const result = await projectRepo.findMany(filter, canViewSecret)

    const items = result.items.filter((p) =>
      canView(p.sensitivity, canViewConfidential, canViewSecret)
    )

    return { success: true as const, data: { items, total: result.total } }
  },

  async getProjectById(
    id: string,
    canViewConfidential: boolean,
    canViewSecret: boolean
  ) {
    const project = await projectRepo.findById(id)
    if (!project) return { success: false as const, error: 'Không tìm thấy đề tài' }

    if (!canView(project.sensitivity, canViewConfidential, canViewSecret)) {
      return { success: false as const, error: 'Không có quyền xem đề tài này' }
    }

    return { success: true as const, data: project }
  },

  async createProject(
    input: ProjectCreateInput,
    principalInvestigatorId: string,
    userId: string,
    ipAddress?: string
  ) {
    const projectCode = await generateProjectCode()

    const created = await projectRepo.create({
      ...input,
      projectCode,
      principalInvestigatorId,
    })

    await logAudit({
      userId,
      functionCode: 'CREATE_RESEARCH_PROJECT',
      action: 'CREATE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: created.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { projectCode },
    })

    return { success: true as const, data: created }
  },

  async updateProject(
    id: string,
    input: ProjectUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const existing = await projectRepo.findById(id)
    if (!existing) return { success: false as const, error: 'Không tìm thấy đề tài' }

    const updated = await projectRepo.update(id, input)

    await logAudit({
      userId,
      functionCode: 'CREATE_RESEARCH_PROJECT',
      action: 'UPDATE',
      resourceType: 'RESEARCH_PROJECT',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
    })

    return { success: true as const, data: updated }
  },

  async transitionWorkflow(
    id: string,
    input: WorkflowTransitionInput,
    userId: string,
    ipAddress?: string
  ) {
    const project = await projectRepo.findById(id)
    if (!project) return { success: false as const, error: 'Không tìm thấy đề tài' }

    const currentStatus = project.status as keyof typeof VALID_STATUS_TRANSITIONS
    const allowed = VALID_STATUS_TRANSITIONS[currentStatus] ?? []

    if (!allowed.includes(input.toStatus as any)) {
      return {
        success: false as const,
        error: `Không thể chuyển từ ${currentStatus} → ${input.toStatus}. Trạng thái hợp lệ: ${allowed.join(', ')}`,
      }
    }

    const updated = await projectRepo.transition(
      id,
      input.toStatus,
      input.toPhase,
      userId,
      input.comment
    )

    await logAudit({
      userId,
      functionCode: 'APPROVE_RESEARCH_DEPT',
      action: 'UPDATE',
      resourceType: 'RESEARCH_PROJECT_WORKFLOW',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
      metadata: {
        fromStatus: currentStatus,
        toStatus: input.toStatus,
        toPhase: input.toPhase,
      },
    })

    return { success: true as const, data: updated }
  },

  async getDeadlineAlerts(daysAhead = 30) {
    const projects = await projectRepo.findDeadlineSoon(daysAhead)
    return { success: true as const, data: projects }
  },

  // ─── Lock guard ─────────────────────────────────────────────────────────────

  async assertNotLocked(id: string) {
    const project = await prisma.nckhProject.findUnique({
      where: { id },
      select: { status: true, phase: true },
    })
    if (!project) return { locked: false, notFound: true }
    // CANCELLED → locked via status; ARCHIVED → locked via phase (status stays COMPLETED)
    if (LOCKED_STATUSES.has(project.status as any) || project.phase === 'ARCHIVED') {
      return { locked: true, notFound: false, status: project.status, phase: project.phase }
    }
    return { locked: false, notFound: false }
  },

  // ─── Milestone service ───────────────────────────────────────────────────────

  async getMilestones(projectId: string) {
    const milestones = await milestoneRepo.findByProject(projectId)
    return { success: true as const, data: milestones }
  },

  async addMilestone(
    projectId: string,
    input: MilestoneCreateInput,
    userId: string,
    ipAddress?: string
  ) {
    const lockCheck = await projectService.assertNotLocked(projectId)
    if (lockCheck.notFound) return { success: false as const, error: 'Không tìm thấy đề tài' }
    if (lockCheck.locked) return { success: false as const, error: `Đề tài đã khóa (${lockCheck.status}), không thể thêm mốc` }

    const milestone = await milestoneRepo.create(projectId, input)

    await logAudit({
      userId,
      functionCode: 'CREATE_RESEARCH_PROJECT',
      action: 'CREATE',
      resourceType: 'RESEARCH_MILESTONE',
      resourceId: milestone.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: { projectId, title: milestone.title },
    })

    return { success: true as const, data: milestone }
  },

  async updateMilestone(
    projectId: string,
    milestoneId: string,
    input: MilestoneUpdateInput,
    userId: string,
    ipAddress?: string
  ) {
    const lockCheck = await projectService.assertNotLocked(projectId)
    if (lockCheck.notFound) return { success: false as const, error: 'Không tìm thấy đề tài' }
    if (lockCheck.locked) return { success: false as const, error: `Đề tài đã khóa, không thể cập nhật mốc` }

    const existing = await milestoneRepo.findById(milestoneId)
    if (!existing || existing.projectId !== projectId) {
      return { success: false as const, error: 'Không tìm thấy mốc tiến độ' }
    }

    const updated = await milestoneRepo.update(milestoneId, input)

    await logAudit({
      userId,
      functionCode: 'CREATE_RESEARCH_PROJECT',
      action: 'UPDATE',
      resourceType: 'RESEARCH_MILESTONE',
      resourceId: milestoneId,
      result: 'SUCCESS',
      ipAddress,
      metadata: { projectId, status: input.status },
    })

    return { success: true as const, data: updated }
  },

  // ─── Acceptance (nghiệm thu) service ────────────────────────────────────────

  async getAcceptanceRecords(projectId: string) {
    const records = await acceptanceRepo.findByProject(projectId)
    return { success: true as const, data: records }
  },

  async submitAcceptance(
    projectId: string,
    input: AcceptanceSubmitInput,
    userId: string,
    ipAddress?: string
  ) {
    const project = await projectRepo.findById(projectId)
    if (!project) return { success: false as const, error: 'Không tìm thấy đề tài' }

    // Chỉ đề tài IN_PROGRESS hoặc PAUSED mới được nghiệm thu
    if (!['IN_PROGRESS', 'PAUSED'].includes(project.status as string)) {
      return {
        success: false as const,
        error: `Chỉ đề tài đang thực hiện mới được nộp nghiệm thu. Trạng thái hiện tại: ${project.status}`,
      }
    }

    const record = await acceptanceRepo.create(projectId, input)

    // Nếu PASSED → auto-transition sang COMPLETED
    if (input.decision === 'PASSED') {
      await projectRepo.transition(
        projectId,
        'COMPLETED',
        'FINAL_REVIEW',
        userId,
        `Nghiệm thu ${record.reviewType}: ${input.grade ?? ''} (${input.score ?? ''}). ${input.comments ?? ''}`
      )
    }

    await logAudit({
      userId,
      functionCode: 'APPROVE_RESEARCH_DEPT',
      action: 'UPDATE',
      resourceType: 'RESEARCH_ACCEPTANCE',
      resourceId: record.id,
      result: 'SUCCESS',
      ipAddress,
      metadata: {
        projectId,
        reviewType: input.reviewType,
        decision: input.decision,
        score: input.score,
      },
    })

    return { success: true as const, data: record }
  },

  // ─── Archive service ─────────────────────────────────────────────────────────

  async archiveProject(
    id: string,
    options: { completionScore?: number; completionGrade?: string; comment?: string },
    userId: string,
    ipAddress?: string
  ) {
    const project = await projectRepo.findById(id)
    if (!project) return { success: false as const, error: 'Không tìm thấy đề tài' }

    if (project.status !== 'COMPLETED') {
      return { success: false as const, error: 'Chỉ đề tài đã hoàn thành mới được lưu trữ' }
    }

    if (project.phase === 'ARCHIVED') {
      return { success: false as const, error: 'Đề tài đã được lưu trữ' }
    }

    // Archive = keep status COMPLETED, set phase → ARCHIVED, record metadata atomically
    // NckhProjectStatus has no ARCHIVED value; archive state = status:COMPLETED + phase:ARCHIVED
    const [archived] = await prisma.$transaction([
      prisma.nckhProject.update({
        where: { id },
        data: {
          phase: 'ARCHIVED' as any,
          ...(options.completionScore !== undefined ? { completionScore: options.completionScore } : {}),
          ...(options.completionGrade !== undefined ? { completionGrade: options.completionGrade } : {}),
        },
      }),
      prisma.nckhProjectWorkflowLog.create({
        data: {
          projectId: id,
          fromStatus: 'COMPLETED',
          toStatus: 'COMPLETED', // status unchanged
          fromPhase: project.phase as string,
          toPhase: 'ARCHIVED',
          actionById: userId,
          comment: options.comment,
        },
      }),
    ])

    // TODO Sprint-07: trigger M23 council.lock() hook if council exists
    // TODO Sprint-07: trigger M24 budget.finalize() hook if budget exists
    // TODO Sprint-07: trigger M25 library.indexProject() hook

    await logAudit({
      userId,
      functionCode: 'APPROVE_RESEARCH_ACADEMY',
      action: 'UPDATE',
      resourceType: 'RESEARCH_PROJECT_ARCHIVE',
      resourceId: id,
      result: 'SUCCESS',
      ipAddress,
      metadata: {
        projectCode: project.projectCode,
        completionScore: options.completionScore,
        completionGrade: options.completionGrade,
      },
    })

    return { success: true as const, data: archived }
  },
}
