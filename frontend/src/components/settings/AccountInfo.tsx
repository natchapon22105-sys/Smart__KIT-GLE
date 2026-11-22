import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ageFromBirthDate, profileApi, type Gender, type Profile } from '@/services/profile';
import { settingColors } from '@/theme/tokens';
import { notify } from '@/utils/notify';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'ชาย' },
  { value: 'female', label: 'หญิง' },
  { value: 'other', label: 'อื่น ๆ' },
];

function Field({ label, children, suffix }: { label: string; children: React.ReactNode; suffix?: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      {children}
      {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
    </View>
  );
}

/** ข้อมูลส่วนตัว: ชื่อ, วันเกิด (→ อายุ), เพศ, ส่วนสูง, น้ำหนัก — ใช้กับระบบสุขภาพ */
export function AccountInfo({ onSaved }: { onSaved: (p: Profile) => void }) {
  const [loaded, setLoaded] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const fill = (p: Profile) => {
    setLoaded(p);
    setName(p.displayName);
    setBirth(p.birthDate ?? '');
    setGender(p.gender);
    setHeight(p.heightCm == null ? '' : String(p.heightCm));
    setWeight(p.weightKg == null ? '' : String(p.weightKg));
  };

  useEffect(() => {
    profileApi.get().then(fill).catch((e) => setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'));
  }, []);

  const save = async () => {
    const num = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));
    const h = num(height);
    const w = num(weight);
    if ((h !== null && Number.isNaN(h)) || (w !== null && Number.isNaN(w))) return notify('ข้อมูลไม่ถูกต้อง', 'ส่วนสูงและน้ำหนักต้องเป็นตัวเลข');
    if (h !== null && !Number.isInteger(h)) return notify('ข้อมูลไม่ถูกต้อง', 'ส่วนสูงต้องเป็นจำนวนเต็ม (ซม.)');
    setSaving(true);
    try {
      const p = await profileApi.save({
        displayName: name,
        birthDate: birth.trim() === '' ? null : birth.trim(),
        gender,
        heightCm: h,
        weightKg: w === null ? null : Math.round(w * 10) / 10,
      });
      fill(p);
      onSaved(p);
      notify('บันทึกแล้ว', 'อัปเดตข้อมูลส่วนตัวเรียบร้อย');
    } catch (e) {
      notify('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Text style={s.err}>{error}</Text>;
  if (!loaded) return <ActivityIndicator color="#fff" />;

  const age = ageFromBirthDate(birth.trim() || null);
  const input = { style: s.input, placeholderTextColor: 'rgba(255,255,255,0.4)' } as const;

  return (
    <View style={{ gap: 8 }}>
      <Field label="อีเมล">
        <Text style={s.readonly} numberOfLines={1}>{loaded.email}</Text>
      </Field>
      <Field label="ชื่อที่แสดง">
        <TextInput {...input} value={name} onChangeText={setName} maxLength={120} />
      </Field>
      <Field label="วันเกิด" suffix={age !== null ? `อายุ ${age} ปี` : undefined}>
        <TextInput {...input} value={birth} onChangeText={setBirth} placeholder="ปปปป-ดด-วว เช่น 2003-05-21" maxLength={10} keyboardType="numbers-and-punctuation" />
      </Field>
      <View style={s.chips}>
        {GENDERS.map((g) => (
          <Pressable key={g.value} onPress={() => setGender(gender === g.value ? null : g.value)} style={[s.chip, gender === g.value && s.chipOn]} accessibilityRole="radio" accessibilityState={{ selected: gender === g.value }}>
            <Text style={[s.chipText, gender === g.value && { color: '#10241A' }]}>{g.label}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="ส่วนสูง" suffix="ซม.">
        <TextInput {...input} value={height} onChangeText={setHeight} keyboardType="number-pad" maxLength={3} />
      </Field>
      <Field label="น้ำหนัก" suffix="กก.">
        <TextInput {...input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={5} />
      </Field>
      <Pressable onPress={save} disabled={saving} style={s.save} accessibilityRole="button">
        {saving ? <ActivityIndicator color="#10241A" /> : <Text style={s.saveText}>บันทึก</Text>}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  field: { minHeight: 36, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: settingColors.field },
  label: { color: '#fff', fontWeight: '800', fontSize: 12, minWidth: 64 },
  input: { flex: 1, color: '#fff', fontSize: 13, paddingVertical: 6, outlineStyle: 'none' } as never,
  readonly: { flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  suffix: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  chipOn: { backgroundColor: '#1BF21B' },
  chipText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  save: { height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1BF21B', marginTop: 4 },
  saveText: { color: '#10241A', fontWeight: '900', fontSize: 14 },
  err: { color: '#FFB4AB', textAlign: 'center' },
});
