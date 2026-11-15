import { PendingScreen } from '@/components/PendingScreen';

// ระบบที่ 1 ที่ต่อกับนาฬิกา: เตือนกินยา → ใช้ getBleService().syncMedicationAlarms()
export default function MediRemind() {
  return <PendingScreen title="MediRemind" />;
}
