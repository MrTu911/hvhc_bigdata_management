/**
 * M03 × M13 Integration Boundary
 *
 * Trạng thái hiện tại (Phase 1):
 *   M13 (Workflow Engine) chưa sẵn sàng. Workflow state của M03 được lưu tạm
 *   dưới dạng text-marker trong các text field (notes, recommendation, note).
 *   Ví dụ: "Xem xét hồ sơ [WF:UNDER_REVIEW]"
 *
 * Kế hoạch migration (Phase 2 — khi M13 sẵn sàng):
 *   1. Thêm field `workflowInstanceId String?` vào các model:
 *      PartyAdmissionHistory, PartyInspectionTarget, PartyTransfer
 *   2. Thay readWorkflowStatusFromText / writeWorkflowStatusToText bằng
 *      các hàm gọi M13 API: createWorkflowInstance, transitionWorkflow, getWorkflowStatus
 *   3. Backfill: tạo WorkflowInstance cho các record cũ, clear text-marker
 *
 * KHÔNG xóa các hàm text-marker cho đến khi Phase 2 hoàn tất và backfill xong.
 */

// ---------------------------------------------------------------------------
// M13 Integration Stub — đây là điểm nối M13 khi sẵn sàng
// ---------------------------------------------------------------------------

export interface PartyWorkflowInstance {
  instanceId: string;
  status: PartyWorkflowStatus;
  resourceType: 'ADMISSION' | 'INSPECTION' | 'TRANSFER';
  resourceId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * @stub Khi M13 sẵn sàng: gọi M13 để tạo workflow instance.
 * Hiện tại trả null — caller fallback sang text-marker.
 */
export async function createPartyWorkflowInstance(
  _resourceType: PartyWorkflowInstance['resourceType'],
  _resourceId: string,
  _actorId: string,
): Promise<PartyWorkflowInstance | null> {
  // TODO: replace with M13 API call when M13 is deployed
  return null;
}

/**
 * @stub Khi M13 sẵn sàng: gọi M13 để transition workflow.
 * Hiện tại trả null — caller fallback sang text-marker.
 */
export async function transitionPartyWorkflowInstance(
  _instanceId: string,
  _to: PartyWorkflowStatus,
  _actorId: string,
  _note?: string | null,
): Promise<PartyWorkflowInstance | null> {
  // TODO: replace with M13 API call when M13 is deployed
  return null;
}

// ---------------------------------------------------------------------------
// Text-marker fallback (Phase 1 — legacy pending M13)
// Các hàm bên dưới sẽ được deprecated và xóa sau khi M13 hoàn tất.
// ---------------------------------------------------------------------------

export type PartyWorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

/** @internal Phase-1 only — embed WF marker into a text field */
export const PARTY_WORKFLOW_MARKER_PREFIX = '[WF:';

/** @deprecated Sẽ thay bằng M13 getWorkflowStatus() khi Phase 2 hoàn tất */
export function readWorkflowStatusFromText(text?: string | null): PartyWorkflowStatus {
  if (!text) return 'DRAFT';
  const m = text.match(/\[WF:([A-Z_]+)\]/);
  const raw = m?.[1];
  if (!raw) return 'DRAFT';
  if (['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(raw)) {
    return raw as PartyWorkflowStatus;
  }
  return 'DRAFT';
}

/** @deprecated Sẽ thay bằng M13 transitionWorkflow() khi Phase 2 hoàn tất */
export function writeWorkflowStatusToText(
  text: string | null | undefined,
  status: PartyWorkflowStatus,
): string {
  const marker = `${PARTY_WORKFLOW_MARKER_PREFIX}${status}]`;
  if (!text || !text.trim()) return marker;
  const cleaned = text.replace(/\[WF:[A-Z_]+\]/g, '').trim();
  return cleaned ? `${cleaned} ${marker}` : marker;
}

/** @deprecated Sẽ thay bằng M13 transition validation khi Phase 2 hoàn tất */
export function canTransitionPartyWorkflow(
  from: PartyWorkflowStatus,
  to: PartyWorkflowStatus,
): boolean {
  const transitions: Record<PartyWorkflowStatus, PartyWorkflowStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'CANCELLED'],
    APPROVED: [],
    REJECTED: ['DRAFT', 'SUBMITTED'],
    CANCELLED: [],
  };
  return transitions[from]?.includes(to) ?? false;
}
