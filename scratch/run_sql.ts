import pool from '../server/db.ts';

async function run() {
    const sql = process.argv[2];
    if (!sql) {
        console.error('No SQL provided');
        process.exit(1);
    }
    try {
        const res = await pool.query(sql);
        console.log('Query successful');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    } finally {
        process.exit();
    }
}
run();
