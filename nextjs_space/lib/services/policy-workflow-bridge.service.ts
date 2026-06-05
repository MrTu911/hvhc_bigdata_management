/**
 * Policy Workflow Bridge Service — M05 + M13
 *
 * Tạo WorkflowInstance cho PolicyRequest khi SUBMIT,
 * và đọc trạng thái từ WorkflowInstance về PolicyRequest.
 *
 * Chiến lược dual-track:
 * - PolicyWorkflowLog vẫn là audit trail cũ (không xóa).
 * - WorkflowInstance là luồng duyệt chính thức qua M13.
 * - Tra cứu WorkflowInstance bằng entityType='POLICY_REQUEST' + entityId=requestId
 *   (không cần thêm field vào PolicyRequest schema).
 *
 * Opt-in: chỉ kích hoạt nếu tồn tại WorkflowTemplate có code = 'POLICY_REQUEST'.
 */

import { prisma } from '@/lib/db';
import { PolicyRequestStatus, WorkflowInstanceStatus } from '@prisma/client';
import { WorkflowEngineService, StartWorkflowInput } from '@/lib/services/workflow/workflow-engine.service';
import { AuthUser } from '@/lib/rbac/types';

const POLICY_WORKFLOW_TEMPLATE_CODE = 'POLICY_REQUEST';

/** Tìm WorkflowTemplate có code POLICY_REQUEST đang active */
async function findPolicyWorkflowTemplate() {
  return prisma.workflowTemplate.findFirst({
    where: { code: POLICY_WORKFLOW_TEMPLATE_CODE, isActive: true },
    select: { id: true, code: true },
  });
}

/** Tìm WorkflowInstance đang active cho một PolicyRequest */
export async function findActiveWorkflowInstance(policyRequestId: string) {
  return prisma.workflowInstance.findFirst({
    where: {
      entityType: 'POLICY_REQUEST',
      entityId: policyRequestId,
      status: { notIn: [WorkflowInstanceStatus.CANCELLED] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, currentStepCode: true },
  });
}

/**
 * Tạo WorkflowInstance cho PolicyRequest khi submit.
 * Opt-in: nếu không tồn tại WorkflowTemplate POLICY_REQUEST → skip (return false).
 * Nếu đã có active workflow cho request này → skip để tránh duplicate.
 */
export async function submitToWorkflow(
  policyRequest: { id: string; title: string; requestNumber: string },
  initiator: Pick<AuthUser, 'id'>
): Promise<{ started: boolean; workflowInstanceId?: string }> {
  const template = await findPolicyWorkflowTemplate();
  if (!template) {
    // WorkflowTemplate chưa được cấu hình — bỏ qua, không lỗi
    return { started: false };
  }

  const existingInstance = await findActiveWorkflowInstance(policyRequest.id);
  if (existingInstance) {
    return { started: true, workflowInstanceId: existingInstance.id };
  }

  const input: StartWorkflowInput = {
    templateCode: POLICY_WORKFLOW_TEMPLATE_CODE,
    entityType: 'POLICY_REQUEST',
    entityId: policyRequest.id,
    title: `Yêu cầu chính sách: ${policyRequest.title}`,
    summary: `Số yêu cầu: ${policyRequest.requestNumber}`,
  };

  // WorkflowEngineService được export dưới dạng singleton instance.
  const instance = await WorkflowEngineService.startWorkflow(input, initiator as AuthUser);

  return { started: true, workflowInstanceId: instance.workflowInstanceId };
}

/**
 * Đọc trạng thái WorkflowInstance → map sang PolicyRequestStatus.
 * Dùng sau khi actOnWorkflow để sync status hiển thị.
 */
export async function syncWorkflowStatus(policyRequestId: string): Promise<PolicyRequestStatus | null> {
  const instance = await findActiveWorkflowInstance(policyRequestId);
  if (!instance) return null;

  const statusMap: Partial<Record<WorkflowInstanceStatus, PolicyRequestStatus>> = {
    [WorkflowInstanceStatus.DRAFT]:       PolicyRequestStatus.DRAFT,
    [WorkflowInstanceStatus.PENDING]:     PolicyRequestStatus.SUBMITTED,
    [WorkflowInstanceStatus.IN_PROGRESS]: PolicyRequestStatus.UNDER_REVIEW,
    [WorkflowInstanceStatus.APPROVED]:    PolicyRequestStatus.APPROVED,
    [WorkflowInstanceStatus.REJECTED]:    PolicyRequestStatus.REJECTED,
    [WorkflowInstanceStatus.CANCELLED]:   PolicyRequestStatus.CANCELLED,
    // WorkflowInstanceStatus không có COMPLETED — trạng thái duyệt xong là APPROVED.
  };

  const mapped = statusMap[instance.status];
  if (!mapped) return null;

  await prisma.policyRequest.update({
    where: { id: policyRequestId },
    data: { status: mapped },
  });

  return mapped;
}
