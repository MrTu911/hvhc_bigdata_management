import "server-only";

/**
 * Query Executor
 * Xử lý thực thi query trên các hệ thống BigData khác nhau
 */

import { Pool } from 'pg';
import { QueryType } from '@prisma/client';

// PostgreSQL connection pool
const postgresPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '55432'),
  database: process.env.POSTGRES_DATABASE || 'hvhc_oltp',
  user: process.env.POSTGRES_USER || 'hvhc_admin',
  password: process.env.POSTGRES_PASSWORD || 'Hv2025_Postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Thực thi query PostgreSQL
 */
export async function executePostgresQuery(
  queryText: string,
  params?: any[]
): Promise<{ rows: any[]; rowCount: number; executionTime: number }> {
  const startTime = Date.now();
  
  try {
    const result = await postgresPool.query(queryText, params);
    const executionTime = Date.now() - startTime;
    
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      executionTime,
    };
  } catch (error: any) {
    throw new Error(`PostgreSQL Query Error: ${error.message}`);
  }
}

/**
 * Thực thi query ClickHouse
 */
export async function executeClickHouseQuery(
  queryText: string
): Promise<{ rows: any[]; rowCount: number; executionTime: number }> {
  const startTime = Date.now();
  
  try {
    const clickhouseUrl = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
    const username = process.env.CLICKHOUSE_USER || 'hvhc_click';
    const password = process.env.CLICKHOUSE_PASSWORD || 'Hv2025_Click';
    
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(clickhouseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/plain',
      },
      body: queryText + ' FORMAT JSON',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ClickHouse Error: ${errorText}`);
    }
    
    const data = await response.json();
    const executionTime = Date.now() - startTime;
    
    return {
      rows: data.data || [],
      rowCount: data.rows || 0,
      executionTime,
    };
  } catch (error: any) {
    throw new Error(`ClickHouse Query Error: ${error.message}`);
  }
}

/**
 * Router để thực thi query dựa trên query type
 */
export async function executeQuery(
  queryType: QueryType,
  queryText: string,
  params?: any[]
): Promise<{ rows: any[]; rowCount: number; executionTime: number }> {
  switch (queryType) {
    case QueryType.POSTGRESQL:
      return executePostgresQuery(queryText, params);
      
    case QueryType.CLICKHOUSE:
      return executeClickHouseQuery(queryText);
      
    case QueryType.HADOOP:
    case QueryType.SPARK:
      // TODO: Implement Spark/Hadoop query execution
      throw new Error('Hadoop/Spark queries not yet implemented');
      
    default:
      throw new Error(`Unsupported query type: ${queryType}`);
  }
}

/**
 * Validate query để tránh các query nguy hiểm (DROP, DELETE, TRUNCATE)
 */
// Wrapper for simple queries
export async function query(queryText: string, params?: any[]): Promise<{ rows: any[] }> {
  const result = await executePostgresQuery(queryText, params);
  return { rows: result.rows };
}

export function validateQuery(queryText: string): { valid: boolean; reason?: string } {
  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE'];
  const upperQuery = queryText.toUpperCase().trim();
  
  for (const keyword of dangerousKeywords) {
    if (upperQuery.includes(keyword)) {
      return {
        valid: false,
        reason: `Query contains dangerous keyword: ${keyword}. Only SELECT queries are allowed.`,
      };
    }
  }
  
  // Kiểm tra query bắt đầu bằng SELECT
  if (!upperQuery.startsWith('SELECT')) {
    return {
      valid: false,
      reason: 'Query must start with SELECT',
    };
  }
  
  return { valid: true };
}

/**
 * Cleanup connection pool (gọi khi server shutdown)
 */
export async function closeConnections() {
  await postgresPool.end();
}
