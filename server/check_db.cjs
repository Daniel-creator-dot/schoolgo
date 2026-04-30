const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function check() {
  const orgs = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations'");
  console.log('organizations columns:', orgs.rows.map(r => r.column_name).join(', '));
  const cals = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'calendar_events'");
  console.log('calendar_events columns:', cals.rows.map(r => r.column_name).join(', '));
  process.exit(0);
}

check();
