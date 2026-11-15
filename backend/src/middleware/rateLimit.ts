import type { NextFunction, Request, Response } from 'express';

/**
 * จำกัดจำนวนครั้งต่อ IP แบบง่าย (เก็บในหน่วยความจำ) กันเดารหัสผ่าน
 * - skipSuccessful: true = นับเฉพาะคำขอที่ล้มเหลว (status >= 400) เหมาะกับ login
 *   ผู้ใช้ที่ล็อกอินสำเร็จซ้ำ ๆ จะไม่โดนบล็อก
 * หมายเหตุ production: ถ้ารันหลายเครื่อง/หลัง proxy ให้ตั้ง app.set('trust proxy', 1) และย้ายไปใช้ Redis
 */
export function rateLimit({
  windowMs,
  max,
  skipSuccessful = false,
}: {
  windowMs: number;
  max: number;
  skipSuccessful?: boolean;
}) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // ล้างรายการหมดอายุเป็นระยะ กัน Map โตไม่จำกัด (unref = ไม่รั้ง process ไว้)
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  }, Math.max(windowMs, 60_000)).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip ?? 'unknown';
    let entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    if (entry.count >= max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่' });
    }

    entry.count += 1;
    if (skipSuccessful) {
      const e = entry;
      res.on('finish', () => {
        if (res.statusCode < 400 && e.count > 0) e.count -= 1;
      });
    }
    next();
  };
}
