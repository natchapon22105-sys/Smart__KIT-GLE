import { api } from '@/services/api/client';
import type { HealthSample } from '@/services/ble';

export type HealthDay = { date: string; steps: number | null; sleepHours: number | null };
export type HealthHour = { hour: string; spo2: number | null; heartRate: number | null };
export type HealthSummary = { days: HealthDay[]; hourly: HealthHour[] };

export const health = {
  summary: () => api.get<HealthSummary>('/health/summary'),
};

const UPLOAD_EVERY_MS = 60_000;
let lastUpload = 0;

/** ส่งค่าสุขภาพล่าสุดจากนาฬิกาไปเก็บ (อย่างน้อยทุก 60 วินาที ล้มเหลวเงียบ ๆ ได้ — ไม่รบกวนหน้าจอ) */
export function uploadHealthSample(s: HealthSample) {
  const now = Date.now();
  if (now - lastUpload < UPLOAD_EVERY_MS) return;
  lastUpload = now;
  api
    .post('/health/records', {
      samples: [
        {
          heartRate: s.heartRate,
          spo2: s.spo2,
          steps: s.steps,
          temperature: s.temperature,
          recordedAt: new Date(s.timestamp || now).toISOString(),
        },
      ],
    })
    .catch(() => {
      lastUpload = 0; // ลองใหม่ในรอบถัดไป
    });
}
