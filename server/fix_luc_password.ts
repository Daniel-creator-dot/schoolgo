import pool from './db';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'luc@gmail.com';
  const password = 'zxcv123$$';

  try {
    console.log(`Updating password for ${email}...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'UPDATE students SET password = $1 WHERE email = $2 RETURNING id, name',
      [hashedPassword, email]
    );

    if (result.rows.length > 0) {
      console.log(`Successfully updated password for ${result.rows[0].name} (${email})`);
    } else {
      console.error(`Student with email ${email} not found.`);
    }

    await pool.end();
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
}

main();
