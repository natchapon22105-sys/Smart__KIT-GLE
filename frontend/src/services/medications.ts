import { api } from '@/services/api/client';
import { getBleService } from '@/services/ble';

export type Medication = {
  id: number;
  scheduleId: number;
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

export type UpcomingMedicationDose = {
  medication: Medication;
  scheduledAt: Date;
};

export type MedicationDoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export type MedicationDoseLog = {
  scheduleId: number;
  scheduledAt: string;
  status: MedicationDoseStatus;
};

export const DAY_LABELS: Record<number, string> = { 1: 'จ', 2: 'อ', 3: 'พ', 4: 'พฤ', 5: 'ศ', 6: 'ส', 7: 'อา' };
export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

export const formatDays = (days: number[]) =>
  days.length === 7 ? 'ทุกวัน' : [...days].sort().map((d) => DAY_LABELS[d]).join(' ');

const pad = (value: number) => String(value).padStart(2, '0');

export function formatLocalDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalDateTime(date: Date) {
  return `${formatLocalDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export function getUpcomingMedicationDoses(items: Medication[], now = new Date()): UpcomingMedicationDose[] {
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  const doses: UpcomingMedicationDose[] = [];

  for (const medication of items) {
    if (!medication.enabled) continue;
    const [hour, minute] = medication.timeOfDay.split(':').map(Number);
    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    ) {
      continue;
    }

    const days = new Set(medication.days);
    for (let offset = 0; offset <= 7; offset += 1) {
      const scheduledAt = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset,
        hour,
        minute,
      );
      const weekday = scheduledAt.getDay() || 7;
      if (days.has(weekday) && (offset === 0 || scheduledAt >= currentMinute)) {
        doses.push({ medication, scheduledAt });
      }
    }
  }

  return doses
    .sort(
      (a, b) =>
        a.scheduledAt.getTime() - b.scheduledAt.getTime() ||
        a.medication.name.localeCompare(b.medication.name),
    );
}

export function getMedicationDoseStatus(
  dose: UpcomingMedicationDose,
  logs: MedicationDoseLog[],
): MedicationDoseStatus {
  return (
    logs.find(
      (log) =>
        log.scheduleId === dose.medication.scheduleId &&
        log.scheduledAt === formatLocalDateTime(dose.scheduledAt),
    )?.status ?? 'pending'
  );
}

export function getNextMedicationDose(
  items: Medication[],
  logs: MedicationDoseLog[],
  now = new Date(),
): UpcomingMedicationDose | null {
  const currentMinute = new Date(now);
  currentMinute.setSeconds(0, 0);
  return (
    getUpcomingMedicationDoses(items, now).find((dose) => {
      const status = getMedicationDoseStatus(dose, logs);
      return status !== 'taken' || dose.scheduledAt >= currentMinute;
    }) ?? null
  );
}

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
  async listDoseLogs(from: string, to: string) {
    return (
      await api.get<{ logs: MedicationDoseLog[] }>(
        `/medications/logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
    ).logs;
  },
  async setDoseStatus(dose: UpcomingMedicationDose, status: 'pending' | 'taken') {
    await api.put(`/medications/${dose.medication.id}/log`, {
      date: formatLocalDate(dose.scheduledAt),
      timeOfDay: `${pad(dose.scheduledAt.getHours())}:${pad(dose.scheduledAt.getMinutes())}`,
      status,
    });
    return {
      scheduleId: dose.medication.scheduleId,
      scheduledAt: formatLocalDateTime(dose.scheduledAt),
      status,
    };
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
