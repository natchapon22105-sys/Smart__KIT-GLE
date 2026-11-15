import { Router } from 'express';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const healthRouter = Router();
healthRouter.use(requireAuth);

const sample = z.object({
  heartRate: z.number().int().min(20).max(250).optional(),
  spo2: z.number().int().min(50).max(100).optional(),
  steps: z.number().int().min(0).optional(),
  temperature: z.number().min(30).max(45).optional(),
  recordedAt: z.string().datetime(),
});

healthRouter.post('/records', async (req: AuthedRequest, res) => {
  const parsed = z.object({ samples: z.array(sample).min(1).max(500) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  const rows = parsed.data.samples.map((s) => [
    req.userId,
    s.heartRate ?? null,
    s.spo2 ?? null,
    s.steps ?? null,
    s.temperature ?? null,
    new Date(s.recordedAt),
  ]);
  await usersDb.query(
    'INSERT INTO health_records (user_id, heart_rate, spo2, steps, temperature, recorded_at) VALUES ?',
    [rows],
  );
  res.status(201).json({ saved: rows.length });
});

healthRouter.get('/records', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<RowDataPacket[]>(
    'SELECT heart_rate, spo2, steps, temperature, recorded_at FROM health_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 200',
    [req.userId],
  );
  res.json({ records: rows });
});
