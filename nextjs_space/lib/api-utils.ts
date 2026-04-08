/**
 * GĐ2.10: API Utilities - Query Validation & Pagination
 * Shared utilities for API routes
 */

import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// ===== Query Schemas =====

/**
 * Base pagination schema
 * - page: Số trang (mặc định 1)
 * - limit: Số bản ghi mỗi trang (mặc định 20, max 100)
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Search schema
 */
export const searchSchema = z.object({
  search: z.string().optional(),
  q: z.string().optional(), // Alias for search
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Combined list query schema
 */
export const listQuerySchema = paginationSchema
  .merge(searchSchema)
  .merge(sortSchema);

// ===== Helper Functions =====

/**
 * Parse and validate query parameters from URL
 */
export function parseQuery<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): z.infer<T> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return schema.parse(params);
}

/**
 * Safe parse query with error handling
 */
export function safeParseQuery<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return schema.safeParse(params);
}

/**
 * Create pagination response
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  };
}

/**
 * Create standard list response
 */
export function createListResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  additionalData?: Record<string, unknown>
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: createPaginationMeta(page, limit, total),
    ...additionalData,
  });
}

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string
) {
  return NextResponse.json(
    {
      success: false,
      error: { code: code || 'ERROR', message },
    },
    { status }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
) {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
}

// ===== Prisma Helpers =====

/**
 * Convert pagination params to Prisma skip/take
 */
export function toPrismaSkipTake(page: number, limit: number) {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Convert sort params to Prisma orderBy
 */
export function toPrismaOrderBy(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
  if (!sortBy) return undefined;
  return { [sortBy]: sortOrder };
}

/**
 * Convert search to Prisma contains query
 */
export function toPrismaSearch(search?: string, fields: string[] = ['name', 'email']) {
  if (!search) return undefined;
  return {
    OR: fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}

// ===== Validation Middleware =====

/**
 * Request body validation
 */
export async function validateBody<T extends z.ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        response: createErrorResponse(
          result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          400,
          'VALIDATION_ERROR'
        ),
      };
    }
    
    return { success: true, data: result.data };
  } catch {
    return {
      success: false,
      response: createErrorResponse('Invalid JSON body', 400, 'INVALID_JSON'),
    };
  }
}

// ===== Common Schemas =====

/**
 * Personnel list query schema
 */
export const personnelListSchema = listQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  workStatus: z.enum(['ACTIVE', 'RETIRED', 'TRANSFERRED', 'SUSPENDED', 'RESIGNED']).optional(),
  personnelType: z.string().optional(),
  rank: z.string().optional(),
});

/**
 * Student list query schema  
 */
export const studentListSchema = listQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  classId: z.string().optional(),
  status: z.string().optional(),
  academicYear: z.string().optional(),
});

/**
 * Faculty list query schema
 */
export const facultyListSchema = listQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  academicRank: z.string().optional(),
  academicDegree: z.string().optional(),
});

/**
 * Audit log query schema
 */
export const auditLogSchema = paginationSchema.extend({
  action: z.string().optional(),
  result: z.string().optional(),
  userId: z.string().uuid().optional(),
  resourceType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
