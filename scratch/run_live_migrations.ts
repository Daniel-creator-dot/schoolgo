import pool from '../server/db.ts';

async function runLiveMigrations() {
  try {
    console.log('--- Creating online_classes table ---');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS online_classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES staff(id) ON DELETE CASCADE,
        subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
        class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
        class_ids JSONB DEFAULT '[]',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) DEFAULT 'Upcoming',
        meeting_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Success: online_classes table created.');

    console.log('--- Updating cbt_exams table (max_attempts) ---');
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cbt_exams' AND column_name='max_attempts') THEN
          ALTER TABLE cbt_exams ADD COLUMN max_attempts INTEGER DEFAULT 1;
        END IF;
      END $$;
    `);
    console.log('Success: max_attempts added/verified in cbt_exams.');

    console.log('--- Updating cbt_exams table (total_marks) ---');
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cbt_exams' AND column_name='total_marks') THEN
          ALTER TABLE cbt_exams ADD COLUMN total_marks NUMERIC(10, 2);
        END IF;
      END $$;
    `);
    
    // Initialize total_marks from sum of questions if possible
    await pool.query(`
      UPDATE cbt_exams e
      SET total_marks = (
        SELECT COALESCE(SUM(points), 0)
        FROM cbt_questions
        WHERE exam_id = e.id
      )
      WHERE total_marks IS NULL;
    `);
    console.log('Success: total_marks added/verified in cbt_exams.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runLiveMigrations();
