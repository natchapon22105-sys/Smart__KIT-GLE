import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { settingColors } from '@/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** รูปโปรไฟล์: วงแหวนขาวขอบดำ + พื้นเทาเข้ม + รูปคนสีเทาอ่อน (ตามดีไซน์) */
export function Avatar({
  size = 134,
  uri,
  busy,
  onPress,
}: {
  size?: number;
  uri?: string | null;
  busy?: boolean;
  /** ถ้าใส่ จะกดเพื่อเปลี่ยนรูปได้ (มีปุ่มกล้องที่มุม) */
  onPress?: () => void;
}) {
  const inner = size * 0.76;
  const ring = (
    <View style={[s.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[s.inner, { width: inner, height: inner, borderRadius: inner / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Ionicons name="person" size={inner * 0.95} color={settingColors.avatarFigure} style={{ marginTop: inner * 0.18 }} />
        )}
        {busy && (
          <View style={s.busy}>
            <ActivityIndicator color="#fff" />
          </View>
        )}
      </View>
      {onPress && (
        <View style={s.cam}>
          <Ionicons name="camera" size={size * 0.14} color="#fff" />
        </View>
      )}
    </View>
  );
  if (!onPress) return ring;
  return (
    <Pressable onPress={onPress} disabled={busy} accessibilityRole="button" accessibilityLabel="เปลี่ยนรูปโปรไฟล์" style={{ alignSelf: 'center' }}>
      {ring}
    </Pressable>
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
  busy: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cam: {
    position: 'absolute',
    right: 2,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1F7BEA',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
