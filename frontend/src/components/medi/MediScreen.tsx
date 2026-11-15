import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { homeColors, mediColors } from '@/theme/tokens';

/** พื้นหลังเขียว + เซลล์ลอย + ปุ่มย้อนกลับแบบแคปซูลชิดซ้าย (title ใส่เฉพาะหน้ารายการ) — ตามเฟรม MediRemind */
export function MediScreen({
  title,
  onBack,
  children,
}: {
  title?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient colors={homeColors.bg} style={StyleSheet.absoluteFill} />
      <AnimatedBackground color={homeColors.cell} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 130 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="ย้อนกลับ"
            style={[styles.pill, !title && { paddingRight: 22 }]}
          >
            <Ionicons name="chevron-back" size={34} color="rgba(255,255,255,0.88)" />
            {title ? <Text style={styles.pillText}>{title}</Text> : null}
          </Pressable>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#2B4837' },
  column: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingLeft: 10,
    paddingRight: 24,
    gap: 4,
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: mediColors.pill,
    marginBottom: 14,
  },
  pillText: { fontSize: 24, fontWeight: '800', color: 'rgba(255,255,255,0.9)' },
});
