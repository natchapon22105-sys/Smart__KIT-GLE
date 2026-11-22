import { Redirect, Tabs } from 'expo-router';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/services/auth/AuthContext';

/**
 * แถบเมนูล่างเป็นแบบกำหนดเอง (BottomNav) ตาม Figma: Family Link (ไอคอนรูปคน) · MediRemind · หน้าหลัก · Health · Setting
 * หน้า family ไม่อยู่บนแถบเมนู (เข้าจากปุ่มเพิ่มคนและช่อง Family Link ในหน้าหลัก) — BottomNav วาดเฉพาะ 5 ปุ่มที่กำหนด
 */
export default function TabsLayout() {
  const { user, loading } = useAuth();
  // ยังไม่ล็อกอิน → กลับไปหน้า Sign In (กันเข้าตรง ๆ ผ่าน URL บนเว็บ และหลัง logout)
  if (!loading && !user) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* profile = หน้าเดิมที่ยังไม่มีดีไซน์ ตอนนี้ไม่มีปุ่มบนแถบเมนู (ไอคอนรูปคนพาไป Family Link) */}
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
      <Tabs.Screen name="medi-remind" options={{ title: 'MediRemind' }} />
      <Tabs.Screen name="home" options={{ title: 'หน้าหลัก' }} />
      <Tabs.Screen name="health" options={{ title: 'Health status' }} />
      <Tabs.Screen name="device" options={{ title: 'ตั้งค่า' }} />
      {/* ไม่ใส่ href: null — เคยทำให้การ push ไป /family เด้งไปหน้าโปรไฟล์ (ทดสอบบน iPhone) แถบเมนูล่างเป็นแบบกำหนดเอง (BottomNav) แสดงเฉพาะ 5 ปุ่มอยู่แล้ว หน้า family จึงไม่โผล่บนแถบเมนู */}
      <Tabs.Screen name="family" options={{ title: 'Family Link' }} />
    </Tabs>
  );
}
