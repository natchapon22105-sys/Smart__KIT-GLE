import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MediScreen } from '@/components/medi/MediScreen';
import { MedicationCard } from '@/components/medi/MedicationCard';
import { medications, type Medication } from '@/services/medications';
import { mediColors } from '@/theme/tokens';

/** MediRemind — หน้ารายการยา (ตามเฟรม Figma ซ้าย) */
export default function MediRemindList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Medication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await medications.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายการยาไม่สำเร็จ');
      setItems((p) => p ?? []);
    }
  }, []);

  // โหลดใหม่ทุกครั้งที่กลับมาหน้านี้ (หลังเพิ่ม/แก้/ลบ)
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1 }}>
      <MediScreen title="MediRemind" onBack={() => router.replace('/(tabs)/home')}>
        <View style={styles.list}>
          {items === null && <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
          {error && (
            <Pressable onPress={load} style={styles.msg}>
              <Text style={styles.err}>{error}</Text>
              <Text style={styles.retry}>แตะเพื่อลองใหม่</Text>
            </Pressable>
          )}
          {items?.map((m) => (
            <MedicationCard
              key={m.id}
              med={m}
              onPress={() => router.push({ pathname: '/(tabs)/medi-remind/[id]', params: { id: String(m.id) } })}
            />
          ))}
          {/* TODO(figma): ข้อความสถานะว่างไม่มีในดีไซน์ */}
          {items && items.length === 0 && !error && <Text style={styles.empty}>ยังไม่มีรายการยา{'\n'}กดปุ่ม + เพื่อเพิ่ม</Text>}
        </View>
      </MediScreen>

      <Pressable
        onPress={() => router.push('/(tabs)/medi-remind/new')}
        accessibilityRole="button"
        accessibilityLabel="เพิ่มยา"
        style={[styles.fab, { bottom: Math.max(insets.bottom, 12) + 48 + 16 }]}
      >
        <Ionicons name="add" size={26} color="#111" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 22, gap: 14 },
  msg: { alignItems: 'center', padding: 16, gap: 4 },
  err: { color: '#FFB4AB', textAlign: 'center' },
  retry: { color: '#fff', fontWeight: '700' },
  empty: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: mediColors.fab,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
