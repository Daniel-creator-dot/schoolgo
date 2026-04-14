
import pg from 'pg';
const { Pool } = pg;

const connectionString = 'postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

async function runMigration() {
    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const client = await pool.connect();
    try {
        console.log('--- Starting Supabase Migration ---');
        
        // 1. Update partners table
        console.log('Updating partners table...');
        await client.query(`
            ALTER TABLE partners 
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
        `);
        await client.query(`
            UPDATE partners SET status = 'Active' WHERE status = 'Pending';
        `);
        console.log('partners table updated.');

        // 2. Update organizations table
        console.log('Updating organizations table with extended fields...');
        const orgColumns = [
            'demo_requested BOOLEAN DEFAULT false',
            'address TEXT',
            'custom_domain VARCHAR(255)',
            'logo TEXT',
            'signature TEXT',
            'language VARCHAR(10) DEFAULT \'en\'',
            'timezone VARCHAR(50) DEFAULT \'GMT\''
        ];

        for (const col of orgColumns) {
            const colName = col.split(' ')[0];
            const colDef = col.substring(colName.length + 1);
            await client.query(`
                ALTER TABLE organizations 
                ADD COLUMN IF NOT EXISTS ${colName} ${colDef};
            `);
        }
        console.log('organizations table updated.');

        console.log('--- Migration Finished Successfully ---');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
