import { Redirect, Tabs } from 'expo-router';
import { BottomNav } from '@/components/BottomNav';
import { useAuth } from '@/services/auth/AuthContext';
import { useHealthSync } from '@/hooks/useHealthSync';

/**
 * แถบเมนูล่างเป็นแบบกำหนดเอง (BottomNav) ตาม Figma: โปรไฟล์ · MediRemind · หน้าหลัก · Health · ตั้งค่า
 * หน้า family ไม่อยู่บนแถบเมนู (เข้าจากปุ่มเพิ่มคนและช่อง Family Link ในหน้าหลัก) จึงซ่อนด้วย href: null
 */
export default function TabsLayout() {
  const { user, loading } = useAuth();
  // ส่งข้อมูลสุขภาพจากนาฬิกาเข้า backend ทุกหน้า (ต้องเรียกก่อน early return ตามกฎของ hooks)
  useHealthSync(!!user);
  // ยังไม่ล็อกอิน → กลับไปหน้า Sign In (กันเข้าตรง ๆ ผ่าน URL บนเว็บ และหลัง logout)
  if (!loading && !user) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
      <Tabs.Screen name="medi-remind" options={{ title: 'MediRemind' }} />
      <Tabs.Screen name="home" options={{ title: 'หน้าหลัก' }} />
      <Tabs.Screen name="health" options={{ title: 'Health status' }} />
      <Tabs.Screen name="device" options={{ title: 'ตั้งค่า' }} />
      <Tabs.Screen name="family" options={{ href: null, title: 'Family Link' }} />
    </Tabs>
  );
}
