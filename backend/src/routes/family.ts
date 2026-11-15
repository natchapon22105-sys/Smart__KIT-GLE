import { Router } from 'express';
import { z } from 'zod';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const familyRouter = Router();
familyRouter.use(requireAuth);

/** ผู้ใช้นาฬิกา (owner) เชิญญาติ (member) ด้วยอีเมล */
familyRouter.post('/invite', async (req: AuthedRequest, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  const [u] = await usersDb.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [parsed.data.email]);
  if (!u[0]) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
  if (u[0].id === req.userId) return res.status(400).json({ error: 'เชิญตัวเองไม่ได้' });
  await usersDb.query<ResultSetHeader>(
    'INSERT IGNORE INTO family_links (owner_user_id, member_user_id) VALUES (?, ?)',
    [req.userId, u[0].id],
  );
  res.status(201).json({ ok: true });
});

/** ญาติตอบรับ/ปฏิเสธ — member เป็นคนกด */
familyRouter.post('/:id/respond', async (req: AuthedRequest, res) => {
  const parsed = z.object({ accept: z.boolean() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  await usersDb.query(
    "UPDATE family_links SET status = ? WHERE id = ? AND member_user_id = ? AND status = 'pending'",
    [parsed.data.accept ? 'accepted' : 'revoked', req.params.id, req.userId],
  );
  res.json({ ok: true });
});

/** รายชื่อผู้ใช้ที่ฉันดูแลอยู่ */
familyRouter.get('/watching', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT fl.id, u.display_name, fl.can_view_health, fl.can_view_meds
       FROM family_links fl JOIN users u ON u.id = fl.owner_user_id
      WHERE fl.member_user_id = ? AND fl.status = 'accepted'`,
    [req.userId],
  );
  res.json({ owners: rows });
});

/** ญาติดูข้อมูลสุขภาพล่าสุดของ owner — ตรวจสิทธิ์ก่อนเสมอ */
familyRouter.get('/owners/:ownerId/health', async (req: AuthedRequest, res) => {
  const [link] = await usersDb.query<RowDataPacket[]>(
    "SELECT can_view_health FROM family_links WHERE owner_user_id = ? AND member_user_id = ? AND status = 'accepted'",
    [req.params.ownerId, req.userId],
  );
  if (!link[0]?.can_view_health) return res.status(403).json({ error: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
  const [rows] = await usersDb.query<RowDataPacket[]>(
    'SELECT heart_rate, spo2, steps, temperature, recorded_at FROM health_records WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 50',
    [req.params.ownerId],
  );
  res.json({ records: rows });
});
