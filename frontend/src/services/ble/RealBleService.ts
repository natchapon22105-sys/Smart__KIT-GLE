import { PermissionsAndroid, Platform } from 'react-native';
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

/** BLE จริงสำหรับ ESP32-C3 SmartWatch firmware. */
export class RealBleService implements BleService {
  readonly isMock = false;
  private manager = new BleManager();
  private device: Device | null = null;
  private state: ConnectionState = 'idle';
  private listeners = new Set<(s: ConnectionState) => void>();
  private fallSub: Subscription | null = null;
  private fallListeners = new Set<() => void>();

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
    await this.ensureBluetoothPermissions();
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

  private async ensureBluetoothPermissions() {
    if (Platform.OS !== 'android') return;

    const permissions =
      Number(Platform.Version) >= 31
        ? [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          ]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
    const results = await PermissionsAndroid.requestMultiple(permissions);
    if (permissions.some((permission) => results[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
      throw new Error('กรุณาอนุญาตสิทธิ์ Bluetooth เพื่อค้นหานาฬิกา');
    }
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
        this.fallSub?.remove();
        this.fallSub = null;
        this.device = null;
        this.setState('disconnected');
      });
      this.fallSub = dev.monitorCharacteristicForService(
        BLE_PROFILE.service,
        BLE_PROFILE.characteristics.fall,
        (error, characteristic) => {
          if (error) {
            console.error('รับการแจ้งเตือน FALL จากนาฬิกาไม่สำเร็จ', error);
            return;
          }
          if (!characteristic?.value) return;
          const message = String.fromCharCode(...b64ToBytes(characteristic.value));
          if (message === 'FALL') this.fallListeners.forEach((listener) => listener());
        },
      );
      this.setState('connected');
    } catch (e) {
      this.setState('error');
      throw e;
    }
  }

  async disconnect() {
    this.fallSub?.remove();
    this.fallSub = null;
    if (this.device) await this.manager.cancelDeviceConnection(this.device.id).catch(() => undefined);
    this.device = null;
    this.setState('disconnected');
  }

  async syncClock() {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const value = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    await this.write(BLE_PROFILE.characteristics.clock, utf8(value));
  }

  subscribeHealth(_cb: (s: HealthSample) => void) {
    // The current watch firmware does not publish HR, SpO2, or step data over BLE.
    return () => {};
  }

  subscribeFallAlert(cb: () => void) {
    this.fallListeners.add(cb);
    return () => this.fallListeners.delete(cb);
  }

  private async write(characteristic: string, bytes: number[]) {
    if (!this.device) throw new Error('ยังไม่ได้เชื่อมต่อนาฬิกา');
    await this.device.writeCharacteristicWithResponseForService(
      BLE_PROFILE.service,
      characteristic,
      bytesToB64(bytes),
    );
  }

  async syncMedicationAlarms(_alarms: MedicationAlarm[]) {
    throw new Error('เฟิร์มแวร์ SmartWatch ยังไม่รองรับการส่งตารางเตือนยา');
  }

  async applySettings(_settings: WatchSettings) {
    throw new Error('เฟิร์มแวร์ SmartWatch ยังไม่รองรับการตั้งค่าผ่าน BLE');
  }
}
