import type {
  BleService,
  ConnectionState,
  HealthSample,
  MedicationAlarm,
  WatchDevice,
  WatchSettings,
} from './types';

/** นาฬิกาจำลอง — ใช้บนเว็บ / Expo Go / ตอนยังไม่มีฮาร์ดแวร์ */
export class MockBleService implements BleService {
  readonly isMock = true;
  private state: ConnectionState = 'idle';
  private stateListeners = new Set<(s: ConnectionState) => void>();
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private healthListeners = new Set<(s: HealthSample) => void>();
  private steps = 1200;

  getState() {
    return this.state;
  }

  onStateChange(cb: (s: ConnectionState) => void) {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  private setState(s: ConnectionState) {
    this.state = s;
    this.stateListeners.forEach((cb) => cb(s));
  }

  async scan(onFound: (d: WatchDevice) => void, timeoutMs = 1500) {
    this.setState('scanning');
    await new Promise((r) => setTimeout(r, Math.min(timeoutMs, 800)));
    onFound({ id: 'mock-kit-gle-001', name: 'KIT-GLE (จำลอง)', rssi: -52 });
    this.setState('idle');
  }

  stopScan() {
    if (this.state === 'scanning') this.setState('idle');
  }

  async connect(_deviceId: string) {
    this.setState('connecting');
    await new Promise((r) => setTimeout(r, 600));
    this.setState('connected');
    this.startHealth();
  }

  async disconnect() {
    this.stopHealth();
    this.setState('disconnected');
  }

  subscribeHealth(cb: (s: HealthSample) => void) {
    this.healthListeners.add(cb);
    return () => this.healthListeners.delete(cb);
  }

  private startHealth() {
    this.stopHealth();
    this.healthTimer = setInterval(() => {
      this.steps += Math.floor(Math.random() * 8);
      const sample: HealthSample = {
        heartRate: 68 + Math.round(Math.random() * 14),
        spo2: 96 + Math.round(Math.random() * 3),
        steps: this.steps,
        temperature: 36.4 + Math.random() * 0.5,
        timestamp: Date.now(),
      };
      this.healthListeners.forEach((cb) => cb(sample));
    }, 2000);
  }

  private stopHealth() {
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = null;
  }

  async syncMedicationAlarms(_alarms: MedicationAlarm[]) {
    await new Promise((r) => setTimeout(r, 300));
  }

  async applySettings(_settings: WatchSettings) {
    await new Promise((r) => setTimeout(r, 200));
  }
}
