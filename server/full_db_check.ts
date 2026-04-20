import pool from './db.ts';

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log(res.rows.map(r => r.column_name).sort());
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
