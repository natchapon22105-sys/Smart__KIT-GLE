/** สัญญา (interface) กลางของ BLE — UI ใช้ผ่านอินเทอร์เฟซนี้เท่านั้น เพื่อสลับ Real/Mock ได้ */

export type WatchDevice = {
  id: string;
  name: string | null;
  rssi: number | null;
};

export type HealthSample = {
  heartRate?: number;
  spo2?: number;
  steps?: number;
  temperature?: number;
  timestamp: number;
};

export type MedicationAlarm = {
  id: string;
  label: string;
  /** "HH:mm" */
  time: string;
  enabled: boolean;
};

export type WatchSettings = {
  mediRemindEnabled: boolean;
  healthMonitorIntervalMin: number;
};

export type ConnectionState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface BleService {
  readonly isMock: boolean;
  getState(): ConnectionState;
  onStateChange(cb: (s: ConnectionState) => void): () => void;
  scan(onFound: (d: WatchDevice) => void, timeoutMs?: number): Promise<void>;
  stopScan(): void;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  syncClock(): Promise<void>;
  subscribeFallAlert(cb: () => void): () => void;
  /** 2. Health status — รับข้อมูลสุขภาพแบบ stream */
  subscribeHealth(cb: (s: HealthSample) => void): () => void;
  /** 1. MediRemind — ส่งตารางเตือนยาไปนาฬิกา */
  syncMedicationAlarms(alarms: MedicationAlarm[]): Promise<void>;
  /** ตั้งค่านาฬิกา */
  applySettings(settings: WatchSettings): Promise<void>;
}
