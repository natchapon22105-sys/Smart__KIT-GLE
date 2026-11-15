import { Router } from 'express';
import { authRouter } from './auth.js';
import { devicesRouter } from './devices.js';
import { healthRouter } from './health.js';
import { familyRouter } from './family.js';

export const api = Router();
api.get('/ping', (_req, res) => res.json({ ok: true, service: 'kit-gle-backend' }));
api.use('/auth', authRouter);
api.use('/devices', devicesRouter);
api.use('/health', healthRouter);
api.use('/family', familyRouter);
// TODO: /medications (MediRemind CRUD + logs) — ดู docs/HANDOFF.md
