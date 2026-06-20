/**
 * Generic CRUD cho các "nhóm" hồ sơ cán bộ điện tử (M02 ext).
 *
 * Một service phục vụ tất cả model con danh sách (định nghĩa ở
 * lib/constants/cadre-profile-sections.ts) + cập nhật trường scalar mở rộng trên User.
 * Tất cả khóa theo account User của cán bộ; soft-delete; mask trường nhạy cảm khi
 * thiếu PERSONNEL.VIEW_SENSITIVE. Scope enforced theo đơn vị của cán bộ.
 *
 * [id] có thể là User.id (trang chi tiết) hoặc Personnel.id.
 */
import 'server-only';
import prisma from '@/lib/db';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import {
  EXTENDED_FIELD_GROUPS,
  YOUTH_MEMBERSHIP_FIELD_MAP,
  getCadreSection,
  type CadreField,
  type CadreListSection,
} from '@/lib/constants/cadre-profile-sections';
import type { AuthUser } from '@/lib/rbac/types';
import type { FunctionScope } from '@prisma/client';

type Result<T> = { success: true; data: T } | { success: false; error: string; status: number };

/** Delegate Prisma động — model name lấy từ registry (đã kiểm soát allow-list). */
function delegate(model: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[model];
}

// ─── Resolve account + scope ────────────────────────────────────────────────────

async function resolveAccount(id: string): Promise<{ userId: string; unitId: string | null } | null> {
  const account = await prisma.user.findUnique({ where: { id }, select: { id: true, unitId: true } });
  if (account) return { userId: account.id, unitId: account.unitId };
  const personnel = await prisma.personnel.findUnique({
    where: { id },
    select: { unitId: true, account: { select: { id: true } } },
  });
  if (!personnel || !personnel.account) return null;
  return { userId: personnel.account.id, unitId: personnel.unitId };
}

async function canAccess(user: AuthUser, scope: FunctionScope, target: { userId: string; unitId: string | null }) {
  if (scope === 'ACADEMY') return true;
  if (scope === 'SELF') return target.userId === user.id;
  const unitIds = await getAccessibleUnitIds(user, scope);
  return target.unitId != null && unitIds.includes(target.unitId);
}

// ─── Field coercion ─────────────────────────────────────────────────────────────

export function coerce(field: CadreField, raw: unknown): unknown {
  if (raw === null || raw === undefined || raw === '') return null;
  switch (field.type) {
    case 'date': {
      const d = new Date(String(raw));
      if (Number.isNaN(d.getTime())) throw new Error(`Ngày không hợp lệ: ${field.label}`);
      return d;
    }
    case 'number': {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`Số không hợp lệ: ${field.label}`);
      return Math.trunc(n);
    }
    case 'decimal': {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`Số không hợp lệ: ${field.label}`);
      return n;
    }
    case 'boolean':
      return raw === true || raw === 'true' || raw === 1 || raw === '1';
    case 'select': {
      const v = String(raw);
      if (field.options && !field.options.some((o) => o.value === v)) {
        throw new Error(`Giá trị không hợp lệ: ${field.label}`);
      }
      return v;
    }
    default:
      return String(raw);
  }
}

/**
 * Dựng payload từ input theo metadata field.
 * - mode 'create': enforce required, bỏ qua field không gửi.
 * - mode 'update': chỉ lấy field có trong input.
 * - canSensitive=false: loại field nhạy cảm (không ghi đè).
 */
export function buildPayload(
  fields: CadreField[],
  input: Record<string, unknown>,
  mode: 'create' | 'update',
  canSensitive: boolean,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.sensitive && !canSensitive) continue;
    const has = Object.prototype.hasOwnProperty.call(input, field.name);
    if (!has) {
      if (mode === 'create' && field.required) {
        throw new Error(`Thiếu trường bắt buộc: ${field.label}`);
      }
      continue;
    }
    const value = coerce(field, input[field.name]);
    if (mode === 'create' && field.required && (value === null || value === '')) {
      throw new Error(`Thiếu trường bắt buộc: ${field.label}`);
    }
    out[field.name] = value;
  }
  return out;
}

function maskRead<T extends Record<string, unknown>>(rows: T[], fields: CadreField[], canSensitive: boolean): T[] {
  if (canSensitive) return rows;
  const sensitive = fields.filter((f) => f.sensitive).map((f) => f.name);
  if (sensitive.length === 0) return rows;
  return rows.map((r) => {
    const masked = { ...r };
    for (const k of sensitive) masked[k as keyof T] = null as T[keyof T];
    return masked;
  });
}

// ─── Đoàn membership (1:1) ───────────────────────────────────────────────────────

async function ensureYouthMembershipId(userId: string, personnelId: string | null): Promise<string> {
  const existing = await prisma.youthUnionMembership.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing.id;
  const created = await prisma.youthUnionMembership.create({
    data: { userId, personnelId: personnelId ?? undefined },
    select: { id: true },
  });
  return created.id;
}

// ─── List section CRUD ──────────────────────────────────────────────────────────

export const CadreProfileSectionService = {
  async list(
    user: AuthUser,
    scope: FunctionScope,
    id: string,
    section: CadreListSection,
    canSensitive: boolean,
  ): Promise<Result<unknown[]>> {
    const account = await resolveAccount(id);
    if (!account) return { success: false, error: 'Không tìm thấy cán bộ', status: 404 };
    if (!(await canAccess(user, scope, account))) {
      return { success: false, error: 'Không có quyền truy cập hồ sơ ngoài phạm vi đơn vị', status: 403 };
    }
    const rows = await delegate(section.model).findMany({
      where: { userId: account.userId, deletedAt: null },
      orderBy: { [section.orderBy.field]: section.orderBy.dir },
    });
    return { success: true, data: maskRead(rows as Record<string, unknown>[], section.fields, canSensitive) };
  },

  async create(
    user: AuthUser,
    scope: FunctionScope,
    id: string,
    section: CadreListSection,
    input: Record<string, unknown>,
    canSensitive: boolean,
  ): Promise<Result<unknown>> {
    const account = await resolveAccount(id);
    if (!account) return { success: false, error: 'Không tìm thấy cán bộ', status: 404 };
    if (!(await canAccess(user, scope, account))) {
      return { success: false, error: 'Không có quyền cập nhật hồ sơ ngoài phạm vi đơn vị', status: 403 };
    }
    let payload: Record<string, unknown>;
    try {
      payload = buildPayload(section.fields, input, 'create', canSensitive);
    } catch (e) {
      return { success: false, error: (e as Error).message, status: 400 };
    }
    const personnelId = await resolvePersonnelId(account.userId);
    const base: Record<string, unknown> = { ...payload, userId: account.userId, personnelId };
    if (section.special === 'youthHistory') {
      base.membershipId = await ensureYouthMembershipId(account.userId, personnelId);
    }
    const created = await delegate(section.model).create({ data: base });
    return { success: true, data: created };
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    recordId: string,
    section: CadreListSection,
    input: Record<string, unknown>,
    canSensitive: boolean,
  ): Promise<Result<unknown>> {
    const existing = await delegate(section.model).findUnique({
      where: { id: recordId },
      select: { id: true, userId: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) return { success: false, error: 'Không tìm thấy bản ghi', status: 404 };
    const access = await accessByUserId(user, scope, existing.userId);
    if (!access) return { success: false, error: 'Không có quyền cập nhật bản ghi này', status: 403 };
    let payload: Record<string, unknown>;
    try {
      payload = buildPayload(section.fields, input, 'update', canSensitive);
    } catch (e) {
      return { success: false, error: (e as Error).message, status: 400 };
    }
    const updated = await delegate(section.model).update({ where: { id: recordId }, data: payload });
    return { success: true, data: updated };
  },

  async softDelete(
    user: AuthUser,
    scope: FunctionScope,
    recordId: string,
    section: CadreListSection,
  ): Promise<Result<unknown>> {
    const existing = await delegate(section.model).findUnique({
      where: { id: recordId },
      select: { id: true, userId: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) return { success: false, error: 'Không tìm thấy bản ghi', status: 404 };
    const access = await accessByUserId(user, scope, existing.userId);
    if (!access) return { success: false, error: 'Không có quyền xóa bản ghi này', status: 403 };
    const deleted = await delegate(section.model).update({
      where: { id: recordId },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });
    return { success: true, data: deleted };
  },

  /** Xóa mềm TẤT CẢ bản ghi của 1 nhóm cho 1 cán bộ — phục vụ chế độ import "thay thế". */
  async softDeleteAll(
    user: AuthUser,
    scope: FunctionScope,
    id: string,
    section: CadreListSection,
  ): Promise<Result<{ deleted: number }>> {
    const account = await resolveAccount(id);
    if (!account) return { success: false, error: 'Không tìm thấy cán bộ', status: 404 };
    if (!(await canAccess(user, scope, account))) {
      return { success: false, error: 'Không có quyền xóa dữ liệu ngoài phạm vi đơn vị', status: 403 };
    }
    const res = await delegate(section.model).updateMany({
      where: { userId: account.userId, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });
    return { success: true, data: { deleted: res.count } };
  },
};

async function accessByUserId(user: AuthUser, scope: FunctionScope, userId: string): Promise<boolean> {
  const account = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, unitId: true } });
  if (!account) return false;
  return canAccess(user, scope, { userId: account.id, unitId: account.unitId });
}

async function resolvePersonnelId(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { personnelId: true } });
  return u?.personnelId ?? null;
}

// ─── Extended scalar profile (User columns + Đoàn membership) ────────────────────

const EXTENDED_FIELDS: CadreField[] = EXTENDED_FIELD_GROUPS.flatMap((g) => g.fields);
const YOUTH_KEYS = Object.keys(YOUTH_MEMBERSHIP_FIELD_MAP);

export const CadreExtendedProfileService = {
  async get(user: AuthUser, scope: FunctionScope, id: string, canSensitive: boolean): Promise<Result<Record<string, unknown>>> {
    const account = await resolveAccount(id);
    if (!account) return { success: false, error: 'Không tìm thấy cán bộ', status: 404 };
    if (!(await canAccess(user, scope, account))) {
      return { success: false, error: 'Không có quyền truy cập hồ sơ ngoài phạm vi đơn vị', status: 403 };
    }
    const userCols = EXTENDED_FIELDS.filter((f) => !YOUTH_KEYS.includes(f.name)).map((f) => f.name);
    const select: Record<string, boolean> = {};
    for (const c of userCols) select[c] = true;
    const userRow = (await prisma.user.findUnique({ where: { id: account.userId }, select })) ?? {};
    const youth = await prisma.youthUnionMembership.findUnique({
      where: { userId: account.userId },
      select: { joinDate: true, joinPlace: true, currentPosition: true },
    });
    const data: Record<string, unknown> = { ...userRow };
    data.youthJoinDate = youth?.joinDate ?? null;
    data.youthJoinPlace = youth?.joinPlace ?? null;
    data.youthCurrentPosition = youth?.currentPosition ?? null;
    if (!canSensitive) for (const f of EXTENDED_FIELDS) if (f.sensitive) data[f.name] = null;
    return { success: true, data };
  },

  async update(
    user: AuthUser,
    scope: FunctionScope,
    id: string,
    input: Record<string, unknown>,
    canSensitive: boolean,
  ): Promise<Result<Record<string, unknown>>> {
    const account = await resolveAccount(id);
    if (!account) return { success: false, error: 'Không tìm thấy cán bộ', status: 404 };
    if (!(await canAccess(user, scope, account))) {
      return { success: false, error: 'Không có quyền cập nhật hồ sơ ngoài phạm vi đơn vị', status: 403 };
    }

    // Tách field Đoàn (upsert youthUnionMembership) khỏi field User.
    const userFields = EXTENDED_FIELDS.filter((f) => !YOUTH_KEYS.includes(f.name));
    const youthFields = EXTENDED_FIELDS.filter((f) => YOUTH_KEYS.includes(f.name));

    let userPayload: Record<string, unknown>;
    let youthInput: Record<string, unknown>;
    try {
      userPayload = buildPayload(userFields, input, 'update', canSensitive);
      youthInput = buildPayload(youthFields, input, 'update', canSensitive);
    } catch (e) {
      return { success: false, error: (e as Error).message, status: 400 };
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userPayload).length > 0) {
        await tx.user.update({ where: { id: account.userId }, data: userPayload });
      }
      if (Object.keys(youthInput).length > 0) {
        const youthData: Record<string, unknown> = {};
        for (const [formKey, modelKey] of Object.entries(YOUTH_MEMBERSHIP_FIELD_MAP)) {
          if (formKey in youthInput) youthData[modelKey] = youthInput[formKey];
        }
        const personnelId = await resolvePersonnelId(account.userId);
        await tx.youthUnionMembership.upsert({
          where: { userId: account.userId },
          create: { userId: account.userId, personnelId: personnelId ?? undefined, ...youthData },
          update: youthData,
        });
      }
    });

    return { success: true, data: { ok: true } };
  },
};

export { getCadreSection };
