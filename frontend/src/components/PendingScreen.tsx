import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from './AnimatedBackground';
import { gradient, colors } from '@/theme/tokens';

/**
 * หน้า placeholder — แสดงเฉพาะพื้นหลังเขียว+เซลล์ลอย และชื่อหน้า
 * ยังไม่มีดีไซน์จาก Figma สำหรับหน้านี้ ห้ามใส่ดีไซน์เอง
 * TODO(figma): แทนที่ด้วยหน้าจริงเมื่อได้ลิงก์ Figma
 */
export function PendingScreen({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.root}>
      <LinearGradient colors={gradient.green} style={StyleSheet.absoluteFill} />
      <AnimatedBackground />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note}>{note ?? 'รอดีไซน์จาก Figma'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.white },
  note: { marginTop: 8, color: colors.whiteSoft },
});
