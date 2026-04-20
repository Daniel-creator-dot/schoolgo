import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getStaff() {
  const orgId = "cd15a058-082a-417b-a558-2241e0d3d2f1";
  try {
    const res = await pool.query("SELECT id, name, role FROM staff WHERE org_id = $1 LIMIT 5", [orgId]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

getStaff();
