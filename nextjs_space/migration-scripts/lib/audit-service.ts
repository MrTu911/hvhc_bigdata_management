/**
 * lib/audit-service.ts
 * Ghi AuditLog cho mọi thao tác CRUD trên dữ liệu nhạy cảm
 * Khắc phục: Thiếu AuditLog model + requestId trace (lỗi #2)
 *
 * Thêm vào schema.prisma trước khi dùng:
 *
 * enum AuditAction {
 *   CREATE UPDATE DELETE VIEW EXPORT IMPORT LOGIN LOGOUT
 *   ACCOUNT_CREATED ACCOUNT_DISABLED PERMISSION_CHANGED
 * }
 *
 * model AuditLog {
 *   id            String      @id @default(cuid())
 *   requestId     String      // UUID từ middleware, dùng để trace 1 request
 *   actorUserId   String      // Người thực hiện (User.id)
 *   actorName     String?     // Tên hiển thị (cache để không mất khi xóa user)
 *   actorIp       String?     // IP address
 *   actorUserAgent String?    // Browser/client
 *   action        AuditAction
 *   resourceType  String      // "PERSONNEL" | "CAREER" | "PARTY" | ...
 *   resourceId    String?     // ID của record bị tác động
 *   beforeData    Json?       // Đã mask PII
 *   afterData     Json?       // Đã mask PII
 *   changedFields String[]    // Chỉ list field thay đổi
 *   metadata      Json?       // Thông tin thêm (filter, pagination...)
 *   result        String      @default("SUCCESS") // SUCCESS | FAILURE
 *   errorMessage  String?
 *   createdAt     DateTime    @default(now())
 *
 *   @@index([actorUserId])
 *   @@index([resourceType, resourceId])
 *   @@index([requestId])
 *   @@index([createdAt])
 *   @@map("audit_logs")
 * }
 */

import { PrismaClient, Prisma, UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { maskPII, diffObjects } from './audit-masking';

const prisma = new PrismaClient();

// ─── Request Context (AsyncLocalStorage) ────────────────────────────────────
// Lưu requestId + actorInfo cho toàn bộ 1 request lifecycle

import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  requestId: string;
  actorUserId?: string;
  actorName?: string;
  actorIp?: string;
  actorUserAgent?: string;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/** Lấy context hiện tại, trả về fallback nếu không có */
function getContext(): RequestContext {
  return requestContextStorage.getStore() ?? {
    requestId: uuidv4(),
    actorUserId: 'SYSTEM',
  };
}

// ─── Kiểu dữ liệu ────────────────────────────────────────────────────────────

export interface LogAuditParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  result?: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  /** Ghi đè actorUserId (dùng cho automated jobs) */
  actorUserId?: string;
}

// ─── Core logAudit ───────────────────────────────────────────────────────────

/**
 * Ghi một audit log entry
 * Tự động mask PII, tính changedFields, lấy requestId từ context
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const ctx = getContext();

    const { changedFields, beforeMasked, afterMasked } = diffObjects(
      params.beforeData ?? null,
      params.afterData  ?? null
    );

    // Nếu là VIEW/EXPORT chỉ mask afterData (không có before)
    const afterMaskedFinal = params.action === 'VIEW' || params.action === 'EXPORT'
      ? (maskPII(params.afterData) as Record<string, unknown> | null)
      : afterMasked;

    await prisma.auditLog.create({
      data: {
        requestId:     ctx.requestId,
        actorUserId:   params.actorUserId ?? ctx.actorUserId ?? 'UNKNOWN',
        actorRole:     UserRole.QUAN_TRI_HE_THONG,
        actorIp:       ctx.actorIp,
        actorUserAgent: ctx.actorUserAgent,
        action:        params.action,
        resourceType:  params.resourceType,
        resourceId:    params.resourceId,
        beforeData:    beforeMasked    as Prisma.InputJsonValue,
        afterData:     afterMaskedFinal as Prisma.InputJsonValue,
        changedFields,
        metadata:      params.metadata as Prisma.InputJsonValue,
        success:       params.result !== 'FAILURE',
        errorMessage:  params.errorMessage,
      },
    });
  } catch (auditErr) {
    // KHÔNG throw – lỗi audit log không được làm crash nghiệp vụ
    console.error('[AuditLog] Failed to write audit log:', auditErr);
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const audit = {
  create: (params: Omit<LogAuditParams, 'action'>) =>
    logAudit({ ...params, action: 'CREATE' }),

  update: (params: Omit<LogAuditParams, 'action'>) =>
    logAudit({ ...params, action: 'UPDATE' }),

  delete: (params: Omit<LogAuditParams, 'action'>) =>
    logAudit({ ...params, action: 'DELETE' }),

  view: (resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'VIEW', resourceType, resourceId, metadata }),

  export: (resourceType: string, metadata?: Record<string, unknown>) =>
    logAudit({ action: 'EXPORT', resourceType, metadata }),

  login: (actorUserId: string, ip?: string, success = true) =>
    logAudit({
      action: 'LOGIN',
      resourceType: 'AUTH',
      actorUserId,
      result: success ? 'SUCCESS' : 'FAILURE',
      metadata: { ip },
    }),

  logout: (actorUserId: string) =>
    logAudit({ action: 'LOGOUT', resourceType: 'AUTH', actorUserId }),
};

// ─── Next.js Middleware: gắn requestId vào mọi request ───────────────────────
// Thêm vào middleware.ts ở root của Next.js project:

export function createRequestId(): string {
  return uuidv4();
}

/**
 * Dùng trong Next.js API Route hoặc Server Action:
 *
 * export async function POST(req: NextRequest) {
 *   const requestId = req.headers.get('x-request-id') ?? createRequestId();
 *   const session = await getServerSession(authOptions);
 *
 *   return requestContextStorage.run({
 *     requestId,
 *     actorUserId: session?.user?.id,
 *     actorName:   session?.user?.name ?? undefined,
 *     actorIp:     req.headers.get('x-forwarded-for') ?? undefined,
 *     actorUserAgent: req.headers.get('user-agent') ?? undefined,
 *   }, async () => {
 *     // Code nghiệp vụ ở đây – audit.create() sẽ tự lấy context
 *     const personnel = await createPersonnel(data);
 *     await audit.create({ resourceType: 'PERSONNEL', resourceId: personnel.id, afterData: personnel });
 *     return NextResponse.json(personnel);
 *   });
 * }
 */

// ─── Retention Cleanup Job ────────────────────────────────────────────────────

/**
 * Xóa audit logs cũ hơn retentionDays (mặc định 3 năm = 1095 ngày)
 * Schedule bằng Cron hoặc Airflow: chạy 1 lần/ngày lúc 2:00 AM
 */
export async function cleanupOldAuditLogs(retentionDays = 1095): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoff },
      // Giữ lại ACCOUNT_CREATED/DISABLED mãi mãi (yêu cầu pháp lý)
      NOT: {
        action: { in: ['ACCOUNT_CREATED', 'ACCOUNT_DISABLED', 'PERMISSION_CHANGED'] },
      },
    },
  });

  console.log(`[AuditLog] Cleanup: deleted ${result.count} records older than ${retentionDays} days`);
  return result.count;
}