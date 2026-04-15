import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function inspectSchema() {
  const client = await pool.connect();
  try {
    console.log('--- Inspecting Database Schema ---');
    
    // Check for tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    const tablesRes = await client.query(tablesQuery);
    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log('Tables found:', tableNames.join(', '));

    // Check columns for key tables
    const keyTables = ['organizations', 'subscriptions', 'plan_templates'];
    for (const table of keyTables) {
      if (tableNames.includes(table)) {
        const colsQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = $1
        `;
        const colsRes = await client.query(colsQuery, [table]);
        console.log(`\nColumns in ${table}:`);
        colsRes.rows.forEach(c => console.log(` - ${c.column_name} (${c.data_type})`));
      } else {
        console.log(`\nTable ${table} is MISSING!`);
      }
    }

  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

inspectSchema();
