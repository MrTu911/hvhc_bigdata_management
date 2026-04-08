/**
 * lib/soft-delete-middleware.ts
 * Prisma middleware tự động:
 *   1. Filter bỏ records có deletedAt != null trong findMany/findFirst
 *   2. Convert delete → update { deletedAt, deletedBy }
 * Khắc phục: onDelete: Cascade gây mất lịch sử (lỗi #4)
 *
 * Dùng trong lib/db.ts:
 *   import { applySoftDeleteMiddleware } from './soft-delete-middleware';
 *   const prisma = new PrismaClient();
 *   applySoftDeleteMiddleware(prisma);
 */

import { Prisma, PrismaClient } from '@prisma/client';

// ─── Models áp dụng soft delete ──────────────────────────────────────────────
// CHỈ các bảng nghiệp vụ – KHÔNG áp dụng cho User, Unit, Permission

const SOFT_DELETE_MODELS = new Set([
  'CareerHistory',
  'PolicyRecord',
  'PartyMember',
  'PartyActivity',
  'InsuranceInfo',
  'MedicalRecord',
  'FamilyRelation',
  'TrainingHistory',
  'EducationHistory',
  'PersonnelEvent',
  'SensitiveIdentity',
  'ScientificProfile',
]);

// Operations cần tự động exclude deleted records
const READ_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

// ─── Apply middleware ─────────────────────────────────────────────────────────

export function applySoftDeleteMiddleware(prisma: PrismaClient): void {
  // @ts-ignore – Prisma middleware API
  prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    const model = params.model as string | undefined;

    if (!model || !SOFT_DELETE_MODELS.has(model)) {
      return next(params);
    }

    // ── READ: tự động thêm deletedAt: null ──────────────────────────────────
    if (READ_OPERATIONS.has(params.action)) {
      // Chỉ thêm filter nếu caller KHÔNG tự set includeDeleted
      const skipFilter = params.args?.where?._includeDeleted === true;

      if (!skipFilter) {
        params.args = params.args ?? {};
        params.args.where = params.args.where ?? {};

        // Xóa flag _includeDeleted khỏi query thật
        delete params.args.where._includeDeleted;

        // Merge filter: chỉ lấy records chưa xóa
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      } else {
        // Có flag → trả về tất cả (kể cả đã xóa), nhưng xóa flag khỏi query
        delete params.args.where._includeDeleted;
      }
    }

    // ── DELETE → Soft delete ─────────────────────────────────────────────────
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = {
        deletedAt: new Date(),
        ...(params.args.data ?? {}),
      };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args.data = {
        deletedAt: new Date(),
        ...(params.args.data ?? {}),
      };
    }

    // ── UPDATE: không update records đã xóa (trừ restore) ───────────────────
    if (params.action === 'update' || params.action === 'updateMany') {
      const isRestore = params.args.data?.deletedAt === null;
      if (!isRestore) {
        params.args.where = {
          ...params.args.where,
          deletedAt: null,
        };
      }
    }

    return next(params);
  });
}

// ─── Utility: restore deleted record ─────────────────────────────────────────

/**
 * Phục hồi record đã soft-deleted
 * Ví dụ: await restoreRecord(prisma.careerHistory, 'clxxxxx')
 */
export async function restoreRecord(
  delegate: { update: (args: Record<string, unknown>) => Promise<unknown> },
  id: string,
  restoredBy?: string
): Promise<unknown> {
  return delegate.update({
    where: { id },
    data: {
      deletedAt: null,
      deletedBy: null,
      ...(restoredBy ? { restoredBy, restoredAt: new Date() } : {}),
    },
  });
}

// ─── Prisma schema snippet (thêm vào schema.prisma) ──────────────────────────
/*
  Thêm các fields này vào từng model trong SOFT_DELETE_MODELS:

  model CareerHistory {
    // ... existing fields ...
    deletedAt      DateTime?
    deletedBy      String?
    deletionReason String?

    @@index([deletedAt])
  }

  model PolicyRecord {
    // ... existing fields ...
    status         PolicyRecordStatus @default(ACTIVE)
    deletedAt      DateTime?
    deletedBy      String?
    voidedAt       DateTime?  // Hủy nhưng vẫn hiển thị (ký hiệu gạch đỏ)
    voidedBy       String?
    voidReason     String?

    @@index([deletedAt])
    @@index([status])
  }

  // Đổi tất cả onDelete: Cascade → onDelete: SetNull (hoặc NoAction)
  // Ví dụ:
  model CareerHistory {
    personnelId    String?
    personnel      Personnel? @relation(fields: [personnelId], references: [id], onDelete: SetNull)
    // Xóa Personnel → personnelId = null, KHÔNG xóa CareerHistory
  }

  enum PolicyRecordStatus {
    ACTIVE
    VOIDED   // Hủy bỏ nhưng giữ record (audit trail)
    ARCHIVED
  }
*/