import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function research() {
  try {
    const ST_PATRICK_ID = 'cd15a058-082a-417b-a558-2241e0d3d2f1';
    
    // Check classes
    const classes = await pool.query('SELECT id, name FROM classes WHERE org_id = $1', [ST_PATRICK_ID]);
    console.log('Classes in St Patrick:', JSON.stringify(classes.rows));

    // Check subjects
    const subjects = await pool.query('SELECT id, name FROM subjects WHERE org_id = $1', [ST_PATRICK_ID]);
    console.log('Subjects in St Patrick:', JSON.stringify(subjects.rows));

    // Check staff
    const staff = await pool.query('SELECT id, name FROM staff WHERE org_id = $1', [ST_PATRICK_ID]);
    console.log('Staff in St Patrick:', JSON.stringify(staff.rows));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

research();
