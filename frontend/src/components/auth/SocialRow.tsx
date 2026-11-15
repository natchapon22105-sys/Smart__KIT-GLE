import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authColors } from '@/theme/tokens';

export type SocialProvider = 'facebook' | 'google';

/**
 * "or continue with" + ปุ่ม Facebook / Google
 * TODO(figma): ไอคอนตอนนี้เป็น Ionicons ชั่วคราว — export ไอคอนจริงจาก Figma มาแทนที่ได้
 * TODO(oauth): ยังไม่ได้ต่อ OAuth จริง (ต้องมี Facebook App / Google Client ID ก่อน) ตอนนี้แค่แจ้งผู้ใช้
 */
export function SocialRow({ onPress }: { onPress: (p: SocialProvider) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>or continue with</Text>
      <View style={styles.row}>
        <Pressable onPress={() => onPress('facebook')} accessibilityLabel="Facebook" hitSlop={8}>
          <Ionicons name="logo-facebook" size={46} color="#1877F2" />
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() => onPress('google')} accessibilityLabel="Google" hitSlop={8}>
          <Ionicons name="logo-google" size={40} color="#EA4335" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 22 },
  label: { fontSize: 14, fontWeight: '800', color: authColors.text },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  divider: { width: 1, height: 36, backgroundColor: '#C6C6C6', marginHorizontal: 22 },
});
