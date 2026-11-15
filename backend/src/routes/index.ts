import { Router } from 'express';
import { authRouter } from './auth.js';
import { devicesRouter } from './devices.js';
import { healthRouter } from './health.js';
import { familyRouter } from './family.js';
import { medicationsRouter } from './medications.js';

export const api = Router();
api.get('/ping', (_req, res) => res.json({ ok: true, service: 'kit-gle-backend' }));
api.use('/auth', authRouter);
api.use('/devices', devicesRouter);
api.use('/health', healthRouter);
api.use('/family', familyRouter);
api.use('/medications', medicationsRouter);
// TODO: medication_logs (บันทึกการกินยาจากนาฬิกา) — ดู docs/HANDOFF.md
