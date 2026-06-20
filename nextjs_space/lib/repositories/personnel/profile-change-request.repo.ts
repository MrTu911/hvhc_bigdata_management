/**
 * Repository – ProfileChangeRequest (Duyệt cập nhật hồ sơ cán bộ theo phân cấp).
 *
 * Chỉ truy cập DB + build where/scope filter. Không chứa business rule.
 */
import 'server-only';
import db from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { ProfileChangeRequestStatus, ManagingOrgan } from '@prisma/client';

export interface ProfileChangeItemData {
  itemType: 'EXTENDED_FIELD' | 'SECTION_CREATE' | 'SECTION_UPDATE' | 'SECTION_DELETE';
  fieldName?: string | null;
  sectionSlug?: string | null;
  targetRecordId?: string | null;
  currentValue?: string | null;
  requestedValue?: Prisma.InputJsonValue;
  isSensitive: boolean;
}

export interface ProfileChangeCreateData {
  userId: string;
  personnelId?: string | null;
  title?: string | null;
  reason?: string | null;
  createdBy: string;
  items: ProfileChangeItemData[];
}

export interface ProfileChangeListFilter {
  /** giới hạn theo người đề nghị (SELF) */
  userId?: string;
  status?: ProfileChangeRequestStatus | ProfileChangeRequestStatus[];
  /** scope tier-1: chỉ đề nghị của cán bộ thuộc các đơn vị này */
  unitIds?: string[];
  /** scope tier-2: theo cơ quan quản lý */
  managingOrgan?: ManagingOrgan;
  keyword?: string;
  page?: number;
  limit?: number;
}

const requestInclude = {
  items: true,
  attachments: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      militaryId: true,
      unitId: true,
      unit: { select: { id: true, name: true, commanderId: true } },
    },
  },
  tier1Reviewer: { select: { id: true, name: true } },
  tier2Reviewer: { select: { id: true, name: true } },
} satisfies Prisma.ProfileChangeRequestInclude;

export async function createProfileChangeRequest(data: ProfileChangeCreateData) {
  return db.profileChangeRequest.create({
    data: {
      userId: data.userId,
      personnelId: data.personnelId ?? null,
      title: data.title ?? null,
      reason: data.reason ?? null,
      createdBy: data.createdBy,
      updatedBy: data.createdBy,
      status: 'DRAFT',
      items: {
        create: data.items.map((it) => ({
          itemType: it.itemType,
          fieldName: it.fieldName ?? null,
          sectionSlug: it.sectionSlug ?? null,
          targetRecordId: it.targetRecordId ?? null,
          currentValue: it.currentValue ?? null,
          requestedValue: it.requestedValue ?? Prisma.JsonNull,
          isSensitive: it.isSensitive,
        })),
      },
    },
    include: requestInclude,
  });
}

export async function findProfileChangeRequestById(id: string) {
  return db.profileChangeRequest.findUnique({ where: { id }, include: requestInclude });
}

export async function updateProfileChangeRequest(
  id: string,
  data: Prisma.ProfileChangeRequestUpdateInput,
) {
  return db.profileChangeRequest.update({ where: { id }, data, include: requestInclude });
}

/** Thay toàn bộ items (chỉ dùng khi sửa nháp). */
export async function replaceProfileChangeItems(requestId: string, items: ProfileChangeItemData[]) {
  await db.$transaction([
    db.profileChangeItem.deleteMany({ where: { requestId } }),
    db.profileChangeItem.createMany({
      data: items.map((it) => ({
        requestId,
        itemType: it.itemType,
        fieldName: it.fieldName ?? null,
        sectionSlug: it.sectionSlug ?? null,
        targetRecordId: it.targetRecordId ?? null,
        currentValue: it.currentValue ?? null,
        requestedValue: it.requestedValue ?? Prisma.JsonNull,
        isSensitive: it.isSensitive,
      })),
    }),
  ]);
}

export async function listProfileChangeRequests(filter: ProfileChangeListFilter) {
  const page = Math.max(1, filter.page ?? 1);
  const limit = Math.min(100, Math.max(1, filter.limit ?? 20));

  const where: Prisma.ProfileChangeRequestWhereInput = {
    ...(filter.userId && { userId: filter.userId }),
    ...(filter.status && {
      status: Array.isArray(filter.status) ? { in: filter.status } : filter.status,
    }),
    ...(filter.unitIds && { unitId: { in: filter.unitIds } }),
    ...(filter.managingOrgan && { managingOrgan: filter.managingOrgan }),
    ...(filter.keyword && {
      OR: [
        { title: { contains: filter.keyword, mode: 'insensitive' } },
        { user: { name: { contains: filter.keyword, mode: 'insensitive' } } },
        { user: { militaryId: { contains: filter.keyword, mode: 'insensitive' } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    db.profileChangeRequest.findMany({
      where,
      include: requestInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.profileChangeRequest.count({ where }),
  ]);

  return { data, total, page, limit };
}

/** Đếm theo trạng thái (KPI cho inbox người duyệt / trang cá nhân). */
export async function countProfileChangeByStatus(filter: Omit<ProfileChangeListFilter, 'page' | 'limit'>) {
  const where: Prisma.ProfileChangeRequestWhereInput = {
    ...(filter.userId && { userId: filter.userId }),
    ...(filter.unitIds && { unitId: { in: filter.unitIds } }),
    ...(filter.managingOrgan && { managingOrgan: filter.managingOrgan }),
  };
  const rows = await db.profileChangeRequest.groupBy({
    by: ['status'],
    where,
    _count: { _all: true },
  });
  return rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = r._count._all;
    return acc;
  }, {});
}

export type ProfileChangeRequestWithRelations = Awaited<ReturnType<typeof findProfileChangeRequestById>>;
