/**
 * M13 – Workflow Dashboard Service (Phase 1)
 *
 * Cung cấp các query tổng hợp cho dashboard workflow.
 * Phase 1: tính trực tiếp từ runtime tables (wf_instances, wf_step_instances).
 * Phase 2: chuyển sang summary tables / materialized views (xem comment cuối file).
 *
 * Nguyên tắc:
 *  - Chỉ dùng COUNT và aggregation — không tải toàn bộ record vào memory
 *  - Scope filtering qua User.unitId (join qua initiatorId)
 *  - Batch size có giới hạn để tránh query scan bảng lớn
 *  - Không tính cycle time phức tạp ở Phase 1
 */

import prisma from '@/lib/db';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import { AuthUser } from '@/lib/rbac/types';
import { FunctionScope, WorkflowInstanceStatus, WorkflowStepStatus } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MyWorkStats {
  pendingCount: number;       // bước đang chờ tôi xử lý
  nearDueCount: number;       // bước sắp đến hạn (trong 24h)
  overdueCount: number;       // bước đã quá hạn
  initiatedCount: number;     // workflow tôi đã khởi tạo còn đang chạy
  completedRecentCount: number; // workflow tôi khởi tạo đã hoàn thành trong 7 ngày
}

export interface PendingTask {
  workflowInstanceId: string;
  instanceTitle: string;
  entityType: string;
  stepCode: string;
  assignedAt: Date | null;
  dueAt: Date | null;
  priority: number;
}

export interface UnitSummaryStats {
  totalOpen: number;          // đang PENDING + IN_PROGRESS
  totalOverdue: number;       // step instance EXPIRED còn trong workflow open
  approvedLast30d: number;    // approved trong 30 ngày
  rejectedLast30d: number;    // rejected trong 30 ngày
  returnedLast30d: number;    // returned trong 30 ngày
  byStatus: Record<string, number>;   // phân bố theo status
  byTemplate: Array<{ templateId: string; count: number }>; // top 5 templates
}

export interface BottleneckStep {
  stepCode: string;
  expiredCount: number;       // số lần step này bị EXPIRED
  avgDurationHours: number | null; // thời gian xử lý trung bình (nếu tính được)
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class WorkflowDashboardServiceClass {

  /**
   * My Work stats — chỉ dựa trên userId, không cần scope.
   * Các query độc lập được chạy song song.
   */
  async getMyWorkStats(userId: string): Promise<MyWorkStats> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      pendingCount,
      nearDueCount,
      overdueCount,
      initiatedCount,
      completedRecentCount,
    ] = await Promise.all([
      // Bước đang chờ tôi (READY hoặc IN_PROGRESS, tôi là assignee)
      prisma.workflowStepInstance.count({
        where: {
          assigneeId: userId,
          status: { in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS] },
        },
      }),

      // Bước sắp đến hạn trong 24h (còn đang chờ)
      prisma.workflowStepInstance.count({
        where: {
          assigneeId: userId,
          status: { in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS] },
          dueAt: { gte: now, lte: in24h },
        },
      }),

      // Bước đã quá hạn (dueAt < now, chưa hoàn thành)
      prisma.workflowStepInstance.count({
        where: {
          assigneeId: userId,
          status: { in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS, WorkflowStepStatus.EXPIRED] },
          dueAt: { lt: now },
        },
      }),

      // Workflow tôi khởi tạo đang chạy
      prisma.workflowInstance.count({
        where: {
          initiatorId: userId,
          status: { in: [WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS] },
        },
      }),

      // Workflow tôi khởi tạo đã hoàn thành trong 7 ngày qua
      prisma.workflowInstance.count({
        where: {
          initiatorId: userId,
          status: WorkflowInstanceStatus.APPROVED,
          completedAt: { gte: ago7d },
        },
      }),
    ]);

    return { pendingCount, nearDueCount, overdueCount, initiatedCount, completedRecentCount };
  }

  /**
   * Danh sách việc đang chờ tôi xử lý, sắp xếp theo priority + dueAt.
   * Trả tối đa 50 tasks để tránh query nặng.
   */
  async getMyPendingTasks(userId: string, limit = 20): Promise<PendingTask[]> {
    const steps = await prisma.workflowStepInstance.findMany({
      where: {
        assigneeId: userId,
        status: { in: [WorkflowStepStatus.READY, WorkflowStepStatus.IN_PROGRESS] },
      },
      include: {
        workflowInstance: {
          select: { id: true, title: true, entityType: true, priority: true },
        },
      },
      orderBy: [
        { workflowInstance: { priority: 'desc' } },
        { dueAt: 'asc' },
      ],
      take: Math.min(limit, 50),
    });

    return steps.map((s) => ({
      workflowInstanceId: s.workflowInstanceId,
      instanceTitle: s.workflowInstance.title,
      entityType: s.workflowInstance.entityType,
      stepCode: s.stepCode,
      assignedAt: s.assignedAt,
      dueAt: s.dueAt,
      priority: s.workflowInstance.priority,
    }));
  }

  /**
   * Unit-level summary — scope-filtered.
   * Scope xác định phạm vi unit nào được tính.
   *
   * Cách join: WorkflowInstance.initiatorId → User.id → User.unitId
   * (Chưa join qua assigneeId vì Phase 1 assigneeId hay null)
   */
  async getUnitSummary(actor: AuthUser, scope: FunctionScope): Promise<UnitSummaryStats> {
    const unitIds = await getAccessibleUnitIds(actor, scope);

    // Nếu SELF hoặc không có unit → trả về stats cá nhân như fallback
    if (unitIds.length === 0 && scope !== 'SELF') {
      return this.emptyUnitStats();
    }

    const now = new Date();
    const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Lấy userId thuộc các unit trong scope
    const usersInScope = await prisma.user.findMany({
      where:
        scope === 'SELF'
          ? { id: actor.id }
          : { unitId: { in: unitIds } },
      select: { id: true },
    });
    const userIds = usersInScope.map((u) => u.id);

    if (userIds.length === 0) return this.emptyUnitStats();

    const instanceWhere = { initiatorId: { in: userIds } };

    const [
      totalOpen,
      totalOverdue,
      approvedLast30d,
      rejectedLast30d,
      returnedLast30d,
      statusGroups,
      topTemplates,
    ] = await Promise.all([
      // Workflow đang mở
      prisma.workflowInstance.count({
        where: { ...instanceWhere, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),

      // Step EXPIRED trong workflow còn mở (không tải hết — dùng COUNT qua subquery)
      prisma.workflowStepInstance.count({
        where: {
          status: WorkflowStepStatus.EXPIRED,
          workflowInstance: {
            initiatorId: { in: userIds },
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        },
      }),

      // Approved 30 ngày
      prisma.workflowInstance.count({
        where: { ...instanceWhere, status: 'APPROVED', completedAt: { gte: ago30d } },
      }),

      // Rejected 30 ngày
      prisma.workflowInstance.count({
        where: { ...instanceWhere, status: 'REJECTED', completedAt: { gte: ago30d } },
      }),

      // Returned 30 ngày (khi workflow bị trả lại thì status = RETURNED)
      prisma.workflowInstance.count({
        where: { ...instanceWhere, status: 'RETURNED', updatedAt: { gte: ago30d } },
      }),

      // Phân bố theo status (groupBy)
      prisma.workflowInstance.groupBy({
        by: ['status'],
        where: instanceWhere,
        _count: { id: true },
      }),

      // Top 5 templates dùng nhiều nhất
      prisma.workflowInstance.groupBy({
        by: ['templateId'],
        where: { ...instanceWhere, startedAt: { gte: ago30d } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Map groupBy results
    const byStatus: Record<string, number> = {};
    for (const g of statusGroups) {
      byStatus[g.status] = g._count.id;
    }

    const byTemplate = topTemplates.map((t) => ({
      templateId: t.templateId,
      count: t._count.id,
    }));

    return {
      totalOpen,
      totalOverdue,
      approvedLast30d,
      rejectedLast30d,
      returnedLast30d,
      byStatus,
      byTemplate,
    };
  }

  /**
   * Top bottleneck steps — bước nào hay bị EXPIRED nhất.
   * Scope-filtered tương tự getUnitSummary.
   * Phase 1: chỉ đếm EXPIRED, không tính avg duration (quá tốn query).
   */
  async getBottlenecks(actor: AuthUser, scope: FunctionScope, topN = 10): Promise<BottleneckStep[]> {
    const unitIds = await getAccessibleUnitIds(actor, scope);

    const usersInScope = await prisma.user.findMany({
      where:
        scope === 'SELF'
          ? { id: actor.id }
          : unitIds.length > 0
          ? { unitId: { in: unitIds } }
          : { id: actor.id },
      select: { id: true },
    });
    const userIds = usersInScope.map((u) => u.id);
    if (userIds.length === 0) return [];

    const expiredGroups = await prisma.workflowStepInstance.groupBy({
      by: ['stepCode'],
      where: {
        status: WorkflowStepStatus.EXPIRED,
        workflowInstance: { initiatorId: { in: userIds } },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: topN,
    });

    return expiredGroups.map((g) => ({
      stepCode: g.stepCode,
      expiredCount: g._count.id,
      // Phase 2: tính bằng AVG(actedAt - assignedAt) từ completed steps
      avgDurationHours: null,
    }));
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private emptyUnitStats(): UnitSummaryStats {
    return {
      totalOpen: 0,
      totalOverdue: 0,
      approvedLast30d: 0,
      rejectedLast30d: 0,
      returnedLast30d: 0,
      byStatus: {},
      byTemplate: [],
    };
  }
}

export const WorkflowDashboardService = new WorkflowDashboardServiceClass();

// =============================================================================
// Phase 2 – Summary Tables Proposal
// =============================================================================
//
// Khi lưu lượng tăng, thay thế các COUNT query trực tiếp bằng:
//
// model WorkflowAnalyticsDaily {
//   id          String   @id @default(cuid())
//   date        DateTime @db.Date         // ngày tổng hợp
//   templateId  String
//   unitId      String?
//   status      String                   // APPROVED | REJECTED | RETURNED | CANCELLED
//   count       Int      @default(0)
//   createdAt   DateTime @default(now())
//
//   @@unique([date, templateId, unitId, status])
//   @@index([date])
//   @@index([templateId])
//   @@index([unitId])
//   @@map("wf_analytics_daily")
// }
//
// model WorkflowAnalyticsByTemplate {
//   id              String   @id @default(cuid())
//   templateId      String   @unique
//   totalInstances  Int      @default(0)
//   openInstances   Int      @default(0)
//   avgCycleHours   Float?                // avg(completedAt - startedAt) tính bằng giờ
//   onTimeRate      Float?                // % hoàn thành đúng hạn
//   updatedAt       DateTime @updatedAt
//
//   @@map("wf_analytics_by_template")
// }
//
// Cập nhật bằng cron job daily (sau khi workflow-overdue chạy xong).
// Query dashboard đọc từ summary tables thay vì JOIN runtime tables.
// =============================================================================
