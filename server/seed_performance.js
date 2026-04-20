import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});

const ORG_ID = '2f221db3-1676-4bd5-9e87-17fdafe80152';

async function seed() {
  console.log('--- Starting Performance Insights Seed ---');
  try {
    // 1. Get Students
    const studentsRes = await pool.query('SELECT id, name FROM students WHERE org_id = $1', [ORG_ID]);
    const students = studentsRes.rows;
    console.log(`Found ${students.length} students to update.`);

    // 2. Update Student GPA & Attendance
    for (const student of students) {
      const randomGPA = (Math.random() * (4.0 - 2.2) + 2.2).toFixed(2);
      const randomAtt = Math.floor(Math.random() * (98 - 70) + 70) + '%';
      
      await pool.query(
        'UPDATE students SET gpa = $1, attendance = $2 WHERE id = $3',
        [randomGPA, randomAtt, student.id]
      );
    }
    console.log('Updated students with mock GPA and Attendance.');

    // 3. Create Mock Subjects if needed
    const subjectsToCreate = ['Mathematics', 'English Language', 'Integrated Science'];
    const subjectIds = [];

    for (const subName of subjectsToCreate) {
      const checkSub = await pool.query('SELECT id FROM subjects WHERE name = $1 AND org_id = $2', [subName, ORG_ID]);
      if (checkSub.rows.length === 0) {
        const res = await pool.query(
          'INSERT INTO subjects (name, org_id) VALUES ($1, $2) RETURNING id',
          [subName, ORG_ID]
        );
        subjectIds.push(res.rows[0].id);
        console.log(`Created subject: ${subName}`);
      } else {
        subjectIds.push(checkSub.rows[0].id);
        console.log(`Subject exists: ${subName}`);
      }
    }

    // 4. Create Exams
    const examIds = [];
    const termNames = ['First Term Finals', 'Mid-Term Assessment'];

    for (let i = 0; i < subjectIds.length; i++) {
        const subId = subjectIds[i];
        const subName = subjectsToCreate[i];
        
        for (const term of termNames) {
            const examName = `${subName} - ${term}`;
            const checkExam = await pool.query('SELECT id FROM exams WHERE subject = $1 AND org_id = $2', [examName, ORG_ID]);
            
            if (checkExam.rows.length === 0) {
                const res = await pool.query(
                    'INSERT INTO exams (subject, type, org_id, subject_id, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
                    [examName, 'Exam', ORG_ID, subId]
                );
                examIds.push(res.rows[0].id);
                console.log(`Created exam: ${examName}`);
            } else {
                examIds.push(checkExam.rows[0].id);
                console.log(`Exam exists: ${examName}`);
            }
        }
    }

    // 5. Create Results
    console.log('Generating results...');
    let resultCount = 0;
    for (const examId of examIds) {
        for (const student of students) {
            // Check if result already exists to avoid duplicates
            const checkResult = await pool.query('SELECT id FROM results WHERE student_id = $1 AND exam_id = $2', [student.id, examId]);
            if (checkResult.rows.length === 0) {
                // Generate score based on student "potential" (somewhat correlated to their dummy GPA)
                const scoreBase = 40 + (Math.random() * 55);
                const score = Math.floor(scoreBase);
                
                let grade = 'F';
                if (score >= 90) grade = 'A+';
                else if (score >= 80) grade = 'A';
                else if (score >= 70) grade = 'B';
                else if (score >= 60) grade = 'C';
                else if (score >= 50) grade = 'D';

                await pool.query(
                    'INSERT INTO results (student_id, exam_id, score, grade, status, org_id, remark) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [student.id, examId, score, grade, 'Published', ORG_ID, 'Good effort.']
                );
                resultCount++;
            }
        }
    }
    console.log(`Created ${resultCount} mock results.`);

    console.log('--- Seeding Completed Successfully ---');
  } catch (e) {
    console.error('--- Seeding Failed ---');
    console.error(e);
  } finally {
    await pool.end();
  }
}

seed();
