import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";

async function checkSubscriptionsTable() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to DB");

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `);

    console.log("Subscriptions Table Columns:");
    console.table(res.rows);

    const statusRes = await client.query(`
      SELECT DISTINCT status FROM subscriptions;
    `);
    console.log("Existing statuses:");
    console.table(statusRes.rows);

  } catch (err) {
    console.error("Error checking table:", err);
  } finally {
    await client.end();
  }
}

checkSubscriptionsTable();
