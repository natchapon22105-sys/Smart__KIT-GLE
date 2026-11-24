import { Router } from 'express';
import { z } from 'zod';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

export const familyRouter = Router();
familyRouter.use(requireAuth);

const parseId = (v: string | string[]) => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null);

/**
 * รายการความสัมพันธ์ของฉัน แยก 3 กลุ่มตามหน้า Family Link:
 *  - waiting   = คำขอที่ฉันส่งไปแล้ว รอเขาตอบ (CANCEL ได้)
 *  - incoming  = คำขอที่คนอื่นส่งมาหาฉัน (ตอบรับ/ปฏิเสธ)  [ไม่มีใน Figma]
 *  - connected = เชื่อมต่อแล้ว (UN-LINK ได้)  direction: 'sharing' = เขาดูข้อมูลฉัน · 'watching' = ฉันดูข้อมูลเขา
 */
familyRouter.get('/links', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT fl.id, fl.status, fl.owner_user_id AS ownerId,
            u.id AS userId, u.username, u.display_name AS displayName, u.avatar_data AS avatar
       FROM family_links fl
       JOIN users u ON u.id = IF(fl.owner_user_id = ?, fl.member_user_id, fl.owner_user_id)
      WHERE (fl.owner_user_id = ? OR fl.member_user_id = ?) AND fl.status IN ('pending','accepted')
      ORDER BY fl.created_at DESC`,
    [req.userId, req.userId, req.userId],
  );
  const row = (r: RowDataPacket) => ({
    id: r.id,
    userId: r.userId,
    username: r.username,
    displayName: r.displayName,
    avatar: r.avatar,
  });
  res.json({
    waiting: rows.filter((r) => r.status === 'pending' && r.ownerId === req.userId).map(row),
    incoming: rows.filter((r) => r.status === 'pending' && r.ownerId !== req.userId).map(row),
    connected: rows
      .filter((r) => r.status === 'accepted')
      .map((r) => ({ ...row(r), direction: r.ownerId === req.userId ? 'sharing' : 'watching' })),
  });
});

/**
 * ค้นหาผู้ใช้เพื่อส่งคำขอ (หน้า search Username or Email): username ขึ้นต้นด้วยคำค้น หรืออีเมลตรงทุกตัว
 * ต้องพิมพ์ ≥ 2 ตัว คืนเฉพาะ username/ชื่อที่แสดง (ไม่เปิดเผยอีเมล) สูงสุด 20 รายการ
 * relation: none = ยังไม่เคยส่ง · sent = ส่งคำขอแล้วรอตอบ · incoming = เขาส่งมาหาฉัน · linked = เชื่อมต่อแล้ว
 */
familyRouter.get('/search', rateLimit({ windowMs: 60_000, max: 60 }), async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? '').trim().toLowerCase().replace(/^@/, '').slice(0, 255);
  if (q.length < 2) return res.json({ users: [] });
  const like = `${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT u.id AS userId, u.username, u.display_name AS displayName, u.avatar_data AS avatar,
            fl.status, fl.owner_user_id AS ownerId
       FROM users u
       LEFT JOIN family_links fl
         ON (fl.owner_user_id = ? AND fl.member_user_id = u.id)
         OR (fl.owner_user_id = u.id AND fl.member_user_id = ?)
      WHERE u.id <> ? AND (u.username LIKE ? OR u.email = ?)
      ORDER BY u.username LIMIT 20`,
    [req.userId, req.userId, req.userId, like, q],
  );
  res.json({
    users: rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      displayName: r.displayName,
      avatar: r.avatar,
      relation:
        r.status === 'accepted' ? 'linked' : r.status === 'pending' ? (r.ownerId === req.userId ? 'sent' : 'incoming') : 'none',
    })),
  });
});

/** ส่งคำขอเชื่อมต่อ: ผู้ใช้ (owner) เชิญสมาชิกครอบครัว (member) ด้วย username หรืออีเมล เพื่อให้เขาดูข้อมูลของฉัน */
familyRouter.post(
  '/invite',
  rateLimit({ windowMs: 15 * 60_000, max: 30 }),
  async (req: AuthedRequest, res) => {
    const parsed = z.object({ query: z.string().trim().toLowerCase().min(1).max(255) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้หรืออีเมล' });
    const q = parsed.data.query.replace(/^@/, '');
    const [u] = await usersDb.query<RowDataPacket[]>('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1', [q, q]);
    if (!u[0]) return res.status(404).json({ error: 'ไม่พบผู้ใช้นี้' });
    const memberId = Number(u[0].id);
    if (memberId === req.userId) return res.status(400).json({ error: 'เชิญตัวเองไม่ได้' });

    const [existing] = await usersDb.query<RowDataPacket[]>(
      `SELECT id, status FROM family_links
        WHERE (owner_user_id = ? AND member_user_id = ?) OR (owner_user_id = ? AND member_user_id = ?)`,
      [req.userId, memberId, memberId, req.userId],
    );
    if (existing.some((r) => r.status === 'accepted')) return res.status(409).json({ error: 'เชื่อมต่อกับผู้ใช้นี้อยู่แล้ว' });
    if (existing.some((r) => r.status === 'pending')) return res.status(409).json({ error: 'มีคำขอที่รอตอบอยู่แล้ว' });

    // เคยถูกปฏิเสธ/ยกเลิกแบบ revoked → ใช้แถวเดิมส่งคำขอใหม่ (UNIQUE owner+member)
    await usersDb.query<ResultSetHeader>(
      `INSERT INTO family_links (owner_user_id, member_user_id, status) VALUES (?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending', created_at = CURRENT_TIMESTAMP`,
      [req.userId, memberId],
    );
    res.status(201).json({ ok: true });
  },
);

/** ผู้รับคำขอ (member) ตอบรับ/ปฏิเสธ */
familyRouter.post('/:id/respond', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  const parsed = z.object({ accept: z.boolean() }).safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
  const [r] = await usersDb.query<ResultSetHeader>(
    parsed.data.accept
      ? "UPDATE family_links SET status = 'accepted' WHERE id = ? AND member_user_id = ? AND status = 'pending'"
      : "DELETE FROM family_links WHERE id = ? AND member_user_id = ? AND status = 'pending'",
    [id, req.userId],
  );
  if (r.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบคำขอ' });
  res.json({ ok: true });
});

/** ยกเลิกคำขอที่ส่งไป (CANCEL) หรือยกเลิกการเชื่อมต่อ (UN-LINK) — ทำได้ทั้งสองฝั่ง */
familyRouter.delete('/:id', async (req: AuthedRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });
  const [r] = await usersDb.query<ResultSetHeader>(
    'DELETE FROM family_links WHERE id = ? AND (owner_user_id = ? OR member_user_id = ?)',
    [id, req.userId, req.userId],
  );
  if (r.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json({ ok: true });
});

/** อ่านประวัติข้อความได้เฉพาะสมาชิก Family Link ที่เชื่อมต่ออยู่ */
familyRouter.get('/:id/messages', rateLimit({ windowMs: 60_000, max: 60 }), async (req: AuthedRequest, res) => {
  const linkId = parseId(req.params.id);
  if (!linkId) return res.status(400).json({ error: 'รหัสไม่ถูกต้อง' });

  const [links] = await usersDb.query<RowDataPacket[]>(
    "SELECT id FROM family_links WHERE id = ? AND status = 'accepted' AND (owner_user_id = ? OR member_user_id = ?)",
    [linkId, req.userId, req.userId],
  );
  if (!links[0]) return res.status(404).json({ error: 'ไม่พบสมาชิกครอบครัวที่เชื่อมต่ออยู่' });

  const afterValue = req.query.afterId;
  const afterId =
    afterValue === undefined
      ? null
      : typeof afterValue === 'string' && /^\d+$/.test(afterValue)
        ? Number(afterValue)
        : NaN;
  if (afterId !== null && (!Number.isSafeInteger(afterId) || afterId < 0)) {
    return res.status(400).json({ error: 'รหัสข้อความไม่ถูกต้อง' });
  }

  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT m.id, m.sender_user_id AS senderId,
            COALESCE(NULLIF(u.display_name, ''), u.username) AS senderName,
            m.body, m.image_data AS imageData, m.created_at AS createdAt
       FROM family_messages m
       JOIN users u ON u.id = m.sender_user_id
      WHERE m.family_link_id = ? ${afterId === null ? '' : 'AND m.id > ?'}
      ORDER BY m.id ${afterId === null ? 'DESC' : 'ASC'}
      LIMIT ?`,
    afterId === null ? [linkId, 50] : [linkId, afterId, 100],
  );
  const messages = afterId === null ? rows.reverse() : rows;
  res.json({
    messages: messages.map((message) => ({
      id: Number(message.id),
      senderId: Number(message.senderId),
      senderName: message.senderName,
      body: message.body,
      imageData: message.imageData,
      createdAt: message.createdAt,
    })),
  });
});

/** ส่งข้อความหรือรูปภาพให้สมาชิกที่เชื่อมต่ออยู่ */
familyRouter.post(
  '/:id/messages',
  rateLimit({ windowMs: 60_000, max: 30 }),
  async (req: AuthedRequest, res) => {
    const linkId = parseId(req.params.id);
    const parsed = z
      .object({
        body: z.string().trim().max(2000).optional(),
        imageData: z
          .string()
          .max(1_400_000)
          .regex(/^data:image\/(?:jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/i)
          .optional(),
      })
      .refine((message) => Boolean(message.body || message.imageData))
      .safeParse(req.body);
    if (!linkId || !parsed.success) return res.status(400).json({ error: 'ข้อความหรือรูปภาพไม่ถูกต้อง' });

    const [links] = await usersDb.query<RowDataPacket[]>(
      "SELECT id FROM family_links WHERE id = ? AND status = 'accepted' AND (owner_user_id = ? OR member_user_id = ?)",
      [linkId, req.userId, req.userId],
    );
    if (!links[0]) return res.status(404).json({ error: 'ไม่พบสมาชิกครอบครัวที่เชื่อมต่ออยู่' });

    const body = parsed.data.body || null;
    const imageData = parsed.data.imageData || null;
    const [inserted] = await usersDb.query<ResultSetHeader>(
      'INSERT INTO family_messages (family_link_id, sender_user_id, body, image_data) VALUES (?, ?, ?, ?)',
      [linkId, req.userId, body, imageData],
    );
    const [rows] = await usersDb.query<RowDataPacket[]>(
      `SELECT m.id, m.sender_user_id AS senderId,
              COALESCE(NULLIF(u.display_name, ''), u.username) AS senderName,
              m.body, m.image_data AS imageData, m.created_at AS createdAt
         FROM family_messages m
         JOIN users u ON u.id = m.sender_user_id
        WHERE m.id = ?`,
      [inserted.insertId],
    );
    const message = rows[0];
    res.status(201).json({
      id: Number(message.id),
      senderId: Number(message.senderId),
      senderName: message.senderName,
      body: message.body,
      imageData: message.imageData,
      createdAt: message.createdAt,
    });
  },
);

/** รายชื่อผู้ใช้ที่ฉันดูแลอยู่ */
familyRouter.get('/watching', async (req: AuthedRequest, res) => {
  const [rows] = await usersDb.query<RowDataPacket[]>(
    `SELECT fl.id, u.id AS ownerId, u.username, fl.can_view_health, fl.can_view_meds
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
