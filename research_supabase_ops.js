import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function research() {
  const tables = ['clubs', 'health_records', 'behavior_discipline', 'transport_routes', 'hostels'];
  try {
    for (const table of tables) {
      const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [table]);
      console.log(`${table}:`, res.rows.map(c => c.column_name));
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

research();
