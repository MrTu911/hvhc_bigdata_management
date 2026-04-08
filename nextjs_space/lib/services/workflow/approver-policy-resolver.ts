/**
 * M13 Phase 2 – Approver Policy Resolver
 *
 * Đọc configJson của WorkflowStepTemplate để resolve danh sách userId hợp lệ
 * làm assignee cho một bước workflow.
 *
 * M13 không tự quyết người ký — luôn lấy từ M02 (User, UserPosition, Unit).
 *
 * configJson schema (lưu trong WorkflowStepTemplate.configJson):
 * {
 *   approverPolicy: {
 *     type: 'SPECIFIC_USER' | 'BY_POSITION' | 'BY_UNIT_ROLE' | 'INITIATOR' | 'SUPERVISOR'
 *     userId?: string                      // SPECIFIC_USER
 *     positionCode?: string                // BY_POSITION
 *     unitScope?: 'INITIATOR_UNIT' | 'FIXED'
 *     fixedUnitId?: string                 // khi unitScope = FIXED
 *     unitRole?: 'HEAD' | 'DEPUTY_HEAD'    // BY_UNIT_ROLE
 *     fallbackToInitiator?: boolean        // nếu không resolve được → fallback initiator
 *   }
 * }
 */

import prisma from '@/lib/db';

// ---------------------------------------------------------------------------
// Policy schema
// ---------------------------------------------------------------------------

export type ApproverPolicyType =
  | 'SPECIFIC_USER'   // Gán cứng một userId cụ thể
  | 'BY_POSITION'     // Tìm người có positionCode trong đơn vị
  | 'BY_UNIT_ROLE'    // Tìm trưởng/phó đơn vị liên quan
  | 'INITIATOR'       // Chính người khởi tạo (tự xử lý bước)
  | 'SUPERVISOR';     // Cấp trên trực tiếp của initiator theo M02

export interface ApproverPolicy {
  type: ApproverPolicyType;
  // SPECIFIC_USER
  userId?: string;
  // BY_POSITION
  positionCode?: string;
  unitScope?: 'INITIATOR_UNIT' | 'FIXED';
  fixedUnitId?: string;
  // BY_UNIT_ROLE
  unitRole?: 'HEAD' | 'DEPUTY_HEAD';
  // Fallback nếu không resolve được
  fallbackToInitiator?: boolean;
}

export interface ResolvedAssignees {
  /** Người được gán chính (assignee cho step) */
  primary: string | null;
  /** Danh sách tất cả người có thể act (dùng cho multi-approver Phase 3) */
  candidates: string[];
}

// ---------------------------------------------------------------------------
// Context cần để resolve
// ---------------------------------------------------------------------------

export interface PolicyResolveContext {
  initiatorId: string;
  initiatorUnitId: string | null;
  templateVersionId: string;
  stepCode: string;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

class ApproverPolicyResolverClass {

  /**
   * Điểm vào chính: đọc configJson của step template và resolve assignee.
   * Trả null nếu không resolve được và không có fallback.
   */
  async resolve(ctx: PolicyResolveContext): Promise<ResolvedAssignees> {
    const stepTemplate = await prisma.workflowStepTemplate.findFirst({
      where: { templateVersionId: ctx.templateVersionId, code: ctx.stepCode },
      select: { configJson: true },
    });

    const policy = this.extractPolicy(stepTemplate?.configJson);
    if (!policy) {
      // Không có policy → không gán assignee (workflow vẫn chạy, step mở cho bất kỳ người có quyền)
      return { primary: null, candidates: [] };
    }

    const candidates = await this.resolveCandidates(policy, ctx);

    // Fallback về initiator nếu không tìm được ai
    if (candidates.length === 0 && policy.fallbackToInitiator) {
      return { primary: ctx.initiatorId, candidates: [ctx.initiatorId] };
    }

    return {
      primary: candidates[0] ?? null,
      candidates,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private extractPolicy(configJson: unknown): ApproverPolicy | null {
    if (!configJson || typeof configJson !== 'object') return null;
    const cfg = configJson as Record<string, unknown>;
    if (!cfg.approverPolicy || typeof cfg.approverPolicy !== 'object') return null;
    return cfg.approverPolicy as ApproverPolicy;
  }

  private async resolveCandidates(
    policy: ApproverPolicy,
    ctx: PolicyResolveContext
  ): Promise<string[]> {
    switch (policy.type) {

      case 'SPECIFIC_USER':
        return policy.userId ? [policy.userId] : [];

      case 'INITIATOR':
        return [ctx.initiatorId];

      case 'BY_POSITION':
        return this.resolveByPosition(policy, ctx);

      case 'BY_UNIT_ROLE':
        return this.resolveByUnitRole(policy, ctx);

      case 'SUPERVISOR':
        return this.resolveSupervisor(ctx);

      default:
        return [];
    }
  }

  /**
   * Tìm người có positionCode đang active trong đơn vị liên quan.
   * unitScope INITIATOR_UNIT → lấy unitId của initiator
   * unitScope FIXED → lấy fixedUnitId từ policy
   */
  private async resolveByPosition(
    policy: ApproverPolicy,
    ctx: PolicyResolveContext
  ): Promise<string[]> {
    if (!policy.positionCode) return [];

    const position = await prisma.position.findUnique({
      where: { code: policy.positionCode, isActive: true },
      select: { id: true },
    });
    if (!position) return [];

    const targetUnitId = policy.unitScope === 'FIXED'
      ? policy.fixedUnitId
      : ctx.initiatorUnitId;

    const userPositions = await prisma.userPosition.findMany({
      where: {
        positionId: position.id,
        isActive: true,
        endDate: null,
        ...(targetUnitId ? { unitId: targetUnitId } : {}),
        user: { status: 'ACTIVE' },
      },
      select: { userId: true, isPrimary: true },
      orderBy: { isPrimary: 'desc' }, // primary position trước
    });

    // Deduplicate (một user có thể có nhiều UserPosition row)
    const seen = new Set<string>();
    return userPositions
      .map((up) => up.userId)
      .filter((id) => !seen.has(id) && seen.add(id));
  }

  /**
   * Tìm trưởng/phó đơn vị của initiator (hoặc đơn vị cấp trên).
   * HEAD → trưởng đơn vị (position.level cao nhất trong unit)
   * DEPUTY_HEAD → phó đơn vị
   *
   * Phase 2 đơn giản hóa: tìm UserPosition có isPrimary=true và position.level cao nhất trong unitId.
   */
  private async resolveByUnitRole(
    policy: ApproverPolicy,
    ctx: PolicyResolveContext
  ): Promise<string[]> {
    // FIXED scope → dùng fixedUnitId từ policy; ngược lại dùng unit của initiator
    const targetUnitId = policy.unitScope === 'FIXED'
      ? policy.fixedUnitId
      : ctx.initiatorUnitId;

    if (!targetUnitId) return [];

    // Lấy tất cả UserPosition active trong unit, join Position để sort theo level
    const upList = await prisma.userPosition.findMany({
      where: {
        unitId: targetUnitId,
        isActive: true,
        endDate: null,
        user: { status: 'ACTIVE' },
      },
      include: {
        position: { select: { level: true, code: true } },
      },
      orderBy: { position: { level: 'desc' } },
    });

    if (upList.length === 0) return [];

    if (policy.unitRole === 'HEAD') {
      // Người có position.level cao nhất = trưởng đơn vị
      const topLevel = upList[0].position.level;
      return upList
        .filter((up) => up.position.level === topLevel)
        .map((up) => up.userId)
        .slice(0, 1);
    }

    if (policy.unitRole === 'DEPUTY_HEAD') {
      // Người có position.level cao thứ hai
      const levels = [...new Set(upList.map((up) => up.position.level))].sort((a, b) => b - a);
      if (levels.length < 2) return [];
      const deputyLevel = levels[1];
      return upList
        .filter((up) => up.position.level === deputyLevel)
        .map((up) => up.userId)
        .slice(0, 2);
    }

    return [];
  }

  /**
   * Tìm cấp trên trực tiếp của initiator.
   * Dùng Unit hierarchy: lấy parentId của unit initiator, rồi tìm HEAD của unit đó.
   */
  private async resolveSupervisor(ctx: PolicyResolveContext): Promise<string[]> {
    if (!ctx.initiatorUnitId) return [];

    // Tìm parent unit
    const unit = await prisma.unit.findUnique({
      where: { id: ctx.initiatorUnitId },
      select: { parentId: true },
    });
    if (!unit?.parentId) return [];

    // Tìm HEAD của parent unit
    const headPolicy: ApproverPolicy = { type: 'BY_UNIT_ROLE', unitRole: 'HEAD' };
    return this.resolveByUnitRole(headPolicy, {
      ...ctx,
      initiatorUnitId: unit.parentId,
    });
  }
}

export const ApproverPolicyResolver = new ApproverPolicyResolverClass();
