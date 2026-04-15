import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const pool = new Pool({
  connectionString: 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixSchema() {
  const client = await pool.connect();
  try {
    console.log('--- Applying missing schema updates ---');
    
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'organogram_head_title') THEN
          ALTER TABLE organizations ADD COLUMN organogram_head_title VARCHAR(255) DEFAULT 'School Admin';
          RAISE NOTICE 'Added organogram_head_title to organizations';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'expiry_date') THEN
          ALTER TABLE organizations ADD COLUMN expiry_date DATE;
          RAISE NOTICE 'Added expiry_date to organizations';
        END IF;
      END $$;
    `);

    // Verify
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      AND column_name IN ('expiry_date', 'organogram_head_title')
    `);
    console.log('Columns confirmed after fix:');
    res.rows.forEach(r => console.log(` - ${r.column_name}`));
    console.log('Successfully completed schema updates.');

  } catch (err) {
    console.error('Schema fix failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixSchema();
