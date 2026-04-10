import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: 'postgres',
        host: 'localhost',
        database: 'school',
        password: 'Admin',
        port: 5432,
      }
);

export default pool;
