import pool from './db.ts';

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.table(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
