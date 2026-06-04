/**
 * Policy Calculation Service — M05
 *
 * Tính toán benefit/allowance và kiểm tra điều kiện hưởng chính sách.
 * Tách biệt khỏi policy-service.ts để không làm tăng thêm trách nhiệm.
 *
 * Quy tắc nghiệp vụ cốt lõi:
 * - EMULATION/REWARD bị block nếu person có DISCIPLINE record chưa hết hạn (ACTIVE).
 * - Calculation dựa vào requestedAmount từ PolicyRequest và category metadata.
 */

import { prisma } from '@/lib/db';
import { PolicyRecordType, PolicyRecordStatus } from '@prisma/client';

export interface EligibilityCheckResult {
  eligible: boolean;
  blockReasons: string[];
}

export interface PolicyCalculationResult {
  requestId: string;
  categoryCode: string;
  requestedAmount: number;
  estimatedAmount: number;
  currency: string;
  notes: string;
}

// ===== ELIGIBILITY =====

/**
 * Kiểm tra điều kiện hưởng chính sách cho userId.
 * Reward/Emulation bị block nếu còn kỷ luật ACTIVE chưa hết hạn.
 */
export async function validatePolicyEligibility(
  userId: string,
  requestType: PolicyRecordType
): Promise<EligibilityCheckResult> {
  const blockReasons: string[] = [];

  if (requestType === PolicyRecordType.EMULATION || requestType === PolicyRecordType.REWARD) {
    const activeDiscipline = await prisma.policyRecord.findFirst({
      where: {
        userId,
        recordType: PolicyRecordType.DISCIPLINE,
        status: PolicyRecordStatus.ACTIVE,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } },
        ],
      },
      select: { id: true, title: true, decisionDate: true },
    });

    if (activeDiscipline) {
      blockReasons.push(
        `Còn kỷ luật đang hiệu lực (${activeDiscipline.title ?? activeDiscipline.id}). Phải xóa kỷ luật trước khi xét khen thưởng.`
      );
    }
  }

  return { eligible: blockReasons.length === 0, blockReasons };
}

// ===== CALCULATION =====

/**
 * Tính toán preview benefit amount cho PolicyRequest.
 * Không commit vào DB — chỉ trả về kết quả dự tính.
 *
 * Chiến lược tính toán đơn giản hóa:
 * - Lấy requestedAmount từ PolicyRequest làm baseline.
 * - Nếu category.requiresApproval = true và approvalLevels > 1 → giảm 5% mỗi cấp duyệt (buffer).
 * - Trả về estimatedAmount cùng ghi chú.
 */
export async function calculateBenefitAmount(
  policyRequestId: string
): Promise<PolicyCalculationResult | null> {
  const request = await prisma.policyRequest.findUnique({
    where: { id: policyRequestId, deletedAt: null },
    select: {
      id: true,
      requestedAmount: true,
      currency: true,
      category: {
        select: { code: true, requiresApproval: true, approvalLevels: true },
      },
    },
  });

  if (!request) return null;

  const baseAmount = request.requestedAmount ? Number(request.requestedAmount) : 0;
  const { approvalLevels, requiresApproval } = request.category;

  // Buffer nhỏ mỗi cấp duyệt (hệ số tham chiếu, không phải công thức pháp lý)
  const levelBuffer = requiresApproval && approvalLevels > 1 ? 0.95 ** (approvalLevels - 1) : 1;
  const estimatedAmount = Math.round(baseAmount * levelBuffer);

  return {
    requestId: policyRequestId,
    categoryCode: request.category.code,
    requestedAmount: baseAmount,
    estimatedAmount,
    currency: request.currency,
    notes: requiresApproval
      ? `Cần ${approvalLevels} cấp duyệt — dự tính sau điều chỉnh cấp duyệt.`
      : 'Không cần phê duyệt — dự tính bằng requestedAmount.',
  };
}

// ===== AUTO-EXPIRY (dùng trong cron) =====

/**
 * Tự động chuyển PolicyRecord đã hết hạn sang EXPIRED.
 * Idempotent — an toàn khi gọi nhiều lần.
 * Trả về số record đã cập nhật.
 */
export async function expireOverduePolicyRecords(): Promise<number> {
  const result = await prisma.policyRecord.updateMany({
    where: {
      status: PolicyRecordStatus.ACTIVE,
      expiryDate: { lte: new Date() },
    },
    data: { status: PolicyRecordStatus.EXPIRED },
  });
  return result.count;
}
