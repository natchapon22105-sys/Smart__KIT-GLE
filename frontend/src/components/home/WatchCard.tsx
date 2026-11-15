import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassPanel } from './GlassPanel';
import { homeColors } from '@/theme/tokens';

/**
 * การ์ดสถานะนาฬิกา: "Your watch is disconnected." + ปุ่ม CONNECT (ตาม Figma)
 * สถานะอื่น (กำลังค้นหา / เชื่อมต่อแล้ว / ผิดพลาด) ไม่มีใน Figma — ผมเพิ่มข้อความ/ปุ่มพื้นฐานเพื่อให้ใช้งานได้จริง
 * TODO(figma): ขอดีไซน์สถานะ connected / scanning จากเจ้าของ
 */
export function WatchCard({
  connected,
  busy,
  state,
  error,
  isMock,
  onConnect,
  onDisconnect,
}: {
  connected: boolean;
  busy: boolean;
  state: string;
  error: string | null;
  isMock: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const message = busy
    ? state === 'scanning'
      ? 'Searching for your watch...'
      : 'Connecting to your watch...'
    : connected
      ? 'Your watch is connected.'
      : 'Your watch is disconnected.';

  return (
    <GlassPanel radius={30} style={styles.card}>
      <Ionicons name="bluetooth" size={56} color={connected ? homeColors.ok : 'rgba(255,255,255,0.55)'} />
      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={connected ? onDisconnect : onConnect}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={connected ? 'Disconnect' : 'Connect'}
        style={[styles.btn, busy && { opacity: 0.7 }]}
      >
        {busy ? (
          <ActivityIndicator color="#111" />
        ) : (
          <>
            <Ionicons name="bluetooth" size={16} color="#111" />
            <Text style={styles.btnText}>{connected ? 'DISCONNECT' : 'CONNECT'}</Text>
          </>
        )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isMock ? <Text style={styles.mock}>โหมดนาฬิกาจำลอง (ไม่ใช่ Bluetooth จริง)</Text> : null}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', minHeight: 230, alignItems: 'center', justifyContent: 'center', paddingVertical: 22, paddingHorizontal: 16 },
  message: { marginTop: 10, fontSize: 15, color: homeColors.textDim },
  btn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 152,
    height: 34,
    paddingHorizontal: 18,
    borderRadius: 17,
    backgroundColor: homeColors.connect,
  },
  btnText: { marginLeft: 6, fontSize: 14, fontWeight: '900', color: '#111' },
  error: { marginTop: 12, textAlign: 'center', fontSize: 12, color: '#FFB4A8' },
  mock: { marginTop: 10, fontSize: 10, color: homeColors.textDim },
});
