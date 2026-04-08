/**
 * AI Scope Guard - Lọc response AI theo quyền user
 * Ngăn chặn AI trả về dữ liệu vượt phạm vi quyền
 */

import { FunctionScope } from '@prisma/client';
import { getAccessibleUnitIds } from '@/lib/rbac/scope';
import prisma from '@/lib/db';

export interface AIUser {
  id: string;
  role: string;
  unitId?: string | null;
  maxScope?: FunctionScope;
}

export interface AIQueryContext {
  user: AIUser;
  query: string;
  requestedTables?: string[];
}

// Bảng nhạy cảm cần lọc theo scope
const SENSITIVE_TABLES = [
  'personnel',
  'faculty_profiles',
  'hoc_vien',
  'ket_qua_hoc_tap',
  'policy_records',
  'awards',
  'party_members',
  'career_history',
  'users',
];

// Từ khóa PII cần mask
const PII_KEYWORDS = [
  'cmnd', 'cccd', 'số điện thoại', 'phone', 'số tài khoản', 'account',
  'địa chỉ', 'address', 'ngày sinh', 'birth', 'lương', 'salary',
  'kỷ luật', 'discipline', 'bệnh', 'health', 'y tế',
];

/**
 * Kiểm tra query AI có yêu cầu dữ liệu nhạy cảm không
 */
export function detectSensitiveQuery(query: string): {
  isSensitive: boolean;
  reasons: string[];
} {
  const queryLower = query.toLowerCase();
  const reasons: string[] = [];

  // Kiểm tra từ khóa PII
  PII_KEYWORDS.forEach((keyword) => {
    if (queryLower.includes(keyword)) {
      reasons.push(`Chứa từ khóa nhạy cảm: ${keyword}`);
    }
  });

  // Kiểm tra yêu cầu "tất cả", "toàn bộ"
  const broadPatterns = [
    'tất cả cán bộ', 'toàn bộ nhân sự', 'danh sách toàn', 'all personnel',
    'export all', 'dump', 'toàn học viện', 'all students', 'tất cả học viên',
  ];
  broadPatterns.forEach((pattern) => {
    if (queryLower.includes(pattern)) {
      reasons.push(`Yêu cầu dữ liệu rộng: ${pattern}`);
    }
  });

  return {
    isSensitive: reasons.length > 0,
    reasons,
  };
}

/**
 * Tạo scope filter cho AI query
 * @param user User hiện tại
 * @returns SQL WHERE clause hoặc Prisma filter
 */
export async function buildAIScopeFilter(
  user: AIUser
): Promise<{
  unitIds: string[];
  scopeDescription: string;
}> {
  const scope = user.maxScope || 'SELF';

  if (scope === 'ACADEMY') {
    return {
      unitIds: [], // Empty = no filter (full access)
      scopeDescription: 'Toàn học viện',
    };
  }

  if (scope === 'DEPARTMENT' || scope === 'UNIT') {
    if (!user.unitId) {
      return {
        unitIds: [],
        scopeDescription: 'Chưa gán đơn vị',
      };
    }

    // Lấy đơn vị và các đơn vị con (dùng path nếu có)
    const unit = await prisma.unit.findUnique({
      where: { id: user.unitId },
    });

    if (!unit) {
      return { unitIds: [user.unitId], scopeDescription: 'Đơn vị hiện tại' };
    }

    // Nếu có path, lấy tất cả đơn vị con
    if (unit.path) {
      const childUnits = await prisma.unit.findMany({
        where: {
          path: { startsWith: unit.path },
          active: true,
        },
        select: { id: true },
      });
      return {
        unitIds: childUnits.map((u) => u.id),
        scopeDescription: `${unit.name} và các đơn vị con`,
      };
    }

    // Fallback: chỉ đơn vị hiện tại
    return {
      unitIds: [user.unitId],
      scopeDescription: unit.name,
    };
  }

  // SELF: chỉ dữ liệu bản thân
  return {
    unitIds: [],
    scopeDescription: 'Dữ liệu cá nhân',
  };
}

/**
 * Lọc kết quả AI theo scope
 */
export function filterAIResponseByScope(
  response: any,
  allowedUnitIds: string[],
  userId: string,
  scope: FunctionScope
): any {
  // Nếu ACADEMY scope hoặc không có filter -> trả về nguyên
  if (scope === 'ACADEMY' || allowedUnitIds.length === 0) {
    return response;
  }

  // Nếu là array, lọc từng item
  if (Array.isArray(response)) {
    return response.filter((item) => {
      // Kiểm tra unitId
      if (item.unitId && !allowedUnitIds.includes(item.unitId)) {
        return false;
      }
      // Kiểm tra SELF scope
      if (scope === 'SELF' && item.userId && item.userId !== userId) {
        return false;
      }
      return true;
    });
  }

  // Nếu là object, kiểm tra trực tiếp
  if (typeof response === 'object' && response !== null) {
    if (response.unitId && !allowedUnitIds.includes(response.unitId)) {
      return { error: 'Access denied - Out of scope' };
    }
    if (scope === 'SELF' && response.userId && response.userId !== userId) {
      return { error: 'Access denied - Not your data' };
    }
  }

  return response;
}

/**
 * Mask PII trong response AI
 */
export function maskPIIInResponse(text: string): string {
  let masked = text;

  // Mask số điện thoại
  masked = masked.replace(/0\d{9,10}/g, '0***XXX***');

  // Mask CMND/CCCD
  masked = masked.replace(/\b\d{9}\b/g, '***XXX***');
  masked = masked.replace(/\b\d{12}\b/g, '***XXXXXX***');

  // Mask email
  masked = masked.replace(
    /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+)\.([a-zA-Z0-9_-]+)/g,
    '***@***.***'
  );

  // Mask số tài khoản ngân hàng
  masked = masked.replace(/\b\d{10,16}\b/g, (match) => {
    if (match.length >= 10) {
      return match.substring(0, 4) + '****' + match.substring(match.length - 4);
    }
    return match;
  });

  return masked;
}

/**
 * Wrapper chính cho AI response
 */
export async function wrapAIResponse(
  user: AIUser,
  query: string,
  rawResponse: any
): Promise<{
  response: any;
  filtered: boolean;
  scopeInfo: string;
  warnings: string[];
}> {
  const warnings: string[] = [];

  // 1. Kiểm tra query nhạy cảm
  const sensitiveCheck = detectSensitiveQuery(query);
  if (sensitiveCheck.isSensitive) {
    warnings.push(...sensitiveCheck.reasons);
  }

  // 2. Build scope filter
  const scopeFilter = await buildAIScopeFilter(user);

  // 3. Lọc response theo scope
  const filteredResponse = filterAIResponseByScope(
    rawResponse,
    scopeFilter.unitIds,
    user.id,
    user.maxScope || 'SELF'
  );

  // 4. Mask PII nếu là text
  let finalResponse = filteredResponse;
  if (typeof filteredResponse === 'string') {
    finalResponse = maskPIIInResponse(filteredResponse);
  } else if (
    typeof filteredResponse === 'object' &&
    filteredResponse?.content
  ) {
    finalResponse = {
      ...filteredResponse,
      content: maskPIIInResponse(filteredResponse.content),
    };
  }

  return {
    response: finalResponse,
    filtered: scopeFilter.unitIds.length > 0 || sensitiveCheck.isSensitive,
    scopeInfo: scopeFilter.scopeDescription,
    warnings,
  };
}
