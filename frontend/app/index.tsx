import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { SplashIntro } from '@/components/SplashIntro';
import { useAuth } from '@/services/auth/AuthContext';

/**
 * หน้าแรก = Splash อนิเมชัน ตาม Figma
 * จบ Splash แล้ว (และตรวจโทเคนที่เก็บไว้เสร็จ):
 *   มีบัญชีล็อกอินอยู่ → หน้าหลัก / ยังไม่ล็อกอิน (ผู้ใช้ใหม่ก็เข้ามาทางนี้) → Sign In
 */
export default function Index() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  const onFinish = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    if (!splashDone || loading) return;
    router.replace(user ? '/(tabs)/home' : '/(auth)/sign-in');
  }, [splashDone, loading, user, router]);

  return <SplashIntro onFinish={onFinish} />;
}
