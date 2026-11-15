import { PendingScreen } from '@/components/PendingScreen';

// สแกน/เชื่อมต่อ/ตั้งค่านาฬิกา → ใช้ getBleService() (scan, connect, applySettings)
export default function Device() {
  return <PendingScreen title="ตั้งค่านาฬิกา" />;
}
