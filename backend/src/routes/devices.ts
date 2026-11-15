import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { devicesDb } from '../db/pools.js';

export const devicesRouter = Router();

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
