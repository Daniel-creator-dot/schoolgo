import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});

async function run() {
  try {
    // 1. Get all table names
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log('Tables:', tables.rows.map(r => r.table_name).join(', '));
    
    // 2. Check student columns again to be absolutely sure
    const studentCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
    console.log('Student Columns:', studentCols.rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
