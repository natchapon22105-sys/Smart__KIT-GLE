import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/home/GlassPanel';
import { familyColors } from '@/theme/tokens';
import type { FamilyPerson } from '@/services/family';

/** ปุ่มเขียว "Add family member" เต็มความกว้าง */
export function AddButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={s.add}>
      <Ionicons name="person-add" size={22} color="#1F1F1F" style={{ marginRight: 14 }} />
      <Text style={s.addText}>Add family member</Text>
    </Pressable>
  );
}

/** สถานะว่าง: ไอคอนกลุ่มคนจาง ๆ + ข้อความ */
export function EmptyFamily() {
  return (
    <View style={s.empty}>
      <Ionicons name="people-outline" size={56} color={familyColors.emptyIcon} />
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

export type RowAction = { text: string; kind: 'cancel' | 'unlink' | 'accept' | 'decline'; onPress: () => void };

/** แถวบุคคล: อวาตาร์ + ชื่อ + @username + ปุ่มด้านขวา (1–2 ปุ่ม) */
export function PersonRow({ person, actions }: { person: FamilyPerson; actions: RowAction[] }) {
  return (
    <GlassPanel radius={26} tint={familyColors.row} border={familyColors.rowBorder} style={s.row}>
      <View style={s.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{person.displayName || person.username}</Text>
        <Text style={s.handle} numberOfLines={1}>@{person.username}</Text>
      </View>
      <View style={{ gap: 6 }}>
        {actions.map((a) => (
          <Pressable key={a.text} onPress={a.onPress} accessibilityRole="button" style={[s.btn, btnStyle[a.kind]]}>
            <Text style={[s.btnText, a.kind === 'cancel' && { color: '#fff' }]}>{a.text}</Text>
          </Pressable>
        ))}
      </View>
    </GlassPanel>
  );
}

const btnStyle = StyleSheet.create({
  cancel: { backgroundColor: 'rgba(170,176,174,0.7)' },
  unlink: { backgroundColor: '#FF0000' },
  accept: { backgroundColor: '#1BF21B' },
  decline: { backgroundColor: 'rgba(170,176,174,0.7)' },
});

const s = StyleSheet.create({
  add: {
    height: 45,
    marginHorizontal: 22,
    borderRadius: 23,
    backgroundColor: familyColors.add,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#111', fontWeight: '800', fontSize: 14 },
  empty: { alignItems: 'center', marginTop: 22, paddingHorizontal: 30 },
  emptyText: { marginTop: 8, color: familyColors.emptyText, textAlign: 'center', fontSize: 11, lineHeight: 15 },
  label: { flexDirection: 'row', alignItems: 'center', marginTop: 26, marginBottom: 8 },
  labelBar: { width: 58, height: 9, borderTopRightRadius: 5, borderBottomRightRadius: 5, marginRight: 8 },
  labelText: { color: '#fff', fontWeight: '800', fontSize: 10, letterSpacing: 0.3 },
  row: { marginHorizontal: 32, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#D9D9D9' },
  name: { color: '#fff', fontSize: 19, fontWeight: '600' },
  handle: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  btn: { minWidth: 82, height: 26, paddingHorizontal: 12, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#000', fontWeight: '800', fontSize: 12 },
});
