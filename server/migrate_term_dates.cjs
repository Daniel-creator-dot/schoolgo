require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    const client = await pool.connect();
    console.log("Connected to database.");
    
    await client.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS term_start_date DATE;");
    await client.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS term_end_date DATE;");
    
    console.log("Successfully added term_start_date and term_end_date.");
    client.release();
  } catch(e) {
    console.error("Migration failed:", e.message);
  }
  process.exit(0);
}

migrate();
