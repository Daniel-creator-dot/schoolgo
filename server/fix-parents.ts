import pool from './db.ts';

async function main() {
  const client = await pool.connect();
  try {
    const orgs = await client.query('SELECT id, name FROM organizations');
    for (const org of orgs.rows) {
      console.log(`Fixing students for: ${org.name}`);
      
      const studentsRes = await client.query('SELECT id, name FROM students WHERE org_id = $1', [org.id]);
      
      for (const student of studentsRes.rows) {
        const dummyEmail = student.name.toLowerCase().replace(/ /g, '') + '_parent@example.com';
        await client.query('UPDATE students SET parent_email = $1 WHERE id = $2', [dummyEmail, student.id]);
      }
    }
    console.log('Successfully assigned parent emails to existing students.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
