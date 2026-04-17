import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;

const connectionString = 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

async function seedPartner() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase...');

    // 1. Ensure Table Exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50),
        company_name VARCHAR(255),
        registration_number VARCHAR(255),
        referral_code VARCHAR(50) UNIQUE NOT NULL,
        total_earnings NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured partners table exists.');

    // 2. Add columns natively to the existing Organizations table safely
    await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID REFERENCES partners(id)`);
    await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan VARCHAR(100)`);
    await client.query(`ALTER TABLE organizations ADD COLUMN IF NOT EXISTS demo_requested BOOLEAN DEFAULT FALSE`);
    console.log('Ensured organization columns exist.');

    // 3. Create a test partner
    const email = 'test@partner.com';
    const plainPassword = 'zxcv123$$';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const referralCode = 'OMNI99';

    // Check if partner exists
    const existing = await client.query('SELECT * FROM partners WHERE email = $1', [email]);
    if (existing.rows.length === 0) {
      await client.query(
        'INSERT INTO partners (name, email, password, contact_number, company_name, referral_code) VALUES ($1, $2, $3, $4, $5, $6)',
        ['Test Partner Agency', email, hashedPassword, '+1234567890', 'Tech Solutions Inc', referralCode]
      );
      console.log('Test partner created successfully!');
    } else {
      console.log('Test partner already exists! Updating password just in case...');
      await client.query('UPDATE partners SET password = $1 WHERE email = $2', [hashedPassword, email]);
    }
    
    console.log('');
    console.log('=== TEST ACCOUNT ===');
    console.log('Email: test@partner.com');
    console.log('Password: zxcv123$$');
    console.log('====================');

  } catch (error) {
    console.error('Error seeding partner:', error);
  } finally {
    await client.end();
  }
}

seedPartner();
