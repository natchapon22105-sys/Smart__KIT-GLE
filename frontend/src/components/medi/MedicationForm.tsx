import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from '@/components/home/GlassPanel';
import { TimeText } from './TimeText';
import { TimePickerModal } from './TimePickerModal';
import { ALL_DAYS, DAY_LABELS, formatDays, type MedicationInput } from '@/services/medications';
import { pickSquareImage } from '@/utils/pickImage';
import { mediColors } from '@/theme/tokens';

type Props = {
  /** create = หน้าเพิ่มยา (เวลาใหญ่กลางจอ + ปุ่ม UPLOAD) · edit = หน้าดู/แก้ไข (รูปซ้าย เวลาขวา) */
  mode: 'create' | 'edit';
  initial: MedicationInput;
  saving: boolean;
  onSave: (v: MedicationInput) => void;
  onDelete?: () => void;
};

export function MedicationForm({ mode, initial, saving, onSave, onDelete }: Props) {
  const [v, setV] = useState<MedicationInput>(initial);
  const [pickTime, setPickTime] = useState(false);
  const [daysOpen, setDaysOpen] = useState(false);
  const set = <K extends keyof MedicationInput>(k: K, val: MedicationInput[K]) => setV((p) => ({ ...p, [k]: val }));

  const upload = async () => {
    const img = await pickSquareImage();
    if (img) set('image', img);
  };
  const toggleDay = (d: number) =>
    set('days', v.days.includes(d) ? v.days.filter((x) => x !== d) : [...v.days, d].sort());

  const imageBox = (style: object) => (
    <Pressable onPress={upload} accessibilityRole="button" accessibilityLabel="เลือกรูปยา" style={[styles.img, style]}>
      {v.image ? (
        <Image source={{ uri: v.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Ionicons name="image-outline" size={mode === 'edit' ? 44 : 30} color="rgba(255,255,255,0.4)" />
      )}
    </Pressable>
  );

  return (
    <View>
      {mode === 'create' ? (
        <Pressable onPress={() => setPickTime(true)} accessibilityRole="button" accessibilityLabel="ตั้งเวลา" style={styles.bigTime}>
          <TimeText time={v.timeOfDay} size={104} />
        </Pressable>
      ) : (
        <View style={styles.editTop}>
          {imageBox(styles.imgBig)}
          <Pressable onPress={() => setPickTime(true)} accessibilityRole="button" accessibilityLabel="ตั้งเวลา" style={{ flex: 1 }}>
            <TimeText time={v.timeOfDay} size={60} />
          </Pressable>
        </View>
      )}

      <GlassPanel radius={22} tint={mediColors.panel} border={mediColors.panelBorder} style={styles.panel}>
        <View style={styles.field}>
          <Text style={styles.label}>Medicine :</Text>
          <TextInput
            value={v.name}
            onChangeText={(t) => set('name', t)}
            maxLength={160}
            placeholder="ชื่อยา"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
          />
        </View>

        <Pressable onPress={() => setDaysOpen((o) => !o)} style={styles.field} accessibilityRole="button">
          <Text style={styles.label}>Select Days :</Text>
          <Text style={styles.value} numberOfLines={1}>
            {v.days.length ? formatDays(v.days) : 'เลือกวัน'}
          </Text>
          <Ionicons name={daysOpen ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.8)" />
        </Pressable>
        {daysOpen && (
          <View style={styles.dayRow}>
            {ALL_DAYS.map((d) => {
              const on = v.days.includes(d);
              return (
                <Pressable key={d} onPress={() => toggleDay(d)} style={[styles.day, on && styles.dayOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Text style={[styles.dayText, on && { color: '#10241A' }]}>{DAY_LABELS[d]}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={[styles.field, styles.area]}>
          <Text style={[styles.label, { marginBottom: 6 }]}>Medication Details :</Text>
          <TextInput
            value={v.details}
            onChangeText={(t) => set('details', t)}
            multiline
            maxLength={2000}
            textAlignVertical="top"
            placeholder="รายละเอียดของยา"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={[styles.input, { minHeight: 100 }]}
          />
        </View>
      </GlassPanel>

      {mode === 'create' && (
        <View style={styles.uploadRow}>
          {imageBox(styles.imgSmall)}
          <Pressable onPress={upload} style={styles.uploadBtn} accessibilityRole="button">
            <Text style={styles.uploadText}>UPLOAD Medication</Text>
          </Pressable>
        </View>
      )}

      <Pressable onPress={() => onSave(v)} disabled={saving} accessibilityRole="button" accessibilityLabel="บันทึก" style={styles.saveWrap}>
        <LinearGradient colors={mediColors.saveGradient} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.save}>
          {saving ? <ActivityIndicator color="#2A2A2A" /> : <Ionicons name="checkmark" size={30} color="#2A2A2A" />}
        </LinearGradient>
      </Pressable>

      {/* TODO(figma): ปุ่มลบไม่มีในดีไซน์ — เพิ่มเป็นลิงก์เล็ก ๆ ชั่วคราว ให้ปรับ/ย้ายตามดีไซน์ได้ */}
      {mode === 'edit' && onDelete && (
        <Pressable onPress={onDelete} style={styles.delete} accessibilityRole="button">
          <Text style={styles.deleteText}>ลบรายการยานี้</Text>
        </Pressable>
      )}

      <TimePickerModal
        visible={pickTime}
        value={v.timeOfDay}
        onCancel={() => setPickTime(false)}
        onConfirm={(t) => {
          set('timeOfDay', t);
          setPickTime(false);
        }}
      />
    </View>
  );
}

export const EMPTY_MEDICATION: MedicationInput = {
  name: '',
  timeOfDay: '08:00',
  days: ALL_DAYS,
  details: '',
  image: null,
};

const styles = StyleSheet.create({
  bigTime: { alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 36 },
  editTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginTop: 6, marginBottom: 36, gap: 14 },
  img: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mediColors.imageBox,
    borderWidth: 1,
    borderColor: mediColors.imageBorder,
  },
  imgBig: { width: 168, height: 168, borderRadius: 16 },
  imgSmall: { width: 70, height: 70, borderRadius: 16 },
  panel: { marginHorizontal: 22, padding: 24, gap: 10 },
  field: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: mediColors.field,
  },
  area: { flexDirection: 'column', alignItems: 'stretch', borderRadius: 14, paddingVertical: 10, minHeight: 140 },
  label: { color: '#fff', fontWeight: '800', fontSize: 14 },
  value: { flex: 1, color: '#fff', fontSize: 14 },
  input: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 6, outlineStyle: 'none' } as never,
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  dayOn: { backgroundColor: mediColors.fab },
  dayText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 44, marginTop: 18, gap: 20 },
  uploadBtn: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: mediColors.upload },
  uploadText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  saveWrap: { alignSelf: 'center', width: '72%', marginTop: 26 },
  save: { height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  delete: { alignSelf: 'center', marginTop: 18, padding: 8 },
  deleteText: { color: '#FF8A80', fontWeight: '700', fontSize: 13 },
});
