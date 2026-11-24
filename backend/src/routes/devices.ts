import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { devicesDb } from '../db/pools.js';
import { usersDb } from '../db/pools.js';
import { requireAuth, type AuthedRequest } from '../middleware/auth.js';

export const devicesRouter = Router();

devicesRouter.post('/pair', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({
    deviceId: z.string().trim().min(1).max(128),
    name: z.string().trim().max(80).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลนาฬิกาไม่ถูกต้อง' });
  await usersDb.query('DELETE FROM user_devices WHERE user_id = ?', [req.userId]);
  await usersDb.query(
    `INSERT INTO user_devices (user_id, device_model_code, ble_id, nickname, last_connected_at)
     VALUES (?, 'KIT-GLE', ?, ?, NOW())`,
    [req.userId, parsed.data.deviceId, parsed.data.name ?? null],
  );
  res.json({ connected: true });
});

devicesRouter.delete('/pair', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ deviceId: z.string().trim().min(1).max(128).optional() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลนาฬิกาไม่ถูกต้อง' });
  await usersDb.query(
    parsed.data.deviceId
      ? 'DELETE FROM user_devices WHERE user_id = ? AND ble_id = ?'
      : 'DELETE FROM user_devices WHERE user_id = ?',
    parsed.data.deviceId ? [req.userId, parsed.data.deviceId] : [req.userId],
  );
  res.json({ connected: false });
});

/** รายการรุ่นอุปกรณ์ที่รองรับ */
devicesRouter.get('/models', async (_req, res) => {
  const [rows] = await devicesDb.query<RowDataPacket[]>(
    'SELECT code, name, ble_name_prefix, min_app_version, firmware_latest FROM device_models WHERE active = 1',
  );
  res.json({ models: rows });
});

/** ความสามารถ + BLE profile ของรุ่นหนึ่ง (แอปใช้แทน hardcode UUID) */
devicesRouter.get('/models/:code', async (req, res) => {
  const [models] = await devicesDb.query<RowDataPacket[]>('SELECT * FROM device_models WHERE code = ? AND active = 1', [
    req.params.code,
  ]);
  const model = models[0];
  if (!model) return res.status(404).json({ error: 'ไม่พบรุ่นอุปกรณ์' });
  const [caps] = await devicesDb.query<RowDataPacket[]>('SELECT feature FROM device_capabilities WHERE model_id = ?', [
    model.id,
  ]);
  const [ble] = await devicesDb.query<RowDataPacket[]>(
    'SELECT purpose, service_uuid, characteristic_uuid, direction, payload_format FROM device_ble_profiles WHERE model_id = ?',
    [model.id],
  );
  res.json({ model, capabilities: caps.map((c) => c.feature), bleProfiles: ble });
});
