import { Router } from 'express';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

/** หน้า Setting: ข้อมูลส่วนตัว (ชื่อ, วันเกิด→อายุ, เพศ, ส่วนสูง, น้ำหนัก) + รายงานปัญหาแอป */
export const profileRouter = Router();
profileRouter.use(requireAuth);

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

const today = () => new Date().toISOString().slice(0, 10);

const profileBody = z.object({
  displayName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(120),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'วันเกิดต้องอยู่ในรูปแบบ ปปปป-ดด-วว')
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, 'วันเกิดไม่ถูกต้อง')
    .refine((v) => v >= '1900-01-01' && v <= today(), 'วันเกิดไม่ถูกต้อง')
    .nullable(),
  gender: z.enum(['male', 'female', 'other']).nullable(),
  heightCm: z.number().int().min(50, 'ส่วนสูงต้องอยู่ระหว่าง 50–260 ซม.').max(260, 'ส่วนสูงต้องอยู่ระหว่าง 50–260 ซม.').nullable(),
  weightKg: z.number().min(10, 'น้ำหนักต้องอยู่ระหว่าง 10–400 กก.').max(400, 'น้ำหนักต้องอยู่ระหว่าง 10–400 กก.').nullable(),
});

const SELECT = `SELECT email, username, display_name AS displayName,
       DATE_FORMAT(birth_date, '%Y-%m-%d') AS birthDate, gender,
       height_cm AS heightCm, weight_kg AS weightKg, avatar_data AS avatar
  FROM users WHERE id = ?`;

const shape = (r: RowDataPacket) => ({ ...r, weightKg: r.weightKg == null ? null : Number(r.weightKg) });

profileRouter.get('/', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<RowDataPacket[]>(SELECT, [req.userId]);
  if (!rows[0]) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });
  res.json({ profile: shape(rows[0]) });
});

profileRouter.put('/', async (req: AuthedRequest, res) => {
  const p = profileBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' });
  const d = p.data;
  await usersDb.query(
    'UPDATE users SET display_name = ?, birth_date = ?, gender = ?, height_cm = ?, weight_kg = ? WHERE id = ?',
    [d.displayName, d.birthDate, d.gender, d.heightCm, d.weightKg, req.userId],
  );
  const [rows] = await usersDb.query<RowDataPacket[]>(SELECT, [req.userId]);
  res.json({ profile: shape(rows[0]!) });
});

// รูปโปรไฟล์: ส่ง data URI ที่ย่อแล้วจากแอป หรือ null เพื่อลบรูป
profileRouter.put('/avatar', async (req: AuthedRequest, res) => {
  const p = z
    .object({ image: z.string().startsWith('data:image/').max(1_500_000).nullable() })
    .safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'รูปไม่ถูกต้องหรือมีขนาดใหญ่เกินไป' });
  await usersDb.query('UPDATE users SET avatar_data = ? WHERE id = ?', [p.data.image, req.userId]);
  res.json({ avatar: p.data.image });
});

reportsRouter.post('/', rateLimit({ windowMs: 60 * 60_000, max: 10 }), async (req: AuthedRequest, res) => {
  const p = z.object({ message: z.string().trim().min(5, 'กรุณาอธิบายปัญหาอย่างน้อย 5 ตัวอักษร').max(2000) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' });
  await usersDb.query('INSERT INTO app_reports (user_id, message) VALUES (?, ?)', [req.userId, p.data.message]);
  res.status(201).json({ ok: true });
});
