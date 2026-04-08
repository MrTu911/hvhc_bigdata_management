import "server-only";
/**
 * Soft Delete Prisma Middleware
 * Intercepts delete operations and converts them to soft deletes
 * Auto-filters deleted records in queries
 * 
 * Business tables with soft delete:
 * - CareerHistory
 * - PolicyRecord
 * - PartyMember
 * - PartyActivity
 * - InsuranceInfo
 * - MedicalRecord
 * - FamilyRelation
 */

import { Prisma } from '@prisma/client';

/**
 * Models that support soft delete
 * These tables have deletedAt, deletedBy fields
 */
export const SOFT_DELETE_MODELS = [
  'CareerHistory',
  'PolicyRecord',
  'PartyMember', 
  'PartyActivity',
  'InsuranceInfo',
  'MedicalRecord',
  'FamilyRelation',
] as const;

export type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number];

/**
 * Check if a model supports soft delete
 */
export function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

/**
 * Soft delete middleware for Prisma
 * 
 * Behaviors:
 * 1. delete -> update deletedAt
 * 2. deleteMany -> updateMany deletedAt
 * 3. findUnique/findFirst/findMany -> filter deletedAt = null
 * 
 * To query deleted records, use:
 * prisma.model.findMany({ where: { deletedAt: { not: null } } })
 * 
 * To include deleted records:
 * prisma.model.findMany({ where: { OR: [{ deletedAt: null }, { deletedAt: { not: null } }] } })
 */
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  const model = params.model;
  
  if (!model || !isSoftDeleteModel(model)) {
    return next(params);
  }
  
  // Intercept delete operations
  if (params.action === 'delete') {
    // Convert delete to update
    params.action = 'update';
    params.args['data'] = {
      deletedAt: new Date(),
      // deletedBy should be set by the caller if needed
    };
    return next(params);
  }
  
  if (params.action === 'deleteMany') {
    // Convert deleteMany to updateMany
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
    return next(params);
  }
  
  // Auto-filter deleted records in queries
  if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'].includes(params.action)) {
    // Initialize args and where if needed
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    
    // Only filter if deletedAt is not explicitly queried
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
    
    return next(params);
  }
  
  // For update/updateMany, don't auto-filter (allow updating deleted records if needed)
  
  return next(params);
};

/**
 * Hard delete function for when you really need to delete
 * Use sparingly - only for data retention compliance
 */
export async function hardDelete(
  prisma: any,
  model: SoftDeleteModel,
  where: Record<string, any>
): Promise<number> {
  // Use raw query to bypass middleware
  const tableName = model.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1) + 's';
  
  const whereClause = Object.entries(where)
    .map(([key, value]) => `"${key}" = '${value}'`)
    .join(' AND ');
  
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "${tableName}" WHERE ${whereClause}`
  );
  
  return Number(result);
}

/**
 * Restore soft-deleted record
 */
export async function restoreSoftDeleted(
  prisma: any,
  model: SoftDeleteModel,
  id: string
): Promise<boolean> {
  try {
    // Use raw query to bypass middleware filter
    const tableName = model.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1) + 's';
    
    await prisma.$executeRawUnsafe(
      `UPDATE "${tableName}" SET "deletedAt" = NULL, "deletedBy" = NULL WHERE "id" = $1`,
      id
    );
    
    return true;
  } catch (error) {
    console.error(`Failed to restore ${model} ${id}:`, error);
    return false;
  }
}

/**
 * Get deleted records for a model
 */
export async function getDeletedRecords(
  prisma: any,
  model: SoftDeleteModel,
  options: {
    limit?: number;
    offset?: number;
    deletedAfter?: Date;
    deletedBefore?: Date;
  } = {}
) {
  const { limit = 50, offset = 0, deletedAfter, deletedBefore } = options;
  
  const tableName = model.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1) + 's';
  
  let whereClause = '"deletedAt" IS NOT NULL';
  
  if (deletedAfter) {
    whereClause += ` AND "deletedAt" >= '${deletedAfter.toISOString()}'`;
  }
  if (deletedBefore) {
    whereClause += ` AND "deletedAt" <= '${deletedBefore.toISOString()}'`;
  }
  
  const records = await prisma.$queryRawUnsafe(
    `SELECT * FROM "${tableName}" WHERE ${whereClause} ORDER BY "deletedAt" DESC LIMIT $1 OFFSET $2`,
    limit,
    offset
  );
  
  return records;
}
