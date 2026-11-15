import { PendingScreen } from '@/components/PendingScreen';

// ระบบที่ 2 ที่ต่อกับนาฬิกา: Health status → ใช้ getBleService().subscribeHealth()
export default function Health() {
  return <PendingScreen title="Health status" />;
}
