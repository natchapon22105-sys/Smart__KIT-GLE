import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { familyColors } from '@/theme/tokens';

/** TODO(figma): หน้าต่างค้นหา/ส่งคำขอไม่มีในดีไซน์ — สร้างขึ้นให้ใช้งานได้ก่อน แก้ตามดีไซน์จริงเมื่อมี */
export function AddFamilyModal({
  visible,
  onClose,
  onSend,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (query: string) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const close = () => {
    setQ('');
    setErr(null);
    onClose();
  };
  const send = async () => {
    if (!q.trim()) return setErr('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    setBusy(true);
    setErr(null);
    try {
      await onSend(q.trim());
      close();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'ส่งคำขอไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close}>
        <Pressable style={s.sheet} onPress={() => undefined}>
          <Text style={s.title}>Add family member</Text>
          <Text style={s.hint}>ค้นหาด้วยชื่อผู้ใช้หรืออีเมล แล้วส่งคำขอเชื่อมต่อ</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="username หรือ email"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={s.input}
            onSubmitEditing={send}
          />
          {err && <Text style={s.err}>{err}</Text>}
          <View style={s.actions}>
            <Pressable onPress={close} style={s.btn}>
              <Text style={s.btnText}>ยกเลิก</Text>
            </Pressable>
            <Pressable onPress={send} disabled={busy} style={[s.btn, { backgroundColor: familyColors.add }]}>
              {busy ? <ActivityIndicator color="#111" /> : <Text style={[s.btnText, { color: '#111' }]}>ส่งคำขอ</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 360, borderRadius: 26, padding: 22, backgroundColor: '#35553F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  hint: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 14 },
  input: { height: 42, borderRadius: 21, paddingHorizontal: 16, color: '#fff', backgroundColor: 'rgba(168,174,172,0.45)', outlineStyle: 'none' } as never,
  err: { color: '#FFB4AB', fontSize: 12, marginTop: 8, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  btnText: { color: '#fff', fontWeight: '800' },
});
