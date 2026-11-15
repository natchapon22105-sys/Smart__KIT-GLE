import { MockBleService } from './MockBleService';
import type { BleService } from './types';

export * from './types';

/** เว็บ: ใช้นาฬิกาจำลองเสมอ (Web Bluetooth ไม่รองรับเต็มรูปแบบ) — ไฟล์ index.native.ts ใช้บนมือถือ */
let instance: BleService | null = null;
export function getBleService(): BleService {
  if (!instance) instance = new MockBleService();
  return instance;
}
