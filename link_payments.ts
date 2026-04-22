
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: "postgresql://postgres.yqtsdxwizzszcboaxtez:Daniel%4024419000@aws-1-eu-central-1.pooler.supabase.com:5432/postgres",
});

async function linkPayments() {
    const studentId = 'e1ab1fc5-4380-4a3f-9e38-a092b37a875a';
    const invoiceId = '14c857bc-a652-4b30-9578-d35b66d3276b';

    try {
        console.log(`Linking all unlinked payments for student ${studentId} to invoice ${invoiceId}`);

        const res = await pool.query(
            'UPDATE payments SET invoice_id = $1 WHERE student_id = $2 AND invoice_id IS NULL RETURNING id',
            [invoiceId, studentId]
        );

        console.log(`Updated ${res.rows.length} payments.`);

        // Also check if invoice should be marked Paid (sum is 234, invoice is 300, so not yet)

        await pool.end();
    } catch (err) {
        console.error(err);
    }
}

linkPayments();
