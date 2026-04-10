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
  
  const studentRes = await pool.query('SELECT * FROM students WHERE email = $1', [email]);
  const student = studentRes.rows[0];
  console.log('-- STUDENT --');
  console.log(JSON.stringify(student, null, 2));
  
  if (!student) return console.log('Student not found');

  const classRes = await pool.query('SELECT * FROM classes WHERE id = $1', [student.class_id]);
  const cl = classRes.rows[0];
  console.log('\n-- CLASS --');
  console.log(JSON.stringify(cl, null, 2));
  
  const subjectsRes = await pool.query('SELECT * FROM subjects WHERE class_id = $1', [student.class_id]);
  console.log('\n-- SUBJECTS --');
  console.log(JSON.stringify(subjectsRes.rows, null, 2));
  
  const teacherIds = [...new Set(subjectsRes.rows.map(s => s.teacher_id).concat([cl?.class_teacher_id]).filter(Boolean))];
  console.log('\n-- EXTRACTED TEACHER IDs --', teacherIds);
  
  if (teacherIds.length) {
    const teachersRes = await pool.query('SELECT id, name, email, department FROM staff WHERE id = ANY($1)', [teacherIds]);
    console.log('\n-- FOUND TEACHERS --');
    console.log(JSON.stringify(teachersRes.rows, null, 2));
  }
  
  pool.end();
}

main().catch(console.error);
