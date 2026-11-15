import { Router } from 'express';
import { z } from 'zod';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

/**
 * MediRemind — ยา 1 รายการ = medications 1 แถว + medication_schedules 1 แถว (เวลา + วันที่ต้องกิน)
 * ตาม Figma: เวลา (00:00) · Medicine · Select Days · Medication Details · รูปยา
 */
export const medicationsRouter = Router();
medicationsRouter.use(requireAuth);

const body = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อยา').max(160),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'เวลาไม่ถูกต้อง'),
  days: z.array(z.number().int().min(1).max(7)).min(1, 'กรุณาเลือกวันอย่างน้อย 1 วัน').max(7),
  details: z.string().trim().max(2000).optional().default(''),
  // data URI ของรูปที่ย่อแล้วจากแอป (จำกัด ~1.5MB)
  image: z.string().startsWith('data:image/').max(1_500_000).nullable().optional(),
});

const SELECT = `
  SELECT m.id, m.name, m.note AS details, m.image_data AS image,
         s.id AS scheduleId, TIME_FORMAT(s.time_of_day, '%H:%i') AS timeOfDay,
         s.days_of_week AS days, s.enabled
  FROM medications m
  JOIN medication_schedules s ON s.medication_id = m.id
  WHERE m.user_id = ? AND m.active = 1`;

type Row = RowDataPacket & { days: string; enabled: number };
const shape = (r: Row) => ({
  ...r,
  days: String(r.days).split(',').map(Number).filter(Boolean),
  enabled: !!r.enabled,
});

const parseId = (v: string | string[]) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null);

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, 'วันที่ไม่ถูกต้อง');

const doseLogsQuery = z.object({ from: dateOnly, to: dateOnly });
const doseLogBody = z.object({
  date: dateOnly,
  timeOfDay: body.shape.timeOfDay,
  status: z.enum(['pending', 'taken']),
});

type DoseLogRow = RowDataPacket & {
  scheduleId: number;
  scheduledAt: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
};

medicationsRouter.get('/', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<Row[]>(`${SELECT} ORDER BY s.time_of_day, m.id`, [req.userId]);
  res.json({ medications: rows.map(shape) });
});

medicationsRouter.get('/logs', async (req: AuthedRequest, res) => {
  const parsed = doseLogsQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'ช่วงวันที่ไม่ถูกต้อง' });
  const { from, to } = parsed.data;
  const span = Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`);
  if (span < 0 || span > 7 * 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: 'เลือกช่วงวันที่ได้ไม่เกิน 8 วัน' });
  }

  const [rows] = await usersDb.query<DoseLogRow[]>(
    `SELECT l.schedule_id AS scheduleId,
            DATE_FORMAT(l.scheduled_at, '%Y-%m-%d %H:%i:%s') AS scheduledAt,
            l.status
     FROM medication_logs l
     JOIN medication_schedules s ON s.id = l.schedule_id
     JOIN medications m ON m.id = s.medication_id
     WHERE m.user_id = ? AND m.active = 1
       AND l.scheduled_at >= ? AND l.scheduled_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY l.scheduled_at`,
    [req.userId, `${from} 00:00:00`, `${to} 00:00:00`],
  );
  res.json({ logs: rows });
});

medicationsRouter.get('/:id', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
  const [rows] = await usersDb.query<Row[]>(`${SELECT} AND m.id = ?`, [req.userId, id]);
  if (!rows[0]) return res.status(404).json({ error: 'ไม่พบรายการยา' });
  res.json({ medication: shape(rows[0]) });
});

medicationsRouter.post('/', async (req: AuthedRequest, res) => {
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' });
  const d = p.data;
  const conn = await usersDb.getConnection();
  try {
    await conn.beginTransaction();
    const [m] = await conn.query<ResultSetHeader>(
      'INSERT INTO medications (user_id, name, note, image_data) VALUES (?,?,?,?)',
      [req.userId, d.name, d.details || null, d.image ?? null],
    );
    await conn.query(
      'INSERT INTO medication_schedules (medication_id, time_of_day, days_of_week) VALUES (?,?,?)',
      [m.insertId, `${d.timeOfDay}:00`, [...new Set(d.days)].sort().join(',')],
    );
    await conn.commit();
    res.status(201).json({ id: m.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

medicationsRouter.put('/:id', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' });
  const d = p.data;
  const conn = await usersDb.getConnection();
  try {
    await conn.beginTransaction();
    const [u] = await conn.query<ResultSetHeader>(
      'UPDATE medications SET name=?, note=?, image_data=? WHERE id=? AND user_id=? AND active=1',
      [d.name, d.details || null, d.image ?? null, id, req.userId],
    );
    if (u.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'ไม่พบรายการยา' });
    }
    await conn.query('UPDATE medication_schedules SET time_of_day=?, days_of_week=? WHERE medication_id=?', [
      `${d.timeOfDay}:00`,
      [...new Set(d.days)].sort().join(','),
      id,
    ]);
    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

medicationsRouter.put('/:id/log', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
  const parsed = doseLogBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลสถานะยาไม่ถูกต้อง' });
  const { date, timeOfDay, status } = parsed.data;
  const scheduledAt = `${date} ${timeOfDay}:00`;
  const conn = await usersDb.getConnection();
  try {
    await conn.beginTransaction();
    const [schedules] = await conn.query<RowDataPacket[]>(
      `SELECT s.id AS scheduleId
       FROM medication_schedules s
       JOIN medications m ON m.id = s.medication_id
       WHERE m.id = ? AND m.user_id = ? AND m.active = 1
         AND TIME_FORMAT(s.time_of_day, '%H:%i') = ?
       AND FIND_IN_SET(
         CAST(WEEKDAY(?) + 1 AS CHAR CHARACTER SET ascii),
         CAST(s.days_of_week AS CHAR CHARACTER SET ascii)
       ) > 0
       FOR UPDATE`,
      [id, req.userId, timeOfDay, date],
    );
    if (!schedules[0]) {
      await conn.rollback();
      return res.status(404).json({ error: 'ไม่พบคิวเวลานี้' });
    }

    const scheduleId = Number(schedules[0].scheduleId);
    const [logs] = await conn.query<RowDataPacket[]>(
      'SELECT id FROM medication_logs WHERE schedule_id = ? AND scheduled_at = ? FOR UPDATE',
      [scheduleId, scheduledAt],
    );
    if (logs[0]) {
      await conn.query(
        `UPDATE medication_logs
         SET status = ?, taken_at = CASE WHEN ? = 'taken' THEN NOW() ELSE NULL END
         WHERE id = ?`,
        [status, status, logs[0].id],
      );
    } else {
      await conn.query(
        `INSERT INTO medication_logs (schedule_id, scheduled_at, taken_at, status)
         VALUES (?, ?, CASE WHEN ? = 'taken' THEN NOW() ELSE NULL END, ?)`,
        [scheduleId, scheduledAt, status, status],
      );
    }
    await conn.commit();
    res.json({ scheduleId, scheduledAt, status });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
});

// ลบแบบ soft delete (active=0) เพื่อเก็บประวัติ medication_logs ไว้
medicationsRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
  const [r] = await usersDb.query<ResultSetHeader>('UPDATE medications SET active=0 WHERE id=? AND user_id=?', [
    id,
    req.userId,
  ]);
  if (r.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบรายการยา' });
  res.json({ ok: true });
});
