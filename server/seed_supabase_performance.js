import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const ORG_ID = 'cd15a058-082a-417b-a558-2241e0d3d2f1';

const CLASSES = [
  { id: '2af3c175-da0a-44bc-bcfd-b2ce542894a6', name: 'Grade 10' },
  { id: 'e0f3bbd9-6b74-4281-8846-e28ec76b1648', name: 'Grade 11' },
  { id: '43b4236f-6b22-4242-ad9e-2cec11d9353a', name: 'Grade 12' }
];

const SUBJECTS = [
  { id: '83ecdf1e-b2c2-41f8-880b-a2e531439261', name: 'Mathematics' },
  { id: '661eac6f-ff64-46f2-9717-67516a829f6b', name: 'Physics' },
  { id: '8cc1fcf9-486a-4515-bae5-c2d8e57c1964', name: 'English' }
];

const STUDENT_NAMES = [
  'Michael Adebayo', 'Sarah Mensah', 'David Okafor', 'Blessing Williams', 
  'Emmanuel Tetteh', 'Gift Anyanwu', 'Confidence Osei', 'Prince Boateng',
  'Precious Appiah', 'Wisdom Kwesi', 'Success Amadi', 'Faith Chidera'
];

async function seed() {
  console.log('--- Starting Supabase Performance Insights Seed ---');
  try {
    // 1. Create Students
    console.log('Adding 12 new students...');
    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const name = STUDENT_NAMES[i];
      const email = `${name.toLowerCase().replace(' ', '.')}@stpatrick.edu`;
      const admission_no = `STP-${2024000 + i}`;
      const class_id = CLASSES[i % CLASSES.length].id;
      const gpa = (Math.random() * (4.0 - 2.5) + 2.5).toFixed(2);
      const attendance = Math.floor(Math.random() * (99 - 75) + 75) + '%';

      const checkStudent = await pool.query('SELECT id FROM students WHERE email = $1', [email]);
      if (checkStudent.rows.length === 0) {
          await pool.query(
            'INSERT INTO students (name, email, admission_no, class_id, org_id, gpa, attendance, status, fee_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [name, email, admission_no, class_id, ORG_ID, gpa, attendance, 'Present', 'Paid']
          );
      } else {
          await pool.query('UPDATE students SET gpa = $1, attendance = $2 WHERE id = $3', [gpa, attendance, checkStudent.rows[0].id]);
      }
    }

    // 2. Refresh Student List (including existing ones)
    const studentsRes = await pool.query('SELECT id, name, gpa FROM students WHERE org_id = $1', [ORG_ID]);
    const students = studentsRes.rows;
    console.log(`Working with ${students.length} total students.`);

    // Update existing students who might not have gpa/attendance
    for (const student of students) {
        if (!student.gpa || student.gpa === '0.0' || student.gpa === null) {
            const gpa = (Math.random() * (4.0 - 2.4) + 2.4).toFixed(2);
            const attendance = Math.floor(Math.random() * (98 - 72) + 72) + '%';
            await pool.query('UPDATE students SET gpa = $1, attendance = $2 WHERE id = $3', [gpa, attendance, student.id]);
        }
    }

    // 3. Create Exams for each Grade and Subject
    const examIds = [];
    console.log('Creating exams...');
    for (const cls of CLASSES) {
      for (const sub of SUBJECTS) {
        const examName = `${sub.name} - Second Term Finals (${cls.name})`;
        // Use COALESCE/SELECT to avoid duplicate exams
        const checkExam = await pool.query('SELECT id FROM exams WHERE subject = $1 AND org_id = $2', [examName, ORG_ID]);
        if (checkExam.rows.length > 0) {
            examIds.push({ id: checkExam.rows[0].id, class_id: cls.id });
            console.log(`Exam already exists: ${examName}`);
        } else {
            const res = await pool.query(
              'INSERT INTO exams (subject, type, org_id, class_id, subject_id, date) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id',
              [examName, 'Exam', ORG_ID, cls.id, sub.id]
            );
            examIds.push({ id: res.rows[0].id, class_id: cls.id });
            console.log(`Created exam: ${examName}`);
        }
      }
    }

    // 4. Generate Results
    console.log('Generating results (this may take a moment)...');
    let resultsCreated = 0;
    for (const exam of examIds) {
      // Find students in this exam's class
      const classStudents = await pool.query('SELECT id, gpa FROM students WHERE org_id = $1 AND class_id = $2', [ORG_ID, exam.class_id]);
      
      for (const student of classStudents.rows) {
        // Check for existing result
        const checkResult = await pool.query('SELECT id FROM results WHERE student_id = $1 AND exam_id = $2', [student.id, exam.id]);
        if (checkResult.rows.length > 0) continue;

        // Base score on GPA (Gpa 4.0 -> ~90, Gpa 2.5 -> ~60)
        const gpaFactor = (parseFloat(student.gpa || '3.0') - 2.4) / (4.0 - 2.4);
        const baseScore = 60 + (gpaFactor * 30);
        const score = Math.min(98, Math.max(45, Math.floor(baseScore + (Math.random() * 10 - 5))));
        
        let grade = 'F';
        if (score >= 85) grade = 'A';
        else if (score >= 75) grade = 'B';
        else if (score >= 65) grade = 'C';
        else if (score >= 55) grade = 'D';
        else if (score >= 45) grade = 'E';

        await pool.query(
          'INSERT INTO results (student_id, exam_id, score, grade, status, org_id) VALUES ($1, $2, $3, $4, $5, $6)',
          [student.id, exam.id, score, grade, 'Published', ORG_ID]
        );
        resultsCreated++;
      }
    }


    console.log(`--- Seeding Completed ---`);
    console.log(`Added students, created ${examIds.length} exams and ${resultsCreated} results.`);
  } catch (e) {
    console.error('--- Seeding Failed ---');
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();
