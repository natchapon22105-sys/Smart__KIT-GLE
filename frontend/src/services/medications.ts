import { api } from '@/services/api/client';
import { getBleService } from '@/services/ble';

export type Medication = {
  id: number;
  name: string;
  details: string | null;
  /** data URI ของรูปยา */
  image: string | null;
  /** "HH:mm" */
  timeOfDay: string;
  /** 1 = จันทร์ ... 7 = อาทิตย์ */
  days: number[];
  enabled: boolean;
};

export type MedicationInput = {
  name: string;
  timeOfDay: string;
  days: number[];
  details: string;
  image: string | null;
};

export const DAY_LABELS: Record<number, string> = { 1: 'จ', 2: 'อ', 3: 'พ', 4: 'พฤ', 5: 'ศ', 6: 'ส', 7: 'อา' };
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export const formatDays = (days: number[]) =>
  days.length === 7 ? 'ทุกวัน' : [...days].sort().map((d) => DAY_LABELS[d]).join(' ');

/** ส่งตารางเตือนยาไปนาฬิกา (ทำเมื่อเชื่อมต่ออยู่เท่านั้น ไม่สำเร็จไม่เป็นไร — ซิงก์ใหม่ได้ภายหลัง) */
async function syncToWatch(list: Medication[]) {
  try {
    const ble = getBleService();
    if (ble.getState() !== 'connected') return;
    // TODO(protocol): MedicationAlarm ยังไม่รวม "วันที่ต้องกิน" — เพิ่มเมื่อได้ BLE protocol จริง
    await ble.syncMedicationAlarms(
      list.map((m) => ({ id: String(m.id), label: m.name, time: m.timeOfDay, enabled: m.enabled })),
    );
  } catch {
    /* ignore */
  }
}

export const medications = {
  async list() {
    return (await api.get<{ medications: Medication[] }>('/medications')).medications;
  },
  async get(id: number | string) {
    return (await api.get<{ medication: Medication }>(`/medications/${id}`)).medication;
  },
  async create(input: MedicationInput) {
    await api.post('/medications', input);
    void this.list().then(syncToWatch).catch(() => undefined);
  },
  async update(id: number | string, input: MedicationInput) {
    await api.put(`/medications/${id}`, input);
    void this.list().then(syncToWatch).catch(() => undefined);
  },
  async remove(id: number | string) {
    await api.del(`/medications/${id}`);
    void this.list().then(syncToWatch).catch(() => undefined);
  },
};
