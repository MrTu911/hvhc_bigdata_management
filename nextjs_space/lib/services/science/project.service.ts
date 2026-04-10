/**
 * ProjectService – CSDL-KHQL Phase 3
 * Business logic cho NckhProject wrapper:
 *   - list / get với sensitivity guard
 *   - create project + auto-generate projectCode
 *   - workflow transition với guard hợp lệ
 *   - alerts: deadline < 30 ngày
 */
import 'server-only'
import { projectRepo } from '@/lib/repositories/science/project.repo'
import { scienceCatalogRepo } from '@/lib/repositories/science/catalog.repo'
import { logAudit } from '@/lib/audit'
import {
  VALID_STATUS_TRANSITIONS,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ProjectListFilter,
  type WorkflowTransitionInput,
} from '@/lib/validations/science-project'
import { db } from '@/lib/db'

// ─── Code generation ──────────────────────────────────────────────────────────

async function generateProjectCode(): Promise<string> {
  const year = new Date().getFullYear()

  const seq = await db.scienceIdSequence.upsert({
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
}
