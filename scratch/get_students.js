import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getStudents() {
  const orgId = "cd15a058-082a-417b-a558-2241e0d3d2f1";
  try {
    const res = await pool.query("SELECT id, name FROM students WHERE org_id = $1 LIMIT 10", [orgId]);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

getStudents();
