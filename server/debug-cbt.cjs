const { Pool } = require('pg');

const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'school', password: 'Admin', port: 5432 });

async function main() {
  try {
    const r1 = await pool.query(`SELECT s.id, s.name, s.class_id, s.org_id, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.email = 'luc@gmail.com'`);
    const student = r1.rows[0];
    console.log('\n=== STUDENT ===');
    console.log('Name:', student.name);
    console.log('Class ID:', student.class_id);
    console.log('Class Name:', student.class_name);

    const r2 = await pool.query('SELECT id, title, class_id, class_ids, status FROM cbt_exams WHERE org_id = $1', [student.org_id]);
    console.log('\n=== ALL CBT EXAMS ===');
    r2.rows.forEach(e => {
      console.log(`Title: ${e.title} | class_id: ${e.class_id} | class_ids: ${JSON.stringify(e.class_ids)} | status: ${e.status}`);
    });

    // Check all class names
    const r3 = await pool.query('SELECT id, name FROM classes WHERE org_id = $1', [student.org_id]);
    console.log('\n=== ALL CLASSES ===');
    r3.rows.forEach(c => console.log(`${c.id}: ${c.name}`));

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();
