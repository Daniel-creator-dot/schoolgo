const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function fixLeaveDays() {
  try {
    const result = await pool.query(`
      UPDATE leave_requests 
      SET leave_days = (EXTRACT(DAY FROM (end_date::timestamp - start_date::timestamp)) + 1)
      WHERE leave_days IS NULL OR leave_days = 0 
      OR leave_days < 1
    `);
    console.log('Fixed', result.rowCount, 'leave request(s)');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

fixLeaveDays();
