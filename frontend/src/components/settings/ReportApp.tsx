import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { profileApi } from '@/services/profile';
import { settingColors } from '@/theme/tokens';
import { notify } from '@/utils/notify';

/** แจ้งปัญหาการใช้งานแอป — เก็บลงตาราง app_reports */
export function ReportApp() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await profileApi.report(text);
      setText('');
      notify('ส่งแล้ว', 'ขอบคุณที่แจ้งปัญหา เราจะนำไปปรับปรุงแอป');
    } catch (e) {
      notify('ส่งไม่สำเร็จ', e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
        textAlignVertical="top"
        placeholder="อธิบายปัญหาที่พบ"
        placeholderTextColor="rgba(255,255,255,0.4)"
        style={s.input}
      />
      <Pressable onPress={send} disabled={busy || text.trim().length < 5} style={[s.btn, text.trim().length < 5 && { opacity: 0.5 }]} accessibilityRole="button">
        {busy ? <ActivityIndicator color="#10241A" /> : <Text style={s.btnText}>ส่งรายงาน</Text>}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  input: { minHeight: 90, borderRadius: 16, padding: 12, color: '#fff', fontSize: 13, backgroundColor: settingColors.field, outlineStyle: 'none' } as never,
  btn: { height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1BF21B' },
  btnText: { color: '#10241A', fontWeight: '900', fontSize: 14 },
});
