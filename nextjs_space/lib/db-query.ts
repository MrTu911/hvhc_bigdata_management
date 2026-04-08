// Database query wrapper for non-Prisma queries
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export const db = {
  query: async (text: string, params?: any[]) => {
    const client = await pool.connect();
    try {
      return await client.query(text, params);
    } finally {
      client.release();
    }
  }
};
