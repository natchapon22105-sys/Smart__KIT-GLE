import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export type AuthedRequest = Request & { userId?: number };

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'ต้องเข้าสู่ระบบ' });
  try {
    const payload = jwt.verify(h.slice(7), env.JWT_SECRET) as { sub: string };
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'โทเคนไม่ถูกต้องหรือหมดอายุ' });
  }
}
