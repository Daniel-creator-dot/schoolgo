import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixJane() {
  const email = 'jane.smith@omnischool.local';
  const passHash = '$2b$10$vgjiW1zoJSnwA/UMD7V0VuDCOUw9O4Riuo5YOzc8JWvjOmraZHlX.';
  // Default org
  const orgId = "cd15a058-082a-417b-a558-2241e0d3d2f1";

  try {
    const colsRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    const cols = colsRes.rows.map(r => r.column_name);
    console.log("Users table columns:", cols);
    
    // Assuming the password column might be 'password'
    const passwordCol = cols.includes('password_hash') ? 'password_hash' : 'password';

    const res = await pool.query(
      `INSERT INTO users (name, email, ${passwordCol}, role, org_id) 
       VALUES ($1, $2, $3, 'STAFF', $4) 
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email`,
      ['Jane Smith', email, passHash, orgId]
    );
    console.log("Inserted User:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

fixJane();
