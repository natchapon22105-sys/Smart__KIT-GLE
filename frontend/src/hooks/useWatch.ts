import { useCallback, useEffect, useMemo, useState } from 'react';
import { uploadHealthSample } from '@/services/health';
import { getBleService, type ConnectionState, type HealthSample, type WatchDevice } from '@/services/ble';

/**
 * สถานะนาฬิกาสำหรับหน้าจอ — ครอบ BleService (UI ห้ามเรียก BLE ตรง)
 * โหมดจำลอง (เว็บ / EXPO_PUBLIC_USE_MOCK_BLE=true) จะได้ค่าสุขภาพสุ่มทุก 2 วินาทีหลังกด CONNECT
 */
export function useWatch() {
  const ble = useMemo(() => getBleService(), []);
  const [state, setState] = useState<ConnectionState>(ble.getState());
  const [health, setHealth] = useState<HealthSample | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offState = ble.onStateChange(setState);
    const offHealth = ble.subscribeHealth((sample) => {
      setHealth(sample);
      uploadHealthSample(sample); // เก็บลงฐานข้อมูล (หน่วงเวลา) เพื่อใช้แสดงกราฟหน้า Health status
    });
    return () => {
      offState();
      offHealth();
    };
  }, [ble]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const found: WatchDevice[] = [];
      await ble.scan((d) => found.push(d), 5000);
      const first = found[0];
      if (!first) {
        setError('ไม่พบนาฬิกาใกล้เคียง ตรวจสอบว่าเปิดนาฬิกาและ Bluetooth แล้ว');
        return;
      }
      await ble.connect(first.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เชื่อมต่อนาฬิกาไม่สำเร็จ');
    }
  }, [ble]);

  const disconnect = useCallback(async () => {
    setError(null);
    setHealth(null);
    await ble.disconnect();
  }, [ble]);

  return {
    state,
    health,
    error,
    connected: state === 'connected',
    busy: state === 'scanning' || state === 'connecting',
    isMock: ble.isMock,
    connect,
    disconnect,
  };
}
