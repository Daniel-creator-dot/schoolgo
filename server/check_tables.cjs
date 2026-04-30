const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function check() {
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  console.log('tables:', tables.rows.map(r => r.table_name).join(', '));
  process.exit(0);
}

check();
