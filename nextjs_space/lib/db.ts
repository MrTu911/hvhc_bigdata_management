import "server-only";
import { PrismaClient } from '@prisma/client'
import { softDeleteMiddleware } from './soft-delete-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn'] 
      : ['error'],
  })
  
  // Apply soft delete middleware
  client.$use(softDeleteMiddleware)
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

// Alias for backward compatibility with raw SQL queries
export const db = {
  query: async (text: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }> => {
    // Note: Prisma doesn't support raw parameterized queries directly
    // This is a compatibility layer - in production, use Prisma's typed queries
    const result = await prisma.$queryRawUnsafe(text, ...(params || []));
    const rows = Array.isArray(result) ? result : [result];
    return { rows, rowCount: rows.length };
  }
};
