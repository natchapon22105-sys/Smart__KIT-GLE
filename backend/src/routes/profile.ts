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

/** โปรไฟล์สาธารณะสำหรับผู้ใช้ที่ล็อกอินแล้ว */
profileRouter.get('/users/:userId', rateLimit({ windowMs: 60_000, max: 60 }), async (req: AuthedRequest, res) => {
  const rawId = req.params.userId;
  const userId = typeof rawId === 'string' && /^\d+$/.test(rawId) ? Number(rawId) : null;
  if (!userId || !Number.isSafeInteger(userId)) return res.status(400).json({ error: 'รหัสผู้ใช้ไม่ถูกต้อง' });

  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT id AS userId, username, display_name AS displayName, avatar_data AS avatar,
            DATE_FORMAT(birth_date, '%Y-%m-%d') AS birthDate,
            height_cm AS heightCm, weight_kg AS weightKg
       FROM users WHERE id = ?`,
    [userId],
  );
  if (!rows[0]) return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้' });

  const [deviceRows] = await usersDb.query<RowDataPacket[]>(
    'SELECT id FROM user_devices WHERE user_id = ? ORDER BY last_connected_at DESC LIMIT 1',
    [userId],
  );
  const watchConnected = deviceRows.length > 0;

  let canViewMeds = req.userId === userId;
  let canViewHealth = req.userId === userId;
  if (req.userId !== userId) {
    const [permissions] = await usersDb.query<RowDataPacket[]>(
      `SELECT can_view_meds, can_view_health
         FROM family_links
        WHERE owner_user_id = ? AND member_user_id = ? AND status = 'accepted'
        LIMIT 1`,
      [userId, req.userId],
    );
    canViewMeds = !!permissions[0]?.can_view_meds;
    canViewHealth = !!permissions[0]?.can_view_health;
  }

  let medicationStatus: {
    taken: number;
    pending: number;
    items: Array<{ name: string; timeOfDay: string; status: 'taken' | 'pending' | 'missed' | 'skipped' }>;
  } | null = null;
  if (canViewMeds) {
    const [medRows] = await usersDb.query<RowDataPacket[]>(
      `SELECT m.name, TIME_FORMAT(s.time_of_day, '%H:%i') AS timeOfDay, l.status
         FROM medications m
         JOIN medication_schedules s ON s.medication_id = m.id
         LEFT JOIN medication_logs l
           ON l.schedule_id = s.id
          AND DATE(l.scheduled_at) = CURDATE()
        WHERE m.user_id = ? AND m.active = 1 AND s.enabled = 1
          AND FIND_IN_SET(CAST(WEEKDAY(CURDATE()) + 1 AS CHAR CHARACTER SET ascii),
                          CAST(s.days_of_week AS CHAR CHARACTER SET ascii)) > 0
        ORDER BY s.time_of_day, m.name`,
      [userId],
    );
    const now = new Date();
    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const items = medRows.map((r) => {
      const logged = r.status as 'taken' | 'pending' | 'missed' | 'skipped' | null;
      const [hour, minute] = String(r.timeOfDay).split(':').map(Number);
      const status = logged ?? (hour * 60 + minute < nowMinute ? 'missed' : 'pending');
      return { name: String(r.name), timeOfDay: String(r.timeOfDay), status };
    });
    medicationStatus = {
      taken: items.filter((item) => item.status === 'taken').length,
      pending: items.filter((item) => item.status === 'pending' || item.status === 'missed').length,
      items,
    };
  }

  let healthStatus: {
    heartRate: number | null;
    spo2: number | null;
    steps: number | null;
    temperature: number | null;
    recordedAt: string | null;
  } | null = null;
  if (watchConnected && canViewHealth) {
    const [healthRows] = await usersDb.query<RowDataPacket[]>(
      `SELECT heart_rate AS heartRate, spo2, steps, temperature, recorded_at AS recordedAt
         FROM health_records
        WHERE user_id = ?
        ORDER BY recorded_at DESC LIMIT 1`,
      [userId],
    );
    if (healthRows[0]) {
      healthStatus = {
        heartRate: healthRows[0].heartRate == null ? null : Number(healthRows[0].heartRate),
        spo2: healthRows[0].spo2 == null ? null : Number(healthRows[0].spo2),
        steps: healthRows[0].steps == null ? null : Number(healthRows[0].steps),
        temperature: healthRows[0].temperature == null ? null : Number(healthRows[0].temperature),
        recordedAt: healthRows[0].recordedAt ? new Date(healthRows[0].recordedAt).toISOString() : null,
      };
    }
  }

  res.json({
    profile: {
      ...rows[0],
      heightCm: rows[0].heightCm == null ? null : Number(rows[0].heightCm),
      weightKg: rows[0].weightKg == null ? null : Number(rows[0].weightKg),
      watchConnected,
      canViewMeds,
      canViewHealth,
      medicationStatus,
      healthStatus,
    },
  });
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
