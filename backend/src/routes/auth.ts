import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import type { RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { env } from '../config/env.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const authRouter = Router();

/** เวอร์ชันของข้อความ Privacy Policy ที่ผู้ใช้กดยอมรับ — เปลี่ยนเมื่อแก้ข้อความ (ต้องตรงกับ frontend/src/content/privacyPolicy.ts) */
const PRIVACY_VERSION = '1.0-draft';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/, 'ชื่อผู้ใช้ต้องเป็น a-z 0-9 _ . ยาว 3-30 ตัว'),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร')
    .max(100)
    .regex(/[A-Za-z]/, 'รหัสผ่านต้องมีตัวอักษร')
    .regex(/\d/, 'รหัสผ่านต้องมีตัวเลข'),
  acceptedPrivacy: z.literal(true, { errorMap: () => ({ message: 'ต้องยอมรับ Privacy Policy ก่อน' }) }),
});

const loginSchema = z.object({
  // อีเมลหรือชื่อผู้ใช้ก็ได้
  identifier: z.string().trim().toLowerCase().min(3).max(255),
  password: z.string().min(1).max(100),
});

const sign = (id: number) =>
  jwt.sign({ sub: String(id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

// hash หลอกไว้เทียบเวลา กันเดาว่ามีบัญชีนี้อยู่จากความเร็วการตอบ
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 12);

type UserRow = RowDataPacket & { id: number; email: string; username: string; password_hash: string };

const publicUser = (u: { id: number; email: string; username: string }) => ({
  id: u.id,
  email: u.email,
  username: u.username,
});

authRouter.post('/register', rateLimit({ windowMs: 15 * 60_000, max: 20 }), async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' });
  }
  const { email, username, password } = parsed.data;

  const [dup] = await usersDb.query<RowDataPacket[]>('SELECT email, username FROM users WHERE email = ? OR username = ?', [
    email,
    username,
  ]);
  if (dup.length) {
    const emailTaken = dup.some((r) => r.email === email);
    return res.status(409).json({ error: emailTaken ? 'อีเมลนี้ถูกใช้แล้ว' : 'ชื่อผู้ใช้นี้ถูกใช้แล้ว' });
  }

  const hash = await bcrypt.hash(password, 12);
  try {
    const [r] = await usersDb.query<import('mysql2').ResultSetHeader>(
      `INSERT INTO users (email, username, password_hash, display_name, privacy_accepted_at, privacy_version)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [email, username, hash, username, PRIVACY_VERSION],
    );
    res.status(201).json({ token: sign(r.insertId), user: publicUser({ id: r.insertId, email, username }) });
  } catch (e) {
    // กรณีสมัครพร้อมกัน (race) — unique key ป้องกันซ้ำที่ระดับ DB
    if ((e as { code?: string }).code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้แล้ว' });
    }
    throw e;
  }
});

// นับเฉพาะครั้งที่ล็อกอินไม่สำเร็จ: พลาดเกิน 10 ครั้ง/15 นาที/IP จึงโดนบล็อก
authRouter.post('/login', rateLimit({ windowMs: 15 * 60_000, max: 10, skipSuccessful: true }), async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'กรุณากรอกอีเมล/ชื่อผู้ใช้ และรหัสผ่าน' });
  const { identifier, password } = parsed.data;

  const [rows] = await usersDb.query<UserRow[]>(
    'SELECT id, email, username, password_hash FROM users WHERE email = ? OR username = ? LIMIT 1',
    [identifier, identifier],
  );
  const user = rows[0];
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' });

  res.json({ token: sign(user.id), user: publicUser(user) });
});

/** ตรวจโทเคนที่เก็บไว้ในเครื่อง + ดึงข้อมูลผู้ใช้ปัจจุบัน */
authRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<UserRow[]>('SELECT id, email, username FROM users WHERE id = ?', [req.userId]);
  if (!rows[0]) return res.status(401).json({ error: 'ไม่พบบัญชีผู้ใช้' });
  res.json({ user: publicUser(rows[0]) });
});
