const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});

async function main() {
  const email = 'obmickie@gmail.com';
  console.log('Searching for:', email);

  const studentRes = await pool.query('SELECT id, name, email, class_id, org_id FROM students WHERE email = $1', [email]);
  const student = studentRes.rows[0];
  console.log('-- STUDENT --');
  if (!student) {
      console.log('Student NOT FOUND in DB');
      const allStudents = await pool.query('SELECT count(*) FROM students');
      console.log('Total students in DB:', allStudents.rows[0].count);
      return;
  }
  console.log('ID:', student.id);
  console.log('Name:', student.name);
  console.log('Class ID:', student.class_id);
  console.log('Org ID:', student.org_id);

  if (student.class_id) {
      const classRes = await pool.query('SELECT id, name, section, class_teacher_id FROM classes WHERE id = $1', [student.class_id]);
      const cl = classRes.rows[0];
      console.log('\n-- CLASS --');
      if (cl) {
          console.log('ID:', cl.id);
          console.log('Name:', cl.name, cl.section);
          console.log('Class Teacher ID:', cl.class_teacher_id);
          
          if (cl.class_teacher_id) {
              const ctRes = await pool.query('SELECT id, name FROM staff WHERE id = $1', [cl.class_teacher_id]);
              console.log('Class Teacher Name:', ctRes.rows[0]?.name || 'NOT FOUND');
          }
      } else {
          console.log('Class NOT FOUND in DB for ID:', student.class_id);
      }

      const subjectsRes = await pool.query('SELECT id, name, teacher_id FROM subjects WHERE class_id = $1', [student.class_id]);
      console.log('\n-- SUBJECTS (Legacy Field) --');
      console.log('Count:', subjectsRes.rows.length);
      subjectsRes.rows.forEach(s => {
          console.log(`- ${s.name} (Teacher ID: ${s.teacher_id})`);
      });

      const assignmentsRes = await pool.query(`
          SELECT s.name as subject_name, sa.teacher_id, sa.class_id
          FROM subject_assignments sa
          JOIN subjects s ON sa.subject_id = s.id
          WHERE sa.class_id = $1
      `, [student.class_id]);
      console.log('\n-- SUBJECT ASSIGNMENTS (New Table) --');
      console.log('Count:', assignmentsRes.rows.length);
      assignmentsRes.rows.forEach(a => {
          console.log(`- ${a.subject_name} (Teacher ID: ${a.teacher_id})`);
      });
  }

  pool.end();
}

main().catch(console.error);
