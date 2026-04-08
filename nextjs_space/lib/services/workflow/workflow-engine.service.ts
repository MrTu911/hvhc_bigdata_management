/**
 * M13 – Workflow Engine Service (Phase 1 + Phase 2 assignee resolution)
 *
 * State machine engine dùng chung cho toàn hệ thống.
 * Chịu trách nhiệm:
 *  - startWorkflow: tạo WorkflowInstance + WorkflowStepInstance đầu tiên
 *  - actOnWorkflow: kiểm tra quyền, validate transition, ghi action + bước mới trong transaction
 *
 * Nguyên tắc:
 *  - FAIL-CLOSED: thiếu quyền hoặc transition không hợp lệ → throw WorkflowError
 *  - Mọi write (action + step mới) phải trong cùng một transaction
 *  - Không sở hữu dữ liệu nghiệp vụ gốc; chỉ biết entityType + entityId
 */

import prisma from '@/lib/db';
import { authorize } from '@/lib/rbac/authorize';
import { WORKFLOW } from '@/lib/rbac/function-codes';
import { AuthUser } from '@/lib/rbac/types';
import { ApproverPolicyResolver } from './approver-policy-resolver';
import {
  WorkflowActionCode,
  WorkflowInstanceStatus,
  WorkflowStepStatus,
  WorkflowVersionStatus,
} from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StartWorkflowInput {
  /** Code của WorkflowTemplate đã published */
  templateCode: string;
  /** Tên Prisma model chủ quản, ví dụ "PolicyRecord" */
  entityType: string;
  /** ID của entity chủ quản */
  entityId: string;
  /** Tiêu đề hiển thị trong dashboard/notification */
  title: string;
  /** Tóm tắt ngắn (optional) */
  summary?: string;
  /** Mức ưu tiên 0-3 (0 = bình thường) */
  priority?: number;
}

export interface ActOnWorkflowInput {
  workflowInstanceId: string;
  actionCode: WorkflowActionCode;
  /** Comment bắt buộc với REJECT, RETURN theo policy (service tự enforce) */
  comment?: string;
  /** Payload bổ sung (file đính kèm, form data...) */
  payloadJson?: Record<string, unknown>;
}

export interface WorkflowActionResult {
  workflowInstanceId: string;
  previousStatus: WorkflowInstanceStatus;
  newStatus: WorkflowInstanceStatus;
  currentStepCode: string | null;
  actionId: string;
}

// ---------------------------------------------------------------------------
// Custom error – giúp route layer phân biệt loại lỗi khi trả response
// ---------------------------------------------------------------------------

export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'INVALID_TRANSITION'
      | 'INVALID_STATE'
      | 'TEMPLATE_NOT_PUBLISHED'
      | 'COMMENT_REQUIRED'
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

// ---------------------------------------------------------------------------
// Helper: map action → trạng thái instance mới
// ---------------------------------------------------------------------------

const ACTION_TO_INSTANCE_STATUS: Partial<Record<WorkflowActionCode, WorkflowInstanceStatus>> = {
  APPROVE: WorkflowInstanceStatus.APPROVED,
  REJECT: WorkflowInstanceStatus.REJECTED,
  RETURN: WorkflowInstanceStatus.RETURNED,
  CANCEL: WorkflowInstanceStatus.CANCELLED,
};

const ACTION_TO_STEP_STATUS: Partial<Record<WorkflowActionCode, WorkflowStepStatus>> = {
  SUBMIT: WorkflowStepStatus.APPROVED,
  APPROVE: WorkflowStepStatus.APPROVED,
  REJECT: WorkflowStepStatus.REJECTED,
  RETURN: WorkflowStepStatus.RETURNED,
  CANCEL: WorkflowStepStatus.CANCELLED,
  COMMENT: WorkflowStepStatus.IN_PROGRESS,   // comment không thay đổi step
  SIGN: WorkflowStepStatus.IN_PROGRESS,       // sign không tự kết thúc step
  REASSIGN: WorkflowStepStatus.READY,
  ESCALATE: WorkflowStepStatus.IN_PROGRESS,
  SYSTEM_TIMEOUT: WorkflowStepStatus.EXPIRED,
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WorkflowEngineServiceClass {

  /**
   * Khởi tạo một workflow instance mới cho một entity.
   *
   * Quy trình:
   * 1. Check quyền WF.INITIATE
   * 2. Resolve template version đang PUBLISHED
   * 3. Lấy START step từ template
   * 4. Tạo WorkflowInstance + WorkflowStepInstance trong transaction
   * 5. Ghi WorkflowAuditLog
   */
  async startWorkflow(
    input: StartWorkflowInput,
    actor: AuthUser
  ): Promise<{ workflowInstanceId: string; currentStepCode: string }> {
    // 1. FAIL-CLOSED permission check
    const authResult = await authorize(actor, WORKFLOW.INITIATE);
    if (!authResult.allowed) {
      throw new WorkflowError(
        authResult.deniedReason ?? 'Không có quyền khởi tạo quy trình',
        'FORBIDDEN'
      );
    }

    // 2. Resolve template + published version
    const template = await prisma.workflowTemplate.findUnique({
      where: { code: input.templateCode, isActive: true },
    });
    if (!template) {
      throw new WorkflowError(
        `Không tìm thấy workflow template: ${input.templateCode}`,
        'NOT_FOUND'
      );
    }

    const publishedVersion = await prisma.workflowTemplateVersion.findFirst({
      where: { templateId: template.id, status: WorkflowVersionStatus.PUBLISHED },
    });
    if (!publishedVersion) {
      throw new WorkflowError(
        `Template "${input.templateCode}" chưa có version PUBLISHED`,
        'TEMPLATE_NOT_PUBLISHED'
      );
    }

    // 3. Lấy START step
    const startStep = await prisma.workflowStepTemplate.findFirst({
      where: { templateVersionId: publishedVersion.id, stepType: 'START' },
    });
    if (!startStep) {
      throw new WorkflowError(
        `Template version ${publishedVersion.id} thiếu START step`,
        'INVALID_STATE'
      );
    }

    // 4. Resolve bước tiếp theo sau START (bước đầu tiên thực sự xử lý)
    const firstTransition = await prisma.workflowTransitionTemplate.findFirst({
      where: {
        templateVersionId: publishedVersion.id,
        fromStepCode: startStep.code,
        actionCode: WorkflowActionCode.SUBMIT,
      },
      orderBy: { priority: 'asc' },
    });

    const firstRealStepCode = firstTransition?.toStepCode ?? startStep.code;

    // 4b. Resolve assignee cho bước đầu tiên (Phase 2: ApproverPolicyResolver)
    const initiatorUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: { unitId: true },
    });
    const firstAssignees = await ApproverPolicyResolver.resolve({
      initiatorId: actor.id,
      initiatorUnitId: initiatorUser?.unitId ?? null,
      templateVersionId: publishedVersion.id,
      stepCode: firstRealStepCode,
    });

    // 5. Tạo instance + step đầu trong transaction
    const result = await prisma.$transaction(async (tx) => {
      const instance = await tx.workflowInstance.create({
        data: {
          templateId: template.id,
          templateVersionId: publishedVersion.id,
          entityType: input.entityType,
          entityId: input.entityId,
          title: input.title,
          summary: input.summary,
          priority: input.priority ?? 0,
          status: WorkflowInstanceStatus.PENDING,
          currentStepCode: firstRealStepCode,
          initiatorId: actor.id,
          currentAssigneeId: firstAssignees.primary,
          startedAt: new Date(),
        },
      });

      const stepInstance = await tx.workflowStepInstance.create({
        data: {
          workflowInstanceId: instance.id,
          stepCode: firstRealStepCode,
          status: WorkflowStepStatus.READY,
          assigneeId: firstAssignees.primary,
          assignedAt: new Date(),
          startedAt: new Date(),
        },
      });

      // Ghi action SUBMIT (người khởi tạo nộp hồ sơ)
      await tx.workflowAction.create({
        data: {
          workflowInstanceId: instance.id,
          stepInstanceId: stepInstance.id,
          actionCode: WorkflowActionCode.SUBMIT,
          actionBy: actor.id,
          comment: input.summary,
        },
      });

      await tx.workflowAuditLog.create({
        data: {
          workflowInstanceId: instance.id,
          action: 'START_WORKFLOW',
          performedBy: actor.id,
          fromStatus: null,
          toStatus: WorkflowInstanceStatus.PENDING,
          comment: `Khởi tạo quy trình: ${input.title}`,
        },
      });

      return { workflowInstanceId: instance.id, currentStepCode: firstRealStepCode };
    });

    return result;
  }

  /**
   * Thực hiện một action tại bước hiện tại của workflow.
   *
   * Quy trình:
   * 1. Load instance + current step instance
   * 2. Check quyền WF.ACT (hoặc WF.SIGN với action SIGN)
   * 3. Check assignee: chỉ người được giao mới act được
   * 4. Validate transition: action phải có trong transition table
   * 5. Enforce comment bắt buộc với REJECT/RETURN
   * 6. Trong transaction:
   *    a. Ghi WorkflowAction
   *    b. Update WorkflowStepInstance hiện tại → completed
   *    c. Xác định bước tiếp theo theo transition
   *    d. Tạo WorkflowStepInstance mới (nếu chưa kết thúc)
   *    e. Update WorkflowInstance.status + currentStepCode
   *    f. Ghi WorkflowAuditLog
   */
  async actOnWorkflow(
    input: ActOnWorkflowInput,
    actor: AuthUser
  ): Promise<WorkflowActionResult> {
    // 1. Load instance
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: input.workflowInstanceId },
    });
    if (!instance) {
      throw new WorkflowError(
        `Workflow instance không tồn tại: ${input.workflowInstanceId}`,
        'NOT_FOUND'
      );
    }

    // Không cho act trên workflow đã kết thúc
    const terminalStatuses: WorkflowInstanceStatus[] = [
      WorkflowInstanceStatus.APPROVED,
      WorkflowInstanceStatus.REJECTED,
      WorkflowInstanceStatus.CANCELLED,
      WorkflowInstanceStatus.EXPIRED,
      WorkflowInstanceStatus.FAILED,
    ];
    if (terminalStatuses.includes(instance.status)) {
      throw new WorkflowError(
        `Workflow đã ở trạng thái kết thúc: ${instance.status}`,
        'INVALID_STATE'
      );
    }

    // 2. Check quyền
    const requiredCode = input.actionCode === WorkflowActionCode.SIGN
      ? WORKFLOW.SIGN
      : WORKFLOW.ACT;
    const authResult = await authorize(actor, requiredCode, {
      resourceId: instance.id,
    });
    if (!authResult.allowed) {
      throw new WorkflowError(
        authResult.deniedReason ?? 'Không có quyền thực hiện hành động này',
        'FORBIDDEN'
      );
    }

    // 3. Load current step instance
    const currentStep = await prisma.workflowStepInstance.findFirst({
      where: {
        workflowInstanceId: instance.id,
        stepCode: instance.currentStepCode ?? '',
        status: {
          in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS],
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
    if (!currentStep) {
      throw new WorkflowError(
        'Không tìm thấy bước hiện tại đang xử lý',
        'INVALID_STATE'
      );
    }

    // Chỉ assignee mới được act (trừ CANCEL với initiator, và unassigned step với WF.OVERRIDE)
    const isAssignee = currentStep.assigneeId === actor.id;
    const isInitiator = instance.initiatorId === actor.id;
    const isCancelByInitiator = input.actionCode === WorkflowActionCode.CANCEL && isInitiator;

    if (currentStep.assigneeId === null) {
      // Unassigned step: chỉ người có WF.OVERRIDE mới được act
      const overrideResult = await authorize(actor, WORKFLOW.OVERRIDE);
      if (!overrideResult.allowed) {
        console.warn(
          `[M13] Workflow step ${currentStep.id} không có assignee — actor ${actor.id} cần WF.OVERRIDE để act`
        );
        throw new WorkflowError(
          'Bước này chưa được giao cho ai. Cần quyền WF.OVERRIDE để tiếp tục.',
          'FORBIDDEN'
        );
      }
    } else if (!isAssignee && !isCancelByInitiator) {
      throw new WorkflowError(
        'Chỉ người được giao xử lý mới có thể thực hiện hành động này',
        'FORBIDDEN'
      );
    }

    // 4. Validate transition
    const transition = await this.resolveTransition(
      instance.templateVersionId,
      currentStep.stepCode,
      input.actionCode
    );

    // 5. Enforce comment bắt buộc
    if (
      (input.actionCode === WorkflowActionCode.REJECT ||
        input.actionCode === WorkflowActionCode.RETURN) &&
      !input.comment?.trim()
    ) {
      throw new WorkflowError(
        'Vui lòng nhập lý do khi từ chối hoặc trả lại hồ sơ',
        'COMMENT_REQUIRED'
      );
    }

    // 6. Xác định trạng thái mới của instance
    const previousStatus = instance.status;
    const toStepCode = transition?.toStepCode ?? null;

    // Kiểm tra toStepCode là END step không
    const isEndStep = toStepCode
      ? await this.isEndStep(instance.templateVersionId, toStepCode)
      : false;

    const newInstanceStatus = this.resolveInstanceStatus(
      input.actionCode,
      isEndStep,
      instance.status
    );

    // 6b. Resolve assignee cho bước tiếp theo TRƯỚC transaction để tránh lock timeout
    let nextAssigneeId: string | null = null;
    if (toStepCode && !isEndStep && newInstanceStatus === WorkflowInstanceStatus.IN_PROGRESS) {
      const initiatorUser = await prisma.user.findUnique({
        where: { id: instance.initiatorId },
        select: { unitId: true },
      });
      const nextAssignees = await ApproverPolicyResolver.resolve({
        initiatorId: instance.initiatorId,
        initiatorUnitId: initiatorUser?.unitId ?? null,
        templateVersionId: instance.templateVersionId,
        stepCode: toStepCode,
      });
      nextAssigneeId = nextAssignees.primary;
    }

    // 7. Transaction: ghi tất cả trong cùng một lần
    const actionResult = await prisma.$transaction(async (tx) => {
      // a. Ghi WorkflowAction
      const action = await tx.workflowAction.create({
        data: {
          workflowInstanceId: instance.id,
          stepInstanceId: currentStep.id,
          actionCode: input.actionCode,
          actionBy: actor.id,
          comment: input.comment,
          payloadJson: input.payloadJson ?? undefined,
        },
      });

      // b. Update step hiện tại → completed
      const newStepStatus = ACTION_TO_STEP_STATUS[input.actionCode] ?? WorkflowStepStatus.APPROVED;
      await tx.workflowStepInstance.update({
        where: { id: currentStep.id },
        data: {
          status: newStepStatus,
          actedAt: new Date(),
          completedAt: new Date(),
        },
      });

      // c. Tạo step mới nếu có bước tiếp theo và chưa kết thúc
      let nextStepCode: string | null = null;
      if (toStepCode && !isEndStep && newInstanceStatus === WorkflowInstanceStatus.IN_PROGRESS) {
        await tx.workflowStepInstance.create({
          data: {
            workflowInstanceId: instance.id,
            stepCode: toStepCode,
            status: WorkflowStepStatus.READY,
            assigneeId: nextAssigneeId,
            assignedAt: new Date(),
          },
        });
        nextStepCode = toStepCode;
      }

      // d. Update WorkflowInstance
      const now = new Date();
      await tx.workflowInstance.update({
        where: { id: instance.id },
        data: {
          status: newInstanceStatus,
          currentStepCode: nextStepCode ?? (isEndStep ? toStepCode : instance.currentStepCode),
          currentAssigneeId: nextAssigneeId,
          completedAt: terminalStatuses.includes(newInstanceStatus) ? now : undefined,
          cancelledAt: newInstanceStatus === WorkflowInstanceStatus.CANCELLED ? now : undefined,
        },
      });

      // e. Ghi audit log
      await tx.workflowAuditLog.create({
        data: {
          workflowInstanceId: instance.id,
          action: input.actionCode,
          performedBy: actor.id,
          fromStatus: previousStatus,
          toStatus: newInstanceStatus,
          comment: input.comment,
          payloadJson: input.payloadJson ?? undefined,
        },
      });

      return {
        workflowInstanceId: instance.id,
        previousStatus,
        newStatus: newInstanceStatus,
        currentStepCode: nextStepCode ?? toStepCode,
        actionId: action.id,
      };
    });

    return actionResult;
  }

  /**
   * Lấy lịch sử actions của một workflow instance.
   * Dùng cho route GET /api/workflows/:id/history
   */
  async getHistory(workflowInstanceId: string, actor: AuthUser) {
    const authResult = await authorize(actor, WORKFLOW.VIEW_DETAIL, {
      resourceId: workflowInstanceId,
    });
    if (!authResult.allowed) {
      throw new WorkflowError(
        authResult.deniedReason ?? 'Không có quyền xem lịch sử',
        'FORBIDDEN'
      );
    }

    return prisma.workflowAction.findMany({
      where: { workflowInstanceId },
      orderBy: { actionAt: 'asc' },
    });
  }

  /**
   * Danh sách workflow instances đang chờ actor xử lý.
   * Dùng cho route GET /api/workflows/me/tasks
   */
  async listMyTasks(
    actor: AuthUser,
    options: { page?: number; pageSize?: number } = {}
  ) {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20));

    const steps = await prisma.workflowStepInstance.findMany({
      where: {
        assigneeId: actor.id,
        status: { in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS] },
      },
      select: { workflowInstanceId: true },
    });

    const instanceIds = Array.from(new Set(steps.map((s) => s.workflowInstanceId)));
    if (instanceIds.length === 0) return { data: [], total: 0, page, pageSize };

    const where = {
      id: { in: instanceIds },
      status: { in: [WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS] },
    };

    const [data, total] = await Promise.all([
      prisma.workflowInstance.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.workflowInstance.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Validate transition: action phải có trong WorkflowTransitionTemplate.
   * FAIL-CLOSED: nếu không tìm thấy → throw INVALID_TRANSITION
   */
  private async resolveTransition(
    templateVersionId: string,
    fromStepCode: string,
    actionCode: WorkflowActionCode
  ) {
    // CANCEL và COMMENT không nhất thiết cần transition (được phép ở mọi bước)
    const freeActions: WorkflowActionCode[] = [
      WorkflowActionCode.CANCEL,
      WorkflowActionCode.COMMENT,
      WorkflowActionCode.ESCALATE,
    ];
    if (freeActions.includes(actionCode)) {
      return null;
    }

    const transition = await prisma.workflowTransitionTemplate.findFirst({
      where: { templateVersionId, fromStepCode, actionCode },
      orderBy: { priority: 'asc' },
    });

    if (!transition) {
      throw new WorkflowError(
        `Action "${actionCode}" không hợp lệ tại bước "${fromStepCode}"`,
        'INVALID_TRANSITION'
      );
    }

    return transition;
  }

  /** Kiểm tra stepCode có phải là END step trong version không */
  private async isEndStep(templateVersionId: string, stepCode: string): Promise<boolean> {
    const step = await prisma.workflowStepTemplate.findFirst({
      where: { templateVersionId, code: stepCode, stepType: 'END' },
      select: { id: true },
    });
    return step !== null;
  }

  /**
   * Xác định trạng thái mới của WorkflowInstance sau action.
   * Nếu action không phải terminal và bước tiếp theo không phải END
   * thì giữ IN_PROGRESS.
   */
  private resolveInstanceStatus(
    actionCode: WorkflowActionCode,
    isEndStep: boolean,
    currentStatus: WorkflowInstanceStatus
  ): WorkflowInstanceStatus {
    const terminalAction = ACTION_TO_INSTANCE_STATUS[actionCode];
    if (terminalAction) {
      // APPROVE: kết thúc chỉ khi bước tiếp là END
      if (actionCode === WorkflowActionCode.APPROVE && !isEndStep) {
        return WorkflowInstanceStatus.IN_PROGRESS;
      }
      // RETURN: trả lại bước trước → workflow tiếp tục IN_PROGRESS (không terminal)
      if (actionCode === WorkflowActionCode.RETURN) {
        return WorkflowInstanceStatus.IN_PROGRESS;
      }
      return terminalAction;
    }

    // COMMENT, SIGN, REASSIGN, ESCALATE không đổi trạng thái tổng
    return currentStatus === WorkflowInstanceStatus.PENDING
      ? WorkflowInstanceStatus.IN_PROGRESS
      : currentStatus;
  }
}

export const WorkflowEngineService = new WorkflowEngineServiceClass();
