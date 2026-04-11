/**
 * Science Workflow Adapter – M20 ↔ M13 integration layer
 *
 * Thin adapter bọc M13 WorkflowEngineService với graceful fallback.
 *
 * Thiết kế nguyên tắc:
 *   - M20 project service vẫn là source of truth về status (NckhProjectStatus).
 *   - M13 cung cấp: formal approval chain, notifications, SLA tracking, audit trail.
 *   - Nếu M13 template chưa PUBLISHED (DRAFT), adapter log warning và tiếp tục.
 *   - Mọi lỗi M13 KHÔNG được phép làm fail business operation của M20.
 *
 * Template codes (seeded bởi seed_m20_workflow_template.ts):
 *   M20-APPROVAL   – SUBMITTED → UNDER_REVIEW → APPROVED
 *   M20-ACCEPTANCE – PENDING_ACCEPTANCE → COMPLETED
 *
 * Sprint 03 action: chạy seed_m20_workflow_template.ts với PUBLISHED status
 *   để kích hoạt M13 cho live instances.
 */
import 'server-only'
import {
  WorkflowEngineService as workflowEngineService,
  WorkflowError,
} from '@/lib/services/workflow/workflow-engine.service'
import type { AuthUser } from '@/lib/rbac/types'

// ─── Template codes ───────────────────────────────────────────────────────────

export const SCIENCE_WORKFLOW_TEMPLATES = {
  PROJECT_APPROVAL:   'M20-APPROVAL',
  PROJECT_ACCEPTANCE: 'M20-ACCEPTANCE',
} as const

// ─── Action code mapping ──────────────────────────────────────────────────────
// Maps NckhProjectStatus transition → M13 WorkflowActionCode

const STATUS_TO_ACTION: Partial<Record<string, 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RETURN'>> = {
  SUBMITTED:    'SUBMIT',
  UNDER_REVIEW: 'APPROVE',   // Dept nhận hồ sơ vào xét duyệt
  APPROVED:     'APPROVE',   // Academy phê duyệt chính thức
  REJECTED:     'REJECT',
  COMPLETED:    'APPROVE',   // Kết thúc acceptance workflow
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const scienceWorkflowAdapter = {
  /**
   * Khởi tạo M13 workflow instance khi đề tài được tạo.
   * Gọi sau khi NckhProject đã được tạo thành công trong DB.
   *
   * Template: M20-APPROVAL
   * Nếu template chưa PUBLISHED → log warning, không throw.
   */
  async tryStartApprovalWorkflow(
    projectId: string,
    projectCode: string,
    projectTitle: string,
    actor: AuthUser,
  ): Promise<{ workflowInstanceId: string } | null> {
    try {
      const result = await workflowEngineService.startWorkflow(
        {
          templateCode: SCIENCE_WORKFLOW_TEMPLATES.PROJECT_APPROVAL,
          entityType:   'NckhProject',
          entityId:     projectId,
          title:        `Phê duyệt đề tài ${projectCode}`,
          summary:      projectTitle,
          priority:     1,
        },
        actor,
      )
      return { workflowInstanceId: result.workflowInstanceId }
    } catch (err) {
      if (err instanceof WorkflowError && err.code === 'TEMPLATE_NOT_PUBLISHED') {
        console.warn(
          `[ScienceWorkflowAdapter] M20-APPROVAL template chưa PUBLISHED — bỏ qua M13 cho project ${projectId}. Chạy seed_m20_workflow_template.ts để kích hoạt.`,
        )
        return null
      }
      // Các lỗi khác: log nhưng không throw để không block business operation
      console.error(`[ScienceWorkflowAdapter] tryStartApprovalWorkflow failed for ${projectId}:`, err)
      return null
    }
  },

  /**
   * Thực hiện action M13 khi project chuyển trạng thái.
   * Gọi sau khi NckhProject đã được transition thành công trong DB.
   *
   * Tìm WorkflowInstance theo (entityType, entityId) — không cần lưu ID trên project.
   * Nếu không tìm thấy instance → bỏ qua silently.
   */
  async tryActOnTransition(
    projectId: string,
    toStatus: string,
    actor: AuthUser,
    comment?: string,
  ): Promise<void> {
    const actionCode = STATUS_TO_ACTION[toStatus]
    if (!actionCode) return  // Transition không cần M13 action (e.g. PAUSED, CANCELLED)

    try {
      // Tìm active workflow instance cho project này
      const instance = await findActiveWorkflowInstance('NckhProject', projectId)
      if (!instance) return  // Workflow chưa được khởi tạo (template DRAFT)

      await workflowEngineService.actOnWorkflow(
        {
          workflowInstanceId: instance.id,
          actionCode,
          comment,
        },
        actor,
      )
    } catch (err) {
      if (err instanceof WorkflowError) {
        // INVALID_TRANSITION: M13 state và M20 state lệch nhau — log để điều tra
        console.warn(
          `[ScienceWorkflowAdapter] M13 transition rejected for project ${projectId} → ${toStatus}: ${err.message}`,
        )
        return
      }
      console.error(`[ScienceWorkflowAdapter] tryActOnTransition failed for ${projectId}:`, err)
    }
  },

  /**
   * Khởi tạo M13 acceptance workflow khi đề tài nộp báo cáo hoàn thành.
   * Template: M20-ACCEPTANCE
   */
  async tryStartAcceptanceWorkflow(
    projectId: string,
    projectCode: string,
    projectTitle: string,
    actor: AuthUser,
  ): Promise<{ workflowInstanceId: string } | null> {
    try {
      const result = await workflowEngineService.startWorkflow(
        {
          templateCode: SCIENCE_WORKFLOW_TEMPLATES.PROJECT_ACCEPTANCE,
          entityType:   'NckhProject',
          entityId:     projectId,
          title:        `Nghiệm thu đề tài ${projectCode}`,
          summary:      projectTitle,
          priority:     1,
        },
        actor,
      )
      return { workflowInstanceId: result.workflowInstanceId }
    } catch (err) {
      if (err instanceof WorkflowError && err.code === 'TEMPLATE_NOT_PUBLISHED') {
        console.warn(
          `[ScienceWorkflowAdapter] M20-ACCEPTANCE template chưa PUBLISHED — bỏ qua M13 cho project ${projectId}.`,
        )
        return null
      }
      console.error(`[ScienceWorkflowAdapter] tryStartAcceptanceWorkflow failed for ${projectId}:`, err)
      return null
    }
  },
}

// ─── Internal helper ──────────────────────────────────────────────────────────

async function findActiveWorkflowInstance(entityType: string, entityId: string) {
  const { default: prisma } = await import('@/lib/db')
  return prisma.workflowInstance.findFirst({
    where: {
      entityType,
      entityId,
      status: { notIn: ['APPROVED', 'REJECTED', 'CANCELLED', 'RETURNED'] as any },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, currentStepCode: true },
  })
}
