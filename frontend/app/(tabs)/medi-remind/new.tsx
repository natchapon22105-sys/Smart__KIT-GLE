import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { EMPTY_MEDICATION, MedicationForm } from '@/components/medi/MedicationForm';
import { medications, type MedicationInput } from '@/services/medications';
import { notify } from '@/utils/notify';

/** MediRemind — เพิ่มยา (เฟรม Figma บนขวา) */
export default function NewMedication() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/medi-remind'));

  const save = async (v: MedicationInput) => {
    if (!v.name.trim()) return notify('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อยา');
    if (v.days.length === 0) return notify('ข้อมูลไม่ครบ', 'กรุณาเลือกวันอย่างน้อย 1 วัน');
    setSaving(true);
    try {
      await medications.create(v);
      back();
    } catch (e) {
      notify('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MediScreen onBack={back}>
      <MedicationForm mode="create" initial={EMPTY_MEDICATION} saving={saving} onSave={save} />
    </MediScreen>
  );
}
