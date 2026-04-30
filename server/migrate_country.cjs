const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function migrate() {
  try {
    await pool.query("ALTER TABLE organizations ADD COLUMN country_code VARCHAR(10);");
    console.log("Successfully added country_code to organizations.");
  } catch(e) {
    console.error("Migration failed or already applied:", e.message);
  }
  process.exit(0);
}

migrate();
