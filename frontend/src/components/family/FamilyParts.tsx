import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/home/GlassPanel';
import { familyColors } from '@/theme/tokens';
import type { FamilyPerson } from '@/services/family';

/** ปุ่มเขียว "Add family member" เต็มความกว้าง */
export function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.add}>
      <Ionicons name="person-add" size={30} color="#252525" style={s.addIcon} />
      <Text style={s.addText}>Add family member</Text>
    </Pressable>
  );
}

/** สถานะว่าง: ไอคอนกลุ่มคนจาง ๆ + ข้อความ */
export function EmptyFamily() {
  return (
    <View style={s.empty}>
      <Ionicons name="people-outline" size={50} color={familyColors.emptyIcon} />
      <Text style={s.emptyText}>No family linked yet. Search by username or email to{'\n'}send a link request.</Text>
    </View>
  );
}

/** หัวข้อกลุ่ม: แถบสีชิดซ้าย + ตัวหนังสือเล็กตัวหนา */
export function GroupLabel({ color, text }: { color: string; text: string }) {
  return (
    <View style={s.label}>
      <View style={[s.labelBar, { backgroundColor: color }]} />
      <Text style={s.labelText}>{text}</Text>
    </View>
  );
}

export type RowAction = { text: string; kind: 'cancel' | 'unlink' | 'accept' | 'decline' | 'chat'; onPress: () => void };

/** แถวบุคคล: อวาตาร์ + ชื่อ + @username + ปุ่มด้านขวา (1–2 ปุ่ม) */
export function PersonRow({
  person,
  actions,
  onPressProfile,
}: {
  person: FamilyPerson;
  actions: RowAction[];
  onPressProfile?: () => void;
}) {
  return (
    <GlassPanel radius={32} tint={familyColors.row} border={familyColors.rowBorder} style={s.row}>
      <Pressable
        onPress={onPressProfile}
        disabled={!onPressProfile}
        accessibilityRole="button"
        accessibilityLabel={`เปิดโปรไฟล์ ${person.displayName || person.username}`}
        style={s.profile}
      >
        <View style={s.avatar}>
          {person.avatar ? (
            <Image source={{ uri: person.avatar }} style={s.avatarImage} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={20} color="rgba(40,50,45,0.72)" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{person.displayName || person.username}</Text>
          <Text style={s.handle} numberOfLines={1}>@{person.username}</Text>
        </View>
      </Pressable>
      <View style={{ gap: 6 }}>
        {actions.map((a) => (
          <Pressable key={a.text} onPress={a.onPress} accessibilityRole="button" style={[s.btn, btnStyle[a.kind]]}>
            <Text style={[s.btnText, ['cancel', 'chat'].includes(a.kind) && { color: '#fff' }]}>{a.text}</Text>
          </Pressable>
        ))}
      </View>
    </GlassPanel>
  );
}

const btnStyle = StyleSheet.create({
  cancel: { backgroundColor: 'rgba(150,160,156,0.75)' },
  unlink: { backgroundColor: '#FF0000', minWidth: 96, height: 27 },
  accept: { backgroundColor: '#1BF21B' },
  decline: { backgroundColor: 'rgba(170,176,174,0.7)' },
  chat: { backgroundColor: 'rgba(58,138,90,0.9)' },
});

const s = StyleSheet.create({
  add: {
    height: 44,
    marginHorizontal: 18,
    borderRadius: 22,
    backgroundColor: familyColors.add,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // ไอคอนกับข้อความไม่ได้อยู่กึ่งกลางรวมกัน — ตามตำแหน่งใน Figma (ไอคอนซ้าย ข้อความเริ่มที่ ~121px)
  addIcon: { marginLeft: 62 },
  addText: { color: '#111', fontWeight: '800', fontSize: 13, marginLeft: 22 },
  empty: { alignItems: 'center', marginTop: 24, paddingHorizontal: 30 },
  emptyText: { marginTop: 8, color: familyColors.emptyText, textAlign: 'center', fontSize: 11, lineHeight: 15 },
  label: { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 10, marginLeft: 4 },
  labelBar: { width: 55, height: 9, borderRadius: 5, marginRight: 7 },
  labelText: { color: '#fff', fontWeight: '800', fontSize: 10 },
  row: { marginHorizontal: 33, minHeight: 67, flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 17, gap: 10 },
  profile: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: '100%', height: '100%' },
  name: { color: '#fff', fontSize: 19, fontWeight: '600', lineHeight: 22 },
  handle: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 13 },
  btn: { minWidth: 80, height: 26, paddingHorizontal: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 13 },
});
