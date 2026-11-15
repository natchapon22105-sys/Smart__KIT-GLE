import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { BLE_PROFILE, DEVICE_NAME_PREFIX } from './protocol';
import type {
  BleService,
  ConnectionState,
  HealthSample,
  MedicationAlarm,
  WatchDevice,
  WatchSettings,
} from './types';

// ---- base64 helpers (ble-plx ใช้ base64) ----
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function bytesToB64(bytes: number[]): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const [a, b, c] = [bytes[i], bytes[i + 1], bytes[i + 2]];
    out += B64[a >> 2] + B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : B64[c & 63];
  }
  return out;
}
function b64ToBytes(s: string): number[] {
  const clean = s.replace(/=+$/, '');
  const out: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of clean) {
    buf = (buf << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return out;
}
const utf8 = (s: string) => Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));

/**
 * BLE จริง (เฉพาะ native — ต้องใช้ development build ไม่ใช่ Expo Go)
 * TODO(protocol): รูปแบบ payload ด้านล่างเป็น placeholder ต้องแก้ตามโปรโตคอลนาฬิกาจริง
 */
export class RealBleService implements BleService {
  readonly isMock = false;
  private manager = new BleManager();
  private device: Device | null = null;
  private state: ConnectionState = 'idle';
  private listeners = new Set<(s: ConnectionState) => void>();
  private healthSub: Subscription | null = null;
  private healthListeners = new Set<(s: HealthSample) => void>();

  getState() {
    return this.state;
  }

  onStateChange(cb: (s: ConnectionState) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private setState(s: ConnectionState) {
    this.state = s;
    this.listeners.forEach((cb) => cb(s));
  }

  async scan(onFound: (d: WatchDevice) => void, timeoutMs = 8000) {
    this.setState('scanning');
    const seen = new Set<string>();
    this.manager.startDeviceScan(null, null, (error, dev) => {
      if (error) {
        this.setState('error');
        return;
      }
      if (!dev || seen.has(dev.id)) return;
      if (!dev.name?.startsWith(DEVICE_NAME_PREFIX)) return;
      seen.add(dev.id);
      onFound({ id: dev.id, name: dev.name, rssi: dev.rssi });
    });
    await new Promise((r) => setTimeout(r, timeoutMs));
    this.stopScan();
  }

  stopScan() {
    this.manager.stopDeviceScan();
    if (this.state === 'scanning') this.setState('idle');
  }

  async connect(deviceId: string) {
    try {
      this.setState('connecting');
      const dev = await this.manager.connectToDevice(deviceId, { timeout: 10000 });
      await dev.discoverAllServicesAndCharacteristics();
      this.device = dev;
      dev.onDisconnected(() => {
        this.healthSub?.remove();
        this.healthSub = null;
        this.device = null;
        this.setState('disconnected');
      });
      this.setState('connected');
      this.startHealthMonitor();
    } catch (e) {
      this.setState('error');
      throw e;
    }
  }

  async disconnect() {
    this.healthSub?.remove();
    this.healthSub = null;
    if (this.device) await this.manager.cancelDeviceConnection(this.device.id).catch(() => undefined);
    this.device = null;
    this.setState('disconnected');
  }

  subscribeHealth(cb: (s: HealthSample) => void) {
    this.healthListeners.add(cb);
    return () => this.healthListeners.delete(cb);
  }

  private startHealthMonitor() {
    if (!this.device) return;
    this.healthSub = this.device.monitorCharacteristicForService(
      BLE_PROFILE.service,
      BLE_PROFILE.characteristics.health,
      (error, ch) => {
        if (error || !ch?.value) return;
        const b = b64ToBytes(ch.value);
        // TODO(protocol): placeholder = [hr, spo2, stepsHi, stepsLo]
        const sample: HealthSample = {
          heartRate: b[0],
          spo2: b[1],
          steps: ((b[2] ?? 0) << 8) | (b[3] ?? 0),
          timestamp: Date.now(),
        };
        this.healthListeners.forEach((l) => l(sample));
      },
    );
  }

  private async write(characteristic: string, bytes: number[]) {
    if (!this.device) throw new Error('ยังไม่ได้เชื่อมต่อนาฬิกา');
    await this.device.writeCharacteristicWithResponseForService(
      BLE_PROFILE.service,
      characteristic,
      bytesToB64(bytes),
    );
  }

  async syncMedicationAlarms(alarms: MedicationAlarm[]) {
    // TODO(protocol): placeholder = JSON UTF-8
    await this.write(BLE_PROFILE.characteristics.medication, utf8(JSON.stringify(alarms)));
  }

  async applySettings(settings: WatchSettings) {
    await this.write(BLE_PROFILE.characteristics.settings, utf8(JSON.stringify(settings)));
  }
}
