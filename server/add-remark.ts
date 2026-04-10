import { Pool } from 'pg';
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'school',
  password: 'Admin',
  port: 5432,
});
pool.query('ALTER TABLE results ADD COLUMN IF NOT EXISTS remark TEXT')
  .then(() => { console.log("Added remark column"); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
