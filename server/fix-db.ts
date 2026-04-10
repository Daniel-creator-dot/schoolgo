import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});

async function fixConstraints() {
  try {
    // Drop foreign key constraint on lesson_notes table
    await pool.query('ALTER TABLE lesson_notes DROP CONSTRAINT IF EXISTS lesson_notes_marked_by_fkey');
    console.log('Dropped lesson_notes_marked_by_fkey constraint');

    // Drop foreign key constraint on staff_performance_reviews table
    await pool.query('ALTER TABLE staff_performance_reviews DROP CONSTRAINT IF EXISTS staff_performance_reviews_reviewer_id_fkey');
    console.log('Dropped staff_performance_reviews_reviewer_id_fkey constraint');

  } catch (err) {
    console.error('Error modifying DB:', err);
  } finally {
    await pool.end();
  }
}

fixConstraints();
