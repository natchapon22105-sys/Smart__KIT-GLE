import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mediColors } from '@/theme/tokens';

const pad = (n: number) => String(n).padStart(2, '0');
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const ROW = 46;

function Column({ items, value, onPick }: { items: number[]; value: number; onPick: (n: number) => void }) {
  const ref = useRef<React.ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: Math.max(value * ROW - ROW, 0), animated: false }), 30);
    return () => clearTimeout(t);
    // เลื่อนไปที่ค่าเริ่มต้นตอนเปิดเท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <ScrollView ref={ref} style={styles.col} showsVerticalScrollIndicator={false}>
      {items.map((n) => (
        <Pressable key={n} onPress={() => onPick(n)} style={[styles.cell, n === value && styles.cellOn]}>
          <Text style={[styles.cellText, n === value && styles.cellTextOn]}>{pad(n)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** ตัวเลือกเวลา (ชั่วโมง : นาที) แบบกำหนดเอง ใช้ได้ทั้งมือถือและเว็บ ไม่พึ่งแพ็กเกจเพิ่ม */
export function TimePickerModal({
  visible,
  value,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  value: string;
  onCancel: () => void;
  onConfirm: (hhmm: string) => void;
}) {
  const [h0, m0] = value.split(':').map(Number);
  const [h, setH] = useState(h0 || 0);
  const [m, setM] = useState(m0 || 0);

  useEffect(() => {
    if (visible) {
      setH(h0 || 0);
      setM(m0 || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.title}>ตั้งเวลา</Text>
          <View style={styles.cols}>
            {visible && <Column items={HOURS} value={h} onPick={setH} />}
            <Text style={styles.colon}>:</Text>
            {visible && <Column items={MINUTES} value={m} onPick={setM} />}
          </View>
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.btn}>
              <Text style={styles.btnText}>ยกเลิก</Text>
            </Pressable>
            <Pressable onPress={() => onConfirm(`${pad(h)}:${pad(m)}`)} style={[styles.btn, styles.btnOk]}>
              <Text style={[styles.btnText, { color: '#10241A' }]}>ตกลง</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 340, borderRadius: 28, padding: 20, backgroundColor: '#35553F', borderWidth: 1, borderColor: mediColors.cardBorder },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  cols: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: ROW * 4 },
  col: { width: 90, height: ROW * 4 },
  colon: { color: '#fff', fontSize: 30, fontWeight: '800' },
  cell: { height: ROW, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  cellOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  cellText: { color: 'rgba(255,255,255,0.6)', fontSize: 26, fontWeight: '700' },
  cellTextOn: { color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  btnOk: { backgroundColor: mediColors.fab },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
