/**
 * ProfileChangeRequestService — Duyệt cập nhật hồ sơ cán bộ theo phân cấp (2 cấp).
 *
 * Vòng đời:
 *   DRAFT → (submit) → SUBMITTED → (tier-1: chỉ huy đơn vị APPROVE) → UNIT_APPROVED
 *         → (tier-2: ban cán bộ/quân lực APPROVE) → APPROVED (commit vào CSDL + lock)
 *   REJECT/RETURN ở mỗi cấp; RETURNED cho phép cán bộ sửa & gửi lại.
 *
 * Định tuyến:
 *   - tier-1 reviewer = Unit.commanderId của đơn vị cán bộ (auto-skip nếu trống
 *     hoặc người đề nghị chính là chỉ huy).
 *   - tier-2 định tuyến theo Personnel.managingOrgan (BAN_CAN_BO/BAN_QUAN_LUC).
 *
 * Commit: áp từng item vào CSDL trong MỘT transaction (mẫu RankDeclaration),
 * tái dùng coerce/buildPayload + metadata cadre-profile-sections. Audit mọi bước.
 */
import 'server-only';
import db from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { coerce, buildPayload } from './cadre-profile-section.service';
import { projectUserPatchToPersonnel } from './personnel-projection.service';
import {
  EXTENDED_FIELD_GROUPS,
  YOUTH_MEMBERSHIP_FIELD_MAP,
  getCadreSection,
  type CadreField,
} from '@/lib/constants/cadre-profile-sections';
import {
  findExtendedField,
  isExtendedFieldSensitive,
  isSectionPayloadSensitive,
} from '@/lib/constants/profile-change';
import {
  createProfileChangeRequest,
  findProfileChangeRequestById,
  updateProfileChangeRequest,
  replaceProfileChangeItems,
  listProfileChangeRequests,
  countProfileChangeByStatus,
  type ProfileChangeItemData,
  type ProfileChangeListFilter,
  type ProfileChangeRequestWithRelations,
} from '@/lib/repositories/personnel/profile-change-request.repo';
import type { ProfileChangeItemInput } from '@/lib/validators/profile-change.schema';
import type { AuthUser } from '@/lib/rbac/types';
import { Prisma, type FunctionScope } from '@prisma/client';

// ─── Workflow template codes (khớp khi seed M13) ─────────────────────────────
const WF_TEMPLATE_CAN_BO = 'PROFILE_CHANGE_CAN_BO';
const WF_TEMPLATE_QUAN_LUC = 'PROFILE_CHANGE_QUAN_LUC';

const YOUTH_KEYS = Object.keys(YOUTH_MEMBERSHIP_FIELD_MAP);
const EXTENDED_FIELDS: CadreField[] = EXTENDED_FIELD_GROUPS.flatMap((g) => g.fields);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateRequestInput {
  ownerUserId: string; // chủ hồ sơ (người được cập nhật)
  title?: string | null;
  reason?: string | null;
  items: ProfileChangeItemInput[];
  submit?: boolean;
}

export interface ActOnRequestInput {
  requestId: string;
  tier: 1 | 2;
  action: 'APPROVE' | 'REJECT' | 'RETURN';
  note?: string | null;
  actor: AuthUser;
  scope: FunctionScope;
}

class ProfileChangeError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Validate target + tính isSensitive cho từng mục thay đổi trước khi lưu. */
function mapItemsForStore(items: ProfileChangeItemInput[]): ProfileChangeItemData[] {
  return items.map((it) => {
    if (it.itemType === 'EXTENDED_FIELD') {
      if (!findExtendedField(it.fieldName!)) {
        throw new ProfileChangeError(`Trường không hợp lệ: ${it.fieldName}`, 400);
      }
      return {
        itemType: 'EXTENDED_FIELD',
        fieldName: it.fieldName,
        currentValue: it.currentValue ?? null,
        requestedValue: it.requestedValue as Prisma.InputJsonValue,
        isSensitive: isExtendedFieldSensitive(it.fieldName!),
      };
    }
    const section = getCadreSection(it.sectionSlug!);
    if (!section) throw new ProfileChangeError(`Nhóm danh sách không hợp lệ: ${it.sectionSlug}`, 400);
    const payload = (it.requestedValue ?? {}) as Record<string, unknown>;
    return {
      itemType: it.itemType,
      sectionSlug: it.sectionSlug,
      targetRecordId: it.targetRecordId ?? null,
      currentValue: it.currentValue ?? null,
      requestedValue: it.requestedValue as Prisma.InputJsonValue,
      isSensitive: it.itemType === 'SECTION_DELETE' ? false : isSectionPayloadSensitive(it.sectionSlug!, payload),
    };
  });
}

async function resolveOwner(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, unitId: true, personnelId: true },
  });
  if (!user) throw new ProfileChangeError('Không tìm thấy tài khoản cán bộ', 404);
  return user;
}

/**
 * Chống IDOR: SECTION_UPDATE/DELETE chỉ được nhắm tới bản ghi thuộc CHÍNH chủ hồ
 * sơ. Kiểm tại lúc tạo/sửa nháp (trước khi commit ghi thẳng theo targetRecordId).
 */
async function assertSectionTargetsOwned(items: ProfileChangeItemInput[], ownerUserId: string) {
  for (const it of items) {
    if (it.itemType !== 'SECTION_UPDATE' && it.itemType !== 'SECTION_DELETE') continue;
    const section = getCadreSection(it.sectionSlug!);
    if (!section) throw new ProfileChangeError(`Nhóm danh sách không hợp lệ: ${it.sectionSlug}`, 400);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await (db as any)[section.model].findUnique({
      where: { id: it.targetRecordId },
      select: { userId: true, deletedAt: true },
    });
    if (!record || record.deletedAt || record.userId !== ownerUserId) {
      throw new ProfileChangeError('Bản ghi không tồn tại hoặc không thuộc về chủ hồ sơ', 403);
    }
  }
}

/** Người duyệt có quyền truy cập đề nghị này không (ngoài function-code đã gate ở route). */
async function reviewerCanAccess(actor: AuthUser, scope: FunctionScope, unitId: string | null): Promise<boolean> {
  if (scope === 'ACADEMY') return true;
  if (!unitId) return false;
  const unitIds = await getAccessibleUnitIds(actor, scope);
  return unitIds.includes(unitId);
}

/** Khởi tạo M13 workflow (optional, graceful — không chặn nghiệp vụ nếu thiếu). */
async function startWorkflowSafe(
  managingOrgan: string | null,
  request: NonNullable<ProfileChangeRequestWithRelations>,
  actorId: string,
): Promise<string | null> {
  try {
    const code = managingOrgan === 'BAN_QUAN_LUC' ? WF_TEMPLATE_QUAN_LUC : WF_TEMPLATE_CAN_BO;
    const template = await db.workflowTemplate.findFirst({ where: { code, isActive: true } });
    const version = template
      ? await db.workflowTemplateVersion.findFirst({ where: { templateId: template.id, status: 'PUBLISHED' } })
      : null;
    if (!template || !version) return null;
    const instance = await db.workflowInstance.create({
      data: {
        templateId: template.id,
        templateVersionId: version.id,
        entityType: 'ProfileChangeRequest',
        entityId: request.id,
        status: 'PENDING',
        initiatorId: actorId,
        title: `Duyệt cập nhật hồ sơ – ${request.user.name ?? request.userId}`,
      },
    });
    return instance.id;
  } catch {
    return null; // workflow engine optional
  }
}

async function notifyInitiatorSafe(
  request: NonNullable<ProfileChangeRequestWithRelations>,
  eventType: 'APPROVED' | 'REJECTED' | 'RETURNED',
  note?: string | null,
) {
  if (!request.workflowInstanceId) return;
  try {
    const { WorkflowNotificationService } = await import('@/lib/services/workflow/workflow-notification.service');
    await WorkflowNotificationService.notifyInitiator({
      workflowInstanceId: request.workflowInstanceId,
      instanceTitle: request.title ?? 'Đề nghị cập nhật hồ sơ',
      initiatorId: request.userId,
      eventType,
      comment: note ?? undefined,
    });
  } catch {
    /* best-effort */
  }
}

async function notifyReviewerSafe(
  request: NonNullable<ProfileChangeRequestWithRelations>,
  assigneeId: string,
  stepName: string,
) {
  if (!request.workflowInstanceId) return;
  try {
    const { WorkflowNotificationService } = await import('@/lib/services/workflow/workflow-notification.service');
    await WorkflowNotificationService.notifyNewTask({
      workflowInstanceId: request.workflowInstanceId,
      instanceTitle: request.title ?? 'Đề nghị cập nhật hồ sơ',
      assigneeId,
      stepName,
    });
  } catch {
    /* best-effort */
  }
}

// ─── Create / Update draft ───────────────────────────────────────────────────

export async function createRequest(input: CreateRequestInput, actorId: string) {
  const owner = await resolveOwner(input.ownerUserId);
  await assertSectionTargetsOwned(input.items, owner.id);
  const items = mapItemsForStore(input.items);

  const created = await createProfileChangeRequest({
    userId: owner.id,
    personnelId: owner.personnelId,
    title: input.title ?? null,
    reason: input.reason ?? null,
    createdBy: actorId,
    items,
  });

  await logAudit({
    userId: actorId,
    functionCode: PROFILE_CHANGE.CREATE,
    action: 'CREATE',
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: created.id,
    newValue: JSON.stringify({ ownerUserId: owner.id, itemCount: items.length }),
    result: 'SUCCESS',
  });

  if (input.submit) return submitRequest(created.id, actorId);
  return created;
}

export async function updateDraft(
  requestId: string,
  input: { title?: string | null; reason?: string | null; items?: ProfileChangeItemInput[] },
  actorId: string,
) {
  const request = await findProfileChangeRequestById(requestId);
  if (!request) throw new ProfileChangeError('Không tìm thấy đề nghị', 404);
  if (request.userId !== actorId) throw new ProfileChangeError('Chỉ người đề nghị mới được sửa nháp', 403);
  if (request.status !== 'DRAFT' && request.status !== 'RETURNED') {
    throw new ProfileChangeError('Chỉ sửa được đề nghị ở trạng thái nháp/trả lại', 409);
  }

  if (input.items) {
    await assertSectionTargetsOwned(input.items, request.userId);
    await replaceProfileChangeItems(requestId, mapItemsForStore(input.items));
  }
  const updated = await updateProfileChangeRequest(requestId, {
    title: input.title ?? request.title,
    reason: input.reason ?? request.reason,
    updatedBy: actorId,
  });

  await logAudit({
    userId: actorId,
    functionCode: PROFILE_CHANGE.CREATE,
    action: 'UPDATE',
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: requestId,
    result: 'SUCCESS',
  });
  return updated;
}

export async function cancelRequest(requestId: string, actorId: string) {
  const request = await findProfileChangeRequestById(requestId);
  if (!request) throw new ProfileChangeError('Không tìm thấy đề nghị', 404);
  if (request.userId !== actorId) throw new ProfileChangeError('Chỉ người đề nghị mới được hủy', 403);
  if (!['DRAFT', 'SUBMITTED', 'RETURNED'].includes(request.status)) {
    throw new ProfileChangeError('Không thể hủy đề nghị đã được duyệt/kết thúc', 409);
  }
  const updated = await updateProfileChangeRequest(requestId, { status: 'CANCELLED', updatedBy: actorId });
  await logAudit({
    userId: actorId,
    functionCode: PROFILE_CHANGE.CREATE,
    action: 'CANCEL',
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: requestId,
    result: 'SUCCESS',
  });
  return updated;
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export async function submitRequest(requestId: string, actorId: string) {
  const request = await findProfileChangeRequestById(requestId);
  if (!request) throw new ProfileChangeError('Không tìm thấy đề nghị', 404);
  if (request.status !== 'DRAFT' && request.status !== 'RETURNED') {
    throw new ProfileChangeError('Chỉ gửi duyệt được từ trạng thái nháp/trả lại', 409);
  }
  if (request.items.length === 0) throw new ProfileChangeError('Đề nghị chưa có mục thay đổi nào', 400);

  // Định tuyến tier-2 theo cơ quan quản lý của cán bộ.
  const managingOrgan = request.personnelId
    ? (await db.personnel.findUnique({ where: { id: request.personnelId }, select: { managingOrgan: true } }))?.managingOrgan ?? null
    : null;
  if (!managingOrgan) {
    throw new ProfileChangeError('Cán bộ chưa được gán cơ quan quản lý (Ban cán bộ/Quân lực) — không thể gửi duyệt', 409);
  }

  const unitId = request.user.unitId;
  const commanderId = request.user.unitRelation?.commanderId ?? null;
  // Auto-skip tier-1 khi không có chỉ huy hoặc người đề nghị chính là chỉ huy.
  const autoSkipTier1 = !commanderId || commanderId === request.userId;

  const workflowInstanceId = await startWorkflowSafe(managingOrgan, request, actorId);
  const now = new Date();

  const updated = await updateProfileChangeRequest(requestId, {
    status: autoSkipTier1 ? 'UNIT_APPROVED' : 'SUBMITTED',
    submittedAt: now,
    unitId,
    managingOrgan,
    workflowInstanceId,
    tier1ReviewerId: commanderId,
    tier1ReviewedAt: autoSkipTier1 ? now : null,
    tier1Note: autoSkipTier1
      ? `auto-skip: ${commanderId ? 'người đề nghị là chỉ huy đơn vị' : 'đơn vị chưa gán chỉ huy'}`
      : null,
    updatedBy: actorId,
  });

  if (!autoSkipTier1 && commanderId) {
    await notifyReviewerSafe(updated!, commanderId, 'Duyệt cấp 1 (Chỉ huy đơn vị)');
  }

  await logAudit({
    userId: actorId,
    functionCode: PROFILE_CHANGE.CREATE,
    action: 'SUBMIT',
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: requestId,
    newValue: JSON.stringify({ autoSkipTier1, managingOrgan, workflowInstanceId }),
    result: 'SUCCESS',
  });
  return updated;
}

// ─── Act (tier-1 / tier-2) ─────────────────────────────────────────────────────

export async function actOnRequest(input: ActOnRequestInput) {
  const { requestId, tier, action, note, actor, scope } = input;
  const request = await findProfileChangeRequestById(requestId);
  if (!request) throw new ProfileChangeError('Không tìm thấy đề nghị', 404);

  const expectedStatus = tier === 1 ? 'SUBMITTED' : 'UNIT_APPROVED';
  if (request.status !== expectedStatus) {
    throw new ProfileChangeError(`Đề nghị không ở trạng thái chờ duyệt cấp ${tier}`, 409);
  }
  if (!(await reviewerCanAccess(actor, scope, request.unitId))) {
    throw new ProfileChangeError('Không có quyền duyệt đề nghị ngoài phạm vi', 403);
  }

  if (action === 'APPROVE' && tier === 2) {
    return commitRequest(request, actor, note ?? null);
  }

  const now = new Date();
  let nextStatus: 'UNIT_APPROVED' | 'REJECTED' | 'RETURNED';
  if (action === 'APPROVE') nextStatus = 'UNIT_APPROVED';
  else if (action === 'REJECT') nextStatus = 'REJECTED';
  else nextStatus = 'RETURNED';

  const tierPatch =
    tier === 1
      ? { tier1ReviewerId: actor.id, tier1ReviewedAt: now, tier1Note: note ?? null }
      : { tier2ReviewerId: actor.id, tier2ReviewedAt: now, tier2Note: note ?? null };

  const updated = await updateProfileChangeRequest(requestId, {
    status: nextStatus,
    ...tierPatch,
    updatedBy: actor.id,
  });

  // Thông báo best-effort.
  if (nextStatus === 'UNIT_APPROVED') {
    // chuyển sang tier-2: chưa có assignee cụ thể (định tuyến theo cơ quan) → bỏ qua notify.
  } else {
    await notifyInitiatorSafe(updated!, nextStatus as 'REJECTED' | 'RETURNED', note);
  }

  await logAudit({
    userId: actor.id,
    functionCode: tier === 1 ? PROFILE_CHANGE.APPROVE_UNIT : PROFILE_CHANGE.APPROVE_ORGAN,
    action: `TIER${tier}_${action}`,
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: requestId,
    newValue: note ? JSON.stringify({ note }) : undefined,
    result: 'SUCCESS',
  });
  return updated;
}

// ─── Commit (tier-2 APPROVE) — áp items vào CSDL trong MỘT transaction ──────────

async function ensureMembershipId(
  tx: Prisma.TransactionClient,
  userId: string,
  personnelId: string | null,
): Promise<string> {
  const existing = await tx.youthUnionMembership.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const created = await tx.youthUnionMembership.create({
    data: { userId, personnelId: personnelId ?? undefined },
    select: { id: true },
  });
  return created.id;
}

async function commitRequest(
  request: NonNullable<ProfileChangeRequestWithRelations>,
  actor: AuthUser,
  note: string | null,
) {
  const owner = await resolveOwner(request.userId);

  await db.$transaction(async (tx) => {
    const extendedPatch: Record<string, unknown> = {};
    const youthPatch: Record<string, unknown> = {};

    for (const item of request.items) {
      if (item.itemType === 'EXTENDED_FIELD') {
        const field = findExtendedField(item.fieldName!);
        if (!field) throw new ProfileChangeError(`Trường không hợp lệ: ${item.fieldName}`, 400);
        const value = coerce(field, item.requestedValue);
        if (YOUTH_KEYS.includes(field.name)) {
          const modelKey = YOUTH_MEMBERSHIP_FIELD_MAP[field.name as keyof typeof YOUTH_MEMBERSHIP_FIELD_MAP];
          youthPatch[modelKey] = value;
        } else {
          extendedPatch[field.name] = value;
        }
        continue;
      }

      const section = getCadreSection(item.sectionSlug!);
      if (!section) throw new ProfileChangeError(`Nhóm danh sách không hợp lệ: ${item.sectionSlug}`, 400);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate = (tx as any)[section.model];

      if (item.itemType === 'SECTION_DELETE') {
        await delegate.update({
          where: { id: item.targetRecordId! },
          data: { deletedAt: new Date(), deletedBy: actor.id },
        });
        continue;
      }

      const raw = (item.requestedValue ?? {}) as Record<string, unknown>;
      if (item.itemType === 'SECTION_CREATE') {
        const payload = buildPayload(section.fields, raw, 'create', true);
        const base: Record<string, unknown> = { ...payload, userId: owner.id, personnelId: owner.personnelId };
        if (section.special === 'youthHistory') {
          base.membershipId = await ensureMembershipId(tx, owner.id, owner.personnelId);
        }
        await delegate.create({ data: base });
      } else {
        // SECTION_UPDATE
        const payload = buildPayload(section.fields, raw, 'update', true);
        await delegate.update({ where: { id: item.targetRecordId! }, data: payload });
      }
    }

    if (Object.keys(extendedPatch).length > 0) {
      await tx.user.update({ where: { id: owner.id }, data: extendedPatch });
      // Liên thông: chiếu trường mô tả nhân thân sang Personnel (M02 master) để CSDL
      // chính phục vụ lãnh đạo đồng bộ ngay. Trường không nằm trong map sẽ bị bỏ qua.
      await projectUserPatchToPersonnel(tx, owner.personnelId, extendedPatch);
    }
    if (Object.keys(youthPatch).length > 0) {
      await tx.youthUnionMembership.upsert({
        where: { userId: owner.id },
        create: { userId: owner.id, personnelId: owner.personnelId ?? undefined, ...youthPatch },
        update: youthPatch,
      });
    }

    const now = new Date();
    await tx.profileChangeRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED',
        tier2ReviewerId: actor.id,
        tier2ReviewedAt: now,
        tier2Note: note,
        committedAt: now,
        lockedAt: now,
        updatedBy: actor.id,
      },
    });
  });

  await logAudit({
    userId: actor.id,
    functionCode: PROFILE_CHANGE.APPROVE_ORGAN,
    action: 'TIER2_APPROVE_COMMIT',
    resourceType: 'PROFILE_CHANGE_REQUEST',
    resourceId: request.id,
    newValue: JSON.stringify({ ownerUserId: owner.id, itemCount: request.items.length }),
    result: 'SUCCESS',
  });

  const committed = await findProfileChangeRequestById(request.id);
  await notifyInitiatorSafe(committed!, 'APPROVED', note);
  return committed;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export async function getRequest(id: string) {
  return findProfileChangeRequestById(id);
}

/** Lấy chi tiết 1 đề nghị cho người duyệt, có kiểm tra phạm vi (scope). */
export async function getRequestForReviewer(actor: AuthUser, scope: FunctionScope, id: string) {
  const request = await findProfileChangeRequestById(id);
  if (!request) throw new ProfileChangeError('Không tìm thấy đề nghị', 404);
  if (!(await reviewerCanAccess(actor, scope, request.unitId))) {
    throw new ProfileChangeError('Không có quyền xem đề nghị ngoài phạm vi', 403);
  }
  return request;
}

export async function listMyRequests(userId: string, filters: Omit<ProfileChangeListFilter, 'userId' | 'unitIds' | 'managingOrgan'>) {
  return listProfileChangeRequests({ ...filters, userId });
}

export async function listForReviewer(
  actor: AuthUser,
  scope: FunctionScope,
  tier: 1 | 2,
  filters: Omit<ProfileChangeListFilter, 'unitIds' | 'status'>,
) {
  const status = tier === 1 ? 'SUBMITTED' : 'UNIT_APPROVED';
  const unitIds = scope === 'ACADEMY' ? undefined : await getAccessibleUnitIds(actor, scope);
  // scope không phải ACADEMY mà không có đơn vị nào → trả rỗng (fail-closed).
  if (scope !== 'ACADEMY' && (!unitIds || unitIds.length === 0)) {
    return { data: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 20 };
  }
  return listProfileChangeRequests({ ...filters, status, unitIds });
}

export async function getReviewerStats(actor: AuthUser, scope: FunctionScope) {
  const unitIds = scope === 'ACADEMY' ? undefined : await getAccessibleUnitIds(actor, scope);
  if (scope !== 'ACADEMY' && (!unitIds || unitIds.length === 0)) return {};
  return countProfileChangeByStatus({ unitIds });
}

export { ProfileChangeError };
