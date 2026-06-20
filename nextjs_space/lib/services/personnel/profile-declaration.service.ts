/**
 * ProfileDeclarationService — vòng đời "khai báo hồ sơ lần đầu".
 *
 *   profileDeclaredAt = null  → ĐANG KHAI BÁO: cán bộ tự ghi trực tiếp HSCB
 *   confirmDeclaration()      → kiểm đủ mục tối thiểu → KHÓA (set profileDeclaredAt)
 *   (đã khóa)                 → mọi thay đổi đi qua đề nghị thay đổi 2 cấp
 *   reopenDeclaration()       → tier-2 (Ban CB/Quân lực)/admin mở lại để khai lại
 *
 * Service chỉ quản trạng thái vòng đời; việc ghi từng bản ghi HSCB do
 * CadreProfileSectionService / CadreExtendedProfileService đảm nhiệm (route gọi khi
 * còn ở giai đoạn khai báo). Audit mọi chuyển trạng thái.
 */
import 'server-only';
import db from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { PERSONAL, PROFILE_CHANGE } from '@/lib/rbac/function-codes';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import {
  DECLARATION_REQUIRED_CHECKS,
  type DeclarationCheck,
} from '@/lib/constants/profile-declaration';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

export class DeclarationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface DeclarationCheckResult extends DeclarationCheck {
  ok: boolean;
}

export interface DeclarationCompleteness {
  complete: boolean;
  checks: DeclarationCheckResult[];
}

export interface DeclarationState {
  declared: boolean;
  declaredAt: Date | null;
  declaredBy: string | null;
  completeness: DeclarationCompleteness;
}

const OWNER_SELECT = {
  id: true,
  name: true,
  dateOfBirth: true,
  gender: true,
  profileDeclaredAt: true,
  profileDeclaredBy: true,
  unitId: true,
} as const;

async function loadOwner(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: OWNER_SELECT });
  if (!user) throw new DeclarationError('Không tìm thấy tài khoản cán bộ', 404);
  return user;
}

/**
 * Reviewer truyền vào có thể là User.id HOẶC Personnel.id — chuẩn hóa về account
 * (giống resolveAccount của cadre service) để tránh lệch id ở trang chi tiết cán bộ.
 */
async function resolveTargetUser(id: string) {
  const user = await db.user.findUnique({ where: { id }, select: OWNER_SELECT });
  if (user) return user;
  const personnel = await db.personnel.findUnique({
    where: { id },
    select: { account: { select: OWNER_SELECT } },
  });
  if (!personnel?.account) throw new DeclarationError('Không tìm thấy tài khoản cán bộ', 404);
  return personnel.account;
}

/** Kiểm phạm vi đơn vị cho reviewer (route đã gate function-code). */
async function assertReviewerScope(
  actor: AuthUser,
  scope: FunctionScope,
  unitId: string | null,
): Promise<void> {
  if (scope === 'ACADEMY') return;
  if (!unitId) throw new DeclarationError('Không có quyền thao tác ngoài phạm vi', 403);
  const unitIds = await getAccessibleUnitIds(actor, scope);
  if (!unitIds.includes(unitId)) throw new DeclarationError('Không có quyền thao tác ngoài phạm vi', 403);
}

/** Đánh giá các mục tối thiểu để được xác nhận hoàn tất khai báo. */
export async function evaluateCompleteness(userId: string): Promise<DeclarationCompleteness> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, dateOfBirth: true, gender: true },
  });
  if (!user) throw new DeclarationError('Không tìm thấy tài khoản cán bộ', 404);

  const careerCount = await db.careerHistory.count({ where: { userId, deletedAt: null } });

  const okByKey: Record<string, boolean> = {
    basicInfo: Boolean(user.name && user.dateOfBirth && user.gender),
    careerHistory: careerCount > 0,
  };

  const checks: DeclarationCheckResult[] = DECLARATION_REQUIRED_CHECKS.map((c) => ({
    ...c,
    ok: okByKey[c.key] ?? false,
  }));
  return { complete: checks.every((c) => c.ok), checks };
}

export async function getDeclarationState(userId: string): Promise<DeclarationState> {
  const user = await loadOwner(userId);
  const completeness = await evaluateCompleteness(userId);
  return {
    declared: user.profileDeclaredAt !== null,
    declaredAt: user.profileDeclaredAt,
    declaredBy: user.profileDeclaredBy,
    completeness,
  };
}

/** Đang trong giai đoạn khai báo? Ném 409 nếu đã chốt (dùng cho route ghi trực tiếp). */
export async function assertDeclaring(userId: string): Promise<void> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { profileDeclaredAt: true } });
  if (!user) throw new DeclarationError('Không tìm thấy tài khoản cán bộ', 404);
  if (user.profileDeclaredAt !== null) {
    throw new DeclarationError(
      'Hồ sơ đã chốt khai báo lần đầu. Mọi thay đổi phải gửi đề nghị thay đổi 2 cấp.',
      409,
    );
  }
}

/** Xác nhận hoàn tất khai báo: kiểm đủ mục tối thiểu rồi khóa. */
export async function confirmDeclaration(userId: string, actorId: string): Promise<DeclarationState> {
  const user = await loadOwner(userId);
  if (user.profileDeclaredAt !== null) {
    throw new DeclarationError('Hồ sơ đã được xác nhận khai báo trước đó', 409);
  }

  const completeness = await evaluateCompleteness(userId);
  if (!completeness.complete) {
    const missing = completeness.checks.filter((c) => !c.ok).map((c) => c.label);
    throw new DeclarationError(`Chưa đủ mục bắt buộc để xác nhận: ${missing.join('; ')}`, 422);
  }

  const now = new Date();
  await db.user.update({
    where: { id: userId },
    data: { profileDeclaredAt: now, profileDeclaredBy: actorId },
  });

  await logAudit({
    userId: actorId,
    functionCode: PERSONAL.MANAGE_PROFILE,
    action: 'DECLARATION_CONFIRM',
    resourceType: 'PROFILE_DECLARATION',
    resourceId: userId,
    newValue: JSON.stringify({ declaredAt: now }),
    result: 'SUCCESS',
  });

  return getDeclarationState(userId);
}

/** Reviewer xem trạng thái khai báo của 1 cán bộ (id có thể là User.id/Personnel.id). */
export async function getDeclarationStateForReviewer(
  targetId: string,
  actor: AuthUser,
  scope: FunctionScope,
): Promise<DeclarationState> {
  const target = await resolveTargetUser(targetId);
  await assertReviewerScope(actor, scope, target.unitId);
  return getDeclarationState(target.id);
}

/** Mở lại khai báo (Ban CB/Quân lực tier-2 hoặc admin) — cho cán bộ khai lại. */
export async function reopenDeclaration(
  targetId: string,
  actor: AuthUser,
  scope: FunctionScope,
  reason: string,
): Promise<DeclarationState> {
  const trimmed = (reason ?? '').trim();
  if (!trimmed) throw new DeclarationError('Phải nêu lý do mở lại khai báo', 400);

  const target = await resolveTargetUser(targetId);
  if (target.profileDeclaredAt === null) {
    throw new DeclarationError('Hồ sơ đang ở trạng thái khai báo, không cần mở lại', 409);
  }
  await assertReviewerScope(actor, scope, target.unitId);

  await db.user.update({
    where: { id: target.id },
    data: { profileDeclaredAt: null, profileDeclaredBy: null },
  });

  await logAudit({
    userId: actor.id,
    functionCode: PROFILE_CHANGE.APPROVE_ORGAN,
    action: 'DECLARATION_REOPEN',
    resourceType: 'PROFILE_DECLARATION',
    resourceId: target.id,
    newValue: JSON.stringify({ reason: trimmed }),
    result: 'SUCCESS',
  });

  return getDeclarationState(target.id);
}
