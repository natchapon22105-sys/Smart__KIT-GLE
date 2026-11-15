import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MediScreen } from '@/components/medi/MediScreen';
import { MedicationForm } from '@/components/medi/MedicationForm';
import { medications, type Medication, type MedicationInput } from '@/services/medications';
import { notify } from '@/utils/notify';

/** MediRemind — ดู/แก้ไขยา (เฟรม Figma ล่างขวา) */
export default function EditMedication() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [med, setMed] = useState<Medication | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/medi-remind'));

  useEffect(() => {
    medications
      .get(id)
      .then(setMed)
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'));
  }, [id]);

  const save = async (v: MedicationInput) => {
    if (!v.name.trim()) return notify('ข้อมูลไม่ครบ', 'กรุณากรอกชื่อยา');
    if (v.days.length === 0) return notify('ข้อมูลไม่ครบ', 'กรุณาเลือกวันอย่างน้อย 1 วัน');
    setSaving(true);
    try {
      await medications.update(id, v);
      back();
    } catch (e) {
      notify('บันทึกไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    try {
      await medications.remove(id);
      back();
    } catch (e) {
      notify('ลบไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
  };
  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('ลบรายการยานี้?')) void doDelete();
      return;
    }
    Alert.alert('ลบรายการยา', 'ต้องการลบรายการยานี้ใช่ไหม', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: () => void doDelete() },
    ]);
  };

  return (
    <MediScreen onBack={back}>
      {error ? (
        <Text style={{ color: '#FFB4AB', textAlign: 'center', padding: 24 }}>{error}</Text>
      ) : !med ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 60 }} />
      ) : (
        <MedicationForm
          mode="edit"
          initial={{ name: med.name, timeOfDay: med.timeOfDay, days: med.days, details: med.details ?? '', image: med.image }}
          saving={saving}
          onSave={save}
          onDelete={confirmDelete}
        />
      )}
    </MediScreen>
  );
}
