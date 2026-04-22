
import pg from 'pg';
const { Pool } = pg;

// Connection string from existing migration script
const connectionString = 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

async function runMigration() {
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log('--- Starting SMS System Migration ---');

        // 1. Update organizations table
        console.log('Adding SMS fields to organizations table...');
        await client.query(`
            ALTER TABLE organizations 
            ADD COLUMN IF NOT EXISTS sms_balance INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS sms_unit_price NUMERIC(10, 4) DEFAULT 0.1000,
            ADD COLUMN IF NOT EXISTS sms_api_config JSONB DEFAULT '{}';
        `);
        console.log('organizations table updated.');

        // 2. Create sms_transactions table
        console.log('Creating sms_transactions table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS sms_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL, -- 'Distribution', 'Usage'
                amount INTEGER NOT NULL,
                previous_balance INTEGER,
                new_balance INTEGER,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('sms_transactions table created.');

        console.log('--- Migration Finished Successfully ---');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
