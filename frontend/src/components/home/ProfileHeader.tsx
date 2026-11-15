import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './GlassPanel';
import { homeColors } from '@/theme/tokens';

/**
 * ส่วนหัวหน้าหลัก: รูปโปรไฟล์ + UserName / @UserName + ปุ่มเพิ่มคนในครอบครัว
 * + Status: Active/Inactive + Version
 * TODO(figma): ไอคอนเป็น Ionicons ชั่วคราว — export ไอคอนจริงจาก Figma มาแทนได้
 * TODO(profile): รูปโปรไฟล์จริงยังไม่มีระบบอัปโหลด ตอนนี้เป็นรูปคนเทาเหมือนใน Figma
 */
export function ProfileHeader({
  username,
  active,
  version,
  onAddFamily,
}: {
  username: string;
  active: boolean;
  version: string;
  onAddFamily: () => void;
}) {
  return (
    <View style={styles.wrap}>
      {/* เส้นตกแต่งบาง ๆ ตามดีไซน์ */}
      <View pointerEvents="none" style={[styles.line, { top: 0, left: 0, width: '30%' }]} />
      <View pointerEvents="none" style={[styles.line, { top: 8, right: 0, width: '32%' }]} />

      <View style={styles.row}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={78} color="#C2C2C2" style={{ marginBottom: -10 }} />
          </View>
        </View>

        <View style={styles.names}>
          <Text style={styles.username} numberOfLines={1} adjustsFontSizeToFit>
            {username}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            @{username}
          </Text>
        </View>

        <Pressable onPress={onAddFamily} accessibilityRole="button" accessibilityLabel="เพิ่มสมาชิกครอบครัว" hitSlop={6}>
          <GlassPanel radius={22} style={styles.addBtn}>
            <Ionicons name="person-add" size={24} color="rgba(255,255,255,0.78)" />
          </GlassPanel>
        </Pressable>
      </View>

      <View style={styles.row2}>
        <View style={styles.statusPill}>
          <Text style={styles.statusText}>Status: {active ? 'Active' : 'Inactive'}</Text>
          <View style={[styles.dot, { backgroundColor: active ? homeColors.ok : homeColors.danger }]} />
        </View>
        <Text style={styles.version}>Version: {version}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  line: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.28)' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#6B6B6B',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  names: { flex: 1, marginLeft: 12, marginRight: 8 },
  username: { fontSize: 30, fontWeight: '900', color: homeColors.username },
  handle: { marginTop: 2, marginLeft: 10, fontSize: 12, color: homeColors.textDim },
  addBtn: { width: 76, height: 44, alignItems: 'center', justifyContent: 'center' },
  row2: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: homeColors.statusPill,
    borderRadius: 14,
    paddingVertical: 3,
    paddingLeft: 10,
    paddingRight: 8,
  },
  statusText: { fontSize: 12, fontWeight: '900', color: '#1E1E1E' },
  dot: { width: 14, height: 14, borderRadius: 7, marginLeft: 8 },
  version: { fontSize: 12, color: homeColors.textDim },
});
