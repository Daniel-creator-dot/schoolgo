import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});

async function verifyPerformance() {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        d.name as department_name,
        ROUND(AVG(ln.marks), 2) as lesson_note_avg,
        spr.score as appraisal_score,
        spr.comments as appraisal_review,
        spr.created_at as last_review_date
      FROM staff s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN lesson_notes ln ON s.id = ln.teacher_id
      LEFT JOIN LATERAL (
        SELECT score, comments, created_at 
        FROM staff_performance_reviews 
        WHERE staff_id = s.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) spr ON true
      GROUP BY s.id, s.name, d.name, spr.score, spr.comments, spr.created_at
    `);
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error querying DB:', (err as any).message || err);
  } finally {
    await pool.end();
  }
}

verifyPerformance();
