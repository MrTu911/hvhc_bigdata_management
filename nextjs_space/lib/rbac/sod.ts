/**
 * Separation of Duties (SoD) - Phân tách trách nhiệm
 * Ngăn chặn user có quyền xung đột (VD: CREATE_GRADE + APPROVE_GRADE)
 */

import prisma from '@/lib/db';
import { ConflictSeverity } from '@prisma/client';

export interface SoDCheckResult {
  hasConflict: boolean;
  conflicts: {
    functionCodeA: string;
    functionCodeB: string;
    description: string | null;
    severity: ConflictSeverity;
  }[];
  blockedFunctions: string[];
  warnings: string[];
}

/**
 * Kiểm tra xung đột quyền khi gán thêm function cho user
 * @param userId - ID user
 * @param newFunctionCode - Function code mới cần gán
 * @returns SoDCheckResult
 */
export async function checkSoDConflict(
  userId: string,
  newFunctionCode: string
): Promise<SoDCheckResult> {
  const result: SoDCheckResult = {
    hasConflict: false,
    conflicts: [],
    blockedFunctions: [],
    warnings: [],
  };

  try {
    // 1. Lấy tất cả function codes mà user hiện có
    const userPositions = await prisma.userPosition.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        position: {
          include: {
            functions: {
              where: { isActive: true },
              include: {
                function: true,
              },
            },
          },
        },
      },
    });

    // Tập hợp tất cả function codes hiện có
    const existingFunctions = new Set<string>();
    userPositions.forEach((up) => {
      up.position.functions.forEach((pf) => {
        existingFunctions.add(pf.function.code);
      });
    });

    // 2. Kiểm tra xung đột với function mới
    const conflicts = await prisma.permissionConflict.findMany({
      where: {
        isActive: true,
        OR: [
          {
            functionCodeA: newFunctionCode,
            functionCodeB: { in: Array.from(existingFunctions) },
          },
          {
            functionCodeB: newFunctionCode,
            functionCodeA: { in: Array.from(existingFunctions) },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      result.hasConflict = true;
      conflicts.forEach((c) => {
        result.conflicts.push({
          functionCodeA: c.functionCodeA,
          functionCodeB: c.functionCodeB,
          description: c.description,
          severity: c.severity,
        });

        if (c.severity === 'BLOCK') {
          result.blockedFunctions.push(newFunctionCode);
        } else {
          result.warnings.push(
            `Cảnh báo: ${c.description || `Xung đột giữa ${c.functionCodeA} và ${c.functionCodeB}`}`
          );
        }
      });
    }
  } catch (error) {
    console.error('SoD Check Error:', error);
  }

  return result;
}

/**
 * Kiểm tra xung đột trong một hành động workflow
 * VD: User đang submit điểm, kiểm tra xem họ có quyền approve cùng điểm đó không
 * @param userId - ID user
 * @param actionFunctionCode - Function code của action đang thực hiện (VD: SUBMIT_GRADE)
 * @param conflictFunctionCode - Function code xung đột (VD: APPROVE_GRADE)
 * @returns true nếu có xung đột cần chặn
 */
export async function checkWorkflowSoD(
  userId: string,
  actionFunctionCode: string,
  conflictFunctionCode: string
): Promise<{ blocked: boolean; reason?: string }> {
  try {
    // Kiểm tra xem có rule SoD nào chặn việc cùng user có cả 2 quyền không
    const conflict = await prisma.permissionConflict.findFirst({
      where: {
        isActive: true,
        severity: 'BLOCK',
        OR: [
          { functionCodeA: actionFunctionCode, functionCodeB: conflictFunctionCode },
          { functionCodeA: conflictFunctionCode, functionCodeB: actionFunctionCode },
        ],
      },
    });

    if (!conflict) {
      return { blocked: false };
    }

    // Kiểm tra user có cả 2 quyền không
    const userPositions = await prisma.userPosition.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      include: {
        position: {
          include: {
            functions: {
              where: { isActive: true },
              include: { function: true },
            },
          },
        },
      },
    });

    const userFunctions = new Set<string>();
    userPositions.forEach((up) => {
      up.position.functions.forEach((pf) => {
        userFunctions.add(pf.function.code);
      });
    });

    const hasAction = userFunctions.has(actionFunctionCode);
    const hasConflict = userFunctions.has(conflictFunctionCode);

    if (hasAction && hasConflict) {
      return {
        blocked: true,
        reason: conflict.description || 
          `Không được thực hiện ${actionFunctionCode} vì bạn cũng có quyền ${conflictFunctionCode} (Separation of Duties)`,
      };
    }

    return { blocked: false };
  } catch (error) {
    console.error('Workflow SoD Check Error:', error);
    return { blocked: false };
  }
}

/**
 * Lấy danh sách tất cả SoD rules
 */
export async function getAllSoDRules() {
  return prisma.permissionConflict.findMany({
    where: { isActive: true },
    orderBy: [{ severity: 'desc' }, { functionCodeA: 'asc' }],
  });
}

/**
 * Default SoD rules cho hệ thống quân đội
 */
export const DEFAULT_SOD_RULES = [
  // Điểm: Không tự duyệt điểm
  {
    functionCodeA: 'CREATE_GRADE',
    functionCodeB: 'APPROVE_GRADE',
    description: 'Người tạo điểm không được tự duyệt điểm',
    severity: 'BLOCK' as ConflictSeverity,
  },
  {
    functionCodeA: 'SUBMIT_GRADE',
    functionCodeB: 'APPROVE_GRADE',
    description: 'Người nộp điểm không được tự duyệt điểm',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Nghiên cứu: Không tự duyệt đề tài
  {
    functionCodeA: 'CREATE_RESEARCH',
    functionCodeB: 'APPROVE_RESEARCH',
    description: 'Người đăng ký đề tài không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  {
    functionCodeA: 'SUBMIT_RESEARCH',
    functionCodeB: 'APPROVE_RESEARCH',
    description: 'Người nộp đề tài không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Thi đua khen thưởng: Không tự đề xuất và duyệt
  {
    functionCodeA: 'CREATE_AWARD',
    functionCodeB: 'APPROVE_AWARD',
    description: 'Người đề xuất khen thưởng không được tự duyệt',
    severity: 'BLOCK' as ConflictSeverity,
  },
  // Quản lý user: Không tự gán quyền cao
  {
    functionCodeA: 'UPDATE_USER',
    functionCodeB: 'ASSIGN_ADMIN',
    description: 'Người quản lý user không được tự gán quyền Admin',
    severity: 'WARN' as ConflictSeverity,
  },
];
