import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { api } from './routes/index.js';

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS.split(',').map((s) => s.trim()) }));
  app.use(express.json({ limit: '3mb' }));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api', api);

  // Express 5 ส่ง error ของ async handler มาที่นี่อัตโนมัติ
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในระบบ' });
  });
  return app;
}
