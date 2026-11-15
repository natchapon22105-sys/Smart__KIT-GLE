import { api } from '@/services/api/client';
import type { HealthSample } from '@/services/ble';

/** แถวจาก GET /api/health/records (เรียงใหม่ → เก่า) */
export type HealthRecord = {
  heart_rate: number | null;
  spo2: number | null;
  steps: number | null;
  temperature: number | string | null;
  recorded_at: string;
};

const int = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? undefined : Math.round(v));

export const healthApi = {
  records: async () => (await api.get<{ records: HealthRecord[] }>('/health/records')).records,
  /** ส่งค่าจากนาฬิกาเข้า POST /api/health/records (ฟิลด์ที่ไม่มีค่าจะไม่ส่ง) */
  upload: async (samples: HealthSample[]) => {
    const payload = samples
      .filter((s) => s.heartRate !== undefined || s.spo2 !== undefined || s.steps !== undefined || s.temperature !== undefined)
      .map((s) => ({
        heartRate: int(s.heartRate),
        spo2: int(s.spo2),
        steps: int(s.steps),
        temperature: s.temperature === undefined ? undefined : Math.round(s.temperature * 10) / 10,
        recordedAt: new Date(s.timestamp).toISOString(),
      }));
    if (payload.length === 0) return;
    await api.post('/health/records', { samples: payload });
  },
};

export const WEEK_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/**
 * ก้าวต่อวัน จันทร์–อาทิตย์ของสัปดาห์นี้ (ใช้ค่าสูงสุดของวัน เพราะนาฬิกานับสะสมรายวัน)
 * คืน null ถ้าไม่มีข้อมูลก้าวในสัปดาห์นี้เลย
 */
export function weeklySteps(records: HealthRecord[], now = new Date()): number[] | null {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const days = Array<number>(7).fill(0);
  let found = false;
  for (const r of records) {
    if (r.steps == null) continue;
    const t = new Date(r.recorded_at);
    const idx = Math.floor((new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() - monday.getTime()) / 86400000);
    if (idx < 0 || idx > 6) continue;
    days[idx] = Math.max(days[idx], r.steps);
    found = true;
  }
  return found ? days : null;
}

/** ค่าล่าสุด n ค่า (เก่า → ใหม่) ของ SpO2 / HR — null ถ้ามีไม่ถึง 2 จุด (วาดเส้นไม่ได้) */
export function latestSeries(records: HealthRecord[], key: 'spo2' | 'heart_rate', n = 11): number[] | null {
  const values = records
    .map((r) => r[key])
    .filter((v): v is number => v != null)
    .slice(0, n)
    .reverse();
  return values.length >= 2 ? values : null;
}

/** ข้อมูลตัวอย่างหน้าตาตาม Figma — ใช้เมื่อยังไม่มีข้อมูลจริง */
export const DEMO = {
  steps: [3000, 10000, 6200, 800, 10000, 4700, 7100],
  spo2: [94, 95, 97, 94, 99, 97, 97, 98, 99, 95, 94],
  /** ชั่วโมงนอนต่อวัน จันทร์–อาทิตย์ — TODO: ยังไม่มีฟิลด์นอนใน DB/BLE */
  sleep: [6.5, 2.1, 10, 5.2, 8.5, 9.5, 2.6],
  heartRate: [62, 67, 80, 60, 95, 86, 86, 88, 96, 64, 60],
};
