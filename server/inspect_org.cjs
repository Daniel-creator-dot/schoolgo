require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'organizations'");
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
check();
