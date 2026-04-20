import pool from './db.ts';

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
    console.log('Students:', JSON.stringify(res.rows.map(r => r.column_name)));
    
    const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'results'");
    console.log('Results:', JSON.stringify(res2.rows.map(r => r.column_name)));

    const res3 = await pool.query("SELECT * FROM information_schema.tables WHERE table_name = 'results'");
    if (res3.rows.length === 0) {
        console.log("Table 'results' does not exist.");
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

check();
