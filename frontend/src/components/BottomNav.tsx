import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { homeColors } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Props = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/** ลำดับและไอคอนของแถบเมนูล่าง 5 ปุ่มตาม Figma (ซ้าย → ขวา) — name = ชื่อไฟล์ใน app/(tabs)/ */
const ITEMS: { name: string; icon: IconName; label: string }[] = [
  { name: 'profile', icon: 'person', label: 'โปรไฟล์' },
  { name: 'medi-remind', icon: 'time-outline', label: 'MediRemind' },
  { name: 'home', icon: 'home', label: 'หน้าหลัก' },
  { name: 'health', icon: 'stats-chart', label: 'Health status' },
  { name: 'device', icon: 'settings-outline', label: 'ตั้งค่า' },
];

/**
 * แถบเมนูล่างแบบแคปซูลโปร่งแสงลอยอยู่ล่างจอ (ตาม Figma)
 * TODO(figma): ไอคอนเป็น Ionicons ชั่วคราว — แทนด้วยไอคอนจริงจาก Figma ได้
 */
export function BottomNav({ state, navigateToTab }: Props) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  // หน้า Family Link ไม่มีปุ่มบนแถบ — ใน Figma ขีดเส้นใต้ไอคอนโปรไฟล์ไว้
  const activeName = current === 'family' || current === 'family-search' ? 'profile' : current;

  return (
    <View pointerEvents="box-none" style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const route = state.routes.find((r) => r.name === item.name);
          if (!route) return null;
          const active = activeName === item.name;
          return (
            <Pressable
              key={item.name}
              onPress={() => navigateToTab(route.key)}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              style={styles.item}
              hitSlop={6}
            >
              <Ionicons name={item.icon} size={30} color={homeColors.navIcon} />
              <View style={[styles.underline, { opacity: active ? 1 : 0 }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 22 },
  bar: {
    width: '100%',
    maxWidth: 440,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: homeColors.navBg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  item: { alignItems: 'center', justifyContent: 'center', width: 52, height: 44 },
  underline: { marginTop: 1, width: 24, height: 2, borderRadius: 1, backgroundColor: homeColors.navIcon },
});
