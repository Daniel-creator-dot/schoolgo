import pool from './server/db.ts';
import fs from 'fs';
import path from 'path';

async function deploySchema() {
  try {
    const schemaPath = path.resolve('supabase_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Deploying full schema to Supabase...');
    
    // Split the SQL into manageable blocks of 100 statements or use a single transaction if possible
    // Note: Some drivers fail on very large strings with multiple statements, but pg usually handles it.
    await pool.query(sql);

    console.log('Schema deployment successful!');
    process.exit(0);
  } catch (err: any) {
    console.error('Schema deployment failed:', err);
    process.exit(1);
  }
}

deploySchema();
