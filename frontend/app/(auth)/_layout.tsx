import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/services/auth/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  // ล็อกอินแล้วไม่ควรเห็นหน้า Sign In / Sign Up อีก
  if (!loading && user) return <Redirect href="/(tabs)/home" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
