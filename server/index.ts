console.log('>>> [BOOTSTRAP] Server process starting...');
import express from 'express';
import pool from './db.ts';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.ts';
import { init as initDb } from './init-db.ts';

dotenv.config();
console.log('>>> [BOOTSTRAP] Environment variables loaded.');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

// Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', time: result.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: 'ERROR', error: err.message });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Initialize Database before starting server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Deep backend server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('CRITICAL: Failed to initialize database!');
    console.error('Error Details:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
      // Identifying if DATABASE_URL was present
      hasDatabaseUrl: !!process.env.DATABASE_URL
    });
    process.exit(1);
  });
