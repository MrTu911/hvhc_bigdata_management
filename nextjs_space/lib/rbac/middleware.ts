/**
 * RBAC Middleware cho API Routes v8.3
 * 
 * TÍNH NĂNG MỚI:
 * - Tích hợp Rate Limiting theo nhóm endpoint
 * - AI endpoints: 10 req/min
 * - Export endpoints: 5 req/min
 * - Sensitive endpoints: 20 req/min
 * - Default: 100 req/min
 * 
 * Sử dụng:
 * import { withRBAC, withFunction, requireFunction } from '@/lib/rbac/middleware';
 * 
 * // Cách 1: HOC wrapper
 * export const GET = withFunction('VIEW_PERSONNEL')(async (req, { user, context }) => {
 *   // user đã được xác thực và có quyền VIEW_PERSONNEL
 *   return NextResponse.json({ data });
 * });
 * 
 * // Cách 2: Inline check
 * export async function POST(req: Request) {
 *   const authResult = await requireFunction(req, 'CREATE_PERSONNEL');
 *   if (!authResult.allowed) {
 *     return authResult.response;
 *   }
 *   const { user, context } = authResult;
 *   // ... logic
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authorize, authorizeAny, authorizeAll } from './authorize';
import { AuthUser, AuthContext, AuthResult } from './types';
import { logSecurityEvent } from '../audit';
import { createRateLimiter } from '../rate-limit';
import { touchUserSessions } from '../services/auth/auth-session.service';

// ===== RATE LIMIT CONFIGS =====

/**
 * Rate limit configs theo nhóm endpoint
 * Phân loại dựa trên function code prefix
 */
const rateLimitConfigs = {
  // AI endpoints: 10 req/min (tốn tài nguyên)
  AI: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rbac-ai',
    message: 'Quá nhiều yêu cầu AI. Vui lòng đợi 1 phút.',
  }),
  
  // Export endpoints: 5 req/min (tốn băng thông)
  EXPORT: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'rbac-export',
    message: 'Quá nhiều yêu cầu xuất dữ liệu. Vui lòng đợi 1 phút.',
  }),
  
  // Sensitive endpoints: 20 req/min (bảo mật)
  SENSITIVE: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'rbac-sensitive',
    message: 'Quá nhiều yêu cầu. Vui lòng đợi 1 phút.',
  }),
  
  // Delete/destructive operations: 10 req/min
  DELETE: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rbac-delete',
    message: 'Quá nhiều yêu cầu xóa. Vui lòng đợi 1 phút.',
  }),
  
  // Default: 100 req/min
  DEFAULT: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'rbac-default',
    message: 'Quá nhiều yêu cầu. Vui lòng giảm tần suất.',
  }),
};

/**
 * Xác định rate limiter dựa trên function code
 */
function getRateLimiter(functionCode: string) {
  const code = functionCode.toUpperCase();
  
  // AI endpoints
  if (code.includes('AI.') || code.includes('AI_') || 
      code.includes('PREDICT') || code.includes('ANALYZE') ||
      code.includes('SENTIMENT') || code.includes('RECOMMEND')) {
    return rateLimitConfigs.AI;
  }
  
  // Export endpoints
  if (code.includes('EXPORT') || code.includes('DOWNLOAD') || 
      code.includes('GENERATE_REPORT')) {
    return rateLimitConfigs.EXPORT;
  }
  
  // Delete operations
  if (code.includes('DELETE') || code.includes('REMOVE') || 
      code.includes('PURGE')) {
    return rateLimitConfigs.DELETE;
  }
  
  // Sensitive endpoints (admin, security, audit)
  if (code.includes('SYSTEM.') || code.includes('MANAGE_') || 
      code.includes('ADMIN') || code.includes('AUDIT') ||
      code.includes('SECURITY') || code.includes('RBAC')) {
    return rateLimitConfigs.SENSITIVE;
  }
  
  return rateLimitConfigs.DEFAULT;
}

/**
 * Options cho rate limiting
 */
export interface RateLimitOptions {
  /** Bỏ qua rate limit */
  skipRateLimit?: boolean;
  /** Override rate limiter */
  rateLimiter?: ReturnType<typeof createRateLimiter>;
}

// ===== TYPES =====

export interface RBACContext {
  user: AuthUser;
  context: AuthContext;
  session: any;
}

export type RBACHandler = (
  request: NextRequest,
  rbacContext: RBACContext
) => Promise<NextResponse> | NextResponse;

export interface RequireResult {
  allowed: boolean;
  user?: AuthUser;
  context?: AuthContext;
  session?: any;
  response?: NextResponse;
  authResult?: AuthResult;
  rateLimitRemaining?: number;
}

// ===== HELPER FUNCTIONS =====

/**
 * Extract user from session for RBAC
 */
export function sessionToAuthUser(session: any): AuthUser | null {
  if (!session?.user) return null;
  
  return {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name,
    role: session.user.role,
    unitId: session.user.unitId,
    department: session.user.department || session.user.departmentId,
  };
}

/**
 * Extract context from request (body, params, query)
 */
export async function extractContext(
  request: NextRequest,
  additionalContext?: AuthContext
): Promise<AuthContext> {
  const context: AuthContext = { ...additionalContext };
  
  // Extract from URL params
  const url = new URL(request.url);
  const resourceId = url.searchParams.get('id') || url.searchParams.get('resourceId');
  const unitId = url.searchParams.get('unitId');
  const targetUnitId = url.searchParams.get('targetUnitId');
  
  if (resourceId) context.resourceId = resourceId;
  if (unitId) context.resourceUnitId = unitId;
  if (targetUnitId) context.targetUnitId = targetUnitId;
  
  // Try to extract from body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      
      if (body.id && !context.resourceId) context.resourceId = body.id;
      if (body.resourceId && !context.resourceId) context.resourceId = body.resourceId;
      if (body.unitId && !context.resourceUnitId) context.resourceUnitId = body.unitId;
      if (body.targetUnitId && !context.targetUnitId) context.targetUnitId = body.targetUnitId;
      if (body.resourceOwnerId) context.resourceOwnerId = body.resourceOwnerId;
    } catch {
      // Body is not JSON, skip
    }
  }
  
  return context;
}

/**
 * Create error response
 */
function createErrorResponse(status: number, message: string, code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: code || 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

// ===== MIDDLEWARE FUNCTIONS =====

/**
 * Kiểm tra quyền và trả về kết quả
 * Tích hợp Rate Limiting tự động theo function code
 * 
 * @example
 * export async function POST(req: Request) {
 *   const authResult = await requireFunction(req, 'CREATE_PERSONNEL');
 *   if (!authResult.allowed) {
 *     return authResult.response;
 *   }
 *   const { user, context } = authResult;
 *   // ... business logic
 * }
 */
export async function requireFunction(
  request: NextRequest | Request,
  functionCode: string,
  additionalContext?: AuthContext,
  options?: RateLimitOptions
): Promise<RequireResult> {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Chưa đăng nhập', 'NOT_AUTHENTICATED'),
      };
    }
    
    // Convert to AuthUser
    const user = sessionToAuthUser(session);
    if (!user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Phiên làm việc không hợp lệ', 'INVALID_SESSION'),
      };
    }
    
    // Rate Limiting (trước khi authorize để chặn spam)
    const nextRequest = request as NextRequest;
    if (!options?.skipRateLimit) {
      const limiter = options?.rateLimiter || getRateLimiter(functionCode);
      const rateLimitResult = await limiter(nextRequest, user.id);
      
      if (!rateLimitResult.allowed) {
        // Log rate limit exceeded
        await logSecurityEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          userId: user.id,
          severity: 'MEDIUM',
          details: {
            userEmail: user.email,
            functionCode,
            path: nextRequest.nextUrl?.pathname,
          },
        });
        
        return {
          allowed: false,
          response: rateLimitResult.response,
        };
      }
    }
    
    // Extract context
    const context = await extractContext(nextRequest, additionalContext);
    
    // Authorize
    const authResult = await authorize(user, functionCode, context);
    
    if (!authResult.allowed) {
      // Log security event for denied access
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        severity: 'MEDIUM',
        details: {
          userEmail: user.email,
          functionCode,
          context,
          deniedReason: authResult.deniedReason,
          scope: authResult.scope,
        },
      });
      
      return {
        allowed: false,
        response: createErrorResponse(403, authResult.deniedReason || 'Không có quyền thực hiện', 'FORBIDDEN'),
        authResult,
      };
    }
    
    // UC-06: Touch session — fire-and-forget, không block request
    touchUserSessions(user.id).catch(() => {});

    return {
      allowed: true,
      user,
      context,
      session,
      authResult,
    };
  } catch (error) {
    console.error('[RBAC Middleware] Error:', error);
    return {
      allowed: false,
      response: createErrorResponse(500, 'Lỗi hệ thống khi kiểm tra quyền', 'INTERNAL_ERROR'),
    };
  }
}

/**
 * Kiểm tra ít nhất một trong các quyền (OR logic)
 * Tích hợp Rate Limiting tự động
 */
export async function requireAnyFunction(
  request: NextRequest | Request,
  functionCodes: string[],
  additionalContext?: AuthContext,
  options?: RateLimitOptions
): Promise<RequireResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Chưa đăng nhập', 'NOT_AUTHENTICATED'),
      };
    }
    
    const user = sessionToAuthUser(session);
    if (!user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Phiên làm việc không hợp lệ', 'INVALID_SESSION'),
      };
    }
    
    // Rate Limiting - sử dụng function code đầu tiên để xác định limiter
    const nextRequest = request as NextRequest;
    if (!options?.skipRateLimit && functionCodes.length > 0) {
      const limiter = options?.rateLimiter || getRateLimiter(functionCodes[0]);
      const rateLimitResult = await limiter(nextRequest, user.id);
      
      if (!rateLimitResult.allowed) {
        await logSecurityEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          userId: user.id,
          severity: 'MEDIUM',
          details: {
            userEmail: user.email,
            functionCodes,
            path: nextRequest.nextUrl?.pathname,
          },
        });
        
        return {
          allowed: false,
          response: rateLimitResult.response,
        };
      }
    }
    
    const context = await extractContext(nextRequest, additionalContext);
    
    const authResult = await authorizeAny(user, functionCodes, context);
    
    if (!authResult.allowed) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        severity: 'MEDIUM',
        details: {
          userEmail: user.email,
          functionCodes,
          context,
          deniedReason: authResult.deniedReason,
        },
      });
      
      return {
        allowed: false,
        response: createErrorResponse(403, authResult.deniedReason || 'Không có quyền thực hiện', 'FORBIDDEN'),
        authResult,
      };
    }
    
    touchUserSessions(user.id).catch(() => {});
    return { allowed: true, user, context, session, authResult };
  } catch (error) {
    console.error('[RBAC Middleware] Error:', error);
    return {
      allowed: false,
      response: createErrorResponse(500, 'Lỗi hệ thống', 'INTERNAL_ERROR'),
    };
  }
}

/**
 * Kiểm tra tất cả các quyền (AND logic)
 * Tích hợp Rate Limiting tự động
 */
export async function requireAllFunctions(
  request: NextRequest | Request,
  functionCodes: string[],
  additionalContext?: AuthContext,
  options?: RateLimitOptions
): Promise<RequireResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Chưa đăng nhập', 'NOT_AUTHENTICATED'),
      };
    }
    
    const user = sessionToAuthUser(session);
    if (!user) {
      return {
        allowed: false,
        response: createErrorResponse(401, 'Phiên làm việc không hợp lệ', 'INVALID_SESSION'),
      };
    }
    
    // Rate Limiting - sử dụng function code đầu tiên để xác định limiter
    const nextRequest = request as NextRequest;
    if (!options?.skipRateLimit && functionCodes.length > 0) {
      const limiter = options?.rateLimiter || getRateLimiter(functionCodes[0]);
      const rateLimitResult = await limiter(nextRequest, user.id);
      
      if (!rateLimitResult.allowed) {
        await logSecurityEvent({
          eventType: 'RATE_LIMIT_EXCEEDED',
          userId: user.id,
          severity: 'HIGH',
          details: {
            userEmail: user.email,
            functionCodes,
            path: nextRequest.nextUrl?.pathname,
          },
        });
        
        return {
          allowed: false,
          response: rateLimitResult.response,
        };
      }
    }
    
    const context = await extractContext(nextRequest, additionalContext);
    
    const authResult = await authorizeAll(user, functionCodes, context);
    
    if (!authResult.allowed) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS',
        userId: user.id,
        severity: 'HIGH',
        details: {
          userEmail: user.email,
          functionCodes,
          context,
          deniedReason: authResult.deniedReason,
        },
      });
      
      return {
        allowed: false,
        response: createErrorResponse(403, authResult.deniedReason || 'Không có quyền thực hiện', 'FORBIDDEN'),
        authResult,
      };
    }
    
    touchUserSessions(user.id).catch(() => {});
    return { allowed: true, user, context, session, authResult };
  } catch (error) {
    console.error('[RBAC Middleware] Error:', error);
    return {
      allowed: false,
      response: createErrorResponse(500, 'Lỗi hệ thống', 'INTERNAL_ERROR'),
    };
  }
}

// ===== HOC WRAPPERS =====

/**
 * Higher-Order Component để wrap API route với RBAC
 * 
 * @example
 * export const GET = withFunction('VIEW_PERSONNEL')(async (req, { user, context }) => {
 *   const data = await prisma.user.findMany();
 *   return NextResponse.json({ success: true, data });
 * });
 */
export function withFunction(functionCode: string, additionalContext?: AuthContext) {
  return (handler: RBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireFunction(request, functionCode, additionalContext);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      return handler(request, {
        user: result.user!,
        context: result.context!,
        session: result.session,
      });
    };
  };
}

/**
 * Wrap với OR logic (ít nhất một quyền)
 */
export function withAnyFunction(functionCodes: string[], additionalContext?: AuthContext) {
  return (handler: RBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireAnyFunction(request, functionCodes, additionalContext);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      return handler(request, {
        user: result.user!,
        context: result.context!,
        session: result.session,
      });
    };
  };
}

/**
 * Wrap với AND logic (tất cả các quyền)
 */
export function withAllFunctions(functionCodes: string[], additionalContext?: AuthContext) {
  return (handler: RBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireAllFunctions(request, functionCodes, additionalContext);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      return handler(request, {
        user: result.user!,
        context: result.context!,
        session: result.session,
      });
    };
  };
}

// ===== QUICK AUTH CHECK =====

/**
 * Kiểm tra đăng nhập cơ bản (không kiểm tra quyền cụ thể)
 */
export async function requireAuth(
  request: NextRequest | Request
): Promise<RequireResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return {
      allowed: false,
      response: createErrorResponse(401, 'Chưa đăng nhập', 'NOT_AUTHENTICATED'),
    };
  }
  
  const user = sessionToAuthUser(session);
  if (!user) {
    return {
      allowed: false,
      response: createErrorResponse(401, 'Phiên làm việc không hợp lệ', 'INVALID_SESSION'),
    };
  }
  
  return { allowed: true, user, session };
}

/**
 * HOC wrapper cho auth cơ bản
 */
export function withAuth() {
  return (handler: RBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireAuth(request);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      return handler(request, {
        user: result.user!,
        context: {},
        session: result.session,
      });
    };
  };
}

// ===== SCOPED SERVICE HELPERS =====

import { FunctionScope } from '@prisma/client';
import { ScopedQueryOptions } from '@/lib/services/base-service';

export interface ScopedRBACContext extends RBACContext {
  scope: FunctionScope;
  scopedOptions: ScopedQueryOptions;
}

export type ScopedRBACHandler = (
  request: NextRequest,
  scopedContext: ScopedRBACContext
) => Promise<NextResponse> | NextResponse;

/**
 * Lấy scope từ auth result
 */
export function getScopeFromAuthResult(authResult?: AuthResult): FunctionScope {
  return authResult?.scope || 'SELF';
}

/**
 * Tạo ScopedQueryOptions từ RBAC context
 */
export function createScopedOptions(
  user: AuthUser,
  authResult?: AuthResult
): ScopedQueryOptions {
  return {
    user,
    scope: getScopeFromAuthResult(authResult),
    includeInactive: false,
  };
}

/**
 * HOC với tự động scope integration
 * Trả về scopedOptions để dùng với Service Layer
 * 
 * @example
 * export const GET = withScopedFunction('VIEW_PERSONNEL')(async (req, { user, scopedOptions }) => {
 *   const result = await PersonnelService.findMany(scopedOptions, filters);
 *   return NextResponse.json(result);
 * });
 */
export function withScopedFunction(functionCode: string, additionalContext?: AuthContext) {
  return (handler: ScopedRBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireFunction(request, functionCode, additionalContext);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      const scope = getScopeFromAuthResult(result.authResult);
      const scopedOptions = createScopedOptions(result.user!, result.authResult);
      
      return handler(request, {
        user: result.user!,
        context: result.context!,
        session: result.session,
        scope,
        scopedOptions,
      });
    };
  };
}

/**
 * HOC với multiple functions (OR) và scope
 */
export function withAnyScopedFunction(functionCodes: string[], additionalContext?: AuthContext) {
  return (handler: ScopedRBACHandler) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const result = await requireAnyFunction(request, functionCodes, additionalContext);
      
      if (!result.allowed) {
        return result.response!;
      }
      
      const scope = getScopeFromAuthResult(result.authResult);
      const scopedOptions = createScopedOptions(result.user!, result.authResult);
      
      return handler(request, {
        user: result.user!,
        context: result.context!,
        session: result.session,
        scope,
        scopedOptions,
      });
    };
  };
}

/**
 * Inline version: requireFunction + get scopedOptions
 */
export async function requireScopedFunction(
  request: NextRequest | Request,
  functionCode: string,
  additionalContext?: AuthContext
): Promise<RequireResult & { scope?: FunctionScope; scopedOptions?: ScopedQueryOptions }> {
  const result = await requireFunction(request, functionCode, additionalContext);
  
  if (!result.allowed) {
    return result;
  }
  
  const scope = getScopeFromAuthResult(result.authResult);
  const scopedOptions = createScopedOptions(result.user!, result.authResult);
  
  return {
    ...result,
    scope,
    scopedOptions,
  };
}
