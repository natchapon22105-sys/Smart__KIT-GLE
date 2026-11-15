import { useEffect } from 'react';
import { getBleService, type HealthSample } from '@/services/ble';
import { ApiError } from '@/services/api/client';
import { healthApi } from '@/services/health';

const MIN_GAP_MS = 30_000; // เก็บลง DB อย่างน้อยห่างกัน 30 วินาที (นาฬิกาส่งถี่กว่านี้)
const MAX_BUFFER = 200; // ตรงกับ limit ของ backend (max 500) และกันหน่วยความจำบวมเมื่อเน็ตหลุดนาน

/**
 * ส่งข้อมูลสุขภาพจากนาฬิกา (BleService.subscribeHealth) เข้า backend ต่อเนื่อง
 * → หน้า Health status อ่านจาก /api/health/records ได้ข้อมูลจริง
 * - เน็ตหลุด/เซิร์ฟเวอร์ล้ม: เก็บในบัฟเฟอร์แล้วส่งใหม่ในรอบถัดไป
 * - backend ปฏิเสธข้อมูล (4xx): ทิ้งชุดนั้น ไม่วนส่งซ้ำ
 * ติดตั้งครั้งเดียวที่ app/(tabs)/_layout.tsx เพื่อให้ทำงานทุกหน้า ไม่ใช่เฉพาะตอนเปิด Health
 */
export function useHealthSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const ble = getBleService();
    let buffer: HealthSample[] = [];
    let lastAccepted = 0;
    let flushing = false;

    const flush = async () => {
      if (flushing || buffer.length === 0) return;
      flushing = true;
      const batch = buffer;
      buffer = [];
      try {
        await healthApi.upload(batch);
      } catch (e) {
        const rejected = e instanceof ApiError && e.status >= 400 && e.status < 500;
        if (!rejected) buffer = [...batch, ...buffer].slice(-MAX_BUFFER);
      } finally {
        flushing = false;
      }
    };

    const off = ble.subscribeHealth((s) => {
      if (s.timestamp - lastAccepted < MIN_GAP_MS) return;
      lastAccepted = s.timestamp;
      buffer.push(s);
      void flush();
    });
    return () => {
      off();
      void flush();
    };
  }, [enabled]);
}
