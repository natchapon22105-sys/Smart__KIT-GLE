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
  sleepMinutes: z.number().int().min(0).max(1440).optional(),
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
    s.sleepMinutes ?? null,
    new Date(s.recordedAt),
  ]);
  await usersDb.query(
    'INSERT INTO health_records (user_id, heart_rate, spo2, steps, temperature, sleep_minutes, recorded_at) VALUES ?',
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

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * สรุปสำหรับหน้า Health status:
 *  - days   7 วันล่าสุด (เก่า → ใหม่): steps = ค่าสูงสุดของวัน (นาฬิกานับสะสม), sleepHours = ผลรวมชั่วโมงนอน
 *  - hourly 24 ชม.ล่าสุด เฉลี่ยรายชั่วโมง: spo2, heartRate
 * หมายเหตุ: จัดกลุ่มตามเขตเวลาของเซิร์ฟเวอร์ (TODO: รองรับเขตเวลาของผู้ใช้เมื่อมีผู้ใช้หลายประเทศ)
 */
healthRouter.get('/summary', async (req: AuthedRequest, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const [dayRows] = await usersDb.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(recorded_at, '%Y-%m-%d') AS d, MAX(steps) AS steps, SUM(sleep_minutes) AS sleep
     FROM health_records WHERE user_id = ? AND recorded_at >= ? GROUP BY d`,
    [req.userId, start],
  );
  const byDay = new Map(dayRows.map((r) => [String(r.d), r]));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = ymd(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    const r = byDay.get(date);
    return {
      date,
      steps: r?.steps == null ? null : Number(r.steps),
      sleepHours: r?.sleep == null ? null : Math.round((Number(r.sleep) / 60) * 10) / 10,
    };
  });

  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [hourRows] = await usersDb.query<RowDataPacket[]>(
    `SELECT DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00') AS h, AVG(spo2) AS spo2, AVG(heart_rate) AS hr
     FROM health_records WHERE user_id = ? AND recorded_at >= ? GROUP BY h ORDER BY h`,
    [req.userId, since],
  );
  const hourly = hourRows.map((r) => ({
    hour: String(r.h),
    spo2: r.spo2 == null ? null : Math.round(Number(r.spo2) * 10) / 10,
    heartRate: r.hr == null ? null : Math.round(Number(r.hr)),
  }));
  res.json({ days, hourly });
});
