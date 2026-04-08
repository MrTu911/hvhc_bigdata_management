const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sqlFile = path.join(__dirname, 'sql_migrations', '006_data_processing_pipeline.sql');
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    
    console.log('Running migration: 006_data_processing_pipeline.sql');
    await client.query(sql);
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
