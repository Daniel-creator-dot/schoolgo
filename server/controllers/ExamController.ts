import express from 'express';
import { Response } from 'express';
import pool from '../db.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { recordAuditLog } from '../lib/audit.ts';

// EXAMS
export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT e.*, s.name as subject_name, c.name as class_name, c.section as class_section 
      FROM exams e 
      LEFT JOIN subjects s ON e.subject_id = s.id 
      LEFT JOIN classes c ON e.class_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND e.org_id = $${params.length}`;
    }

    let filterStaffId = req.query.staffId;

    // Auto-filter for staff members based on their identity
    if (role === 'STAFF' && !filterStaffId) {
      const staffResult = await pool.query('SELECT id FROM staff WHERE email = $1 AND org_id = $2', [req.user.email, orgId]);
      if (staffResult.rows.length > 0) {
        filterStaffId = staffResult.rows[0].id;
      }
    }

    if (filterStaffId) {
      params.push(filterStaffId);
      query += ` AND (
        e.subject_id IN (SELECT id FROM subjects WHERE teacher_id = $${params.length})
        OR 
        e.class_id IN (SELECT id FROM classes WHERE class_teacher_id = $${params.length})
      )`;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  const { subject_id, class_id, class_ids, subject, date, time, room, type } = req.body;
  const orgId = req.user.org_id;
  
  try {
    const finalClassIds = Array.isArray(class_ids) ? class_ids : (class_id ? [class_id] : []);

    if (finalClassIds.length === 0) {
      return res.status(400).json({ error: 'At least one class must be selected.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const createdExams = [];

      // Fetch organization settings to default term and academic year if not provided
      const orgRes = await client.query('SELECT academic_year, current_term FROM organizations WHERE id = $1', [orgId]);
      const orgSettings = orgRes.rows[0];
      
      const finalTerm = req.body.term || orgSettings?.current_term;
      const finalYear = req.body.academic_year || orgSettings?.academic_year;

      for (const cid of finalClassIds) {
        // Resolve the specific subject_id for this class to ensure the correct teacher is linked
        // If a subject with the same name exists for this specific class, we use its ID.
        // Otherwise, we fallback to the provided subject_id.
        const subjectLookup = await client.query(
          'SELECT id FROM subjects WHERE name = $1 AND class_id = $2 AND org_id = $3',
          [subject, cid, orgId]
        );
        const resolvedSubjectId = subjectLookup.rows.length > 0 ? subjectLookup.rows[0].id : (subject_id || null);

        const result = await client.query(
          'INSERT INTO exams (org_id, subject_id, class_id, subject, date, time, room, type, term, academic_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [orgId, resolvedSubjectId, cid || null, subject || null, date, time, room, type, finalTerm, finalYear]
        );
        createdExams.push(result.rows[0]);
      }

      await client.query('COMMIT');
      await recordAuditLog(req.user.id, 'CREATE_EXAM', `Created ${createdExams.length} exam schedules for ${subject}`, req.user.org_id);
      res.status(201).json(finalClassIds.length === 1 ? createdExams[0] : { message: `${createdExams.length} exam schedules created successfully`, createdCount: createdExams.length });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { subject_id, class_id, class_ids, subject, date, time, room, type, term, academic_year } = req.body;
  
  try {
    const orgId = req.user.org_id;
    const finalClassId = class_id || (Array.isArray(class_ids) && class_ids.length > 0 ? class_ids[0] : null);

    const result = await pool.query(
      'UPDATE exams SET subject_id = $1, class_id = $2, subject = $3, date = $4, time = $5, room = $6, type = $7, term = $8, academic_year = $9 WHERE id = $10 AND org_id = $11 RETURNING *',
      [subject_id || null, finalClassId, subject || null, date, time, room, type, term || null, academic_year || null, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteExam = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    await pool.query('DELETE FROM exams WHERE id = $1 AND org_id = $2', [id, orgId]);
    await recordAuditLog(req.user.id, 'DELETE_EXAM', `Deleted exam schedule ID: ${id}`, req.user.org_id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// RESULTS
export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, examId } = req.query;
    const orgId = req.user.org_id;
    const role = req.user.role;
    let query = `
      SELECT r.*, 
             st.name as student_name, 
             e.subject, 
             c.name as class_name, 
             c.id as class_id,
             e.type as exam_type,
             e.date as exam_date,
             s.name as subject_name,
             c.section as class_section
      FROM results r 
      JOIN students st ON r.student_id = st.id 
      LEFT JOIN exams e ON r.exam_id = e.id 
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role !== 'SUPER_ADMIN') {
      params.push(orgId);
      query += ` AND r.org_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      query += ` AND r.student_id = $${params.length}`;
    }
    if (examId) {
      params.push(examId);
      query += ` AND r.exam_id = $${params.length}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const recordResult = async (req: AuthRequest, res: Response) => {
  const { exam_id, student_id, score, grade, status } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO results (org_id, exam_id, student_id, score, grade, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orgId, exam_id, student_id, score, grade, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkRecordResults = async (req: AuthRequest, res: Response) => {
  const { exam_id, results } = req.body;
  try {
    const orgId = req.user.org_id;

    const examRes = await pool.query('SELECT class_id, subject FROM exams WHERE id = $1 AND org_id = $2', [exam_id, orgId]);
    if (examRes.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
    const { class_id, subject: examSubject } = examRes.rows[0];

    if (!class_id) {
      return res.status(400).json({ error: `Exam "${examSubject}" is not linked to any class. Please edit the exam schedule to assign a class.` });
    }

    const classRes = await pool.query('SELECT name FROM classes WHERE id = $1', [class_id]);
    const className = classRes.rows[0]?.name || 'Unknown Class';

    const scaleRes = await pool.query(`
      SELECT gsl.* 
      FROM classes c
      JOIN grading_scales gs ON c.grading_scale_id = gs.id
      JOIN grading_scale_levels gsl ON gs.id = gsl.scale_id
      WHERE c.id = $1 AND c.org_id = $2 AND gs.status = 'Active'
      ORDER BY gsl.min_score DESC
    `, [class_id, orgId]);
    
    const levels = scaleRes.rows;
    if (levels.length === 0) {
      return res.status(400).json({ error: `No active grading scale found for class "${className}". Please assign a grading scale in School Admin settings.` });
    }

    const calculateGrade = (score: number) => {
      for (const level of levels) {
        if (score >= level.min_score) {
          return level.grade;
        }
      }
      return 'F'; 
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const result of results) {
        const grade = calculateGrade(result.score);
        const exist = await client.query('SELECT id FROM results WHERE exam_id = $1 AND student_id = $2 AND org_id = $3', [exam_id, result.student_id, orgId]);
        if (exist.rows.length > 0) {
          await client.query(
            'UPDATE results SET score = $1, grade = $2, remark = $3, score_details = $4 WHERE id = $5',
            [result.score, grade, result.remark || null, result.score_details ? JSON.stringify(result.score_details) : null, exist.rows[0].id]
          );
        } else {
          await client.query(
            'INSERT INTO results (org_id, exam_id, student_id, score, grade, status, remark, score_details) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [orgId, exam_id, result.student_id, result.score, grade, 'Published', result.remark || null, result.score_details ? JSON.stringify(result.score_details) : null]
          );
        }
      }
      await client.query('COMMIT');
      await recordAuditLog(req.user.id, 'BULK_RECORD_RESULTS', `Recorded results for ${results.length} students in Exam ID: ${exam_id}`, req.user.org_id);
      res.json({ message: 'Results recorded successfully' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// REMARK TEMPLATES
export const getRemarkTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user.org_id;
    const result = await pool.query('SELECT * FROM remark_templates WHERE org_id = $1', [orgId]);
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createRemarkTemplate = async (req: AuthRequest, res: Response) => {
  const { name, remark } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'INSERT INTO remark_templates (org_id, name, remark) VALUES ($1, $2, $3) RETURNING *',
      [orgId, name, remark]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRemarkTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, remark } = req.body;
  try {
    const orgId = req.user.org_id;
    const result = await pool.query(
      'UPDATE remark_templates SET name = $1, remark = $2 WHERE id = $3 AND org_id = $4 RETURNING *',
      [name, remark, id, orgId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Remark template not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteRemarkTemplate = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const orgId = req.user.org_id;
    await pool.query('DELETE FROM remark_templates WHERE id = $1 AND org_id = $2', [id, orgId]);
    res.json({ message: 'Remark template deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const syncELearningMarks = async (req: AuthRequest, res: Response) => {
  const { sourceType, sourceId, targetExamId, targetColumn } = req.body;
  const orgId = req.user.org_id;

  try {
    // 1. Get Target Exam and its Class's Grading Template
    const targetExamRes = await pool.query(
      `SELECT e.*, c.id as class_id
       FROM exams e
       JOIN classes c ON e.class_id = c.id
       WHERE e.id = $1 AND e.org_id = $2`,
      [targetExamId, orgId]
    );

    if (targetExamRes.rows.length === 0) return res.status(404).json({ error: 'Target exam not found' });
    const targetExam = targetExamRes.rows[0];
    
    // Default max marks: 30 for Class Score (CA), 70 for Exam Score
    const targetMax = targetColumn === 'showClassScore' ? 30 : 70;

    let submissions = [];
    let sourceMax = 100;

    if (sourceType === 'cbt') {
      const qRes = await pool.query('SELECT SUM(points::float) as total FROM cbt_questions WHERE exam_id = $1', [sourceId]);
      sourceMax = parseFloat(qRes.rows[0].total) || 100;
      const sRes = await pool.query('SELECT student_id, score FROM cbt_submissions WHERE exam_id = $1', [sourceId]);
      submissions = sRes.rows.map(s => ({ student_id: s.student_id, score: parseFloat(s.score) || 0 }));
    } else {
      // Assignment
      const aRes = await pool.query('SELECT total_marks FROM assignments WHERE id = $1', [sourceId]);
      if (aRes.rows.length === 0) return res.status(404).json({ error: 'Assignment not found' });
      sourceMax = aRes.rows[0].total_marks || 100;

      const sRes = await pool.query('SELECT student_id, grade FROM assignment_submissions WHERE assignment_id = $1 AND status = \'Graded\'', [sourceId]);
      submissions = sRes.rows.map(s => ({ student_id: s.student_id, score: parseFloat(s.grade) || 0 }));
    }

    if (submissions.length === 0) {
      return res.status(400).json({ error: 'No graded submissions found for the selected source.' });
    }

    // 2. Perform Sync
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of submissions) {
        // Scaling logic: (Actual Score / Source Max) * Target Max
        const scaledScore = (item.score / sourceMax) * targetMax;
        
        // Upsert result
        const exist = await client.query('SELECT id, score_details FROM results WHERE exam_id = $1 AND student_id = $2 AND org_id = $3', [targetExamId, item.student_id, orgId]);
        
        const newColValue = parseFloat(scaledScore.toFixed(2));
        let finalDetails: any = { [targetColumn]: newColValue };

        if (exist.rows.length > 0) {
          const oldDetails = exist.rows[0].score_details || {};
          finalDetails = { ...oldDetails, ...finalDetails };
          // Re-calculate total score
          const total = (finalDetails.showClassScore || 0) + (finalDetails.showExamScore || 0);
          
          await client.query(
            'UPDATE results SET score = $1, score_details = $2 WHERE id = $3',
            [total, JSON.stringify(finalDetails), exist.rows[0].id]
          );
        } else {
          const total = newColValue; // Initial total
          await client.query(
            'INSERT INTO results (org_id, exam_id, student_id, score, score_details, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [orgId, targetExamId, item.student_id, total, JSON.stringify(finalDetails), 'Published']
          );
        }
      }
      await client.query('COMMIT');
      res.json({ message: `Successfully synchronized ${submissions.length} marks with automatic scaling.` });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const getPublicReportCardData = async (req: express.Request, res: Response) => {
  const { token } = req.params;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [studentId, term, year, orgId] = decoded.split('|');

    if (!studentId || !orgId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const client = await pool.connect();
    try {
      // 1. Fetch Student & Organization
      const studentRes = await client.query(`
        SELECT s.*, c.name as class_name, c.id as class_id, c.report_card_template_id
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.id = $1 AND s.org_id = $2
      `, [studentId, orgId]);

      if (studentRes.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      const student = studentRes.rows[0];

      const orgRes = await client.query('SELECT * FROM organizations WHERE id = $1', [orgId]);
      const organization = orgRes.rows[0];

      // 2. Fetch Results for the specific term/year
      const resultsRes = await client.query(`
        SELECT r.*, e.subject, e.type as exam_type, e.date as exam_date, s.name as subject_name
        FROM results r
        JOIN exams e ON r.exam_id = e.id
        LEFT JOIN subjects s ON e.subject_id = s.id
        WHERE r.student_id = $1 AND r.org_id = $2 AND e.term = $3 AND e.academic_year = $4
      `, [studentId, orgId, term, year]);

      // 3. Fetch Report Card Template
      let template = null;
      if (student.report_card_template_id) {
        const tmplRes = await client.query('SELECT * FROM report_card_templates WHERE id = $1', [student.report_card_template_id]);
        template = tmplRes.rows[0];
      }

      // 4. Fetch Grading Scale
      const classRes = await client.query('SELECT grading_scale_id FROM classes WHERE id = $1', [student.class_id]);
      let gradingScale = null;
      if (classRes.rows[0]?.grading_scale_id) {
        const scaleRes = await client.query('SELECT * FROM grading_scales WHERE id = $1', [classRes.rows[0].grading_scale_id]);
        const levelsRes = await client.query('SELECT * FROM grading_scale_levels WHERE scale_id = $1 ORDER BY min_score DESC', [classRes.rows[0].grading_scale_id]);
        gradingScale = { ...scaleRes.rows[0], levels: levelsRes.rows };
      }

      res.json({
        student,
        organization,
        results: resultsRes.rows,
        template,
        gradingScale,
        term,
        year
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Public Result Fetch Error:', err);
    res.status(500).json({ error: 'Failed to retrieve results' });
  }
};
