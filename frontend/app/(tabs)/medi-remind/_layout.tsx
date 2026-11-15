import { Stack } from 'expo-router';

/** MediRemind มี 3 หน้า: index (รายการ) · new (เพิ่มยา) · [id] (ดู/แก้ไข) — แถบเมนูล่างยังแสดงตลอด */
export default function MediLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#2B4837' } }} />;
}
