import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PendingScreen } from '@/components/PendingScreen';
import { useAuth } from '@/services/auth/AuthContext';
import { colors } from '@/theme/tokens';

/**
 * หน้าโปรไฟล์ — ปุ่มซ้ายสุดของแถบเมนูล่าง ยังไม่มีดีไซน์ใน Figma (placeholder)
 * ปุ่มออกจากระบบชั่วคราวอยู่ที่นี่ไว้ทดสอบ — TODO(figma): ย้ายไปตำแหน่งตามดีไซน์จริง
 */
export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex: 1 }}>
      <PendingScreen title="โปรไฟล์" note={user ? `${user.username} · ${user.email}` : undefined} />
      <Pressable style={styles.logout} onPress={logout} accessibilityRole="button">
        <Text style={styles.logoutText}>ออกจากระบบ (ชั่วคราว)</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  logout: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  logoutText: { color: colors.white, fontWeight: '700' },
});
