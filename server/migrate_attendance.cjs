const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function migrate() {
  try {
    await pool.query("ALTER TABLE organizations ADD COLUMN attendance_include_weekends BOOLEAN DEFAULT false;");
    console.log("Successfully added attendance_include_weekends to organizations.");
  } catch(e) {
    console.error("Migration failed or already applied:", e.message);
  }
  process.exit(0);
}

migrate();
