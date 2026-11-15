import { env } from '@/config/env';
import { MockBleService } from './MockBleService';
import type { BleService } from './types';

export * from './types';

/**
 * มือถือ: EXPO_PUBLIC_USE_MOCK_BLE=false → BLE จริง (ต้อง development build)
 * โหลด RealBleService แบบ lazy เพื่อไม่ให้ Expo Go พังตอน import native module
 */
let instance: BleService | null = null;
export function getBleService(): BleService {
  if (!instance) {
    if (env.useMockBle) {
      instance = new MockBleService();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RealBleService } = require('./RealBleService');
      instance = new RealBleService();
    }
  }
  return instance as BleService;
}
