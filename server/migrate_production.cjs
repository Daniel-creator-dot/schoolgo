require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    const client = await pool.connect();
    console.log("Connected to production database.");
    
    try {
      await client.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS attendance_include_weekends BOOLEAN DEFAULT false;");
      console.log("Successfully added attendance_include_weekends.");
    } catch (e) {
      console.log("Note: attendance_include_weekends might already exist.");
    }

    try {
      await client.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);");
      console.log("Successfully added country_code.");
    } catch (e) {
      console.log("Note: country_code might already exist.");
    }

    client.release();
  } catch(e) {
    console.error("Migration failed:", e.message);
  }
  process.exit(0);
}

migrate();
