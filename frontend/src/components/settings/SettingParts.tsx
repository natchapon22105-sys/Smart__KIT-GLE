import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingColors } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** รูปโปรไฟล์: วงแหวนขาวขอบดำ + พื้นเทาเข้ม + รูปคนสีเทาอ่อน (ตามดีไซน์) */
export function Avatar({ size = 134 }: { size?: number }) {
  const inner = size * 0.76;
  return (
    <View style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        <Ionicons name="person" size={inner * 0.95} color={settingColors.avatarFigure} style={{ marginTop: inner * 0.18 }} />
      </View>
    </View>
  );
}

/** แถบเมนูแบบกดขยาย (Account info / Report app / About app) */
export function AccordionRow({
  icon,
  title,
  open,
  onToggle,
  children,
}: {
  icon: IconName;
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={s.row}
      >
        <Ionicons name={icon} size={22} color="#111" />
        <Text style={s.rowText}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color="#111" />
      </Pressable>
      {open && <View style={s.body}>{children}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  ring: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  inner: { backgroundColor: settingColors.avatarInner, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  row: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: settingColors.row,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowText: { flex: 1, color: settingColors.rowText, fontWeight: '800', fontSize: 12 },
  body: { paddingHorizontal: 6, paddingTop: 10, paddingBottom: 4, gap: 8 },
});
